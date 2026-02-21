import { db } from "@/lib/db";

export type StudentAccessStatus = {
  hasFullAccess: boolean;
  isApproved: boolean;
  approvalStatus: string;
  feesMet: boolean;
  feePercent: number;
  totalFees: number;
  paidAmount: number;
  feePolicy: string;
  feeThreshold: number;
  reasons: string[];
};

export async function checkStudentAccess(userId: string): Promise<StudentAccessStatus | null> {
  try {
    // Single query to get all needed data
    const student = await db.student.findUnique({
      where: { userId },
      select: {
        id: true,
        approvalStatus: true,
        feePaid: true,
        schoolId: true,
        gradeLevel: true,
        school: {
          select: { feePaymentThreshold: true, feePaymentPolicy: true },
        },
        payments: {
          where: { status: "COMPLETED" },
          select: { amount: true },
        },
      },
    });
    if (!student) return null;

    const isApproved = student.approvalStatus === "APPROVED";
    const feeThreshold = student.school.feePaymentThreshold ?? 70;
    const feePolicy = student.school.feePaymentPolicy || "PERCENTAGE";
    const paidAmount = student.payments.reduce((s: number, p: { amount: number }) => s + p.amount, 0);

    // Get total fees
    let totalFees = 0;
    try {
      const sg = await db.schoolGrade.findFirst({
        where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
        select: { id: true },
      });
      if (sg) {
        const fees = await db.feeStructure.findMany({
          where: { schoolGradeId: sg.id, isActive: true },
          select: { tuitionFee: true, registrationFee: true, examFee: true, technologyFee: true },
        });
        totalFees = fees.reduce((s, f) => s + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee, 0);
      }
    } catch (_e2) { /* fee calc failed */ }

    const feePercent = totalFees > 0 ? Math.round((paidAmount / totalFees) * 100) : 100;

    let feesMet = student.feePaid;
    if (!feesMet) {
      if (feePolicy === "FLEXIBLE") feesMet = true;
      else if (feePolicy === "FULL") feesMet = feePercent >= 100;
      else feesMet = feePercent >= feeThreshold;
    }
    if (totalFees === 0) feesMet = true;

    const reasons: string[] = [];
    if (!isApproved) {
      const labels: Record<string, string> = {
        PENDING: "Your admission is pending principal approval.",
        INTERVIEW_SCHEDULED: "You have an interview scheduled.",
        INTERVIEWED: "Interview complete. Awaiting decision.",
        REJECTED: "Admission not approved. Contact the school.",
      };
      reasons.push(labels[student.approvalStatus] || "Admission needs approval.");
    }
    if (!feesMet && totalFees > 0) {
      reasons.push(feePolicy === "FULL"
        ? "Full payment required (" + feePercent + "% paid)."
        : "Pay at least " + feeThreshold + "% (" + feePercent + "% paid).");
    }

    return { hasFullAccess: isApproved && feesMet, isApproved, approvalStatus: student.approvalStatus, feesMet, feePercent, totalFees, paidAmount, feePolicy, feeThreshold, reasons };
  } catch (_e) {
    return null;
  }
}
