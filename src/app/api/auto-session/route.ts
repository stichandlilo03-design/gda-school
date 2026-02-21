import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
    const now = new Date();
    const results: string[] = [];

    // ============================================================
    // 1. SCHOOL CLOSE — end everything past close time
    // ============================================================
    const schools = await db.school.findMany({ where: { isActive: true }, select: { id: true, schoolCloseTime: true, schoolOpenTime: true, sessionDurationMin: true, sessionsPerDay: true, currency: true, timezone: true } });
    for (const school of schools) {
      const tz = school.timezone || "UTC";
      const sNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
      const sMin = sNow.getHours() * 60 + sNow.getMinutes();
      const closeMin = parseInt((school.schoolCloseTime || "15:00").split(":")[0]) * 60 + parseInt((school.schoolCloseTime || "15:00").split(":")[1] || "0");
      if (sMin > closeMin + 10) {
        const active = await db.liveClassSession.findMany({
          where: { status: { in: ["WAITING", "IN_PROGRESS"] }, class: { schoolGrade: { schoolId: school.id } } },
        });
        for (const s of active) {
          const dur = s.startedAt ? Math.round((now.getTime() - s.startedAt.getTime()) / 60000) : 0;
          await db.liveClassSession.update({ where: { id: s.id }, data: { status: "ENDED", endedAt: now, durationMin: dur } });
          if (!s.isPrep) await creditTeacher(s, school.id, dur, now, school);
          results.push(`School closed — ended (${dur}min)`);
        }
      }
    }

    // ============================================================
    // 2. PREP TIMEOUT — end preps past teacher's chosen duration
    //    BUT skip if timetable class start is within 5 min (section 3 will auto-convert)
    // ============================================================
    const preps = await db.liveClassSession.findMany({
      where: { status: "IN_PROGRESS", isPrep: true },
      include: { class: { include: { schedules: true, schoolGrade: { include: { school: true } } } } },
    });
    for (const p of preps) {
      const mins = p.startedAt ? Math.round((now.getTime() - p.startedAt.getTime()) / 60000) : 0;
      const limit = p.durationMin || 30;
      if (mins >= limit) {
        // Check if timetable class starts within 5 min — if so, keep prep alive for auto-convert
        const school = p.class?.schoolGrade?.school;
        const tz = (school as any)?.timezone || "UTC";
        const localNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
        const localMin = localNow.getHours() * 60 + localNow.getMinutes();
        const localDay = DAYS[localNow.getDay()];

        const upcomingSlot = (p.class?.schedules || []).find((s: any) => {
          if (s.dayOfWeek !== localDay) return false;
          const sStart = parseInt(s.startTime.split(":")[0]) * 60 + parseInt(s.startTime.split(":")[1] || "0");
          return sStart >= localMin && sStart <= localMin + 5; // Class starts within 5 min
        });

        if (upcomingSlot) {
          results.push(`Prep ${mins}min past limit but timetable starts soon — keeping alive for auto-convert`);
          continue; // Don't end — section 3 will convert it
        }

        await db.liveClassSession.update({ where: { id: p.id }, data: { status: "ENDED", endedAt: now, durationMin: mins } });
        results.push(`Prep ended ${mins}min (limit ${limit}min)`);
      }
    }

    // ============================================================
    // 3. TIMETABLE AUTO-START & AUTO-END
    // ============================================================
    const today = DAYS[now.getDay()];
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
      const cls = sched.class;
      const school = cls.schoolGrade?.school;
      if (!school) continue;

      const tz = (school as any).timezone || "UTC";
      const localNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
      const localMin = localNow.getHours() * 60 + localNow.getMinutes();
      const localDay = DAYS[localNow.getDay()];
      if (sched.dayOfWeek !== localDay) continue;

      const openMin = parseInt((school.schoolOpenTime || "08:00").split(":")[0]) * 60 + parseInt((school.schoolOpenTime || "08:00").split(":")[1] || "0");
      const closeMin = parseInt((school.schoolCloseTime || "15:00").split(":")[0]) * 60 + parseInt((school.schoolCloseTime || "15:00").split(":")[1] || "0");
      if (localMin < openMin || localMin > closeMin + 10) continue;

      const startMin = parseInt(sched.startTime.split(":")[0]) * 60 + parseInt(sched.startTime.split(":")[1] || "0");
      const endMin = parseInt(sched.endTime.split(":")[0]) * 60 + parseInt(sched.endTime.split(":")[1] || "0");

      // ============================================================
      // SMART PREP→LIVE: If prep is RUNNING and timetable says class time → auto-convert
      // Same session ID = students stay connected, board content preserved
      // ============================================================
      if (cls.liveSessions.length > 0 && cls.liveSessions[0].isPrep) {
        const prepSession = cls.liveSessions[0];
        // Convert when we're at or past the timetable start time
        if (localMin >= startMin && localMin <= startMin + 2) {
          const newTopic = (prepSession.topic || "").replace("[PREP] ", "");
          await db.liveClassSession.update({
            where: { id: prepSession.id },
            data: {
              isPrep: false,
              durationMin: 0,
              topic: newTopic || `${cls.name} — Period ${sched.periodNumber}`,
              startedAt: now, // Reset for credit calculation
              lateMinutes: 0, // On time — timetable triggered it
            },
          });
          results.push(`Smart convert: ${cls.name} prep → LIVE (timetable ${sched.startTime})`);
        }
        // Don't do anything else for this class (no auto-start, no auto-end of prep here)
        continue;
      }

      // ---- AUTO-START (only if NO active session) ----
      if (localMin >= startMin && localMin <= startMin + 2 && cls.liveSessions.length === 0) {
        // Check if prep ENDED recently — teacher may want to start manually
        const recentEndedPrep = await db.liveClassSession.findFirst({
          where: {
            classId: cls.id,
            isPrep: true,
            status: "ENDED",
            endedAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
          },
        });
        if (recentEndedPrep) {
          results.push(`Skip auto-start ${cls.name} — prep ended recently, teacher starts manually`);
          continue;
        }

        const busy = await db.liveClassSession.findFirst({
          where: { teacherId: cls.teacherId, status: "IN_PROGRESS" },
        });
        if (busy) continue;

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

      // ---- AUTO-END (real classes only, NOT prep) ----
      if (cls.liveSessions.length > 0) {
        const s = cls.liveSessions[0];
        if (s.isPrep) continue;
        const dur = s.startedAt ? Math.round((now.getTime() - s.startedAt.getTime()) / 60000) : 0;
        const limit = school.sessionDurationMin || 40;
        if (localMin > endMin + 5 || dur >= limit + 10) {
          await db.liveClassSession.update({ where: { id: s.id }, data: { status: "ENDED", endedAt: now, durationMin: dur } });
          await creditTeacher(s, school.id, dur, now, school);
          results.push(`Auto-ended: ${cls.name} (${dur}min)`);
        }
      }
    }

    // ============================================================
    // 4. ORPHANED real sessions (3x limit)
    // ============================================================
    const orphaned = await db.liveClassSession.findMany({
      where: { status: "IN_PROGRESS", isPrep: false },
      include: { class: { include: { schoolGrade: { include: { school: true } } } } },
    });
    for (const s of orphaned) {
      const school = s.class?.schoolGrade?.school;
      if (!school) continue;
      const dur = s.startedAt ? Math.round((now.getTime() - s.startedAt.getTime()) / 60000) : 0;
      if (dur > (school.sessionDurationMin || 40) * 3) {
        await db.liveClassSession.update({ where: { id: s.id }, data: { status: "ENDED", endedAt: now, durationMin: dur } });
        await creditTeacher(s, school.id, dur, now, school);
        results.push(`Orphan ended (${dur}min)`);
      }
    }

    return NextResponse.json({ ok: true, results, checked: schedules.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function creditTeacher(session: any, schoolId: string, durationMin: number, now: Date, school: any) {
  if (session.creditAwarded || durationMin < 1 || session.isPrep) return;
  const st = await db.schoolTeacher.findFirst({ where: { teacherId: session.teacherId, schoolId }, include: { salary: true } });
  if (!st?.salary) return;
  const perMonth = (school.sessionsPerDay || 4) * (st.salary.workingDaysPerMonth || 22);
  const limit = school.sessionDurationMin || 40;
  const credit = Math.round((st.salary.baseSalary / perMonth) * (Math.min(durationMin, limit + 5) / limit) * 100) / 100;
  if (credit <= 0) return;
  await db.sessionCredit.create({ data: { liveSessionId: session.id, teacherId: session.teacherId, schoolId, durationMin, creditAmount: credit, currency: school.currency || "USD", status: "CREDITED" } });
  await db.liveClassSession.update({ where: { id: session.id }, data: { creditAwarded: true } });
  const month = now.getMonth() + 1, year = now.getFullYear();
  const ex = await db.payrollRecord.findUnique({ where: { schoolTeacherId_month_year: { schoolTeacherId: st.id, month, year } } });
  if (ex) {
    const g = ex.grossPay + credit, t = g * (st.salary.taxRate / 100), p = g * ((st.salary.pensionRate || 0) / 100);
    await db.payrollRecord.update({ where: { id: ex.id }, data: { grossPay: g, netPay: Math.max(0, g - t - p - ex.otherDeductions) } });
  } else {
    const t = credit * ((st.salary.taxRate || 0) / 100), p = credit * ((st.salary.pensionRate || 0) / 100);
    await db.payrollRecord.create({ data: { schoolTeacherId: st.id, month, year, baseSalary: st.salary.baseSalary, allowances: (st.salary.housingAllowance||0)+(st.salary.transportAllowance||0)+(st.salary.otherAllowances||0), grossPay: credit, taxDeduction: t, pensionDeduction: p, netPay: Math.max(0, credit-t-p), currency: school.currency || "USD", status: "DRAFT" } });
  }
}
