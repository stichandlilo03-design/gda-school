import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import ClassManager from "./class-manager";

export default async function ClassesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      schools: { where: { isActive: true }, include: { school: { include: { grades: true } } } },
      classes: {
        include: {
          enrollments: { where: { status: "ACTIVE" }, include: { student: { include: { user: { select: { name: true } } } } } },
          schoolGrade: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const availableGrades = teacher?.schools.flatMap((st) => st.school.grades) || [];

  return (
    <>
      <DashboardHeader title="My Classes" subtitle="Create and manage your teaching classes" />
      <div className="p-6 lg:p-8">
        <ClassManager
          classes={JSON.parse(JSON.stringify(teacher?.classes || []))}
          availableGrades={JSON.parse(JSON.stringify(availableGrades))}
        />
      </div>
    </>
  );
}
