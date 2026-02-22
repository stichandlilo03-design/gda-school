import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import Link from "next/link";
import { Users, GraduationCap, BookOpen, DollarSign, Clock, AlertCircle, ArrowRight, Briefcase, Calendar, TrendingDown, Activity, CreditCard, Play, Monitor } from "lucide-react";

export default async function PrincipalDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: {
      school: {
        include: {
          students: true,
          teachers: true,
          grades: true,
          vacancies: { where: { status: "OPEN" }, include: { _count: { select: { applications: true } } } },
        },
      },
    },
  });

  if (!principal) return <div className="p-8">Principal profile not found.</div>;

  const school = principal.school;
  const pendingStudents = school.students.filter((s: any) => s.approvalStatus === "PENDING" || s.approvalStatus === "INTERVIEW_SCHEDULED" || s.approvalStatus === "INTERVIEWED").length;
  const approvedStudents = school.students.filter((s: any) => s.approvalStatus === "APPROVED").length;
  const pendingTeachers = school.teachers.filter((t) => t.status === "PENDING" || t.status === "INTERVIEW_SCHEDULED" || t.status === "INTERVIEWED").length;
  const activeTeachers = school.teachers.filter((t) => t.status === "APPROVED" && t.isActive).length;
  const openVacancies = school.vacancies.length;
  const totalApplications = school.vacancies.reduce((sum, v) => sum + v._count.applications, 0);

  // Scheduled interviews
  const scheduledInterviews = await db.interview.count({
    where: {
      status: "SCHEDULED",
      OR: [
        { student: { schoolId: principal.schoolId } },
        { schoolTeacher: { schoolId: principal.schoolId } },
        { vacancyApp: { vacancy: { schoolId: principal.schoolId } } },
      ],
    },
  });

  // Outstanding debts
  const fees = await db.feeStructure.findMany({
    where: { schoolId: principal.schoolId },
    include: { schoolGrade: true },
  });
  const feeByGrade = new Map<string, number>();
  fees.forEach((f) => {
    const k = f.schoolGrade.gradeLevel;
    feeByGrade.set(k, (feeByGrade.get(k) || 0) + f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee);
  });

  const studentsWithPayments = await db.student.findMany({
    where: { schoolId: principal.schoolId, approvalStatus: "APPROVED", feePaid: false },
    include: { payments: { where: { status: "COMPLETED" } } },
  });

  let totalOutstanding = 0;
  let studentsInDebt = 0;
  studentsWithPayments.forEach((s) => {
    const total = feeByGrade.get(s.gradeLevel) || 0;
    const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = total - paid;
    if (balance > 0) { totalOutstanding += balance; studentsInDebt++; }
  });

  // Pending payments
  const pendingPayments = await db.payment.count({
    where: { student: { schoolId: principal.schoolId }, status: "UNDER_REVIEW" },
  });

  // Session activities — live classes right now
  const liveSessions = await db.liveClassSession.findMany({
    where: {
      status: "IN_PROGRESS",
      class: { schoolGrade: { schoolId: principal.schoolId } },
    },
    include: {
      class: { include: { subject: true, schoolGrade: true } },
      teacher: { include: { user: { select: { name: true } } } },
    },
  });

  // Today's attendance stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttendance = await db.attendanceRecord.groupBy({
    by: ["status"],
    where: { date: today, class: { schoolGrade: { schoolId: principal.schoolId } } },
    _count: true,
  });
  const attendanceStats = { present: 0, late: 0, absent: 0 };
  todayAttendance.forEach((a: any) => {
    if (a.status === "PRESENT") attendanceStats.present = a._count;
    if (a.status === "LATE") attendanceStats.late = a._count;
    if (a.status === "ABSENT") attendanceStats.absent = a._count;
  });
  const totalAttendance = attendanceStats.present + attendanceStats.late + attendanceStats.absent;

  // Recent class sessions (ended today)
  const recentSessions = await db.liveClassSession.findMany({
    where: {
      status: "ENDED",
      startedAt: { gte: today },
      class: { schoolGrade: { schoolId: principal.schoolId } },
    },
    include: {
      class: { include: { subject: true, schoolGrade: true } },
      teacher: { include: { user: { select: { name: true } } } },
    },
    orderBy: { endedAt: "desc" },
    take: 5,
  });

  const currency = school.currency;

  return (
    <>
      <DashboardHeader title="Welcome back!" subtitle={school.name} />
      <div className="p-6 lg:p-8 space-y-8">
        {/* Pending Alerts */}
        {(pendingStudents > 0 || pendingTeachers > 0 || scheduledInterviews > 0 || pendingPayments > 0) && (
          <div className="space-y-3">
            {pendingStudents > 0 && (
              <Link href="/principal/students" className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition">
                <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center"><AlertCircle className="w-5 h-5" /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-800">{pendingStudents} Student{pendingStudents > 1 ? "s" : ""} Pending</h3>
                  <p className="text-xs text-amber-600">Review applications, schedule interviews</p>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-500" />
              </Link>
            )}
            {pendingTeachers > 0 && (
              <Link href="/principal/teachers" className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition">
                <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center"><AlertCircle className="w-5 h-5" /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-800">{pendingTeachers} Teacher{pendingTeachers > 1 ? "s" : ""} Pending</h3>
                  <p className="text-xs text-blue-600">Approve or interview teacher applications</p>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500" />
              </Link>
            )}
            {pendingPayments > 0 && (
              <Link href="/principal/payments" className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition">
                <div className="w-10 h-10 rounded-full bg-green-200 text-green-700 flex items-center justify-center"><CreditCard className="w-5 h-5" /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-800">{pendingPayments} Payment{pendingPayments > 1 ? "s" : ""} Under Review</h3>
                  <p className="text-xs text-green-600">Approve or reject payment proofs</p>
                </div>
                <ArrowRight className="w-5 h-5 text-green-500" />
              </Link>
            )}
            {scheduledInterviews > 0 && (
              <Link href="/principal/interviews" className="flex items-center gap-4 p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition">
                <div className="w-10 h-10 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-purple-800">{scheduledInterviews} Interview{scheduledInterviews > 1 ? "s" : ""} Scheduled</h3>
                  <p className="text-xs text-purple-600">Join meetings and review results</p>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-500" />
              </Link>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-8 h-8 text-blue-500" />
              {pendingStudents > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{pendingStudents} new</span>}
            </div>
            <div className="text-2xl font-bold">{approvedStudents}</div>
            <div className="text-xs text-gray-500">Students</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-emerald-500" />
              {pendingTeachers > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{pendingTeachers} new</span>}
            </div>
            <div className="text-2xl font-bold">{activeTeachers}</div>
            <div className="text-xs text-gray-500">Teachers</div>
          </div>
          <Link href="/principal/fees" className="stat-card hover:border-red-200 transition">
            <TrendingDown className="w-8 h-8 text-red-500 mb-2" />
            <div className="text-lg font-bold text-red-600">{currency} {totalOutstanding.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{studentsInDebt} student{studentsInDebt !== 1 ? "s" : ""} with debt →</div>
          </Link>
          <div className="stat-card">
            <Briefcase className="w-8 h-8 text-purple-500 mb-2" />
            <div className="text-2xl font-bold">{openVacancies}</div>
            <div className="text-xs text-gray-500">{totalApplications} applications</div>
          </div>
        </div>

        {/* Live Sessions & Today's Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Live Now */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h3 className="section-title">Live Sessions ({liveSessions.length})</h3>
            </div>
            {liveSessions.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No live classes right now</p>
            ) : (
              <div className="space-y-2">
                {liveSessions.map((ls: any) => (
                  <div key={ls.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <Play className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800">{ls.class.subject?.name || ls.class.name} — {ls.class.schoolGrade?.gradeLevel}</p>
                      <p className="text-[10px] text-gray-500">Teacher: {ls.teacher.user.name}{ls.topic ? ` • ${ls.topic}` : ""}</p>
                    </div>
                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium animate-pulse">LIVE</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Attendance */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-brand-500" />
              <h3 className="section-title">Today&apos;s Attendance</h3>
            </div>
            {totalAttendance === 0 ? (
              <p className="text-xs text-gray-400 py-4">No attendance recorded today</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="text-xl font-bold text-emerald-600">{attendanceStats.present}</div>
                    <div className="text-[10px] text-emerald-700">Present</div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <div className="text-xl font-bold text-amber-600">{attendanceStats.late}</div>
                    <div className="text-[10px] text-amber-700">Late</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-600">{attendanceStats.absent}</div>
                    <div className="text-[10px] text-red-700">Absent</div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: (attendanceStats.present / totalAttendance * 100) + "%" }} />
                  <div className="bg-amber-500 h-full" style={{ width: (attendanceStats.late / totalAttendance * 100) + "%" }} />
                  <div className="bg-red-500 h-full" style={{ width: (attendanceStats.absent / totalAttendance * 100) + "%" }} />
                </div>
                <p className="text-[10px] text-gray-500 mt-2">{totalAttendance} records • {Math.round((attendanceStats.present + attendanceStats.late) / totalAttendance * 100)}% attendance rate</p>
              </>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div className="card">
            <h3 className="section-title mb-4">Recent Class Sessions Today</h3>
            <div className="space-y-2">
              {recentSessions.map((rs: any) => (
                <div key={rs.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Monitor className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800">{rs.class.subject?.name || rs.class.name} — {rs.class.schoolGrade?.gradeLevel}</p>
                    <p className="text-[10px] text-gray-500">{rs.teacher.user.name}{rs.topic ? ` • ${rs.topic}` : ""}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Ended</span>
                    {rs.startedAt && rs.endedAt && (
                      <p className="text-[9px] text-gray-400 mt-0.5">{Math.round((new Date(rs.endedAt).getTime() - new Date(rs.startedAt).getTime()) / 60000)} min</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h3 className="section-title mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: "/principal/students", label: "Students", icon: GraduationCap, badge: pendingStudents },
              { href: "/principal/teachers", label: "Teachers", icon: Users, badge: pendingTeachers },
              { href: "/principal/interviews", label: "Interviews", icon: Calendar, badge: scheduledInterviews },
              { href: "/principal/vacancies", label: "Vacancies", icon: Briefcase, badge: totalApplications },
              { href: "/principal/curriculum", label: "Curriculum", icon: BookOpen },
              { href: "/principal/fees", label: "Fees & Debts", icon: DollarSign, badge: studentsInDebt },
              { href: "/principal/payments", label: "Payments", icon: CreditCard, badge: pendingPayments },
              { href: "/principal/reports", label: "Reports", icon: Activity },
            ].map((a: any) => (
              <Link key={a.href} href={a.href} className="relative flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                <a.icon className="w-6 h-6 text-brand-500" />
                <span className="text-xs font-medium text-gray-700 text-center">{a.label}</span>
                {a.badge && a.badge > 0 && <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{a.badge}</span>}
              </Link>
            ))}
          </div>
        </div>

        {/* School Info */}
        <div className="card">
          <h3 className="section-title mb-4">School Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">School:</span> <strong>{school.name}</strong></div>
            <div><span className="text-gray-500">Country:</span> <strong>{school.countryCode}</strong></div>
            <div><span className="text-gray-500">Currency:</span> <strong>{school.currency}</strong></div>
            <div><span className="text-gray-500">Grades:</span> <strong>{school.grades.length}</strong></div>
            {school.motto && <div className="col-span-2"><span className="text-gray-500">Motto:</span> <strong>{school.motto}</strong></div>}
          </div>
        </div>
      </div>
    </>
  );
}
