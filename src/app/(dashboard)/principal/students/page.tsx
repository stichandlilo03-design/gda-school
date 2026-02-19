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
      user: { select: { name: true, email: true, image: true, isActive: true, createdAt: true } },
      enrollments: { where: { status: "ACTIVE" } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <>
      <DashboardHeader title="Student Management" subtitle={`${students.length} students enrolled`} />
      <div className="p-6 lg:p-8">
        <StudentManager students={JSON.parse(JSON.stringify(students))} />
      </div>
    </>
  );
}
