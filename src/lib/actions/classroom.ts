"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============ TEACHER ACTIONS ============

// Start a live class session
export async function startLiveClass(classId: string, topic?: string, isPrep?: boolean, prepDurationMin?: number) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return { error: "Teacher not found" };

  // Check if ANOTHER teacher already has an active session in this class
  const existingSession = await db.liveClassSession.findFirst({
    where: { classId, status: { in: ["WAITING", "IN_PROGRESS"] }, teacherId: { not: teacher.id } },
    include: { teacher: { include: { user: { select: { name: true } } } } },
  });
  if (existingSession) {
    return { error: `Another teacher (${existingSession.teacher.user.name}) already has an active session in this class.` };
  }

  // If teacher wants PREP: end any existing sessions first, then create fresh prep
  if (isPrep) {
    // End any existing sessions (auto-started or not) for this class
    await db.liveClassSession.updateMany({
      where: { classId, teacherId: teacher.id, status: { in: ["WAITING", "IN_PROGRESS"] } },
      data: { status: "ENDED", endedAt: new Date() },
    });

    const live = await db.liveClassSession.create({
      data: {
        classId, teacherId: teacher.id,
        topic: `[PREP] ${topic || "Class Setup"}`,
        status: "IN_PROGRESS", startedAt: new Date(),
        teacherJoinedAt: new Date(), lateMinutes: 0,
        isPrep: true,
        durationMin: prepDurationMin || 30,
        boardContent: [], boardHistory: [],
        raisedHands: [], chatMessages: [],
        whispers: [], questions: [], reactions: [], polls: [], teachingMode: "board",
      },
    });

    // NO revalidatePath — students poll every 3-10 seconds and will find the session
    return { success: true, sessionId: live.id };
  }

  // REAL CLASS: Check if there's an auto-started session to join
  const autoSession = await db.liveClassSession.findFirst({
    where: { classId, teacherId: teacher.id, status: { in: ["WAITING", "IN_PROGRESS"] }, autoStarted: true, teacherJoinedAt: null },
  });
  if (autoSession) {
    const nowJ = new Date();
    let lateMins = 0;
    if (autoSession.startedAt) {
      lateMins = Math.max(0, Math.round((nowJ.getTime() - autoSession.startedAt.getTime()) / 60000));
    }
    await db.liveClassSession.update({
      where: { id: autoSession.id },
      data: { teacherJoinedAt: nowJ, lateMinutes: lateMins, topic: topic || autoSession.topic },
    });
    // NO revalidatePath — polling handles updates
    return { success: true, sessionId: autoSession.id, lateMinutes: lateMins };
  }

  // Check for existing PREP session — carry over board content to new real class
  let carryOverBoard: any[] = [];
  let carryOverHistory: any[] = [];
  const existingPrep = await db.liveClassSession.findFirst({
    where: { classId, teacherId: teacher.id, status: { in: ["WAITING", "IN_PROGRESS"] }, isPrep: true },
  });
  if (existingPrep) {
    carryOverBoard = Array.isArray(existingPrep.boardContent) ? existingPrep.boardContent as any[] : [];
    carryOverHistory = Array.isArray(existingPrep.boardHistory) ? existingPrep.boardHistory as any[] : [];
    await db.liveClassSession.update({
      where: { id: existingPrep.id },
      data: { status: "ENDED", endedAt: new Date() },
    });
  } else {
    // Close any existing non-prep sessions
    await db.liveClassSession.updateMany({
      where: { classId, teacherId: teacher.id, status: { in: ["WAITING", "IN_PROGRESS"] }, isPrep: false },
      data: { status: "ENDED", endedAt: new Date() },
    });
  }

  // Calculate late minutes from timetable
  const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = DAYS[now.getDay()];
  let lateMinutes = 0;

  const schedule = await db.classSchedule.findFirst({
    where: { classId, dayOfWeek: today as any },
  });
  if (schedule) {
    const schedStart = parseInt(schedule.startTime.split(":")[0]) * 60 + parseInt(schedule.startTime.split(":")[1] || "0");
    if (nowMin > schedStart + 2) {
      lateMinutes = nowMin - schedStart;
    }
  }

  const live = await db.liveClassSession.create({
    data: {
      classId, teacherId: teacher.id,
      topic: topic || "Live Class",
      status: "IN_PROGRESS", startedAt: new Date(),
      teacherJoinedAt: new Date(), lateMinutes,
      isPrep: false,
      durationMin: 0,
      boardContent: carryOverBoard.length > 0 ? carryOverBoard : [],
      boardHistory: carryOverHistory.length > 0 ? carryOverHistory : [],
      raisedHands: [], chatMessages: [],
      whispers: [], questions: [], reactions: [], polls: [], teachingMode: "board",
    },
  });

  // NO revalidatePath — polling handles everything
  return { success: true, sessionId: live.id };
}

