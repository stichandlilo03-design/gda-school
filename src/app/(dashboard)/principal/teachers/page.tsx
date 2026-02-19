import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import TeacherManager from "./teacher-manager";

export default async function TeachersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: {
      school: {
        include: {
          grades: { where: { isActive: true }, orderBy: { gradeLevel: "asc" } },
        },
      },
    },
  });
  if (!principal) return null;

  const schoolTeachers = await db.schoolTeacher.findMany({
    where: { schoolId: principal.schoolId },
    include: {
      teacher: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true, phone: true, countryCode: true } },
          classes: {
            where: { schoolGrade: { schoolId: principal.schoolId } },
            include: {
              schoolGrade: true,
              enrollments: { where: { status: "ACTIVE" } },
            },
          },
        },
      },
      interviews: { orderBy: { scheduledAt: "desc" }, take: 1, include: { interviewer: { select: { name: true } } } },
      salary: true,
    },
    orderBy: { hiredAt: "desc" },
  });

  // Get all teachers for reassign dropdown
  const allTeachers = schoolTeachers
    .filter((st) => st.status === "APPROVED" && st.isActive && !st.isSuspended && !st.terminatedAt)
    .map((st) => ({ id: st.teacher.id, name: st.teacher.user.name }));

  const pending = schoolTeachers.filter((st) => ["PENDING", "INTERVIEW_SCHEDULED", "INTERVIEWED"].includes(st.status));
  const active = schoolTeachers.filter((st) => st.status === "APPROVED" && st.isActive && !st.isSuspended && !st.terminatedAt);
  const suspended = schoolTeachers.filter((st) => st.isSuspended);
  const terminated = schoolTeachers.filter((st) => !!st.terminatedAt);
  const rejected = schoolTeachers.filter((st) => st.status === "REJECTED");

  return (
    <>
      <DashboardHeader
        title="Teacher Management"
        subtitle={`${active.length} active • ${pending.length} pending • ${suspended.length} suspended`}
      />
      <div className="p-6 lg:p-8">
        <TeacherManager
          pending={JSON.parse(JSON.stringify(pending))}
          active={JSON.parse(JSON.stringify(active))}
          suspended={JSON.parse(JSON.stringify(suspended))}
          terminated={JSON.parse(JSON.stringify(terminated))}
          rejected={JSON.parse(JSON.stringify(rejected))}
          schoolGrades={JSON.parse(JSON.stringify(principal.school.grades))}
          allTeachers={allTeachers}
          principalUserId={session.user.id}
        />
      </div>
    </>
  );
}
