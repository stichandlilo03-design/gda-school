import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import GradebookManager from "./gradebook-manager";

export default async function GradebookPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: {
        where: { isActive: true },
        include: {
          enrollments: { where: { status: "ACTIVE" }, include: { student: { include: { user: { select: { name: true } } } } } },
          assessments: { include: { scores: true }, orderBy: { createdAt: "desc" } },
          schoolGrade: true,
          assignments: { include: { submissions: true }, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  const classes = teacher?.classes || [];
  const assignments = classes.flatMap(c => (c.assignments || []).map(a => ({ ...a, classId: c.id })));

  return (
    <>
      <DashboardHeader title="Gradebook" subtitle="Create assessments, enter grades, and manage assignments" />
      <div className="p-6 lg:p-8">
        <GradebookManager classes={JSON.parse(JSON.stringify(classes))} assignments={JSON.parse(JSON.stringify(assignments))} />
      </div>
    </>
  );
}