// Convert a prep session into a real live class (keeps all board content)
export async function convertPrepToLive(sessionId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const live = await db.liveClassSession.findUnique({
    where: { id: sessionId },
    include: { class: { include: { schedules: true, schoolGrade: { include: { school: true } } } } },
  });
  if (!live || !live.isPrep) return { error: "Not a prep session" };

  // Check timetable — warn if going live outside scheduled time
  const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  const school = live.class?.schoolGrade?.school;
  const tz = (school as any)?.timezone || "UTC";
  const localNow = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  const nowMin = localNow.getHours() * 60 + localNow.getMinutes();
  const today = DAYS[localNow.getDay()];
  let lateMinutes = 0;
  let outsideSchedule = false;
  let nextClassInfo = "";

  const todaySchedules = (live.class?.schedules || []).filter((s: any) => s.dayOfWeek === today);
  if (todaySchedules.length > 0) {
    const sched = todaySchedules[0];
    const schedStart = parseInt(sched.startTime.split(":")[0]) * 60 + parseInt(sched.startTime.split(":")[1] || "0");
    const schedEnd = parseInt(sched.endTime.split(":")[0]) * 60 + parseInt(sched.endTime.split(":")[1] || "0");

    if (nowMin < schedStart - 5) {
      // Before class time
      outsideSchedule = true;
      const h = Math.floor(schedStart / 60), m = schedStart % 60;
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      nextClassInfo = `Class is scheduled for ${h12}:${String(m).padStart(2,"0")} ${ampm} today`;
    } else if (nowMin > schedEnd + 10) {
      // After class time
      outsideSchedule = true;
      nextClassInfo = "Class time has already passed for today";
    } else {
      // During class time — calculate late
      if (nowMin > schedStart + 2) {
        lateMinutes = nowMin - schedStart;
      }
    }
  } else {
    // No schedule today
    outsideSchedule = true;
    // Find next scheduled day
    const allSchedules = live.class?.schedules || [];
    if (allSchedules.length > 0) {
      const dayOrder = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
      const todayIdx = dayOrder.indexOf(today);
      const sorted = allSchedules.sort((a: any, b: any) => {
        const ai = (dayOrder.indexOf(a.dayOfWeek) - todayIdx + 7) % 7;
        const bi = (dayOrder.indexOf(b.dayOfWeek) - todayIdx + 7) % 7;
        return ai - bi;
      });
      const next = sorted.find((s: any) => s.dayOfWeek !== today) || sorted[0];
      const h = parseInt(next.startTime.split(":")[0]), m = parseInt(next.startTime.split(":")[1] || "0");
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      nextClassInfo = `Next class: ${next.dayOfWeek} at ${h12}:${String(m).padStart(2,"0")} ${ampm}`;
    } else {
      nextClassInfo = "No class scheduled on the timetable";
    }
  }

  if (outsideSchedule) {
    return { error: `Cannot go live outside class time. ${nextClassInfo}. You can continue preparing.` };
  }

  // Convert: keep ALL content, change isPrep to false, clear prepHidden
  const newTopic = (live.topic || "").replace("[PREP] ", "");
  await db.liveClassSession.update({
    where: { id: sessionId },
    data: {
      isPrep: false,
      durationMin: 0,
      topic: newTopic || "Live Class",
      startedAt: new Date(),
      lateMinutes,
      prepHidden: {}, // Clear all hidden flags — everything visible now
    },
  });

  return { success: true, sessionId };
}

