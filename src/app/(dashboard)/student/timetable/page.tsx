import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkStudentAccess } from "@/lib/student-access";
import StudentAccessGate from "@/components/student-access-gate";
import DashboardHeader from "@/components/layout/dashboard-header";
import { to12h, formatRange, sessionLabel, sessionBadgeColor } from "@/lib/time-utils";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_SHORT: Record<string, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat" };
const DAY_FULL: Record<string, string> = { MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday", THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday" };
const COLORS = ["bg-blue-100 text-blue-800 border-blue-300", "bg-emerald-100 text-emerald-800 border-emerald-300", "bg-purple-100 text-purple-800 border-purple-300", "bg-amber-100 text-amber-800 border-amber-300", "bg-rose-100 text-rose-800 border-rose-300", "bg-cyan-100 text-cyan-800 border-cyan-300", "bg-pink-100 text-pink-800 border-pink-300"];

export default async function StudentTimetablePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // Access gate: block unapproved / unpaid students
  const access = await checkStudentAccess(session.user.id);
  if (access && !access.hasFullAccess) {
    return <StudentAccessGate access={access} pageName="Timetable" />;
  }

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      school: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              subject: true,
              teacher: { include: { user: { select: { name: true } } } },
              schedules: { orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }] },
            },
          },
        },
      },
    },
  });

  if (!student) return <div className="p-8">Not found.</div>;

  const school = student.school;
  const tz = school?.timezone || "UTC";
  const allSchedules = student.enrollments.flatMap((en, idx) => {
    const c = en.class;
    return (c.schedules || []).map(s => ({
      ...s,
      className: c.name,
      subjectName: c.subject?.name || c.name,
      teacherName: c.teacher?.user?.name || "",
      sessionSlot: (c as any).session || "SESSION_A",
      colorClass: COLORS[idx % COLORS.length],
    }));
  });

  const todayDay = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || "MONDAY";
  const maxPeriod = Math.max(...allSchedules.map(s => s.periodNumber), school?.sessionsPerDay || 4);
  const todayClasses = allSchedules.filter(s => s.dayOfWeek === todayDay).sort((a, b) => a.periodNumber - b.periodNumber);

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0); };

  const currentClass = todayClasses.find(s => nowMin >= toMin(s.startTime) && nowMin <= toMin(s.endTime));
  const nextClass = todayClasses.find(s => toMin(s.startTime) > nowMin);

  return (
    <>
      <DashboardHeader title="My Timetable" subtitle="Your weekly class schedule" />
      <div className="p-6 lg:p-8 space-y-6">

        {/* Current / Next class banner */}
        {currentClass && (
          <div className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-[10px] uppercase font-medium">🟢 Happening Now</p>
                <p className="text-xl font-bold mt-1">{currentClass.subjectName}</p>
                <p className="text-emerald-200 text-xs mt-0.5">
                  with {currentClass.teacherName} · {to12h(currentClass.startTime)} – {to12h(currentClass.endTime)}
                </p>
              </div>
              <div className="text-right flex items-center gap-2">
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${sessionBadgeColor(currentClass.sessionSlot)}`}>
                  {sessionLabel(currentClass.sessionSlot)}
                </span>
                <span className="text-[10px] bg-white/20 px-3 py-1 rounded-full">Period {currentClass.periodNumber}</span>
              </div>
            </div>
          </div>
        )}
        {!currentClass && nextClass && (
          <div className="p-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-200 text-[10px] uppercase font-medium">⏳ Up Next</p>
                <p className="text-xl font-bold mt-1">{nextClass.subjectName}</p>
                <p className="text-brand-200 text-xs mt-0.5">
                  with {nextClass.teacherName} · starts at {to12h(nextClass.startTime)}
                </p>
              </div>
              <div className="text-right flex items-center gap-2">
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${sessionBadgeColor(nextClass.sessionSlot)}`}>
                  {sessionLabel(nextClass.sessionSlot)}
                </span>
                <span className="text-[10px] bg-white/20 px-3 py-1 rounded-full">Period {nextClass.periodNumber}</span>
              </div>
            </div>
          </div>
        )}

        {/* School hours with timezone */}
        {school && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 flex items-center gap-3 flex-wrap">
            <span>🏫 School: <strong>{to12h(school.schoolOpenTime || "08:00")} – {to12h(school.schoolCloseTime || "15:00")}</strong></span>
            <span>📚 {school.sessionsPerDay} periods</span>
            <span>⏱️ {school.sessionDurationMin}min each</span>
            <span>☕ {school.breakDurationMin}min breaks</span>
            {tz !== "UTC" && <span className="text-brand-600">🌍 {tz.replace("_", " ").split("/").pop()}</span>}
          </div>
        )}

        {/* Today highlight with AM/PM */}
        {todayClasses.length > 0 && (
          <div className="card border-brand-200">
            <h3 className="text-sm font-bold text-brand-800 mb-3">📅 Today — {DAY_FULL[todayDay]}</h3>
            <div className="space-y-2">
              {todayClasses.map(s => {
                const isPast = nowMin > toMin(s.endTime);
                const isCurrent = nowMin >= toMin(s.startTime) && nowMin <= toMin(s.endTime);
                return (
                  <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isCurrent ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200" : isPast ? "border-gray-200 bg-gray-50 opacity-60" : s.colorClass}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${isCurrent ? "bg-emerald-500 text-white" : isPast ? "bg-gray-300 text-gray-600" : "bg-white/50"}`}>
                      P{s.periodNumber}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold">{s.subjectName}</p>
                        <span className={`text-[7px] px-1 rounded ${sessionBadgeColor(s.sessionSlot)}`}>
                          {sessionLabel(s.sessionSlot)}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-60">{s.teacherName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{to12h(s.startTime)} – {to12h(s.endTime)}</p>
                      {isCurrent && <span className="text-[9px] text-emerald-600 font-medium animate-pulse">● LIVE</span>}
                      {isPast && <span className="text-[9px] text-gray-400">Done</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {allSchedules.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-sm text-gray-500">No timetable set yet.</p>
            <p className="text-xs text-gray-400 mt-1">Your principal will create the timetable soon.</p>
          </div>
        ) : (
          /* Weekly Grid with AM/PM */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-[10px] font-bold text-gray-500 text-left w-16 border border-gray-200">Period</th>
                  {DAYS.slice(0, 5).map(day => (
                    <th key={day} className={`p-2 text-[10px] font-bold text-center border border-gray-200 ${day === todayDay ? "bg-brand-50 text-brand-700" : "text-gray-500"}`}>
                      {DAY_SHORT[day]}
                      {day === todayDay && <span className="ml-1 text-[8px] bg-brand-600 text-white px-1 py-0.5 rounded">TODAY</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxPeriod }, (_, i) => i + 1).map(period => (
                  <tr key={period}>
                    <td className="p-2 border border-gray-200 text-center">
                      <div className="text-[10px] font-bold text-gray-600">P{period}</div>
                    </td>
                    {DAYS.slice(0, 5).map(day => {
                      const entry = allSchedules.find(s => s.dayOfWeek === day && s.periodNumber === period);
                      const isTodayCell = day === todayDay;
                      const isCurrent = isTodayCell && entry && nowMin >= toMin(entry.startTime) && nowMin <= toMin(entry.endTime);
                      return (
                        <td key={day} className={`p-1 border border-gray-200 ${isTodayCell ? "bg-brand-50/20" : ""}`}>
                          {entry ? (
                            <div className={`p-2 rounded-lg border ${isCurrent ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200" : entry.colorClass} relative`}>
                              <p className="text-[11px] font-bold leading-tight">{entry.subjectName}</p>
                              <p className="text-[9px] opacity-70 mt-0.5">{entry.teacherName}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <p className="text-[8px] opacity-60">{to12h(entry.startTime)} – {to12h(entry.endTime)}</p>
                                <span className={`text-[6px] px-0.5 rounded ${sessionBadgeColor(entry.sessionSlot)}`}>
                                  {sessionLabel(entry.sessionSlot)}
                                </span>
                              </div>
                              {isCurrent && <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                            </div>
                          ) : (
                            <div className="h-[50px] rounded-lg bg-gray-50/50" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Subject Legend with session badges */}
        {allSchedules.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {student.enrollments.map((en, i) => {
              const slot = (en.class as any).session || "SESSION_A";
              return (
                <span key={en.id} className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${COLORS[i % COLORS.length]}`}>
                  <span className={`inline-block text-[7px] px-1 rounded mr-1 ${sessionBadgeColor(slot)}`}>{sessionLabel(slot)}</span>
                  {en.class.subject?.name || en.class.name} — {en.class.teacher?.user?.name?.split(" ")[0]}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
