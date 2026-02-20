import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import CalendarManager from "./calendar-manager";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: { school: { select: { id: true, countryCode: true, name: true } } },
  });
  if (!principal) return null;

  const events = await db.academicEvent.findMany({
    where: { schoolId: principal.schoolId },
    orderBy: { startDate: "asc" },
  });

  const terms = await db.term.findMany({
    where: { schoolId: principal.schoolId },
    orderBy: { startDate: "asc" },
  });

  return (
    <>
      <DashboardHeader title="Academic Calendar" subtitle="Manage terms, holidays, and school events" />
      <div className="p-6 lg:p-8">
        <CalendarManager
          events={JSON.parse(JSON.stringify(events))}
          terms={JSON.parse(JSON.stringify(terms))}
          countryCode={principal.school.countryCode}
        />
      </div>
    </>
  );
}
