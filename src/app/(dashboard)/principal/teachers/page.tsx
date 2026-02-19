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
          user: { select: { name: true, email: true, image: true, phone: true } },
          classes: { where: { isActive: true }, include: { enrollments: { where: { status: "ACTIVE" } } } },
        },
      },
    },
    orderBy: { hiredAt: "desc" },
  });

  return (
    <>
      <DashboardHeader title="Teacher Management" subtitle="Hire, manage, and review teachers" />
      <div className="p-6 lg:p-8">
        <TeacherManager teachers={JSON.parse(JSON.stringify(schoolTeachers))} />
      </div>
    </>
  );
}
