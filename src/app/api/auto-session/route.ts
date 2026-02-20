import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
    const now = new Date();
    const today = DAYS[now.getDay()];
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const results: string[] = [];

    const schedules = await db.classSchedule.findMany({
      where: { dayOfWeek: today as any },
      include: {
        class: {
          include: {
            teacher: true,
            liveSessions: { where: { status: "IN_PROGRESS" }, take: 1 },
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
      const sessionLimit = school?.sessionDurationMin || 40;

      // Auto-start: within 2 min of start time
      if (nowMin >= startMin && nowMin <= startMin + 2 && cls.liveSessions.length === 0) {
        await db.liveClassSession.create({
          data: {
            classId: cls.id, teacherId: cls.teacherId,
            topic: `${cls.name} (Auto)`, status: "IN_PROGRESS",
            startedAt: now, autoStarted: true,
            boardContent: [], boardHistory: [], raisedHands: [], chatMessages: [],
            whispers: [], questions: [], reactions: [], polls: [],
          },
        });
        results.push(`Auto-started: ${cls.name}`);
      }

      // Auto-end: past end time OR past session limit
      if (cls.liveSessions.length > 0) {
        const session = cls.liveSessions[0];
        const sessionMin = session.startedAt ? Math.round((now.getTime() - session.startedAt.getTime()) / 60000) : 0;

        if (nowMin > endMin + 2 || sessionMin >= sessionLimit) {
          const durationMin = session.startedAt ? Math.round((now.getTime() - session.startedAt.getTime()) / 60000) : 0;

          await db.liveClassSession.update({
            where: { id: session.id },
            data: { status: "ENDED", endedAt: now, durationMin },
          });

          // Credit teacher + auto payroll
          if (!session.creditAwarded && durationMin >= 5) {
            const st = await db.schoolTeacher.findFirst({
              where: { teacherId: cls.teacherId, schoolId: school?.id || "" },
              include: { salary: true },
            });
            if (st?.salary) {
              const sessionsPerDay = school?.sessionsPerDay || 4;
              const workingDays = st.salary.workingDaysPerMonth || 22;
              const sessionsPerMonth = sessionsPerDay * workingDays;
              const credit = Math.round((st.salary.baseSalary / sessionsPerMonth) * (Math.min(durationMin, sessionLimit + 5) / sessionLimit) * 100) / 100;

              if (credit > 0) {
                await db.sessionCredit.create({
                  data: {
                    liveSessionId: session.id, teacherId: cls.teacherId,
                    schoolId: school?.id || "", durationMin,
                    creditAmount: credit, currency: school?.currency || "USD",
                    status: "CREDITED",
                  },
                });
                await db.liveClassSession.update({ where: { id: session.id }, data: { creditAwarded: true } });

                // Auto payroll
                const month = now.getMonth() + 1;
                const year = now.getFullYear();
                const existing = await db.payrollRecord.findUnique({
                  where: { schoolTeacherId_month_year: { schoolTeacherId: st.id, month, year } },
                });
                if (existing) {
                  const newGross = existing.grossPay + credit;
                  const taxDed = st.salary ? newGross * (st.salary.taxRate / 100) : 0;
                  await db.payrollRecord.update({
                    where: { id: existing.id },
                    data: { grossPay: newGross, netPay: newGross - taxDed - existing.pensionDeduction - existing.otherDeductions },
                  });
                } else {
                  const taxDed = credit * ((st.salary.taxRate || 0) / 100);
                  await db.payrollRecord.create({
                    data: {
                      schoolTeacherId: st.id, month, year,
                      baseSalary: st.salary.baseSalary,
                      allowances: (st.salary.housingAllowance||0) + (st.salary.transportAllowance||0) + (st.salary.otherAllowances||0),
                      grossPay: credit, taxDeduction: taxDed, netPay: credit - taxDed,
                      currency: school?.currency || "USD", status: "DRAFT",
                    },
                  });
                }
              }
            }
          }
          results.push(`Auto-ended: ${cls.name} (${durationMin}min)`);
        }
      }
    }

    return NextResponse.json({ ok: true, results, checked: schedules.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
