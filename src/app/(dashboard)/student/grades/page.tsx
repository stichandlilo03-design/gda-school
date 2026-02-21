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

  // Access gate: block unapproved / unpaid students
  try {
    const access = await checkStudentAccess(session.user.id);
    if (access && !access.hasFullAccess) {
      return <StudentAccessGate access={access} pageName="Grades & Assignments" />;
    }
  } catch (_e) {}

  const student = await db.student.findUnique({
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

  const allAssignments = student?.enrollments.flatMap(e =>
    (e.class.assignments || []).map((a: any) => ({
      ...a,
      classId: e.class.id,
      className: e.class.name,
      submitted: student.assignmentSubmissions.some(s => s.assignmentId === a.id),
    }))
  ) || [];

  return (
    <>
      <DashboardHeader title="My Grades & Assignments" subtitle="Only principal-approved grades are shown" />
      <div className="p-6 lg:p-8">
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
