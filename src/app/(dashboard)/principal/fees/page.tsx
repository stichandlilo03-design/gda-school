import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import FeeManager from "./fee-manager";

export default async function FeesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: { school: true },
  });
  if (!principal) return null;

  const grades = await db.schoolGrade.findMany({
    where: { schoolId: principal.schoolId },
    orderBy: { gradeLevel: "asc" },
  });

  const fees = await db.feeStructure.findMany({
    where: { schoolId: principal.schoolId },
    include: { schoolGrade: true },
    orderBy: [{ schoolGrade: { gradeLevel: "asc" } }, { term: "asc" }],
  });

  // Get all students with their payments for outstanding debts
  const students = await db.student.findMany({
    where: { schoolId: principal.schoolId, approvalStatus: "APPROVED" },
    include: {
      user: { select: { name: true, email: true, image: true } },
      payments: { where: { status: "COMPLETED" } },
    },
  });

  // Calculate debts per student
  const feeMap = new Map<string, number>();
  fees.forEach((f: any) => {
    const key = f.schoolGrade.gradeLevel;
    feeMap.set(key, (feeMap.get(key) || 0) + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee);
  });

  const studentDebts = students.map((s) => {
    const totalFees = feeMap.get(s.gradeLevel) || 0;
    const totalPaid = s.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const balance = totalFees - totalPaid;
    const percent = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0;
    return {
      id: s.id, name: s.user.name, email: s.user.email, image: s.user.image,
      grade: s.gradeLevel, totalFees, totalPaid, balance, percent, feePaid: s.feePaid,
    };
  }).filter((s) => s.balance > 0 && !s.feePaid).sort((a, b) => b.balance - a.balance);

  // Pending payments
  const pendingPayments = await db.payment.findMany({
    where: { student: { schoolId: principal.schoolId }, status: "UNDER_REVIEW" },
    include: { student: { include: { user: { select: { name: true } } } } },
  });

  return (
    <>
      <DashboardHeader title="School Fees" subtitle={`Currency: ${principal.school.currency}`} />
      <div className="p-6 lg:p-8">
        <FeeManager
          grades={JSON.parse(JSON.stringify(grades))}
          fees={JSON.parse(JSON.stringify(fees))}
          currency={principal.school.currency}
          studentDebts={JSON.parse(JSON.stringify(studentDebts))}
          pendingPaymentsCount={pendingPayments.length}
        />
      </div>
    </>
  );
}
