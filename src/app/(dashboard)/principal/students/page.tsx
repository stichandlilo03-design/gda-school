import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import StudentManager from "./student-manager";

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return null;

  const students = await db.student.findMany({
    where: { schoolId: principal.schoolId },
    include: {
      user: { select: { name: true, email: true, image: true, isActive: true, createdAt: true, countryCode: true } },
      enrollments: { where: { status: "ACTIVE" } },
      interviews: { orderBy: { scheduledAt: "desc" }, take: 1, include: { interviewer: { select: { name: true } } } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const pending = students.filter((s) => s.approvalStatus === "PENDING" || s.approvalStatus === "INTERVIEW_SCHEDULED" || s.approvalStatus === "INTERVIEWED");
  const approved = students.filter((s) => s.approvalStatus === "APPROVED");
  const rejected = students.filter((s) => s.approvalStatus === "REJECTED");

  return (
    <>
      <DashboardHeader title="Student Management" subtitle={`${pending.length} pending • ${approved.length} approved`} />
      <div className="p-6 lg:p-8">
        <StudentManager
          pending={JSON.parse(JSON.stringify(pending))}
          approved={JSON.parse(JSON.stringify(approved))}
          rejected={JSON.parse(JSON.stringify(rejected))}
        />
      </div>
    </>
  );
}