// End a live class session + credit teacher + auto payroll
export async function endLiveClass(sessionId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const live = await db.liveClassSession.findUnique({
    where: { id: sessionId },
    include: { class: { include: { schoolGrade: { include: { school: true } } } } },
  });
  if (!live) return { error: "Session not found" };

  const durationMin = live.startedAt
    ? Math.round((Date.now() - live.startedAt.getTime()) / 60000)
    : 0;

  const school = live.class.schoolGrade?.school;
  const sessionLimit = school?.sessionDurationMin || 40;
  const breakMin = school?.breakDurationMin || 10;

  await db.liveClassSession.update({
    where: { id: sessionId },
    data: { status: "ENDED", endedAt: new Date(), durationMin, raisedHands: [] },
  });

  // Award session credit + auto payroll (min 1 min for network issues) — SKIP for prep sessions
  if (!live.creditAwarded && durationMin >= 1 && !live.isPrep) {
    const schoolTeacher = await db.schoolTeacher.findFirst({
      where: { teacherId: live.teacherId, schoolId: school?.id || "" },
      include: { salary: true },
    });

    let creditAmount = 0;
    if (schoolTeacher?.salary) {
      const sessionsPerDay = school?.sessionsPerDay || 4;
      const workingDays = schoolTeacher.salary.workingDaysPerMonth || 22;
      const sessionsPerMonth = sessionsPerDay * workingDays;
      creditAmount = Math.round(
        (schoolTeacher.salary.baseSalary / sessionsPerMonth) *
        (Math.min(durationMin, sessionLimit + 5) / sessionLimit) * 100
      ) / 100;
    }

    if (creditAmount > 0) {
      await db.sessionCredit.create({
        data: {
          liveSessionId: sessionId,
          teacherId: live.teacherId,
          schoolId: school?.id || "",
          durationMin,
          creditAmount,
          currency: school?.currency || "USD",
          status: "CREDITED",
        },
      });

      await db.liveClassSession.update({
        where: { id: sessionId },
        data: { creditAwarded: true },
      });

      // AUTO-PAYROLL: Upsert current month's payroll record
      if (schoolTeacher) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const existing = await db.payrollRecord.findUnique({
          where: { schoolTeacherId_month_year: { schoolTeacherId: schoolTeacher.id, month, year } },
        });

        if (existing) {
          // Add credit to existing payroll
          const newGross = existing.grossPay + creditAmount;
          const taxDed = schoolTeacher.salary ? newGross * (schoolTeacher.salary.taxRate / 100) : 0;
          const netPay = newGross - taxDed - existing.pensionDeduction - existing.otherDeductions;
          await db.payrollRecord.update({
            where: { id: existing.id },
            data: { grossPay: newGross, netPay, notes: `Auto-updated: +${creditAmount} from session (${durationMin}min)` },
          });
        } else {
          // Create new payroll for this month
          const base = schoolTeacher.salary?.baseSalary || 0;
          const allowances = (schoolTeacher.salary?.housingAllowance || 0) +
            (schoolTeacher.salary?.transportAllowance || 0) + (schoolTeacher.salary?.otherAllowances || 0);
          const taxRate = schoolTeacher.salary?.taxRate || 0;
          const taxDed = creditAmount * (taxRate / 100);
          await db.payrollRecord.create({
            data: {
              schoolTeacherId: schoolTeacher.id,
              month, year,
              baseSalary: base,
              allowances,
              grossPay: creditAmount,
              taxDeduction: taxDed,
              netPay: creditAmount - taxDed,
              currency: school?.currency || "USD",
              status: "DRAFT",
              notes: `Auto-created from session (${durationMin}min)`,
            },
          });
        }
      }
    }
  }

  revalidatePath("/teacher/classroom");
  revalidatePath("/student/classroom");
  revalidatePath("/principal");
  revalidatePath("/principal/payroll");
  return { success: true, durationMin, breakMin };
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

  // During prep, student is EARLY — always PRESENT
  // During real class, check timing: within 10 min = PRESENT, else LATE
  let status = "PRESENT";
  if (!live.isPrep) {
    const minutesSinceStart = live.startedAt ? (Date.now() - live.startedAt.getTime()) / 60000 : 0;
    status = minutesSinceStart <= 10 ? "PRESENT" : "LATE";
  }

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
