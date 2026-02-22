import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import AcademicCalendarView from "@/components/academic-calendar-view";

export default async function ParentCalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      children: {
        include: {
          student: {
            include: {
              user: { select: { name: true } },
              school: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!parent) return <div className="p-8">Not found.</div>;

  // Get unique school IDs
  const schoolIds = [...new Set(parent.children.map((c: any) => c.student.schoolId))];
  const schoolNames: Record<string, string> = {};
  parent.children.forEach((c: any) => { schoolNames[c.student.schoolId] = c.student.school.name; });

  // Get events and terms for all schools
  const events = await db.academicEvent.findMany({
    where: { schoolId: { in: schoolIds } },
    orderBy: { startDate: "asc" },
  });

  const terms = await db.term.findMany({
    where: { schoolId: { in: schoolIds } },
    orderBy: { startDate: "asc" },
  });

  const currentTerm = terms.find((t: any) => t.isActive);

  return (
    <>
      <DashboardHeader title="Academic Calendar" subtitle="School terms, holidays, exams, and events" />
      <div className="p-6 lg:p-8">
        {schoolIds.length > 1 && (
          <div className="mb-4 bg-blue-50 rounded-xl p-3 text-[10px] text-blue-700">
            📅 Showing combined calendar for {schoolIds.length} schools: {Object.values(schoolNames).join(", ")}
          </div>
        )}
        <AcademicCalendarView
          events={JSON.parse(JSON.stringify(events))}
          terms={JSON.parse(JSON.stringify(terms))}
          currentTerm={currentTerm ? JSON.parse(JSON.stringify(currentTerm)) : undefined}
        />
      </div>
    </>
  );
}
