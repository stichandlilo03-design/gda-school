"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============ TEACHER ACTIONS ============

// Start a live class session
export async function startLiveClass(classId: string, topic?: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return { error: "Teacher not found" };

  // Close any existing open session for this class
  await db.liveClassSession.updateMany({
    where: { classId, teacherId: teacher.id, status: { in: ["WAITING", "IN_PROGRESS"] } },
    data: { status: "ENDED", endedAt: new Date() },
  });

  const live = await db.liveClassSession.create({
    data: { classId, teacherId: teacher.id, topic, status: "IN_PROGRESS", startedAt: new Date() },
  });

  revalidatePath("/teacher/classroom");
  revalidatePath("/student/classroom");
  return { success: true, sessionId: live.id };
}

// End a live class session
export async function endLiveClass(sessionId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await db.liveClassSession.update({
    where: { id: sessionId },
    data: { status: "ENDED", endedAt: new Date() },
  });

  revalidatePath("/teacher/classroom");
  revalidatePath("/student/classroom");
  return { success: true };
}

// Mark attendance for a student
export async function markAttendance(data: {
  classId: string; studentId: string; status: string; date?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const dateVal = data.date ? new Date(data.date) : new Date();
  const dateOnly = new Date(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate());

  // Upsert attendance
  const existing = await db.attendanceRecord.findFirst({
    where: { classId: data.classId, studentId: data.studentId, date: dateOnly },
  });

  const cls = await db.class.findUnique({ where: { id: data.classId }, select: { session: true } });
  const classSession = cls?.session || "SESSION_A";

  if (existing) {
    await db.attendanceRecord.update({
      where: { id: existing.id },
      data: { status: data.status as any, joinedAt: data.status === "PRESENT" || data.status === "LATE" ? new Date() : null },
    });
  } else {
    await db.attendanceRecord.create({
      data: {
        classId: data.classId,
        studentId: data.studentId,
        date: dateOnly,
        session: classSession,
        status: data.status as any,
        joinedAt: data.status === "PRESENT" || data.status === "LATE" ? new Date() : null,
      },
    });
  }

  revalidatePath("/teacher/classroom");
  return { success: true };
}

// Bulk mark attendance
export async function bulkMarkAttendance(classId: string, records: { studentId: string; status: string }[]) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const dateOnly = new Date();
  dateOnly.setHours(0, 0, 0, 0);

  const cls = await db.class.findUnique({ where: { id: classId }, select: { session: true } });
  const classSession = cls?.session || "SESSION_A";

  for (const rec of records) {
    const existing = await db.attendanceRecord.findFirst({
      where: { classId, studentId: rec.studentId, date: dateOnly },
    });
    if (existing) {
      await db.attendanceRecord.update({
        where: { id: existing.id },
        data: { status: rec.status as any, joinedAt: rec.status === "PRESENT" || rec.status === "LATE" ? new Date() : null },
      });
    } else {
      await db.attendanceRecord.create({
        data: {
          classId, studentId: rec.studentId, date: dateOnly,
          session: classSession,
          status: rec.status as any,
          joinedAt: rec.status === "PRESENT" || rec.status === "LATE" ? new Date() : null,
        },
      });
    }
  }

  revalidatePath("/teacher/classroom");
  return { success: true, count: records.length };
}

// Post class announcement / alert
export async function postClassAnnouncement(data: {
  classId: string; title: string; content: string; type?: string; isPinned?: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return { error: "Teacher not found" };

  await db.classAnnouncement.create({
    data: {
      classId: data.classId,
      teacherId: teacher.id,
      title: data.title,
      content: data.content,
      type: data.type || "GENERAL",
      isPinned: data.isPinned || false,
    },
  });

  // Also send a message to all enrolled students
  const enrollments = await db.enrollment.findMany({
    where: { classId: data.classId, status: "ACTIVE" },
    include: { student: { select: { userId: true } } },
  });

  for (const e of enrollments) {
    await db.message.create({
      data: {
        senderId: session.user.id,
        receiverId: e.student.userId,
        subject: `📢 ${data.title}`,
        content: data.content,
      },
    });
  }

  revalidatePath("/teacher/classroom");
  revalidatePath("/student/classroom");
  return { success: true };
}

// Delete announcement
export async function deleteAnnouncement(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };
  await db.classAnnouncement.delete({ where: { id } });
  revalidatePath("/teacher/classroom");
  return { success: true };
}

// ============ STUDENT ACTIONS ============

// Student marks themselves as "joined" (present)
export async function studentJoinClass(classId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const student = await db.student.findUnique({ where: { userId: session.user.id } });
  if (!student) return { error: "Student not found" };

  // Check there's a live session
  const live = await db.liveClassSession.findFirst({
    where: { classId, status: "IN_PROGRESS" },
  });
  if (!live) return { error: "No active class session" };

  // Check time since class started — if within 10 min, PRESENT; else LATE
  const minutesSinceStart = live.startedAt ? (Date.now() - live.startedAt.getTime()) / 60000 : 0;
  const status = minutesSinceStart <= 10 ? "PRESENT" : "LATE";

  const dateOnly = new Date();
  dateOnly.setHours(0, 0, 0, 0);

  const existing = await db.attendanceRecord.findFirst({
    where: { classId, studentId: student.id, date: dateOnly },
  });

  if (existing) {
    await db.attendanceRecord.update({
      where: { id: existing.id },
      data: { status: status as any, joinedAt: new Date() },
    });
  } else {
    const cls = await db.class.findUnique({ where: { id: classId }, select: { session: true } });
    const classSession = cls?.session || "SESSION_A";
    await db.attendanceRecord.create({
      data: { classId, studentId: student.id, date: dateOnly, session: classSession, status: status as any, joinedAt: new Date() },
    });
  }

  revalidatePath("/student/classroom");
  return { success: true, status };
}
