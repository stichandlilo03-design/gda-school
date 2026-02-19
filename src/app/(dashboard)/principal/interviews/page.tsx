import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import InterviewManager from "./interview-manager";

export default async function InterviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: { school: { select: { currency: true } } },
  });
  if (!principal) return null;

  const interviews = await db.interview.findMany({
    where: {
      OR: [
        { student: { schoolId: principal.schoolId } },
        { schoolTeacher: { schoolId: principal.schoolId } },
        { vacancyApp: { vacancy: { schoolId: principal.schoolId } } },
      ],
    },
    include: {
      interviewer: { select: { name: true } },
      student: { include: { user: { select: { name: true, email: true, phone: true } } } },
      schoolTeacher: { include: { teacher: { include: { user: { select: { name: true, email: true, phone: true } } } } } },
      vacancyApp: { include: { vacancy: { select: { title: true } } } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <>
      <DashboardHeader title="Interview Management" subtitle="Schedule, conduct, and decide on all interviews" />
      <div className="p-6 lg:p-8">
        <InterviewManager
          interviews={JSON.parse(JSON.stringify(interviews))}
          schoolCurrency={principal.school.currency}
        />
      </div>
    </>
  );
}
