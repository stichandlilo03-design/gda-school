import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import GradebookManager from "./gradebook-manager";

export default async function GradebookPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  let classes: any[] = [];
  let assignments: any[] = [];
  let queryError = "";

  try {
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        classes: {
          include: {
            enrollments: { where: { status: "ACTIVE" }, include: { student: { include: { user: { select: { name: true } } } } } },
            assessments: { include: { scores: true }, orderBy: { createdAt: "desc" } },
            schoolGrade: true,
            assignments: { include: { submissions: true }, orderBy: { createdAt: "desc" } },
          },
        },
      },
    });

    classes = teacher?.classes || [];
    assignments = classes.flatMap((c: any) => (c.assignments || []).map((a: any) => ({ ...a, classId: c.id })));
  } catch (err: any) {
    queryError = err?.message || "Unknown error loading gradebook";
    console.error("Gradebook page error:", queryError);
  }

  return (
    <>
      <DashboardHeader title="Gradebook" subtitle="Create assessments, enter grades, and manage assignments" />
      <div className="p-6 lg:p-8">
        {queryError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <p className="font-bold">⚠️ Error loading gradebook data</p>
            <p className="text-xs mt-1 text-red-500">{queryError}</p>
            <a href="/teacher/gradebook" className="text-xs underline mt-2 inline-block">Try Again</a>
          </div>
        )}
        <GradebookManager classes={JSON.parse(JSON.stringify(classes))} assignments={JSON.parse(JSON.stringify(assignments))} />
      </div>
    </>
  );
}
