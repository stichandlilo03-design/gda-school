import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import { to12h, sessionLabel, sessionBadgeColor } from "@/lib/time-utils";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const DAY_SHORT: Record<string, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri" };
const COLORS = ["bg-blue-100 text-blue-800 border-blue-300", "bg-emerald-100 text-emerald-800 border-emerald-300", "bg-purple-100 text-purple-800 border-purple-300", "bg-amber-100 text-amber-800 border-amber-300", "bg-rose-100 text-rose-800 border-rose-300"];

export default async function ParentTimetablePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: { children: { include: { student: { include: {
      user: { select: { name: true } },
      school: { select: { name: true, sessionsPerDay: true, schoolOpenTime: true, schoolCloseTime: true } },
      enrollments: { where: { status: "ACTIVE" }, include: { class: { include: { subject: true, teacher: { include: { user: { select: { name: true } } } }, schedules: { orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }] } } } } },
    } } } } },
  });

  if (!parent) return <div className="p-8">Not found.</div>;

  return (
    <>
      <DashboardHeader title="Timetable" subtitle="Your children's weekly schedules" />
      <div className="p-6 lg:p-8 space-y-8">
        {parent.children.map((link) => {
          const child = link.student;
          const schedules = child.enrollments.flatMap((en: any, idx: number) =>
            (en.class?.schedules || []).map((s: any) => ({
              ...s, subjectName: en.class?.subject?.name || en.class?.name,
              teacherName: en.class?.teacher?.user?.name || "",
              sessionSlot: en.class?.session || "SESSION_A",
              colorClass: COLORS[idx % COLORS.length],
            }))
          );
          const maxPeriod = Math.max(...schedules.map((s: any) => s.periodNumber), child.school?.sessionsPerDay || 4);

          return (
            <div key={link.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold">{child.user.name}</h3>
                  <p className="text-[10px] text-gray-500">{child.school.name} · {child.gradeLevel} · {to12h(child.school?.schoolOpenTime || "08:00")} – {to12h(child.school?.schoolCloseTime || "15:00")}</p>
                </div>
              </div>

              {schedules.length === 0 ? (
                <p className="text-[10px] text-gray-400 text-center py-4">No timetable set yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-1.5 text-[9px] font-bold text-gray-500 text-left border border-gray-200 w-12">Period</th>
                        {DAYS.map(d => <th key={d} className="p-1.5 text-[9px] font-bold text-center border border-gray-200 text-gray-500">{DAY_SHORT[d]}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: maxPeriod }, (_, i) => i + 1).map(period => (
                        <tr key={period}>
                          <td className="p-1 border border-gray-200 text-center text-[9px] font-bold text-gray-500">P{period}</td>
                          {DAYS.map(day => {
                            const entry = schedules.find((s: any) => s.dayOfWeek === day && s.periodNumber === period);
                            return (
                              <td key={day} className="p-0.5 border border-gray-200">
                                {entry ? (
                                  <div className={`p-1.5 rounded border ${entry.colorClass}`}>
                                    <p className="text-[10px] font-bold leading-tight">{entry.subjectName}</p>
                                    <p className="text-[8px] opacity-70">{entry.teacherName}</p>
                                    <div className="flex items-center gap-0.5 mt-0.5">
                                      <p className="text-[7px] opacity-60">{to12h(entry.startTime)}–{to12h(entry.endTime)}</p>
                                      <span className={`text-[6px] px-0.5 rounded ${sessionBadgeColor(entry.sessionSlot)}`}>{sessionLabel(entry.sessionSlot)}</span>
                                    </div>
                                  </div>
                                ) : <div className="h-[40px]" />}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {parent.children.length === 0 && (
          <div className="card text-center py-12"><p className="text-sm text-gray-500">Link your children to see their timetables</p></div>
        )}
      </div>
    </>
  );
}
