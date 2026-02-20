import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import MonitorClient from "./monitor-client";

export default async function PrincipalMonitorPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: { school: { select: { currency: true } } },
  });
  if (!principal) return null;

  const liveSessions = await db.liveClassSession.findMany({
    where: { class: { schoolGrade: { schoolId: principal.schoolId } }, status: "IN_PROGRESS" },
    include: {
      class: {
        include: {
          subject: true, schoolGrade: true,
          teacher: { include: { user: { select: { name: true, image: true } } } },
          enrollments: { where: { status: "ACTIVE" }, include: { student: { include: { user: { select: { name: true } } } } } },
        },
      },
      teacher: { include: { user: { select: { name: true } } } },
    },
    orderBy: { startedAt: "desc" },
  });

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const recentSessions = await db.liveClassSession.findMany({
    where: {
      class: { schoolGrade: { schoolId: principal.schoolId } },
      status: "ENDED",
      endedAt: { gte: todayStart },
    },
    include: {
      class: { include: { subject: true, schoolGrade: true, teacher: { include: { user: { select: { name: true } } } } } },
      sessionCredits: true,
    },
    orderBy: { endedAt: "desc" },
    take: 50,
  });

  const todayCredits = await db.sessionCredit.aggregate({
    where: { schoolId: principal.schoolId, createdAt: { gte: todayStart } },
    _sum: { creditAmount: true },
    _count: true,
  });

  return (
    <>
      <DashboardHeader title="Classroom Monitor" subtitle="Live view of all classroom activities & session history" />
      <div className="p-6 lg:p-8">
        <MonitorClient
          liveSessions={JSON.parse(JSON.stringify(liveSessions))}
          recentSessions={JSON.parse(JSON.stringify(recentSessions))}
          todayCreditsTotal={todayCredits._sum.creditAmount || 0}
          todayCreditsCount={todayCredits._count || 0}
          schoolCurrency={principal.school?.currency || "USD"}
        />
      </div>
    </>
  );
}
