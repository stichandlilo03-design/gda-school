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
      user: { select: { id: true, name: true, email: true, image: true, isActive: true, phone: true, countryCode: true, createdAt: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: { class: { select: { id: true, name: true } } },
      },
      interviews: {
        where: { type: "ADMISSION" },
        orderBy: { scheduledAt: "desc" },
        take: 1,
        include: { interviewer: { select: { name: true } } },
      },
      attendances: {
        where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      },
      scores: {
        where: { score: { not: null } },
        include: { assessment: { select: { maxScore: true } } },
        take: 20,
      },
      certificates: { select: { id: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const pending = students.filter((s) => ["PENDING", "INTERVIEW_SCHEDULED", "INTERVIEWED"].includes(s.approvalStatus));
  const active = students.filter((s) => s.approvalStatus === "APPROVED" && !s.isSuspended && !s.isExpelled);
  const suspended = students.filter((s) => s.isSuspended);
  const expelled = students.filter((s) => s.isExpelled);
  const rejected = students.filter((s) => s.approvalStatus === "REJECTED" && !s.isExpelled);

  // Grade levels in school
  const grades = await db.schoolGrade.findMany({
    where: { schoolId: principal.schoolId },
    orderBy: { gradeLevel: "asc" },
  });

  return (
    <>
      <DashboardHeader
        title="Student Management"
        subtitle={`${students.length} total • ${pending.length} pending • ${active.length} active • ${suspended.length} suspended`}
      />
      <div className="p-6 lg:p-8">
        <StudentManager
          pending={JSON.parse(JSON.stringify(pending))}
          active={JSON.parse(JSON.stringify(active))}
          suspended={JSON.parse(JSON.stringify(suspended))}
          expelled={JSON.parse(JSON.stringify(expelled))}
          rejected={JSON.parse(JSON.stringify(rejected))}
          grades={grades.map((g) => g.gradeLevel)}
          principalUserId={session.user.id}
        />
      </div>
    </>
  );
}
