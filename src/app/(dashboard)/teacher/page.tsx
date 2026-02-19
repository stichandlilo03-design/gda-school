import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import TeacherInterviewBanner from "./interview-banner";
import EnrollmentAlerts from "./enrollment-alerts";
import Link from "next/link";
import {
  BookOpen, Users, Clock, ClipboardList, UserCheck, FolderOpen, Briefcase,
  School, ArrowRight, Star, DollarSign, AlertTriangle, Ban, MessageSquare
} from "lucide-react";

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      schools: {
        include: {
          school: { select: { name: true, slug: true, motto: true, primaryColor: true, secondaryColor: true, countryCode: true, currency: true } },
          interviews: {
            orderBy: { scheduledAt: "desc" },
            include: { interviewer: { select: { name: true } } },
          },
        },
      },
      classes: {
        where: { isActive: true },
        include: {
          schoolGrade: true,
          enrollments: {
            where: { status: "ACTIVE" },
            include: { student: { include: { user: { select: { name: true, email: true } } } } },
          },
          enrollmentRequests: {
            where: { status: "PENDING" },
            include: { student: { include: { user: { select: { name: true, email: true } } } } },
          },
          assessments: { orderBy: { createdAt: "desc" }, take: 5 },
          attendances: { orderBy: { date: "desc" }, take: 1 },
          materials: true,
        },
      },
      vacancyApplications: {
        include: {
          vacancy: { include: { school: { select: { name: true } } } },
          interviews: { orderBy: { scheduledAt: "desc" }, take: 1 },
        },
        orderBy: { appliedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!teacher) return <div className="p-8">Teacher profile not found.</div>;

  const activeSchool = teacher.schools.find((s) => s.status === "APPROVED" && s.isActive);
  const pendingSchools = teacher.schools.filter((s) => s.status === "PENDING");
  const interviewScheduled = teacher.schools.filter((s) => s.status === "INTERVIEW_SCHEDULED");
  const interviewed = teacher.schools.filter((s) => s.status === "INTERVIEWED");
  const rejectedSchools = teacher.schools.filter((s) => s.status === "REJECTED");

  // Check suspension / termination
  const isSuspended = activeSchool && (activeSchool as any).isSuspended;
  const isTerminated = activeSchool && (activeSchool as any).terminatedAt;
  const suspendReason = (activeSchool as any)?.suspendReason || "";
  const terminateReason = (activeSchool as any)?.terminateReason || "";

  const subjects = (teacher.subjects as string[]) || [];
  const preferredGrades = (teacher.preferredGrades as string[]) || [];

  // Get unread messages count
  let unreadMessages = 0;
  try {
    unreadMessages = await db.message.count({ where: { receiverId: session.user.id, isRead: false } });
  } catch {}

  // If suspended or terminated — show restricted dashboard
  if (isSuspended || isTerminated) {
    return (
      <>
        <DashboardHeader title={`${session.user.name.split(" ")[0]}'s Dashboard`} subtitle={activeSchool?.school.name || ""} />
        <div className="p-6 lg:p-8 space-y-6">
          {/* Suspension/Termination Banner */}
          <div className={`p-6 rounded-2xl border-2 ${isSuspended ? "bg-orange-50 border-orange-300" : "bg-red-50 border-red-300"}`}>
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isSuspended ? "bg-orange-200 text-orange-700" : "bg-red-200 text-red-700"}`}>
                {isSuspended ? <AlertTriangle className="w-7 h-7" /> : <Ban className="w-7 h-7" />}
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isSuspended ? "text-orange-800" : "text-red-800"}`}>
                  {isSuspended ? "Account Suspended" : "Employment Terminated"}
                </h2>
                <p className={`text-sm mt-1 ${isSuspended ? "text-orange-700" : "text-red-700"}`}>
                  {isSuspended
                    ? "Your account has been temporarily suspended by the school administration. During this period, you cannot access classes, students, materials, or other school resources."
                    : "Your employment with this school has been terminated. You no longer have access to classes, students, or school resources."}
                </p>
                {(suspendReason || terminateReason) && (
                  <div className={`mt-3 p-3 rounded-lg ${isSuspended ? "bg-orange-100" : "bg-red-100"}`}>
                    <p className="text-xs font-bold uppercase text-gray-600 mb-1">Reason Given:</p>
                    <p className="text-sm text-gray-800">{suspendReason || terminateReason}</p>
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-gray-600">
                    {isSuspended
                      ? "If you believe this is an error, please contact your principal directly. Your account will be restored once the suspension is lifted."
                      : "You can still view your payroll history and payment records. If you have concerns, contact the school administration."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Limited access links */}
          <div className="card">
            <h3 className="section-title mb-3">Available To You</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/teacher/payroll" className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100">
                <DollarSign className="w-5 h-5 text-emerald-500" /><span className="text-xs font-medium">My Payroll</span>
              </Link>
              <Link href="/teacher/vacancies" className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-100">
                <Briefcase className="w-5 h-5 text-blue-500" /><span className="text-xs font-medium">Job Board</span>
              </Link>
              {unreadMessages > 0 && (
                <div className="flex items-center gap-2 p-3 bg-brand-50 rounded-xl border border-brand-200">
                  <MessageSquare className="w-5 h-5 text-brand-500" /><span className="text-xs font-medium">{unreadMessages} unread message(s)</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile */}
          {subjects.length > 0 && (
            <div className="card">
              <h3 className="section-title mb-3">My Profile</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {subjects.map((s: string) => <span key={s} className="text-xs bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full">{s}</span>)}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {preferredGrades.map((g: string) => <span key={g} className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">{g}</span>)}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // ============ NORMAL DASHBOARD ============
  const totalStudents = teacher.classes.reduce((sum, c) => sum + c.enrollments.length, 0);
  const totalClasses = teacher.classes.length;
  const totalMaterials = teacher.classes.reduce((sum, c) => sum + c.materials.length, 0);

  const uniqueStudentMap = new Map<string, any>();
  teacher.classes.forEach((c) => {
    c.enrollments.forEach((e) => {
      if (!uniqueStudentMap.has(e.student.userId)) {
        uniqueStudentMap.set(e.student.userId, { ...e.student, classes: [c.name] });
      } else {
        uniqueStudentMap.get(e.student.userId).classes.push(c.name);
      }
    });
  });
  const uniqueStudents = Array.from(uniqueStudentMap.values());

  const today = new Date();
  const weekNumber = Math.ceil(((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(today.getFullYear(), 0, 1).getDay() + 1) / 7);
  const currentTerm = today.getMonth() < 4 ? "TERM_1" : today.getMonth() < 8 ? "TERM_2" : "TERM_3";
  const termWeek = weekNumber <= 13 ? weekNumber : weekNumber <= 26 ? weekNumber - 13 : weekNumber - 26;

  const allPendingRequests = teacher.classes.flatMap((c) =>
    c.enrollmentRequests.map((r: any) => ({
      id: r.id, className: c.name, classId: c.id, gradeLevel: c.schoolGrade.gradeLevel,
      studentName: r.student.user.name, studentEmail: r.student.user.email, message: r.message, createdAt: r.createdAt,
    }))
  );

  return (
    <>
      <DashboardHeader title={`Welcome, ${session.user.name.split(" ")[0]}!`} subtitle={activeSchool ? activeSchool.school.name : "Teacher Dashboard"} />
      <div className="p-6 lg:p-8 space-y-8">

        <TeacherInterviewBanner
          interviewScheduled={JSON.parse(JSON.stringify(interviewScheduled))}
          interviewed={JSON.parse(JSON.stringify(interviewed))}
          pendingSchools={JSON.parse(JSON.stringify(pendingSchools))}
          rejectedSchools={JSON.parse(JSON.stringify(rejectedSchools))}
          activeSchool={activeSchool ? JSON.parse(JSON.stringify(activeSchool)) : null}
        />

        {allPendingRequests.length > 0 && <EnrollmentAlerts requests={JSON.parse(JSON.stringify(allPendingRequests))} />}

        {/* Unread messages */}
        {unreadMessages > 0 && (
          <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-brand-600" />
            <span className="text-sm text-brand-700 font-medium">You have {unreadMessages} unread message(s) from administration</span>
          </div>
        )}

        {teacher.schools.length === 0 && (
          <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 mb-2">No School Yet</h3>
            <p className="text-sm text-gray-500 mb-4">Browse the job board or request to join a school.</p>
            <Link href="/teacher/vacancies" className="btn-primary text-sm"><Briefcase className="w-4 h-4 mr-1" /> Browse Job Board</Link>
          </div>
        )}

        {(subjects.length > 0 || preferredGrades.length > 0) && (
          <div className="card">
            <h3 className="section-title mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> My Teaching Profile</h3>
            {subjects.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Subjects</p>
                <div className="flex flex-wrap gap-1.5">{subjects.map((s: string) => <span key={s} className="text-xs bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full font-medium">{s}</span>)}</div>
              </div>
            )}
            {preferredGrades.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Grades</p>
                <div className="flex flex-wrap gap-1.5">{preferredGrades.map((g: string) => <span key={g} className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">{g}</span>)}</div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="stat-card"><BookOpen className="w-8 h-8 text-brand-500 mb-2" /><div className="text-2xl font-bold">{totalClasses}</div><div className="text-xs text-gray-500 mt-1">Classes</div></div>
          <div className="stat-card"><Users className="w-8 h-8 text-emerald-500 mb-2" /><div className="text-2xl font-bold">{uniqueStudents.length}</div><div className="text-xs text-gray-500 mt-1">Students</div></div>
          <div className="stat-card"><FolderOpen className="w-8 h-8 text-amber-500 mb-2" /><div className="text-2xl font-bold">{totalMaterials}</div><div className="text-xs text-gray-500 mt-1">Materials</div></div>
          <div className="stat-card"><Star className="w-8 h-8 text-purple-500 mb-2" /><div className="text-2xl font-bold">{teacher.rating > 0 ? teacher.rating.toFixed(1) : "—"}</div><div className="text-xs text-gray-500 mt-1">Rating</div></div>
          <Link href="/teacher/payroll" className="stat-card hover:border-emerald-300 transition-colors"><DollarSign className="w-8 h-8 text-emerald-500 mb-2" /><div className="text-sm font-bold text-emerald-600">View</div><div className="text-xs text-gray-500 mt-1">My Payroll</div></Link>
        </div>

        {activeSchool && totalClasses > 0 && (
          <div className="card">
            <h3 className="section-title flex items-center gap-2 mb-4"><ClipboardList className="w-4 h-4" /> Weekly Tasks — Week {termWeek} ({currentTerm.replace("_", " ")})</h3>
            <div className="space-y-3">
              {teacher.classes.map((cls) => {
                const latestAttendance = cls.attendances[0];
                const attendanceToday = latestAttendance && new Date(latestAttendance.date).toDateString() === today.toDateString();
                const ungradedAssessments = cls.assessments.filter((a) => !a.isPublished).length;
                const pendingReqs = cls.enrollmentRequests.length;
                return (
                  <div key={cls.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-gray-800">{cls.name}</h4>
                      {pendingReqs > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold animate-pulse">{pendingReqs} enrollment request{pendingReqs > 1 ? "s" : ""}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{cls.schoolGrade.gradeLevel} • {cls.session.replace("SESSION_", "Session ")} • {cls.enrollments.length} students</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      <Link href="/teacher/attendance" className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${attendanceToday ? "bg-emerald-100 text-emerald-700" : "bg-amber-50 text-amber-700 border border-amber-200"}`}><UserCheck className="w-3.5 h-3.5" /> {attendanceToday ? "Done" : "Mark Attendance"}</Link>
                      <Link href="/teacher/gradebook" className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${ungradedAssessments > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-gray-100 text-gray-600"}`}><ClipboardList className="w-3.5 h-3.5" /> {ungradedAssessments > 0 ? `${ungradedAssessments} to Grade` : "Gradebook"}</Link>
                      <Link href="/teacher/materials" className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"><FolderOpen className="w-3.5 h-3.5" /> Materials</Link>
                      <Link href="/teacher/classes" className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"><BookOpen className="w-3.5 h-3.5" /> Manage</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {uniqueStudents.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title flex items-center gap-2"><Users className="w-4 h-4" /> My Students ({uniqueStudents.length})</h3>
              <Link href="/teacher/students" className="text-xs text-brand-600 hover:underline">View All <ArrowRight className="w-3 h-3 inline" /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {uniqueStudents.slice(0, 9).map((student: any) => (
                <div key={student.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{student.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{student.user.name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">{student.classes.map((cls: string) => <span key={cls} className="text-[9px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded">{cls}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {teacher.vacancyApplications.length > 0 && (
          <div className="card">
            <h3 className="section-title mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4" /> My Applications</h3>
            <div className="space-y-2">
              {teacher.vacancyApplications.map((app: any) => (
                <div key={app.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <div className="flex-1"><p className="text-sm font-medium">{app.vacancy.title}</p><p className="text-xs text-gray-500">{app.vacancy.school.name}</p></div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${app.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" : app.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{app.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSchool && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: "/teacher/classes", label: "My Classes", icon: BookOpen },
              { href: "/teacher/attendance", label: "Attendance", icon: UserCheck },
              { href: "/teacher/gradebook", label: "Gradebook", icon: ClipboardList },
              { href: "/teacher/materials", label: "Materials", icon: FolderOpen },
              { href: "/teacher/students", label: "Students", icon: Users },
              { href: "/teacher/schedule", label: "Schedule", icon: Clock },
              { href: "/teacher/payroll", label: "My Payroll", icon: DollarSign },
              { href: "/teacher/vacancies", label: "Job Board", icon: Briefcase },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors card">
                <a.icon className="w-6 h-6 text-brand-500" /><span className="text-xs font-medium text-gray-700">{a.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
