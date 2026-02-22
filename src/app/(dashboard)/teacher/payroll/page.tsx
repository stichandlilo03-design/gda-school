import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import TeacherPayroll from "./teacher-payroll";

export default async function TeacherPayrollPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;


    let teacher: any = null;
  let sessionCredits: any = null;
try {
    teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { countryCode: true } },
        bankAccounts: { orderBy: { isPrimary: "desc" } },
        classes: { where: { isActive: true }, select: { id: true, name: true, schoolGrade: { select: { gradeLevel: true } } } },
        schools: {
          where: { status: "APPROVED", isActive: true },
          include: {
            school: { select: { name: true, currency: true } },
            salary: { include: { history: { orderBy: { changedAt: "desc" }, take: 10 } } },
            payrolls: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 24 },
            sessions: { orderBy: { date: "desc" }, take: 60 },
          },
        },
      },
    });

    if (!teacher) return <div className="p-8">Teacher not found.</div>;

    // Fetch session credits (from auto live sessions)
    sessionCredits = await db.sessionCredit.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { liveSession: { select: { topic: true, classId: true, durationMin: true, startedAt: true, endedAt: true, lateMinutes: true, teacherJoinedAt: true, autoStarted: true, class: { select: { name: true } } } } },
    });

  } catch (err: any) {
    console.error("payroll page error:", err?.message || err);
  }

  return (
    <>
      <DashboardHeader title="My Payroll" subtitle="Earnings, payment accounts & payslips" />
      <div className="p-6 lg:p-8">
        <TeacherPayroll
          schools={JSON.parse(JSON.stringify(teacher.schools))}
          bankAccounts={JSON.parse(JSON.stringify(teacher.bankAccounts))}
          classes={JSON.parse(JSON.stringify(teacher.classes))}
          countryCode={teacher.user.countryCode}
          sessionCredits={JSON.parse(JSON.stringify(sessionCredits))}
        />
      </div>
    </>
  );
}
