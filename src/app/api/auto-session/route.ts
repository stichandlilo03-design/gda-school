import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
    const now = new Date();
    const results: string[] = [];

    // ============================================================
    // 1. SCHOOL CLOSE — end real sessions after close (NEVER prep — teacher controls prep)
    // ============================================================
    const schools = await db.school.findMany({ where: { isActive: true }, select: { id: true, schoolCloseTime: true, schoolOpenTime: true, sessionDurationMin: true, sessionsPerDay: true, currency: true, timezone: true } });
    for (const school of schools) {
      const tz = school.timezone || "UTC";
      const sNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
      const sMin = sNow.getHours() * 60 + sNow.getMinutes();
      const closeMin = parseInt((school.schoolCloseTime || "15:00").split(":")[0]) * 60 + parseInt((school.schoolCloseTime || "15:00").split(":")[1] || "0");
      if (sMin > closeMin + 15) {
        const active = await db.liveClassSession.findMany({
          where: { status: { in: ["WAITING", "IN_PROGRESS"] }, isPrep: false, class: { schoolGrade: { schoolId: school.id } } },
        });
        for (const s of active) {
          const dur = s.startedAt ? Math.round((now.getTime() - s.startedAt.getTime()) / 60000) : 0;
          await db.liveClassSession.update({ where: { id: s.id }, data: { status: "ENDED", endedAt: now, durationMin: dur } });
          await creditTeacher(s, school.id, dur, now, school);
          results.push(`School closed — ended (${dur}min)`);
        }
      }
    }

    // ============================================================
    // 2. TIMETABLE AUTO-START & AUTO-END
    //    RULE: NEVER auto-start if this class has ANY active or recent prep/session today
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

      // If ANY session is active (prep or real) → skip this class entirely
      if (cls.liveSessions.length > 0) {
        const s = cls.liveSessions[0];

        // If it's prep → do NOTHING. Teacher is in control.
        if (s.isPrep) continue;

        // If it's a real class → check if it should auto-end
        const dur = s.startedAt ? Math.round((now.getTime() - s.startedAt.getTime()) / 60000) : 0;
        const limit = school.sessionDurationMin || 40;
        if (localMin > endMin + 5 || dur >= limit + 10) {
          await db.liveClassSession.update({ where: { id: s.id }, data: { status: "ENDED", endedAt: now, durationMin: dur } });
          await creditTeacher(s, school.id, dur, now, school);
          results.push(`Auto-ended: ${cls.name} (${dur}min)`);
        }
        continue;
      }

      // No active session — should we auto-start?
      if (localMin >= startMin && localMin <= startMin + 2) {
        // BLOCK: Check if ANY session (prep or real) was created for this class today
        // This is the SAFEST check — query the DB fresh, not cached data
        const todayStart = new Date(localNow);
        todayStart.setHours(0, 0, 0, 0);
        const anySessionToday = await db.liveClassSession.findFirst({
          where: {
            classId: cls.id,
            createdAt: { gte: todayStart },
          },
        });
        if (anySessionToday) {
          results.push(`Skip auto-start ${cls.name} — session already existed today`);
          continue;
        }

        // Check teacher not busy
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
    }

    // ============================================================
    // 3. ORPHANED real sessions only (3x limit) — never touch prep
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
