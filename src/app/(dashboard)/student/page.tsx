import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import ClassTimerWidget from "@/components/class-timer-widget";
import StudentInterviewBanner from "./interview-banner";
import Link from "next/link";
import {
  BookOpen, Users, Calendar, Award, Clock, TrendingUp,
  ChevronRight, Play, CheckCircle, AlertCircle, MessageSquare,
  GraduationCap, BarChart3, UserCheck, FolderOpen, CreditCard, Star
} from "lucide-react";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      school: true,
      user: { select: { name: true, image: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              teacher: { include: { user: { select: { name: true, image: true } } } },
              schoolGrade: true,
              schedules: true,
              _count: { select: { enrollments: true } },
            },
          },
        },
      },
      certificates: { orderBy: { issuedAt: "desc" }, take: 3 },
      attendances: {
        where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      },
      scores: {
        include: { assessment: { include: { class: true } } },
        orderBy: { gradedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!student) return null;

  // Fetch interviews separately using studentId (the Interview model uses studentId = Student.id)
  const latestInterview = await db.interview.findFirst({
    where: { studentId: student.id, type: "ADMISSION" },
    orderBy: { scheduledAt: "desc" },
    include: {
      interviewer: { select: { name: true, image: true } },
    },
  });

  const firstName = session.user.name.split(" ")[0];
  const enrollmentCount = student.enrollments.length;

  // Attendance stats
  const totalAttendance = student.attendances.length;
  const presentCount = student.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendancePercent = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;

  // Grades overview
  const gradedScores = student.scores.filter((s) => s.score !== null && s.assessment);
  const avgScore = gradedScores.length > 0
    ? Math.round(gradedScores.reduce((sum, s) => sum + ((s.score! / s.assessment.maxScore) * 100), 0) / gradedScores.length)
    : null;

  // Unread messages
  const unreadCount = await db.message.count({ where: { receiverId: session.user.id, isRead: false } });

  // Today
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const today = days[new Date().getDay()];

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <DashboardHeader
        title={`${greeting}, ${firstName}!`}
        subtitle={student.school?.name || "Global Digital Academy"}
      />
      <div className="p-6 lg:p-8 space-y-6">

        {/* Interview / Approval Status Banner — THIS IS THE KEY FIX */}
        <StudentInterviewBanner
          approvalStatus={student.approvalStatus}
          schoolName={student.school?.name || "School"}
          latestInterview={latestInterview ? JSON.parse(JSON.stringify(latestInterview)) : null}
        />

        {/* Unread messages alert */}
        {unreadCount > 0 && (
          <Link href="/student/messages" className="block p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">You have {unreadCount} unread message{unreadCount > 1 ? "s" : ""}</span>
              <ChevronRight className="w-3 h-3 text-blue-400 ml-auto" />
            </div>
          </Link>
        )}

        {/* Today's classes + Timer (only show for approved students) */}
        {student.approvalStatus === "APPROVED" && <ClassTimerWidget role="STUDENT" />}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Enrolled Classes", value: enrollmentCount, icon: BookOpen, color: "text-blue-600 bg-blue-100" },
            { label: "Grade Level", value: student.gradeLevel, icon: GraduationCap, color: "text-emerald-600 bg-emerald-100" },
            { label: "Attendance", value: `${attendancePercent}%`, icon: UserCheck, color: attendancePercent >= 80 ? "text-emerald-600 bg-emerald-100" : attendancePercent >= 60 ? "text-amber-600 bg-amber-100" : "text-red-600 bg-red-100" },
            { label: "Avg Score", value: avgScore !== null ? `${avgScore}%` : "—", icon: BarChart3, color: "text-purple-600 bg-purple-100" },
            { label: "Certificates", value: student.certificates.length, icon: Award, color: "text-amber-600 bg-amber-100" },
          ].map((stat, i) => (
            <div key={i} className="stat-card">
              <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Classes */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">My Classes</h2>
                <Link href="/student/teachers" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                  Browse more <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {enrollmentCount > 0 ? (
                <div className="space-y-2">
                  {student.enrollments.map((enrollment) => {
                    const t = enrollment.class.teacher;
                    const teacherPic = (t as any).profilePicture || t.user.image;
                    const teacherInitials = t.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                    const studentCount = enrollment.class._count.enrollments;
                    const todaySchedule = enrollment.class.schedules.find((s: any) => s.dayOfWeek === today);

                    return (
                      <div key={enrollment.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        {teacherPic ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-200 flex-shrink-0">
                            <img src={teacherPic} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {teacherInitials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{enrollment.class.name}</p>
                          <p className="text-[10px] text-gray-500">
                            {t.user.name} • {enrollment.class.schoolGrade.gradeLevel} • {studentCount} students
                          </p>
                          {todaySchedule && (
                            <p className="text-[10px] text-brand-600 font-medium mt-0.5">
                              Today: {todaySchedule.startTime} — {todaySchedule.endTime}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Link href={`/student/classroom?classId=${enrollment.classId}`} className="text-[10px] px-2 py-1.5 rounded-lg bg-brand-50 text-brand-600 font-medium hover:bg-brand-100">
                            <Play className="w-3 h-3 inline mr-0.5" /> View
                          </Link>
                          <Link href={`/student/materials?classId=${enrollment.classId}`} className="text-[10px] px-2 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200">
                            <FolderOpen className="w-3 h-3 inline mr-0.5" /> Files
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-600 mb-1">No classes yet</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    {student.approvalStatus === "APPROVED"
                      ? "Browse teachers and request to join classes"
                      : "You need to be approved before enrolling in classes"}
                  </p>
                  {student.approvalStatus === "APPROVED" && (
                    <Link href="/student/teachers" className="btn-primary text-xs px-4 py-2">Browse Classes</Link>
                  )}
                </div>
              )}
            </div>

            {/* Recent Grades */}
            {gradedScores.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title">Recent Grades</h2>
                  <Link href="/student/grades" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                    View all <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {gradedScores.slice(0, 5).map((s) => {
                    const pct = Math.round((s.score! / s.assessment.maxScore) * 100);
                    const grade = pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : "F";
                    const gradeColor = pct >= 70 ? "text-emerald-700 bg-emerald-100" : pct >= 60 ? "text-amber-700 bg-amber-100" : "text-red-700 bg-red-100";
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${gradeColor}`}>{grade}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{s.assessment.title}</p>
                          <p className="text-[10px] text-gray-500">{s.assessment.class?.name} • {s.assessment.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">{s.score}/{s.assessment.maxScore}</p>
                          <p className="text-[10px] text-gray-400">{pct}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h2 className="section-title mb-3">Quick Actions</h2>
              <div className="space-y-1">
                {[
                  { href: "/student/teachers", icon: BookOpen, label: "Browse & Join Classes", color: "text-blue-600" },
                  { href: "/student/schedule", icon: Calendar, label: "My Schedule", color: "text-emerald-600" },
                  { href: "/student/grades", icon: BarChart3, label: "View Grades", color: "text-purple-600" },
                  { href: "/student/attendance", icon: UserCheck, label: "Attendance Record", color: "text-amber-600" },
                  { href: "/student/materials", icon: FolderOpen, label: "Learning Materials", color: "text-cyan-600" },
                  { href: "/student/fees", icon: CreditCard, label: "School Fees", color: "text-pink-600" },
                  { href: "/student/certificates", icon: Award, label: "Certificates", color: "text-indigo-600" },
                  { href: "/student/messages", icon: MessageSquare, label: `Messages${unreadCount > 0 ? ` (${unreadCount})` : ""}`, color: "text-gray-600" },
                ].map((action, i) => (
                  <Link key={i} href={action.href} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{action.label}</span>
                    <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Attendance snapshot */}
            {totalAttendance > 0 && (
              <div className="card">
                <h3 className="section-title mb-3">Attendance This Month</h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none"
                        stroke={attendancePercent >= 80 ? "#10b981" : attendancePercent >= 60 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="3" strokeDasharray={`${attendancePercent} ${100 - attendancePercent}`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">{attendancePercent}%</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{presentCount} present out of {totalAttendance} classes</p>
                    <Link href="/student/attendance" className="text-[10px] text-brand-600 hover:underline">View details →</Link>
                  </div>
                </div>
              </div>
            )}

            {/* School Info */}
            {student.school && (
              <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-5 h-5" />
                  <h3 className="font-semibold text-sm">{student.school.name}</h3>
                </div>
                {student.school.motto && (
                  <p className="text-brand-200 text-xs italic mb-2">&ldquo;{student.school.motto}&rdquo;</p>
                )}
                <div className="text-[10px] text-brand-300 space-y-0.5">
                  <p>Grade: {student.gradeLevel}</p>
                  <p>Session: {student.preferredSession.replace("SESSION_", "Session ")}</p>
                  <p>Status: {
                    student.approvalStatus === "APPROVED" ? "✓ Enrolled" :
                    student.approvalStatus === "PENDING" ? "⏳ Pending Review" :
                    student.approvalStatus === "INTERVIEW_SCHEDULED" ? "📅 Interview Scheduled" :
                    student.approvalStatus === "INTERVIEWED" ? "🔍 Under Review" :
                    "✗ " + student.approvalStatus
                  }</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
