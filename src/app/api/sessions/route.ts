import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ liveSessions: [], upcoming: [] });

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const todayDay = days[now.getDay()];

  if (session.user.role === "TEACHER") {
    const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher) return NextResponse.json({ liveSessions: [], upcoming: [] });

    // Live sessions
    const liveSessions = await db.teachingSession.findMany({
      where: {
        schoolTeacher: { teacherId: teacher.id },
        status: "LIVE",
        date: today,
      },
      include: {
        schoolTeacher: { include: { school: { select: { name: true } } } },
      },
    });

    // Today's scheduled classes
    const classes = await db.class.findMany({
      where: { teacherId: teacher.id, isActive: true },
      include: {
        schedules: { where: { dayOfWeek: todayDay as any } },
        schoolGrade: true,
      },
    });

    const upcoming = classes
      .flatMap((cls) =>
        cls.schedules.map((sch) => ({
          classId: cls.id,
          className: cls.name,
          grade: cls.schoolGrade.gradeLevel,
          startTime: sch.startTime,
          endTime: sch.endTime,
          period: sch.periodNumber,
        }))
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return NextResponse.json({
      liveSessions: liveSessions.map((s) => ({
        id: s.id,
        classId: s.classId,
        startedAt: s.startedAt,
        topic: s.topic,
      })),
      upcoming,
    });
  }

  if (session.user.role === "STUDENT") {
    const student = await db.student.findUnique({
      where: { userId: session.user.id },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            class: {
              include: {
                schedules: { where: { dayOfWeek: todayDay as any } },
                schoolGrade: true,
                teacher: { include: { user: { select: { name: true } } } },
              },
            },
          },
        },
      },
    });

    const upcoming = (student?.enrollments || [])
      .flatMap((e) =>
        e.class.schedules.map((sch) => ({
          classId: e.class.id,
          className: e.class.name,
          teacherName: e.class.teacher.user.name,
          grade: e.class.schoolGrade.gradeLevel,
          startTime: sch.startTime,
          endTime: sch.endTime,
          period: sch.periodNumber,
        }))
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return NextResponse.json({ liveSessions: [], upcoming });
  }

  return NextResponse.json({ liveSessions: [], upcoming: [] });
}
