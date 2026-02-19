import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import { Clock, Calendar } from "lucide-react";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: { where: { isActive: true }, include: { schoolGrade: true, enrollments: { where: { status: "ACTIVE" } }, schedules: true } },
    },
  });

  const classesBySession: Record<string, any[]> = { SESSION_A: [], SESSION_B: [], SESSION_C: [] };
  teacher?.classes.forEach((c) => { if (classesBySession[c.session]) classesBySession[c.session].push(c); });

  const sessionLabels: Record<string, string> = { SESSION_A: "Morning (06:00–10:00 UTC)", SESSION_B: "Afternoon (14:00–18:00 UTC)", SESSION_C: "Evening (22:00–02:00 UTC)" };

  return (
    <>
      <DashboardHeader title="Schedule" subtitle="Your teaching timetable" />
      <div className="p-6 lg:p-8 space-y-6">
        {Object.entries(classesBySession).map(([session, classes]) => (
          <div key={session} className="card">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-brand-500" />
              <h3 className="section-title">{sessionLabels[session]}</h3>
              <span className="badge-info text-[10px]">{classes.length} classes</span>
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
                      <p className="text-xs text-gray-500">{c.schoolGrade.gradeLevel} • {c.enrollments.length} students</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No classes in this session.</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
