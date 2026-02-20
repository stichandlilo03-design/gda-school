import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import StudentFeeClient from "./fee-client";

export default async function StudentFeesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      school: { include: { bankAccounts: { where: { isActive: true } } } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!student) return null;

  // Find fee structure for student's grade
  const schoolGrade = await db.schoolGrade.findFirst({
    where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
  });

  let feeStructures: any[] = [];
  if (schoolGrade) {
    feeStructures = await db.feeStructure.findMany({
      where: { schoolGradeId: schoolGrade.id, isActive: true },
    });
  }

  // Total fees across all active fee structures for this grade
  const totalFees = feeStructures.reduce(
    (sum, fs) => sum + fs.tuitionFee + fs.registrationFee + fs.examFee + fs.technologyFee, 0
  );

  // Find bank accounts matching student's currency
  const schoolCurrency = feeStructures[0]?.currency || student.school.currency;
  const matchingAccounts = student.school.bankAccounts.filter(
    (a: any) => a.currency === schoolCurrency
  );

  // Totals
  const approvedPaid = student.payments
    .filter((p: any) => p.status === "COMPLETED")
    .reduce((sum: number, p: any) => sum + p.amount, 0);
  const pendingReview = student.payments
    .filter((p: any) => p.status === "UNDER_REVIEW")
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  return (
    <>
      <DashboardHeader title="School Fees" subtitle={student.school.name} />
      <div className="p-6 lg:p-8">
        <StudentFeeClient
          student={JSON.parse(JSON.stringify(student))}
          feeStructures={JSON.parse(JSON.stringify(feeStructures))}
          bankAccounts={JSON.parse(JSON.stringify(matchingAccounts.length > 0 ? matchingAccounts : student.school.bankAccounts))}
          totalFees={totalFees}
          totalPaid={approvedPaid}
          pendingReview={pendingReview}
          payments={JSON.parse(JSON.stringify(student.payments))}
          currency={schoolCurrency}
          feeInstructions={student.school.feeInstructions || ""}
          feePaymentPolicy={student.school.feePaymentPolicy || "PERCENTAGE"}
          feePaymentThreshold={student.school.feePaymentThreshold ?? 70}
        />
      </div>
    </>
  );
}
