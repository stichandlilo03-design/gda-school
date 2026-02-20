import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import TimetableManager from "./timetable-manager";

export default async function TimetablePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: {
      school: {
        include: {
          grades: {
            orderBy: { gradeLevel: "asc" },
            include: {
              classes: {
                where: { isActive: true },
                include: {
                  subject: true,
                  teacher: { include: { user: { select: { name: true } } } },
                  schedules: { orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }] },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!principal) return <div className="p-8">Not found.</div>;

  // Fetch all teachers in the school with their classes across ALL grades
  const schoolTeachers = await db.schoolTeacher.findMany({
    where: { schoolId: principal.schoolId, isActive: true, status: "APPROVED" },
    include: {
      teacher: {
        include: {
          user: { select: { name: true, image: true } },
          classes: {
            where: { isActive: true, schoolGrade: { schoolId: principal.schoolId } },
            include: {
              subject: true,
              schoolGrade: { select: { gradeLevel: true, id: true } },
              schedules: true,
            },
          },
        },
      },
    },
  });

  return (
    <>
      <DashboardHeader title="School Timetable" subtitle="Create and manage weekly timetables for each grade" />
      <div className="p-6 lg:p-8">
        <TimetableManager
          school={JSON.parse(JSON.stringify(principal.school))}
          grades={JSON.parse(JSON.stringify(principal.school.grades))}
          schoolTeachers={JSON.parse(JSON.stringify(schoolTeachers))}
        />
      </div>
    </>
  );
}
