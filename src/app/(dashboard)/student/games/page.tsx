import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/layout/dashboard-header";
import SchoolGames from "@/components/school-games";

export default async function StudentGamesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, gradeLevel: true, school: { select: { name: true } } },
  });
  if (!student) redirect("/student");

  return (
    <div className="p-4 md:p-6 space-y-4">
      <DashboardHeader title="🎮 School Games & Competitions" subtitle="Play, learn, and compete with classmates!" />
      <SchoolGames
        studentId={student.id}
        userId={session.user.id}
        studentName={session.user.name || "Student"}
        schoolName={student.school.name}
        gradeLevel={student.gradeLevel}
      />
    </div>
  );
}
