import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import {
  Users, GraduationCap, BookOpen, CreditCard, UserCheck, BarChart3,
  TrendingUp, Clock, CheckCircle, XCircle, DollarSign, AlertTriangle, Award
} from "lucide-react";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({ where: { userId: session.user.id } });
  if (!principal) return null;

  const schoolId = principal.schoolId;

  // Students
  const students = await db.student.findMany({ where: { schoolId } });
  const approvedStudents = students.filter((s: any) => s.approvalStatus === "APPROVED" && !s.isSuspended && !s.isExpelled);
  const pendingStudents = students.filter((s: any) => ["PENDING", "INTERVIEW_SCHEDULED", "INTERVIEWED"].includes(s.approvalStatus));
  const suspendedStudents = students.filter((s: any) => s.isSuspended);
  const feesPaidStudents = students.filter((s: any) => s.feePaid);

  // Teachers
  const teachers = await db.schoolTeacher.findMany({ where: { schoolId } });
  const activeTeachers = teachers.filter((t) => t.status === "APPROVED" && t.isActive && !t.isSuspended && !t.terminatedAt);

  // Classes
  const classes = await db.class.findMany({
    where: { schoolGrade: { schoolId } },
    include: { enrollments: { where: { status: "ACTIVE" } }, schedules: true, _count: { select: { materials: true, assessments: true } } },
  });
  const activeClasses = classes.filter((c) => c.isActive);
  const totalEnrollments = activeClasses.reduce((s, c) => s + c.enrollments.length, 0);

  // Payments
  const payments = await db.payment.findMany({ where: { student: { schoolId } } });
  const totalRevenue = payments.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0);
  const pendingPayments = payments.filter((p) => p.status === "UNDER_REVIEW");
  const rejectedPayments = payments.filter((p) => p.status === "REJECTED");

  // Attendance this month
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const attendances = await db.attendanceRecord.findMany({
    where: { date: { gte: monthStart }, class: { schoolGrade: { schoolId } } },
  });
  const presentCount = attendances.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendanceRate = attendances.length > 0 ? Math.round((presentCount / attendances.length) * 100) : 0;

  // Live sessions right now
  const liveSessions = await db.liveClassSession.count({
    where: { status: "IN_PROGRESS", class: { schoolGrade: { schoolId } } },
  });

  // Grades by grade level
  const gradeDistribution = students.reduce((acc, s) => {
    acc[s.gradeLevel] = (acc[s.gradeLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <DashboardHeader title="School Reports" subtitle="Complete overview of your school" />
      <div className="p-6 lg:p-8 space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Students", value: students.length, sub: `${approvedStudents.length} active`, icon: Users, color: "text-blue-600 bg-blue-100" },
            { label: "Active Teachers", value: activeTeachers.length, sub: `${teachers.length} total`, icon: GraduationCap, color: "text-emerald-600 bg-emerald-100" },
            { label: "Active Classes", value: activeClasses.length, sub: `${totalEnrollments} enrollments`, icon: BookOpen, color: "text-purple-600 bg-purple-100" },
            { label: "Live Now", value: liveSessions, sub: "sessions in progress", icon: Clock, color: liveSessions > 0 ? "text-red-600 bg-red-100" : "text-gray-600 bg-gray-100" },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-[10px] text-gray-500">{s.label}</p>
              <p className="text-[9px] text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Finance + Attendance Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Finance */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-800">Finance Overview</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <p className="text-[10px] text-emerald-600">Revenue Collected</p>
                <p className="text-xl font-bold text-emerald-700">{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <p className="text-[10px] text-amber-600">Pending Review</p>
                <p className="text-xl font-bold text-amber-700">{pendingPayments.length}</p>
                <p className="text-[10px] text-amber-500">{pendingPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> {payments.filter((p) => p.status === "COMPLETED").length} approved</span>
              <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> {rejectedPayments.length} rejected</span>
              <span className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-gray-400" /> {payments.length} total</span>
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Fee Payment Rate</span>
                <span className="font-bold text-gray-800">{approvedStudents.length > 0 ? Math.round((feesPaidStudents.length / approvedStudents.length) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${approvedStudents.length > 0 ? (feesPaidStudents.length / approvedStudents.length) * 100 : 0}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{feesPaidStudents.length}/{approvedStudents.length} students paid</p>
            </div>
          </div>

          {/* Attendance */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-800">Attendance This Month</h3>
            </div>
            <div className="flex items-center gap-6 mb-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={attendanceRate >= 80 ? "#10b981" : attendanceRate >= 60 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="3" strokeDasharray={`${attendanceRate} ${100 - attendanceRate}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800">{attendanceRate}%</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-xs text-gray-600">Present: {attendances.filter((a: any) => a.status === "PRESENT").length}</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-xs text-gray-600">Late: {attendances.filter((a: any) => a.status === "LATE").length}</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-xs text-gray-600">Absent: {attendances.filter((a: any) => a.status === "ABSENT").length}</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-xs text-gray-600">Excused: {attendances.filter((a: any) => a.status === "EXCUSED").length}</span></div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400">{attendances.length} total records this month</p>
            {attendanceRate < 75 && (
              <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <p className="text-[10px] text-red-600 font-medium">Attendance below 75% — action recommended</p>
              </div>
            )}
          </div>
        </div>

        {/* Student Status + Grade Distribution */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Student Pipeline */}
          <div className="card">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /> Student Pipeline</h3>
            <div className="space-y-2">
              {[
                { label: "Pending Approval", count: pendingStudents.length, color: "bg-amber-500", icon: Clock },
                { label: "Active Students", count: approvedStudents.length, color: "bg-emerald-500", icon: CheckCircle },
                { label: "Suspended", count: suspendedStudents.length, color: "bg-orange-500", icon: AlertTriangle },
                { label: "Expelled", count: students.filter((s: any) => s.isExpelled).length, color: "bg-red-500", icon: XCircle },
                { label: "Fees Paid", count: feesPaidStudents.length, color: "bg-blue-500", icon: CreditCard },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg ${item.color} text-white flex items-center justify-center`}><item.icon className="w-3.5 h-3.5" /></div>
                  <span className="text-xs text-gray-700 flex-1">{item.label}</span>
                  <span className="text-sm font-bold text-gray-800">{item.count}</span>
                  <div className="w-20 h-1.5 bg-gray-200 rounded-full">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${students.length > 0 ? (item.count / students.length) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="card">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-600" /> Students by Grade</h3>
            <div className="space-y-2">
              {Object.entries(gradeDistribution).sort(([a], [b]) => a.localeCompare(b)).map(([grade, count]) => (
                <div key={grade} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 w-12">{grade}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(15, (count / Math.max(...Object.values(gradeDistribution))) * 100)}%` }}>
                      <span className="text-[9px] text-white font-bold">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(gradeDistribution).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No students enrolled yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Classes Overview */}
        <div className="card">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-brand-600" /> Class Overview</h3>
          {activeClasses.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No active classes.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {activeClasses.map((cls) => (
                <div key={cls.id} className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-800 truncate">{cls.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                    <span>{cls.enrollments.length} students</span>
                    <span>{cls._count.materials} materials</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {cls.schedules.map((s: any, i: number) => (
                      <span key={i} className="text-[8px] bg-brand-50 text-brand-600 px-1 rounded">{s.dayOfWeek.slice(0, 3)}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
