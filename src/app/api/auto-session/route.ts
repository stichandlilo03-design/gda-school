import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
    const now = new Date();
    const today = DAYS[now.getDay()];
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const results: string[] = [];

    // ============================================================
    // 1. ENFORCE SCHOOL CLOSE TIME — end ALL sessions past close
    // ============================================================
    const schools = await db.school.findMany({ where: { isActive: true }, select: { id: true, schoolCloseTime: true, schoolOpenTime: true, sessionDurationMin: true, sessionsPerDay: true, currency: true, timezone: true } });
    for (const school of schools) {
      // Use school timezone for time calculations
      const schoolTz = school.timezone || "UTC";
      const schoolNow = new Date(now.toLocaleString("en-US", { timeZone: schoolTz }));
      const schoolNowMin = schoolNow.getHours() * 60 + schoolNow.getMinutes();
      const schoolToday = DAYS[schoolNow.getDay()];
      const closeMin = parseInt((school.schoolCloseTime || "15:00").split(":")[0]) * 60 + parseInt((school.schoolCloseTime || "15:00").split(":")[1] || "0");
      if (schoolNowMin > closeMin + 5) {
        const activeSessions = await db.liveClassSession.findMany({
          where: { status: { in: ["WAITING", "IN_PROGRESS"] }, class: { schoolGrade: { schoolId: school.id } } },
        });
        for (const session of activeSessions) {
          const durationMin = session.startedAt ? Math.round((now.getTime() - session.startedAt.getTime()) / 60000) : 0;
          await db.liveClassSession.update({
            where: { id: session.id },
            data: { status: "ENDED", endedAt: now, durationMin },
          });
          await creditTeacher(session, school.id, durationMin, now, school);
          results.push(`School closed — ended session (${durationMin}min)`);
        }
      }
    }

    // ============================================================
    // 2. TIMETABLE-BASED AUTO-START & AUTO-END
    // ============================================================
    // Fetch schedules for all possible "today" days across timezones
    const possibleDays = [...new Set([today, DAYS[(now.getDay() + 1) % 7], DAYS[(now.getDay() + 6) % 7]])];
    const schedules = await db.classSchedule.findMany({
      where: { dayOfWeek: { in: possibleDays as any[] } },
      include: {
        class: {
          include: {
            teacher: true,
            liveSessions: { where: { status: { in: ["IN_PROGRESS", "WAITING"] } }, take: 1 },
            schoolGrade: { include: { school: true } },
          },
        },
      },
    });

    for (const sched of schedules) {
      const startMin = parseInt(sched.startTime.split(":")[0]) * 60 + parseInt(sched.startTime.split(":")[1] || "0");
      const endMin = parseInt(sched.endTime.split(":")[0]) * 60 + parseInt(sched.endTime.split(":")[1] || "0");
      const cls = sched.class;
      const school = cls.schoolGrade?.school;
      if (!school) continue;

      // Use school timezone
      const tz = (school as any).timezone || "UTC";
      const localNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
      const localNowMin = localNow.getHours() * 60 + localNow.getMinutes();
      const localToday = DAYS[localNow.getDay()];

      // Skip if not this school's "today"
      if (sched.dayOfWeek !== localToday) continue;

      const schoolOpenMin = parseInt((school.schoolOpenTime || "08:00").split(":")[0]) * 60 + parseInt((school.schoolOpenTime || "08:00").split(":")[1] || "0");
      const schoolCloseMin = parseInt((school.schoolCloseTime || "15:00").split(":")[0]) * 60 + parseInt((school.schoolCloseTime || "15:00").split(":")[1] || "0");

      // Skip if outside school hours (using school local time)
      if (localNowMin < schoolOpenMin || localNowMin > schoolCloseMin + 5) continue;

      // Auto-start: within 2 min of start time, no active session, teacher not busy
      if (localNowMin >= startMin && localNowMin <= startMin + 2 && cls.liveSessions.length === 0) {
        const teacherBusy = await db.liveClassSession.findFirst({
          where: { teacherId: cls.teacherId, status: "IN_PROGRESS" },
        });
        if (!teacherBusy) {
          await db.liveClassSession.create({
            data: {
              classId: cls.id, teacherId: cls.teacherId,
              topic: `${cls.name} — Period ${sched.periodNumber}`, status: "IN_PROGRESS",
              startedAt: now, autoStarted: true,
              teacherJoinedAt: null, lateMinutes: 0,
              boardContent: [], boardHistory: [], raisedHands: [], chatMessages: [],
              whispers: [], questions: [], reactions: [], polls: [],
            },
          });
          results.push(`Auto-started: ${cls.name} P${sched.periodNumber}`);
        }
      }

      // Auto-end: past timetable end time OR past duration limit
      if (cls.liveSessions.length > 0) {
        const session = cls.liveSessions[0];
        const sessionMin = session.startedAt ? Math.round((now.getTime() - session.startedAt.getTime()) / 60000) : 0;
        const sessionLimit = school.sessionDurationMin || 40;

        if (localNowMin > endMin + 2 || sessionMin >= sessionLimit + 5) {
          const durationMin = session.startedAt ? Math.round((now.getTime() - session.startedAt.getTime()) / 60000) : 0;
          await db.liveClassSession.update({
            where: { id: session.id },
            data: { status: "ENDED", endedAt: now, durationMin },
          });
          await creditTeacher(session, school.id, durationMin, now, school);
          results.push(`Auto-ended: ${cls.name} (${durationMin}min)`);
        }
      }
    }

    // ============================================================
    // 3. ORPHANED SESSIONS — exceed 1.5x limit with no timetable
    // ============================================================
    const orphaned = await db.liveClassSession.findMany({
      where: { status: "IN_PROGRESS" },
      include: { class: { include: { schoolGrade: { include: { school: true } } } } },
    });
    for (const session of orphaned) {
      const school = session.class?.schoolGrade?.school;
      if (!school) continue;
      const sessionMin = session.startedAt ? Math.round((now.getTime() - session.startedAt.getTime()) / 60000) : 0;
      const limit = school.sessionDurationMin || 40;
      if (sessionMin > limit * 1.5) {
        await db.liveClassSession.update({
          where: { id: session.id },
          data: { status: "ENDED", endedAt: now, durationMin: sessionMin },
        });
        await creditTeacher(session, school.id, sessionMin, now, school);
        results.push(`Orphan ended (${sessionMin}min)`);
      }
    }

    return NextResponse.json({ ok: true, results, checked: schedules.length, time: `${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function creditTeacher(session: any, schoolId: string, durationMin: number, now: Date, school: any) {
  if (session.creditAwarded || durationMin < 1) return;

  const st = await db.schoolTeacher.findFirst({
    where: { teacherId: session.teacherId, schoolId },
    include: { salary: true },
  });
  if (!st?.salary) return;

  const sessionsPerDay = school.sessionsPerDay || 4;
  const workingDays = st.salary.workingDaysPerMonth || 22;
  const sessionsPerMonth = sessionsPerDay * workingDays;
  const sessionLimit = school.sessionDurationMin || 40;
  const credit = Math.round((st.salary.baseSalary / sessionsPerMonth) * (Math.min(durationMin, sessionLimit + 5) / sessionLimit) * 100) / 100;
  if (credit <= 0) return;

  await db.sessionCredit.create({
    data: {
      liveSessionId: session.id, teacherId: session.teacherId,
      schoolId, durationMin, creditAmount: credit,
      currency: school.currency || "USD", status: "CREDITED",
    },
  });
  await db.liveClassSession.update({ where: { id: session.id }, data: { creditAwarded: true } });

  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const existing = await db.payrollRecord.findUnique({
    where: { schoolTeacherId_month_year: { schoolTeacherId: st.id, month, year } },
  });
  if (existing) {
    const newGross = existing.grossPay + credit;
    const taxDed = newGross * (st.salary.taxRate / 100);
    const pensionDed = newGross * ((st.salary.pensionRate || 0) / 100);
    await db.payrollRecord.update({
      where: { id: existing.id },
      data: { grossPay: newGross, netPay: Math.max(0, newGross - taxDed - pensionDed - existing.otherDeductions) },
    });
  } else {
    const taxDed = credit * ((st.salary.taxRate || 0) / 100);
    const pensionDed = credit * ((st.salary.pensionRate || 0) / 100);
    await db.payrollRecord.create({
      data: {
        schoolTeacherId: st.id, month, year,
        baseSalary: st.salary.baseSalary,
        allowances: (st.salary.housingAllowance||0) + (st.salary.transportAllowance||0) + (st.salary.otherAllowances||0),
        grossPay: credit, taxDeduction: taxDed, pensionDeduction: pensionDed,
        netPay: Math.max(0, credit - taxDed - pensionDed),
        currency: school.currency || "USD", status: "DRAFT",
      },
    });
  }
}
