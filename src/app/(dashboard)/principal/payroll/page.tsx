import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import PayrollManager from "./payroll-manager";

export default async function PayrollPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: { school: true },
  });
  if (!principal) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const teachers = await db.schoolTeacher.findMany({
    where: { schoolId: principal.schoolId, status: "APPROVED", isActive: true },
    include: {
      teacher: { include: { user: { select: { name: true, email: true, countryCode: true } }, bankAccounts: { where: { isPrimary: true }, take: 1 } } },
      salary: { include: { history: { orderBy: { changedAt: "desc" }, take: 5 } } },
      payrolls: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 12 },
      sessions: {
        where: { date: { gte: monthStart, lt: monthEnd } },
        orderBy: { date: "desc" },
      },
    },
  });

  return (
    <>
      <DashboardHeader title="Payroll Management" subtitle="Track earnings, manage salaries, and process payments" />
      <div className="p-6 lg:p-8">
        <PayrollManager
          teachers={JSON.parse(JSON.stringify(teachers))}
          currency={principal.school.currency}
          currentMonth={now.getMonth() + 1}
          currentYear={now.getFullYear()}
        />
      </div>
    </>
  );
}
