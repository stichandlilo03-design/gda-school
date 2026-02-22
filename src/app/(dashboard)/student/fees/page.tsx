export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import StudentFeeClient from "./fee-client";

export default async function StudentFeesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  try {
    const student = await db.student.findUnique({
      where: { userId: session.user.id },
      include: {
        school: { include: { bankAccounts: { where: { isActive: true } } } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!student) return null;

    // Get active term
    const activeTerm = await db.term.findFirst({
      where: { schoolId: student.schoolId, isActive: true },
      select: { termNumber: true, name: true },
    });

    const schoolGrade = await db.schoolGrade.findFirst({
      where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
    });

    let feeStructures: any[] = [];
    if (schoolGrade) {
      feeStructures = await db.feeStructure.findMany({
        where: { schoolGradeId: schoolGrade.id, isActive: true },
        orderBy: { term: "asc" },
      });
    }

    // Calculate per-term fees
    const termOrder = ["TERM_1", "TERM_2", "TERM_3"];
    const approvedPaid = student.payments
      .filter((p: any) => p.status === "COMPLETED")
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    const pendingReview = student.payments
      .filter((p: any) => p.status === "UNDER_REVIEW")
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    // Build per-term breakdown
    let runningPaid = approvedPaid;
    const termBreakdown = [];
    for (const t of termOrder) {
      const tFees = feeStructures.filter((f: any) => f.term === t);
      const tTotal = tFees.reduce((s: number, f: any) => s + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee, 0);
      if (tTotal > 0) {
        const applied = Math.min(runningPaid, tTotal);
        runningPaid -= applied;
        termBreakdown.push({
          term: t,
          termLabel: t.replace("_", " "),
          isCurrent: activeTerm?.termNumber === t,
          total: tTotal,
          paid: applied,
          owed: Math.max(0, tTotal - applied),
        });
      }
    }

    const totalAllTerms = feeStructures.reduce(
      (sum: number, fs: any) => sum + fs.tuitionFee + fs.registrationFee + fs.examFee + fs.technologyFee, 0
    );

    const schoolCurrency = feeStructures[0]?.currency || student.school.currency;
    const matchingAccounts = student.school.bankAccounts.filter(
      (a: any) => a.currency === schoolCurrency
    );

    return (
      <>
        <DashboardHeader title="School Fees" subtitle={student.school.name} />
        <div className="p-6 lg:p-8">
          <StudentFeeClient
            student={JSON.parse(JSON.stringify(student))}
            feeStructures={JSON.parse(JSON.stringify(feeStructures))}
            bankAccounts={JSON.parse(JSON.stringify(matchingAccounts.length > 0 ? matchingAccounts : student.school.bankAccounts))}
            totalFees={totalAllTerms}
            totalPaid={approvedPaid}
            pendingReview={pendingReview}
            payments={JSON.parse(JSON.stringify(student.payments))}
            currency={schoolCurrency}
            feeInstructions={student.school.feeInstructions || ""}
            feePaymentPolicy={(student.school as any).feePaymentPolicy || "PERCENTAGE"}
            feePaymentThreshold={(student.school as any).feePaymentThreshold ?? 70}
            termBreakdown={termBreakdown}
            currentTermName={activeTerm?.name || ""}
          />
        </div>
      </>
    );
  } catch (err: any) {
    console.error("Fees page error:", err?.message || err);
    return (
      <>
        <DashboardHeader title="School Fees" subtitle="Loading issue" />
        <div className="p-6 lg:p-8">
          <div className="bg-white rounded-2xl border p-8 text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Fees Loading Issue</h3>
            <p className="text-sm text-gray-500 mb-4">There was a problem loading your fee information.</p>
            <a href="/student/fees" className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold">Try Again</a>
          </div>
        </div>
      </>
    );
  }
}
