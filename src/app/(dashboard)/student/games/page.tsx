import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/layout/dashboard-header";
import SchoolGames from "@/components/school-games";

const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

export default async function StudentGamesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true, gradeLevel: true,
      school: { select: { name: true, timezone: true } },
      enrollments: { where: { status: "ACTIVE" }, select: { classId: true } },
    },
  });
  if (!student) redirect("/student");

  // Fetch today's schedule for this student's enrolled classes
  const today = DAYS[new Date().getDay()] as any;
  let todaySlots: { startTime: string; endTime: string }[] = [];
  try {
    const classIds = student.enrollments.map((e: any) => e.classId);
    if (classIds.length > 0) {
      todaySlots = await db.classSchedule.findMany({
        where: { classId: { in: classIds }, dayOfWeek: today },
        select: { startTime: true, endTime: true },
        orderBy: { startTime: "asc" },
      });
    }
  } catch (_e) {}

  return (
    <div className="p-4 md:p-6 space-y-4">
      <DashboardHeader title="🎮 School Games & Competitions" subtitle="Play, learn, and compete with classmates!" />
      <SchoolGames
        studentId={student.id}
        userId={session.user.id}
        studentName={session.user.name || "Student"}
        schoolName={student.school.name}
        gradeLevel={student.gradeLevel}
        todaySlots={JSON.parse(JSON.stringify(todaySlots))}
      />
    </div>
  );
}
