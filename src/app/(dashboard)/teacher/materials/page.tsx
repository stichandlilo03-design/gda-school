import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import MaterialsManager from "./materials-manager";

export default async function MaterialsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: { where: { isActive: true }, select: { id: true, name: true } },
      materials: { include: { class: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  return (
    <>
      <DashboardHeader title="Materials" subtitle="Upload and manage teaching materials" />
      <div className="p-6 lg:p-8">
        <MaterialsManager classes={JSON.parse(JSON.stringify(teacher?.classes || []))} materials={JSON.parse(JSON.stringify(teacher?.materials || []))} />
      </div>
    </>
  );
}
