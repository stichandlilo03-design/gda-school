import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not logged in" });

  try {
    const student = await db.student.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true, approvalStatus: true, feePaid: true, schoolId: true, gradeLevel: true,
        school: { select: { name: true, feePaymentThreshold: true, feePaymentPolicy: true } },
        payments: { select: { id: true, amount: true, status: true, description: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!student) return NextResponse.json({ error: "No student record", userId: session.user.id });

    const sg = await db.schoolGrade.findFirst({
      where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
      select: { id: true },
    });

    let feeStructures: any[] = [];
    if (sg) {
      feeStructures = await db.feeStructure.findMany({
        where: { schoolGradeId: sg.id, isActive: true },
        select: { term: true, tuitionFee: true, registrationFee: true, examFee: true, technologyFee: true },
      });
    }

    const totalFees = feeStructures.reduce((s: number, f: any) => s + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee, 0);
    const completedPayments = student.payments.filter((p: any) => p.status === "COMPLETED");
    const paidAmount = completedPayments.reduce((s: number, p: any) => s + p.amount, 0);
    const feePercent = totalFees > 0 ? Math.round((paidAmount / totalFees) * 100) : 100;
    const threshold = student.school.feePaymentThreshold ?? 70;
    const policy = student.school.feePaymentPolicy || "PERCENTAGE";

    let feesMet = student.feePaid;
    if (!feesMet) {
      if (policy === "FLEXIBLE") feesMet = true;
      else if (policy === "FULL") feesMet = feePercent >= 100;
      else feesMet = feePercent >= threshold;
    }
    if (totalFees === 0) feesMet = true;

    return NextResponse.json({
      student: { id: student.id, approvalStatus: student.approvalStatus, feePaid: student.feePaid, gradeLevel: student.gradeLevel },
      school: { name: student.school.name, policy, threshold },
      fees: { schoolGradeFound: !!sg, feeStructures, totalFees, allPayments: student.payments, completedPayments: completedPayments.length, paidAmount, feePercent, feesMet },
      result: { isApproved: student.approvalStatus === "APPROVED", feesMet, hasFullAccess: student.approvalStatus === "APPROVED" && feesMet },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack?.split("\n").slice(0, 3) });
  }
}
