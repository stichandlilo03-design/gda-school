import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import { Calendar, Clock, Users } from "lucide-react";
import { getSessionLabel } from "@/lib/utils";

export default async function TimetablePage() {
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

  const classesBySession: Record<string, any[]> = { SESSION_A: [], SESSION_B: [], SESSION_C: [] };
  student?.enrollments.forEach((e) => {
    if (classesBySession[e.class.session]) classesBySession[e.class.session].push(e.class);
  });

  const sessionInfo: Record<string, { label: string; time: string; color: string }> = {
    SESSION_A: { label: "Morning Session", time: "06:00 – 10:00 UTC", color: "from-amber-400 to-orange-500" },
    SESSION_B: { label: "Afternoon Session", time: "14:00 – 18:00 UTC", color: "from-blue-400 to-indigo-500" },
    SESSION_C: { label: "Evening Session", time: "22:00 – 02:00 UTC", color: "from-purple-400 to-violet-500" },
  };

  const preferred = student?.preferredSession || "SESSION_A";

  return (
    <>
      <DashboardHeader title="Timetable" subtitle="Your weekly class schedule" />
      <div className="p-6 lg:p-8 space-y-6">
        <div className="card bg-brand-50 border-brand-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-semibold text-brand-800">Your Preferred Session: {sessionInfo[preferred]?.label}</span>
          </div>
          <p className="text-xs text-brand-600">Time: {sessionInfo[preferred]?.time}. Each class runs 3 times daily — you can attend any session.</p>
        </div>

        {Object.entries(classesBySession).map(([sessionKey, classes]) => {
          const info = sessionInfo[sessionKey];
          return (
            <div key={sessionKey} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center`}>
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="section-title">{info.label}</h3>
                  <p className="text-xs text-gray-500">{info.time}</p>
                </div>
                {sessionKey === preferred && <span className="badge-success text-[10px]">Preferred</span>}
                <span className="text-xs text-gray-400 ml-auto">{classes.length} classes</span>
              </div>
              {classes.length > 0 ? (
                <div className="space-y-2">
                  {classes.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-500">Teacher: {c.teacher.user.name} • {c.schoolGrade.gradeLevel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No classes in this session.</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
