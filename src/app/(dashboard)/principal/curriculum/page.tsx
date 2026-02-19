import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import CurriculumManager from "./curriculum-manager";

export default async function CurriculumPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return null;

  const grades = await db.schoolGrade.findMany({
    where: { schoolId: principal.schoolId },
    include: {
      subjects: { include: { subject: true } },
    },
    orderBy: { gradeLevel: "asc" },
  });

  return (
    <>
      <DashboardHeader title="Curriculum" subtitle="Manage grade levels and subjects" />
      <div className="p-6 lg:p-8">
        <CurriculumManager grades={JSON.parse(JSON.stringify(grades))} />
      </div>
    </>
  );
}
