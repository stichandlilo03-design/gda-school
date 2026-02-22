export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { checkStudentAccess } from "@/lib/student-access";
import StudentAccessGate from "@/components/student-access-gate";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import StudentGradesClient from "./grades-client";

export default async function GradesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // Access gate: block unenrolled students
  try {
    const access = await checkStudentAccess(session.user.id);
    if (access && !access.hasFullAccess) {
      return <StudentAccessGate access={access} pageName="Grades" />;
    }
  } catch (_e) {}


  let student: any = null;
  let allAssignments: any[] = [];
  let queryError = "";

  try {
    student = await db.student.findUnique({
      where: { userId: session.user.id },
      include: {
        scores: {
          where: { assessment: { gradeStatus: "APPROVED" } },
          include: {
            assessment: {
              include: { class: { include: { subject: true, teacher: { include: { user: { select: { name: true } } } } } } },
            },
          },
          orderBy: { gradedAt: "desc" },
        },
        assignmentSubmissions: {
          include: {
            assignment: { include: { class: { include: { subject: true } } } },
          },
          orderBy: { submittedAt: "desc" },
        },
        termReports: {
          where: { status: "APPROVED" },
          include: { term: true, subjectReports: true },
          orderBy: { createdAt: "desc" },
        },
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            class: {
              include: {
                subject: true,
                assignments: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
              },
            },
          },
        },
      },
    });

    if (student) {
      allAssignments = student.enrollments.flatMap((e: any) =>
        (e.class.assignments || []).map((a: any) => ({
          ...a,
          classId: e.class.id,
          className: e.class.name,
          submitted: student.assignmentSubmissions.some((s: any) => s.assignmentId === a.id),
        }))
      );
    }
  } catch (err: any) {
    queryError = err?.message || "Unknown error loading grades";
    console.error("Grades page error:", queryError);
  }

  return (
    <>
      <DashboardHeader title="My Grades & Assignments" subtitle="Only principal-approved grades are shown" />
      <div className="p-6 lg:p-8">
        {queryError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <p className="font-bold">⚠️ Error loading grades</p>
            <p className="text-xs mt-1 text-red-500">{queryError}</p>
            <a href="/student/grades" className="text-xs underline mt-2 inline-block">Try Again</a>
          </div>
        )}
        <StudentGradesClient
          scores={JSON.parse(JSON.stringify(student?.scores || []))}
          assignments={JSON.parse(JSON.stringify(allAssignments))}
          submissions={JSON.parse(JSON.stringify(student?.assignmentSubmissions || []))}
          termReports={JSON.parse(JSON.stringify(student?.termReports || []))}
        />
      </div>
    </>
  );
}
