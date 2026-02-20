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

  // Check for teacher conflict — same teacher shouldn't be in two classes at same time
  const cls = await db.class.findUnique({ where: { id: data.classId }, select: { teacherId: true, name: true } });
  if (cls) {
    const conflict = await db.classSchedule.findFirst({
      where: {
        dayOfWeek: data.dayOfWeek as any,
        periodNumber: data.periodNumber,
        class: { teacherId: cls.teacherId, id: { not: data.classId } },
      },
      include: { class: { select: { name: true } } },
    });
    if (conflict) {
      return { error: `Teacher conflict! This teacher already has "${conflict.class.name}" at Period ${data.periodNumber} on ${data.dayOfWeek}. Choose a different period.` };
    }
  }

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

  // Get ALL existing schedules in the school to check teacher conflicts across grades
  const allExistingSchedules = await db.classSchedule.findMany({
    where: {
      class: { schoolGrade: { schoolId: school.id }, id: { notIn: classes.map(c => c.id) } },
    },
    include: { class: { select: { teacherId: true, name: true } } },
  });

  // Build teacher busy map: teacherId -> day -> Set of periods
  const teacherBusy: Record<string, Record<string, Set<number>>> = {};
  for (const sched of allExistingSchedules) {
    const tid = sched.class.teacherId;
    if (!teacherBusy[tid]) teacherBusy[tid] = {};
    if (!teacherBusy[tid][sched.dayOfWeek]) teacherBusy[tid][sched.dayOfWeek] = new Set();
    teacherBusy[tid][sched.dayOfWeek].add(sched.periodNumber);
  }

  // Delete existing schedules for THIS grade's classes
  await db.classSchedule.deleteMany({ where: { classId: { in: classes.map(c => c.id) } } });

  const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const openMin = parseInt(school.schoolOpenTime.split(":")[0]) * 60 + parseInt(school.schoolOpenTime.split(":")[1] || "0");
  const dur = school.sessionDurationMin;
  const brk = school.breakDurationMin;
  const perDay = school.sessionsPerDay;
  const breakAfter = Math.floor(perDay / 2);

  let created = 0;
  let skipped = 0;

  for (const day of DAYS) {
    const dayIdx = DAYS.indexOf(day);
    const rotated = [...classes.slice(dayIdx % classes.length), ...classes.slice(0, dayIdx % classes.length)];

    let periodSlot = 0;
    for (const cls of rotated) {
      if (periodSlot >= perDay) break;

      // Check if this teacher is busy at this period (from other grades)
      const tid = cls.teacherId;
      while (periodSlot < perDay) {
        const period = periodSlot + 1;
        const isBusy = teacherBusy[tid]?.[day]?.has(period);
        if (!isBusy) break;
        periodSlot++; // Skip to next period
        skipped++;
      }
      if (periodSlot >= perDay) break;

      const period = periodSlot + 1;
      let offsetMin = openMin + periodSlot * (dur + brk);
      if (periodSlot >= breakAfter) offsetMin += brk;

      const startH = Math.floor(offsetMin / 60), startM = offsetMin % 60;
      const endOffset = offsetMin + dur;
      const endH = Math.floor(endOffset / 60), endM = endOffset % 60;

      await db.classSchedule.create({
        data: {
          classId: cls.id, dayOfWeek: day as any, periodNumber: period,
          startTime: `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`,
          endTime: `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`,
        },
      });

      // Mark this teacher as busy for this period
      if (!teacherBusy[tid]) teacherBusy[tid] = {};
      if (!teacherBusy[tid][day]) teacherBusy[tid][day] = new Set();
      teacherBusy[tid][day].add(period);

      created++;
      periodSlot++;
    }
  }

  revalidatePath("/principal/timetable");
  revalidatePath("/teacher/timetable");
  revalidatePath("/student/timetable");
  return { success: true, message: `Generated ${created} slots across ${DAYS.length} days${skipped > 0 ? ` (${skipped} conflicts avoided)` : ""}` };
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
