import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import TeacherManager from "./teacher-manager";

export default async function TeachersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return null;

  const schoolTeachers = await db.schoolTeacher.findMany({
    where: { schoolId: principal.schoolId },
    include: {
      teacher: {
        include: {
          user: { select: { name: true, email: true, image: true, phone: true, countryCode: true } },
          classes: { where: { isActive: true }, include: { enrollments: { where: { status: "ACTIVE" } } } },
        },
      },
      interviews: { orderBy: { scheduledAt: "desc" }, take: 1, include: { interviewer: { select: { name: true } } } },
    },
    orderBy: { hiredAt: "desc" },
  });

  const pending = schoolTeachers.filter((st) => st.status === "PENDING" || st.status === "INTERVIEW_SCHEDULED" || st.status === "INTERVIEWED");
  const approved = schoolTeachers.filter((st) => st.status === "APPROVED");
  const rejected = schoolTeachers.filter((st) => st.status === "REJECTED");

  return (
    <>
      <DashboardHeader title="Teacher Management" subtitle={`${pending.length} pending • ${approved.length} active`} />
      <div className="p-6 lg:p-8">
        <TeacherManager
          pending={JSON.parse(JSON.stringify(pending))}
          approved={JSON.parse(JSON.stringify(approved))}
          rejected={JSON.parse(JSON.stringify(rejected))}
        />
      </div>
    </>
  );
}
