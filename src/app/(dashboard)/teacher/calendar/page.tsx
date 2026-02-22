import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import AcademicCalendarView from "@/components/academic-calendar-view";

export default async function TeacherCalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;


    let events: any = null;
  let terms: any = null;
  let currentTerm: any = null;
try {
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
      include: { schools: { where: { isActive: true, status: "APPROVED" }, take: 1, select: { schoolId: true } } },
    });
    if (!teacher || !teacher.schools[0]) return null;

    const schoolId = teacher.schools[0].schoolId;

    events = await db.academicEvent.findMany({
      where: { schoolId },
      orderBy: { startDate: "asc" },
    });

    terms = await db.term.findMany({
      where: { schoolId },
      orderBy: { startDate: "asc" },
    });

    currentTerm = terms.find((t: any) => t.isActive);

  } catch (err: any) {
    console.error("calendar page error:", err?.message || err);
  }

  return (
    <>
      <DashboardHeader title="Academic Calendar" subtitle="View terms, holidays, exams, and school events" />
      <div className="p-6 lg:p-8">
        <AcademicCalendarView events={JSON.parse(JSON.stringify(events))} terms={JSON.parse(JSON.stringify(terms))} currentTerm={currentTerm ? JSON.parse(JSON.stringify(currentTerm)) : undefined} />
      </div>
    </>
  );
}
