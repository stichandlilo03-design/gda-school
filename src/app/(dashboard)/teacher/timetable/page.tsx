import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_SHORT: Record<string, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat" };
const DAY_FULL: Record<string, string> = { MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday", THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday" };
const COLORS = ["bg-blue-100 text-blue-800 border-blue-300", "bg-emerald-100 text-emerald-800 border-emerald-300", "bg-purple-100 text-purple-800 border-purple-300", "bg-amber-100 text-amber-800 border-amber-300", "bg-rose-100 text-rose-800 border-rose-300", "bg-cyan-100 text-cyan-800 border-cyan-300"];

export default async function TeacherTimetablePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: {
        where: { isActive: true },
        include: {
          subject: true,
          schoolGrade: { include: { school: true } },
          schedules: { orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }] },
          enrollments: { where: { status: "ACTIVE" }, select: { id: true } },
        },
      },
    },
  });

  if (!teacher) return <div className="p-8">Not found.</div>;

  const school = teacher.classes[0]?.schoolGrade?.school;
  const allSchedules = teacher.classes.flatMap((c, idx) =>
    c.schedules.map(s => ({
      ...s,
      className: c.name,
      subjectName: c.subject?.name || c.name,
      gradeName: c.schoolGrade?.gradeLevel || "",
      studentCount: c.enrollments.length,
      sessionSlot: (c as any).session || "SESSION_A",
      colorClass: COLORS[idx % COLORS.length],
    }))
  );

  // Get today's day name
  const todayDay = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || "MONDAY";

  // Get max period number
  const maxPeriod = Math.max(...allSchedules.map(s => s.periodNumber), school?.sessionsPerDay || 4);

  // Count classes per day
  const classesPerDay = DAYS.reduce((acc, day) => {
    acc[day] = allSchedules.filter(s => s.dayOfWeek === day).length;
    return acc;
  }, {} as Record<string, number>);

  const totalWeeklyClasses = allSchedules.length;

  return (
    <>
      <DashboardHeader title="My Timetable" subtitle="Your weekly teaching schedule" />
      <div className="p-6 lg:p-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-brand-600">{teacher.classes.length}</div>
            <div className="text-[10px] text-gray-500">Subjects</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-emerald-600">{totalWeeklyClasses}</div>
            <div className="text-[10px] text-gray-500">Classes/Week</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-amber-600">{classesPerDay[todayDay] || 0}</div>
            <div className="text-[10px] text-gray-500">Today&apos;s Classes</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-purple-600">{school?.sessionDurationMin || 40}min</div>
            <div className="text-[10px] text-gray-500">Per Period</div>
          </div>
        </div>

        {/* School hours info */}
        {school && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-center gap-3 flex-wrap">
            <span>🏫 School: <strong>{school.schoolOpenTime || "08:00"} - {school.schoolCloseTime || "15:00"}</strong></span>
            <span>📚 {school.sessionsPerDay} periods/day</span>
            <span>⏱️ {school.sessionDurationMin}min/period</span>
            <span>☕ {school.breakDurationMin}min breaks</span>
          </div>
        )}

        {/* Today's Classes Highlight */}
        {allSchedules.filter(s => s.dayOfWeek === todayDay).length > 0 && (
          <div className="card border-brand-200 bg-brand-50/30">
            <h3 className="text-sm font-bold text-brand-800 mb-3">📅 Today — {DAY_FULL[todayDay]}</h3>
            <div className="flex gap-2 flex-wrap">
              {allSchedules.filter(s => s.dayOfWeek === todayDay).sort((a, b) => a.periodNumber - b.periodNumber).map(s => (
                <div key={s.id} className={`p-3 rounded-xl border ${s.colorClass} min-w-[150px]`}>
                  <div className="text-xs font-bold">{s.subjectName}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">Period {s.periodNumber} · {s.startTime} - {s.endTime}</div>
                  <div className="text-[9px] opacity-60 mt-0.5">
                    {s.gradeName} · {s.studentCount} students
                    <span className={`ml-1 text-[7px] px-1 rounded ${(s as any).sessionSlot === "SESSION_B" ? "bg-blue-500 text-white" : (s as any).sessionSlot === "SESSION_C" ? "bg-purple-500 text-white" : "bg-amber-500 text-white"}`}>
                      {(s as any).sessionSlot === "SESSION_B" ? "PM" : (s as any).sessionSlot === "SESSION_C" ? "Eve" : "AM"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allSchedules.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-sm text-gray-500">No timetable set yet.</p>
            <p className="text-xs text-gray-400 mt-1">Your principal will set up the timetable for your classes.</p>
          </div>
        ) : (
          /* Weekly Grid */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-[10px] font-bold text-gray-500 text-left w-20 border border-gray-200">Period</th>
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
                      return (
                        <td key={day} className={`p-1 border border-gray-200 ${day === todayDay ? "bg-brand-50/20" : ""}`}>
                          {entry ? (
                            <div className={`p-2 rounded-lg border ${entry.colorClass}`}>
                              <p className="text-[11px] font-bold leading-tight">{entry.subjectName}</p>
                              <p className="text-[9px] opacity-60 mt-0.5">{entry.startTime}-{entry.endTime}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <p className="text-[8px] opacity-50">{entry.gradeName}</p>
                                <span className={`text-[7px] px-1 rounded ${entry.sessionSlot === "SESSION_B" ? "bg-blue-500 text-white" : entry.sessionSlot === "SESSION_C" ? "bg-purple-500 text-white" : "bg-amber-500 text-white"}`}>
                                  {entry.sessionSlot === "SESSION_B" ? "PM" : entry.sessionSlot === "SESSION_C" ? "Eve" : "AM"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-[50px] rounded-lg bg-gray-50" />
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

        {/* Legend */}
        {allSchedules.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {teacher.classes.map((c, i) => (
              <span key={c.id} className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${COLORS[i % COLORS.length]}`}>
                {c.subject?.name || c.name} — {c.schoolGrade?.gradeLevel}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
