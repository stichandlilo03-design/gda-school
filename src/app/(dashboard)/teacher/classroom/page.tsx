import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import TeacherClassroomClient from "./classroom-client";

export default async function TeacherClassroomPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: {
        where: { isActive: true },
        include: {
          schoolGrade: true,
          schedules: true,
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              student: {
                include: { user: { select: { id: true, name: true, image: true } } },
              },
            },
          },
          attendances: {
            where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
          },
          announcements: { orderBy: { createdAt: "desc" }, take: 5 },
          liveSessions: { where: { status: "IN_PROGRESS" }, take: 1 },
          _count: { select: { materials: true } },
        },
      },
    },
  });

  if (!teacher) return null;

  const totalStudents = teacher.classes.reduce((s, c) => s + c.enrollments.length, 0);

  return (
    <>
      <DashboardHeader title="My Classroom" subtitle={`${teacher.classes.length} classes • ${totalStudents} students`} />
      <div className="p-6 lg:p-8">
        <TeacherClassroomClient
          classes={JSON.parse(JSON.stringify(teacher.classes))}
          teacherId={teacher.id}
        />
      </div>
    </>
  );
}
