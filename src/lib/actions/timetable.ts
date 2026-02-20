"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveTimetableSlot(data: {
  classId: string; dayOfWeek: string; periodNumber: number; startTime: string; endTime: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.classSchedule.upsert({
    where: { classId_dayOfWeek_periodNumber: { classId: data.classId, dayOfWeek: data.dayOfWeek as any, periodNumber: data.periodNumber } },
    update: { startTime: data.startTime, endTime: data.endTime },
    create: { classId: data.classId, dayOfWeek: data.dayOfWeek as any, periodNumber: data.periodNumber, startTime: data.startTime, endTime: data.endTime },
  });

  revalidatePath("/principal/timetable");
  revalidatePath("/teacher/timetable");
  revalidatePath("/student/timetable");
  return { success: true };
}

export async function deleteTimetableSlot(classId: string, dayOfWeek: string, periodNumber: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  await db.classSchedule.deleteMany({
    where: { classId, dayOfWeek: dayOfWeek as any, periodNumber },
  });

  revalidatePath("/principal/timetable");
  revalidatePath("/teacher/timetable");
  revalidatePath("/student/timetable");
  return { success: true };
}

export async function autoGenerateTimetable(gradeId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id }, include: { school: true } });
  if (!principal) return { error: "Not found" };

  const school = principal.school;
  const classes = await db.class.findMany({
    where: { schoolGradeId: gradeId, isActive: true },
    include: { subject: true, teacher: { include: { user: true } } },
  });

  if (classes.length === 0) return { error: "No classes found for this grade" };

  // Delete existing schedules for these classes
  await db.classSchedule.deleteMany({ where: { classId: { in: classes.map(c => c.id) } } });

  const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const openMin = parseInt(school.schoolOpenTime.split(":")[0]) * 60 + parseInt(school.schoolOpenTime.split(":")[1] || "0");
  const dur = school.sessionDurationMin;
  const brk = school.breakDurationMin;
  const perDay = school.sessionsPerDay;

  let created = 0;
  for (const day of DAYS) {
    // Rotate subjects so each day has different order
    const dayIdx = DAYS.indexOf(day);
    const rotated = [...classes.slice(dayIdx % classes.length), ...classes.slice(0, dayIdx % classes.length)];

    for (let p = 0; p < Math.min(perDay, rotated.length); p++) {
      const cls = rotated[p];
      // Insert break after half the periods
      const breakAfter = Math.floor(perDay / 2);
      let offsetMin = openMin + p * (dur + brk);
      if (p >= breakAfter) offsetMin += brk; // extra long break in middle

      const startH = Math.floor(offsetMin / 60);
      const startM = offsetMin % 60;
      const endOffset = offsetMin + dur;
      const endH = Math.floor(endOffset / 60);
      const endM = endOffset % 60;

      await db.classSchedule.create({
        data: {
          classId: cls.id,
          dayOfWeek: day as any,
          periodNumber: p + 1,
          startTime: `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`,
          endTime: `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`,
        },
      });
      created++;
    }
  }

  revalidatePath("/principal/timetable");
  revalidatePath("/teacher/timetable");
  revalidatePath("/student/timetable");
  return { success: true, message: `Generated ${created} slots across ${DAYS.length} days` };
}

export async function updateSchoolHours(data: { schoolOpenTime: string; schoolCloseTime: string; sessionDurationMin: number; breakDurationMin: number; sessionsPerDay: number }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PRINCIPAL") return { error: "Unauthorized" };

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return { error: "Not found" };

  await db.school.update({
    where: { id: principal.schoolId },
    data: {
      schoolOpenTime: data.schoolOpenTime,
      schoolCloseTime: data.schoolCloseTime,
      sessionDurationMin: data.sessionDurationMin,
      breakDurationMin: data.breakDurationMin,
      sessionsPerDay: data.sessionsPerDay,
    },
  });

  revalidatePath("/principal/timetable");
  revalidatePath("/principal/settings");
  return { success: true };
}
