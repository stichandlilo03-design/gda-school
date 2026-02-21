import { getServerSession } from "next-auth";
import { checkStudentAccess } from "@/lib/student-access";
import StudentAccessGate from "@/components/student-access-gate";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import { UserCheck, Calendar, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

const STATUS_ICON: Record<string, { icon: any; color: string; label: string }> = {
  PRESENT: { icon: CheckCircle, color: "text-emerald-600 bg-emerald-100", label: "Present" },
  LATE: { icon: Clock, color: "text-amber-600 bg-amber-100", label: "Late" },
  ABSENT: { icon: XCircle, color: "text-red-600 bg-red-100", label: "Absent" },
  EXCUSED: { icon: AlertTriangle, color: "text-blue-600 bg-blue-100", label: "Excused" },
};

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // Access gate: block unapproved / unpaid students
  try {
    const access = await checkStudentAccess(session.user.id);
    if (access && !access.hasFullAccess) {
      return <StudentAccessGate access={access} pageName="Attendance" />;
    }
  } catch (_e) {}


  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      attendances: {
        include: {
          class: {
            include: {
              teacher: { include: { user: { select: { name: true } } } },
              schoolGrade: true,
            },
          },
        },
        orderBy: { date: "desc" },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        include: { class: { select: { id: true, name: true } } },
      },
    },
  });

  if (!student) return null;

  const attendances = student.attendances;

  // Per-class stats
  const classStats: Record<string, { name: string; teacher: string; total: number; present: number; late: number; absent: number; excused: number }> = {};
  attendances.forEach((a) => {
    if (!classStats[a.classId]) {
      classStats[a.classId] = {
        name: a.class.name, teacher: a.class.teacher?.user?.name || "—",
        total: 0, present: 0, late: 0, absent: 0, excused: 0,
      };
    }
    classStats[a.classId].total++;
    if (a.status === "PRESENT") classStats[a.classId].present++;
    else if (a.status === "LATE") classStats[a.classId].late++;
    else if (a.status === "ABSENT") classStats[a.classId].absent++;
    else if (a.status === "EXCUSED") classStats[a.classId].excused++;
  });

  // Overall
  const totalRecords = attendances.length;
  const totalPresent = attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const overallPct = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 100;

  // This month
  const now = new Date();
  const thisMonth = attendances.filter((a) => {
    const d = new Date(a.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthPresent = thisMonth.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const monthPct = thisMonth.length > 0 ? Math.round((monthPresent / thisMonth.length) * 100) : 100;

  return (
    <>
      <DashboardHeader title="My Attendance" subtitle="Track your attendance across all classes" />
      <div className="p-6 lg:p-8 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="stat-card text-center">
            <div className="relative w-14 h-14 mx-auto mb-2">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke={overallPct >= 80 ? "#10b981" : overallPct >= 60 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="3" strokeDasharray={`${overallPct} ${100 - overallPct}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{overallPct}%</span>
            </div>
            <div className="text-[10px] text-gray-500">Overall Attendance</div>
          </div>
          <div className="stat-card text-center">
            <UserCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
            <div className="text-2xl font-bold">{monthPct}%</div>
            <div className="text-[10px] text-gray-500">This Month</div>
          </div>
          <div className="stat-card text-center">
            <CheckCircle className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold">{totalPresent}</div>
            <div className="text-[10px] text-gray-500">Days Present</div>
          </div>
          <div className="stat-card text-center">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
            <div className="text-2xl font-bold">{attendances.filter((a) => a.status === "ABSENT").length}</div>
            <div className="text-[10px] text-gray-500">Days Absent</div>
          </div>
        </div>

        {/* Low attendance warning */}
        {overallPct < 75 && totalRecords > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-xs text-red-700">Your attendance is below 75%. Regular attendance is important for your academic success. Please try to attend all scheduled classes.</p>
          </div>
        )}

        {/* Per-class breakdown */}
        {Object.keys(classStats).length > 0 && (
          <div className="card">
            <h3 className="section-title mb-4">Attendance by Class</h3>
            <div className="space-y-3">
              {Object.entries(classStats).map(([classId, stats]) => {
                const pct = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 100;
                return (
                  <div key={classId} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{stats.name}</p>
                        <p className="text-[10px] text-gray-500">{stats.teacher}</p>
                      </div>
                      <span className={`text-sm font-bold ${pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div className={`h-2 rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex gap-3 text-[10px] text-gray-500">
                      <span className="text-emerald-600">✓ {stats.present} present</span>
                      <span className="text-amber-600">⏳ {stats.late} late</span>
                      <span className="text-red-600">✗ {stats.absent} absent</span>
                      <span className="text-blue-600">📋 {stats.excused} excused</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent history */}
        <div className="card">
          <h3 className="section-title mb-4">Recent History</h3>
          {attendances.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No attendance records yet.</p>
              <p className="text-xs text-gray-400 mt-1">Records will appear here once your teachers start marking attendance.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {attendances.slice(0, 30).map((a) => {
                const st = STATUS_ICON[a.status] || STATUS_ICON.ABSENT;
                const Icon = st.icon;
                return (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${st.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800">{a.class.name}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(a.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                        {a.joinedAt && ` • Joined ${new Date(a.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
