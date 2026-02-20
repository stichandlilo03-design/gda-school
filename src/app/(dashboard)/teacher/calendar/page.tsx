import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import AcademicCalendarView from "@/components/academic-calendar-view";

export default async function TeacherCalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    select: { schoolId: true },
  });
  if (!teacher) return null;

  const events = await db.academicEvent.findMany({
    where: { schoolId: teacher.schoolId },
    orderBy: { startDate: "asc" },
  });

  const terms = await db.term.findMany({
    where: { schoolId: teacher.schoolId },
    orderBy: { startDate: "asc" },
  });

  const currentTerm = terms.find(t => t.isActive);

  return (
    <>
      <DashboardHeader title="Academic Calendar" subtitle="View terms, holidays, exams, and school events" />
      <div className="p-6 lg:p-8">
        <AcademicCalendarView events={JSON.parse(JSON.stringify(events))} terms={JSON.parse(JSON.stringify(terms))} currentTerm={currentTerm ? JSON.parse(JSON.stringify(currentTerm)) : undefined} />
      </div>
    </>
  );
}
