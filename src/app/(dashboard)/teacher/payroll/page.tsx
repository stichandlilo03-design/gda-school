import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import TeacherPayroll from "./teacher-payroll";

export default async function TeacherPayrollPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { countryCode: true } },
      bankAccounts: { orderBy: { isPrimary: "desc" } },
      schools: {
        where: { status: "APPROVED", isActive: true },
        include: {
          school: { select: { name: true, currency: true } },
          salary: { include: { history: { orderBy: { changedAt: "desc" }, take: 10 } } },
          payrolls: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 24 },
        },
      },
    },
  });

  if (!teacher) return <div className="p-8">Teacher not found.</div>;

  return (
    <>
      <DashboardHeader title="My Payroll" subtitle="Salary, bank accounts, and payment history" />
      <div className="p-6 lg:p-8">
        <TeacherPayroll
          schools={JSON.parse(JSON.stringify(teacher.schools))}
          bankAccounts={JSON.parse(JSON.stringify(teacher.bankAccounts))}
          countryCode={teacher.user.countryCode}
        />
      </div>
    </>
  );
}
