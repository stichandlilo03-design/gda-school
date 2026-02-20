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

  // Get current week boundaries (Mon-Sun)
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const teachers = await db.schoolTeacher.findMany({
    where: { schoolId: principal.schoolId, status: "APPROVED", isActive: true },
    include: {
      teacher: {
        include: {
          user: { select: { name: true, email: true, countryCode: true } },
          bankAccounts: { orderBy: { isPrimary: "desc" } },
          classes: {
            where: { isActive: true, schoolGrade: { schoolId: principal.schoolId } },
            select: { id: true, name: true, subject: { select: { name: true } }, session: true },
          },
        },
      },
      salary: { include: { history: { orderBy: { changedAt: "desc" }, take: 5 } } },
      payrolls: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 12 },
      sessions: {
        where: { date: { gte: monthStart, lt: monthEnd } },
        orderBy: { date: "desc" },
      },
    },
  });

  // Fetch session credits for ALL teachers in this school
  const allTeacherIds = teachers.map(t => t.teacherId);
  const sessionCredits = await db.sessionCredit.findMany({
    where: {
      teacherId: { in: allTeacherIds },
      schoolId: principal.schoolId,
      createdAt: { gte: monthStart, lt: monthEnd },
    },
    include: {
      liveSession: {
        select: {
          topic: true, durationMin: true, startedAt: true, endedAt: true,
          lateMinutes: true, autoStarted: true, teacherJoinedAt: true,
          class: { select: { name: true, subject: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Weekly credits
  const weeklyCredits = await db.sessionCredit.findMany({
    where: {
      teacherId: { in: allTeacherIds },
      schoolId: principal.schoolId,
      createdAt: { gte: weekStart, lt: weekEnd },
    },
    include: {
      liveSession: {
        select: { topic: true, durationMin: true, startedAt: true, class: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group credits by teacher
  const creditsByTeacher: Record<string, any[]> = {};
  const weeklyCreditsByTeacher: Record<string, any[]> = {};
  sessionCredits.forEach(c => {
    if (!creditsByTeacher[c.teacherId]) creditsByTeacher[c.teacherId] = [];
    creditsByTeacher[c.teacherId].push(c);
  });
  weeklyCredits.forEach(c => {
    if (!weeklyCreditsByTeacher[c.teacherId]) weeklyCreditsByTeacher[c.teacherId] = [];
    weeklyCreditsByTeacher[c.teacherId].push(c);
  });

  return (
    <>
      <DashboardHeader title="Payroll Management" subtitle="Track earnings, manage salaries, and process payments" />
      <div className="p-6 lg:p-8">
        <PayrollManager
          teachers={JSON.parse(JSON.stringify(teachers))}
          creditsByTeacher={JSON.parse(JSON.stringify(creditsByTeacher))}
          weeklyCreditsByTeacher={JSON.parse(JSON.stringify(weeklyCreditsByTeacher))}
          currency={principal.school.currency}
          currentMonth={now.getMonth() + 1}
          currentYear={now.getFullYear()}
          school={JSON.parse(JSON.stringify(principal.school))}
        />
      </div>
    </>
  );
}
