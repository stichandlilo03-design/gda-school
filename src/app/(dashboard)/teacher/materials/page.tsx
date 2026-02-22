import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import MaterialsManager from "./materials-manager";

export default async function TeacherMaterialsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;


    let teacher: any = null;
try {
    teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        classes: {
          where: { isActive: true },
          select: { id: true, name: true, schoolGrade: { select: { gradeLevel: true } } },
        },
        materials: {
          orderBy: { createdAt: "desc" },
          include: { class: { select: { name: true } } },
        },
      },
    });

    if (!teacher) return null;

  } catch (err: any) {
    console.error("materials page error:", err?.message || err);
  }

  return (
    <>
      <DashboardHeader title="Teaching Materials" subtitle={`${teacher.materials.length} materials across ${teacher.classes.length} classes`} />
      <div className="p-6 lg:p-8">
        <MaterialsManager
          classes={JSON.parse(JSON.stringify(teacher.classes))}
          materials={JSON.parse(JSON.stringify(teacher.materials))}
        />
      </div>
    </>
  );
}
