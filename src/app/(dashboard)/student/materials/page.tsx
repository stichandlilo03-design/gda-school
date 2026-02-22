import { getServerSession } from "next-auth";
import { checkStudentAccess } from "@/lib/student-access";
import StudentAccessGate from "@/components/student-access-gate";
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

  // Access gate: block unapproved / unpaid students
  try {
    const access = await checkStudentAccess(session.user.id);
    if (access && !access.hasFullAccess) {
      return <StudentAccessGate access={access} pageName="Materials" />;
    }
  } catch (_e) {}


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

  const allClasses = student.enrollments.map((e: any) => ({
    id: e.class.id,
    name: e.class.name,
    materialCount: e.class.materials.length,
  }));

  const allMaterials = student.enrollments.flatMap((e: any) =>
    e.class.materials.map((m: any) => ({ ...m, className: e.class.name }))
  ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
