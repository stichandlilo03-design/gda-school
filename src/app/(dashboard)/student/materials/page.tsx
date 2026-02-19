import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import StudentMaterialsClient from "./materials-client";

export default async function StudentMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const params = await searchParams;
  const classIdFilter = params.classId;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              materials: {
                where: { isPublished: true },
                orderBy: { createdAt: "desc" },
                include: { teacher: { include: { user: { select: { name: true } } } } },
              },
            },
          },
        },
      },
    },
  });

  if (!student) return null;

  const allClasses = student.enrollments.map((e) => ({
    id: e.class.id,
    name: e.class.name,
    materialCount: e.class.materials.length,
  }));

  const allMaterials = student.enrollments.flatMap((e) =>
    e.class.materials.map((m) => ({ ...m, className: e.class.name }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      <DashboardHeader title="Class Materials" subtitle={`${allMaterials.length} materials from ${allClasses.length} classes`} />
      <div className="p-6 lg:p-8">
        <StudentMaterialsClient
          materials={JSON.parse(JSON.stringify(allMaterials))}
          classes={allClasses}
          initialClassFilter={classIdFilter || ""}
        />
      </div>
    </>
  );
}
