import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import { Clock, Calendar, BookOpen } from "lucide-react";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_SHORT = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat" };
const COLORS = [
  "bg-blue-100 text-blue-800 border-blue-300",
  "bg-emerald-100 text-emerald-800 border-emerald-300",
  "bg-purple-100 text-purple-800 border-purple-300",
  "bg-amber-100 text-amber-800 border-amber-300",
  "bg-pink-100 text-pink-800 border-pink-300",
  "bg-cyan-100 text-cyan-800 border-cyan-300",
  "bg-orange-100 text-orange-800 border-orange-300",
  "bg-indigo-100 text-indigo-800 border-indigo-300",
];

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              teacher: { include: { user: { select: { name: true } } } },
              schoolGrade: true,
              schedules: true,
            },
          },
        },
      },
    },
  });

  if (!student) return null;

  // Build schedule grid
  const scheduleMap: Record<string, any[]> = {};
  DAYS.forEach((d) => (scheduleMap[d] = []));

  const classColors: Record<string, string> = {};
  let colorIdx = 0;

  student.enrollments.forEach((e) => {
    if (!classColors[e.classId]) {
      classColors[e.classId] = COLORS[colorIdx % COLORS.length];
      colorIdx++;
    }
    e.class.schedules.forEach((sch) => {
      if (scheduleMap[sch.dayOfWeek]) {
        scheduleMap[sch.dayOfWeek].push({
          ...sch,
          className: e.class.name,
          classId: e.classId,
          teacher: e.class.teacher.user.name,
          grade: e.class.schoolGrade.gradeLevel,
          color: classColors[e.classId],
        });
      }
    });
  });

  // Sort each day by start time
  DAYS.forEach((d) => scheduleMap[d].sort((a, b) => a.startTime.localeCompare(b.startTime)));

  // Today
  const todayIdx = new Date().getDay();
  const todayDay = DAYS[todayIdx === 0 ? 6 : todayIdx - 1]; // Sunday=6(sat)

  const totalClasses = Object.values(scheduleMap).reduce((s, d) => s + d.length, 0);

  return (
    <>
      <DashboardHeader title="My Schedule" subtitle="Your weekly class timetable" />
      <div className="p-6 lg:p-8 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card text-center">
            <BookOpen className="w-6 h-6 text-brand-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">{student.enrollments.length}</div>
            <div className="text-[10px] text-gray-500">Classes Enrolled</div>
          </div>
          <div className="stat-card text-center">
            <Calendar className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">{totalClasses}</div>
            <div className="text-[10px] text-gray-500">Classes Per Week</div>
          </div>
          <div className="stat-card text-center">
            <Clock className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">{scheduleMap[todayDay]?.length || 0}</div>
            <div className="text-[10px] text-gray-500">Classes Today</div>
          </div>
        </div>

        {totalClasses === 0 ? (
          <div className="card text-center py-16">
            <Calendar className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-2">No Schedule Yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">Your timetable will appear here once your teachers set class schedules. Make sure you're enrolled in classes first!</p>
          </div>
        ) : (
          <>
            {/* Desktop grid */}
            <div className="hidden lg:block overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-6 gap-2">
                  {DAYS.map((day) => (
                    <div key={day} className={`text-center py-2 rounded-lg text-xs font-bold uppercase ${day === todayDay ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                      {DAY_SHORT[day as keyof typeof DAY_SHORT]}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {DAYS.map((day) => (
                    <div key={day} className="space-y-2 min-h-[200px]">
                      {scheduleMap[day].length === 0 ? (
                        <div className="p-3 text-center text-[10px] text-gray-300 bg-gray-50 rounded-lg border border-dashed border-gray-200 h-full flex items-center justify-center">No class</div>
                      ) : (
                        scheduleMap[day].map((sch, i) => (
                          <div key={i} className={`p-2.5 rounded-lg border-l-4 ${sch.color}`}>
                            <p className="text-[10px] font-bold">{sch.startTime} — {sch.endTime}</p>
                            <p className="text-xs font-semibold mt-0.5 leading-tight">{sch.className}</p>
                            <p className="text-[10px] opacity-70 mt-0.5">{sch.teacher}</p>
                            <p className="text-[10px] opacity-50">Period {sch.periodNumber}</p>
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile list */}
            <div className="lg:hidden space-y-3">
              {DAYS.map((day) => {
                if (scheduleMap[day].length === 0) return null;
                return (
                  <div key={day} className={`card ${day === todayDay ? "border-brand-300 bg-brand-50/30" : ""}`}>
                    <h3 className={`text-xs font-bold uppercase mb-2 ${day === todayDay ? "text-brand-700" : "text-gray-500"}`}>
                      {day === todayDay && "📍 "}{DAY_SHORT[day as keyof typeof DAY_SHORT]}day
                      <span className="text-gray-400 font-normal ml-2">{scheduleMap[day].length} class{scheduleMap[day].length > 1 ? "es" : ""}</span>
                    </h3>
                    <div className="space-y-2">
                      {scheduleMap[day].map((sch, i) => (
                        <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border-l-4 ${sch.color}`}>
                          <div className="text-center min-w-[48px]">
                            <p className="text-[10px] font-bold">{sch.startTime}</p>
                            <p className="text-[9px] opacity-60">{sch.endTime}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold">{sch.className}</p>
                            <p className="text-[10px] opacity-70">{sch.teacher} • P{sch.periodNumber}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Color legend */}
        {totalClasses > 0 && (
          <div className="flex flex-wrap gap-2">
            {student.enrollments.map((e) => (
              <span key={e.classId} className={`text-[10px] px-2 py-1 rounded border-l-2 ${classColors[e.classId]}`}>
                {e.class.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
