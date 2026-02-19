import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import MaterialsList from "./materials-list";

export default async function MaterialsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              teacher: { include: { user: { select: { name: true } } } },
              schoolGrade: true,
              materials: {
                where: { isPublished: true },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
    },
  });

  if (!student) return null;

  const allMaterials = student.enrollments.flatMap((e) =>
    e.class.materials.map((m: any) => ({
      ...m,
      className: e.class.name,
      teacherName: e.class.teacher.user.name,
      grade: e.class.schoolGrade.gradeLevel,
    }))
  ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const classNames = [...new Set(student.enrollments.map((e) => e.class.name))];

  return (
    <>
      <DashboardHeader title="Learning Materials" subtitle="Resources from your enrolled classes" />
      <div className="p-6 lg:p-8">
        <MaterialsList
          materials={JSON.parse(JSON.stringify(allMaterials))}
          classNames={classNames}
        />
      </div>
    </>
  );
}
