import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import TeacherInterviewBanner from "./interview-banner";
import Link from "next/link";
import {
  BookOpen, Users, Clock, ClipboardList, UserCheck, FolderOpen, Briefcase,
  AlertCircle, CheckCircle, XCircle, Calendar, Star, School, ArrowRight, GraduationCap
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

  // Collect all interview IDs that are scheduled (for chat)
  const scheduledInterviewIds = teacher.schools
    .flatMap((s) => s.interviews)
    .filter((i) => i.status === "SCHEDULED")
    .map((i) => ({ id: i.id, scheduledAt: i.scheduledAt, interviewer: i.interviewer.name, meetingLink: (i as any).meetingLink }));

  return (
    <>
      <DashboardHeader title={`Welcome, ${session.user.name.split(" ")[0]}!`} subtitle={activeSchool ? activeSchool.school.name : "Teacher Dashboard"} />
      <div className="p-6 lg:p-8 space-y-8">

        {/* Interview banners with chat (client component) */}
        <TeacherInterviewBanner
          interviewScheduled={JSON.parse(JSON.stringify(interviewScheduled))}
          interviewed={JSON.parse(JSON.stringify(interviewed))}
          pendingSchools={JSON.parse(JSON.stringify(pendingSchools))}
          rejectedSchools={JSON.parse(JSON.stringify(rejectedSchools))}
          activeSchool={activeSchool ? JSON.parse(JSON.stringify(activeSchool)) : null}
        />

        {/* No school */}
        {teacher.schools.length === 0 && (
          <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 mb-2">No School Yet</h3>
            <p className="text-sm text-gray-500 mb-4">Browse the job board or wait for a principal to invite you.</p>
            <Link href="/teacher/vacancies" className="btn-primary text-sm"><Briefcase className="w-4 h-4 mr-1" /> Browse Job Board</Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card"><BookOpen className="w-8 h-8 text-brand-500 mb-2" /><div className="text-2xl font-bold text-gray-900">{totalClasses}</div><div className="text-xs text-gray-500 mt-1">Active Classes</div></div>
          <div className="stat-card"><Users className="w-8 h-8 text-emerald-500 mb-2" /><div className="text-2xl font-bold text-gray-900">{uniqueStudents.length}</div><div className="text-xs text-gray-500 mt-1">Total Students</div></div>
          <div className="stat-card"><FolderOpen className="w-8 h-8 text-amber-500 mb-2" /><div className="text-2xl font-bold text-gray-900">{totalMaterials}</div><div className="text-xs text-gray-500 mt-1">Materials</div></div>
          <div className="stat-card"><Star className="w-8 h-8 text-purple-500 mb-2" /><div className="text-2xl font-bold text-gray-900">{teacher.rating > 0 ? teacher.rating.toFixed(1) : "—"}</div><div className="text-xs text-gray-500 mt-1">Rating</div></div>
        </div>

        {/* Weekly Tasks */}
        {activeSchool && totalClasses > 0 && (
          <div className="card">
            <h3 className="section-title flex items-center gap-2 mb-4"><ClipboardList className="w-4 h-4" /> Weekly Tasks — Week {termWeek} ({currentTerm.replace("_", " ")})</h3>
            <div className="space-y-3">
              {teacher.classes.map((cls) => {
                const latestAttendance = cls.attendances[0];
                const attendanceToday = latestAttendance && new Date(latestAttendance.date).toDateString() === today.toDateString();
                const ungradedAssessments = cls.assessments.filter((a) => !a.isPublished).length;
                return (
                  <div key={cls.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-800">{cls.name}</h4>
                    <p className="text-xs text-gray-500 mb-3">{cls.schoolGrade.gradeLevel} • {cls.session.replace("SESSION_", "Session ")} • {cls.enrollments.length} students</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      <Link href="/teacher/attendance" className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${attendanceToday ? "bg-emerald-100 text-emerald-700" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                        <UserCheck className="w-3.5 h-3.5" /> {attendanceToday ? "Attendance Done" : "Mark Attendance"}
                      </Link>
                      <Link href="/teacher/gradebook" className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${ungradedAssessments > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-gray-100 text-gray-600"}`}>
                        <ClipboardList className="w-3.5 h-3.5" /> {ungradedAssessments > 0 ? `${ungradedAssessments} to Grade` : "Gradebook"}
                      </Link>
                      <Link href="/teacher/materials" className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"><FolderOpen className="w-3.5 h-3.5" /> Upload Materials</Link>
                      <Link href="/teacher/classes" className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"><BookOpen className="w-3.5 h-3.5" /> Manage Class</Link>
                    </div>
                    <div className="mt-3 p-3 bg-brand-50 rounded-lg border border-brand-100">
                      <h5 className="text-[10px] font-bold text-brand-700 uppercase mb-1">Week {termWeek} Guide</h5>
                      <div className="text-xs text-brand-600 space-y-0.5">
                        <p>1. Deliver lesson content per scheme</p>
                        <p>2. Mark attendance every session</p>
                        <p>3. Give & grade continuous assessments</p>
                        <p>4. Upload notes/materials for students</p>
                        <p>5. Record student issues or achievements</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="text-xs font-bold text-amber-800 uppercase mb-2">Compensation & Tax</h4>
              <div className="text-xs text-amber-700 space-y-1">
                <p><strong>Full-Time:</strong> PAYE deducted by school. Nigeria: 7-24%, Kenya: 10-30%, Ghana: 5-30%.</p>
                <p><strong>Part-Time/Contract:</strong> Self-employed filing. GDA provides payment records.</p>
                <p><strong>Platform Fee:</strong> Charged to school, not teacher. Your salary is paid in full.</p>
              </div>
            </div>
          </div>
        )}

        {/* Students */}
        {uniqueStudents.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title flex items-center gap-2"><Users className="w-4 h-4" /> My Students ({uniqueStudents.length})</h3>
              <Link href="/teacher/students" className="text-xs text-brand-600 hover:underline">View All <ArrowRight className="w-3 h-3 inline" /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {uniqueStudents.slice(0, 9).map((student: any) => (
                <div key={student.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                    {student.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{student.user.name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {student.classes.map((cls: string) => <span key={cls} className="text-[9px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded">{cls}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vacancy Applications */}
        {teacher.vacancyApplications.length > 0 && (
          <div className="card">
            <h3 className="section-title mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4" /> My Applications</h3>
            <div className="space-y-2">
              {teacher.vacancyApplications.map((app: any) => (
                <div key={app.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{app.vacancy.title}</p>
                    <p className="text-xs text-gray-500">{app.vacancy.school.name}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${app.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" : app.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{app.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {activeSchool && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: "/teacher/classes", label: "My Classes", icon: BookOpen },
              { href: "/teacher/attendance", label: "Attendance", icon: UserCheck },
              { href: "/teacher/gradebook", label: "Gradebook", icon: ClipboardList },
              { href: "/teacher/materials", label: "Materials", icon: FolderOpen },
              { href: "/teacher/students", label: "Students", icon: Users },
              { href: "/teacher/schedule", label: "Schedule", icon: Clock },
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
