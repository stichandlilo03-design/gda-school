import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import AttendanceMarker from "./attendance-marker";

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;


    let teacher: any = null;
try {
    teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        classes: {
          where: { isActive: true },
          include: {
            enrollments: {
              where: { status: "ACTIVE" },
              include: { student: { include: { user: { select: { name: true, email: true } } } } },
            },
            schoolGrade: true,
          },
        },
      },
    });

  } catch (err: any) {
    console.error("attendance page error:", err?.message || err);
  }

  return (
    <>
      <DashboardHeader title="Attendance" subtitle="Mark and track class attendance" />
      <div className="p-6 lg:p-8">
        <AttendanceMarker classes={JSON.parse(JSON.stringify(teacher?.classes || []))} />
      </div>
    </>
  );
}
