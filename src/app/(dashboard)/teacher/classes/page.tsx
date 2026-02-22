import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import ClassManager from "./class-manager";

export default async function ClassesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;


    let teacher: any = null;
  let availableGrades: any = null;
try {
    teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        schools: {
          where: { isActive: true, status: "APPROVED" },
          include: {
            school: {
              include: {
                grades: { include: { subjects: { include: { subject: true } } } },
              },
            },
          },
        },
        classes: {
          include: {
            enrollments: {
              where: { status: "ACTIVE" },
              include: { student: { include: { user: { select: { name: true, image: true, email: true } } } } },
            },
            schoolGrade: true,
            schedules: true,
            requirements: { orderBy: { createdAt: "asc" } },
            _count: { select: { materials: true, assessments: true, attendances: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    availableGrades = teacher?.schools.flatMap((st) => st.school.grades) || [];

  } catch (err: any) {
    console.error("classes page error:", err?.message || err);
  }

  return (
    <>
      <DashboardHeader title="My Classes" subtitle={`${teacher?.classes.filter(c => c.isActive).length || 0} active classes`} />
      <div className="p-6 lg:p-8">
        <ClassManager
          classes={JSON.parse(JSON.stringify(teacher?.classes || []))}
          availableGrades={JSON.parse(JSON.stringify(availableGrades))}
        />
      </div>
    </>
  );
}
