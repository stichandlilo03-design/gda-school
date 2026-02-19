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

  let feeStructure = null;
  if (schoolGrade) {
    feeStructure = await db.feeStructure.findFirst({
      where: { schoolGradeId: schoolGrade.id, isActive: true },
    });
  }

  // Find bank account matching student's currency/country
  const matchingAccounts = student.school.bankAccounts.filter(
    (a) => a.currency === (feeStructure?.currency || student.school.currency)
  );
  const allAccounts = student.school.bankAccounts;

  const totalFees = feeStructure
    ? feeStructure.tuitionFee + feeStructure.registrationFee + feeStructure.examFee + feeStructure.technologyFee
    : 0;
  const totalPaid = student.payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingReview = student.payments.filter((p) => p.status === "UNDER_REVIEW").reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <DashboardHeader title="School Fees" subtitle={student.school.name} />
      <div className="p-6 lg:p-8">
        <StudentFeeClient
          student={JSON.parse(JSON.stringify(student))}
          feeStructure={feeStructure ? JSON.parse(JSON.stringify(feeStructure)) : null}
          bankAccounts={JSON.parse(JSON.stringify(matchingAccounts.length > 0 ? matchingAccounts : allAccounts))}
          totalFees={totalFees}
          totalPaid={totalPaid}
          pendingReview={pendingReview}
          payments={JSON.parse(JSON.stringify(student.payments))}
          currency={feeStructure?.currency || student.school.currency}
        />
      </div>
    </>
  );
}
