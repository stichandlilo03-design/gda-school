import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import StudentClassroomClient from "./classroom-client";

export default async function StudentClassroomPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              subject: true,
              teacher: { include: { user: { select: { name: true, image: true } } } },
              schoolGrade: true,
              schedules: true,
              announcements: { orderBy: { createdAt: "desc" }, take: 10, include: { teacher: { include: { user: { select: { name: true } } } } } },
              liveSessions: { where: { status: "IN_PROGRESS" }, take: 1 },
              enrollments: {
                where: { status: "ACTIVE" },
                include: { student: { include: { user: { select: { id: true, name: true, image: true } } } } },
                take: 50,
              },
              _count: { select: { enrollments: true, materials: true } },
            },
          },
        },
      },
      attendances: {
        where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      },
    },
  });

  if (!student) return null;
  const isKG = ["K1", "K2", "K3"].includes(student.gradeLevel);

  return (
    <>
      <DashboardHeader
        title={isKG ? "🏫 My Classroom" : "My Classroom"}
        subtitle={isKG ? "Join your class and learn!" : "Join live classes & view announcements"}
      />
      <div className="p-6 lg:p-8">
        <StudentClassroomClient
          enrollments={JSON.parse(JSON.stringify(student.enrollments))}
          todayAttendance={JSON.parse(JSON.stringify(student.attendances))}
          studentId={student.id}
          studentName={session.user.name || "Student"}
          isKG={isKG}
        />
      </div>
    </>
  );
}
