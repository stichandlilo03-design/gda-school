import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import Link from "next/link";
import {
  BookOpen, Users, Clock, ClipboardList, UserCheck, FolderOpen, Briefcase,
  AlertCircle, CheckCircle, XCircle, Calendar, Video, Star, School, FileText,
  ArrowRight, GraduationCap, DollarSign, Banknote
} from "lucide-react";

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  let teacher: any = null;
  try {
  teacher = await db.teacher.findUnique({
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
          salary: true,
          payrolls: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 12 },
          sessions: { where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, orderBy: { date: "desc" } },
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
  } catch (dbErr: any) {
    console.error("Teacher dashboard DB error:", dbErr?.message || dbErr);
    return (
      <>
        <DashboardHeader title={`Welcome!`} subtitle="Teacher Dashboard" />
        <div className="p-6 lg:p-8">
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-base font-bold text-amber-800 mb-1">Dashboard Loading Issue</h3>
            <p className="text-sm text-amber-600 mb-4">There was a temporary issue loading your data. This usually resolves on refresh.</p>
            <div className="flex items-center justify-center gap-3">
              <a href="/teacher" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700">Refresh</a>
              <a href="/teacher/classroom" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Go to Classroom</a>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!teacher) return <div className="p-8">Teacher profile not found.</div>;

  // Get all school memberships
  const activeSchool = teacher.schools.find((s) => s.status === "APPROVED" && s.isActive);
  const pendingSchools = teacher.schools.filter((s) => s.status === "PENDING");
  const interviewScheduled = teacher.schools.filter((s) => s.status === "INTERVIEW_SCHEDULED");
  const interviewed = teacher.schools.filter((s) => s.status === "INTERVIEWED");
  const rejectedSchools = teacher.schools.filter((s) => s.status === "REJECTED");

  // Stats
  const totalStudents = teacher.classes.reduce((sum, c) => sum + c.enrollments.length, 0);
  const totalClasses = teacher.classes.length;
  const totalMaterials = teacher.classes.reduce((sum, c) => sum + c.materials.length, 0);

  // Unique students across all classes
  const uniqueStudentMap = new Map<string, any>();
  teacher.classes.forEach((c) => {
    c.enrollments.forEach((e) => {
      if (!uniqueStudentMap.has(e.student.userId)) {
        uniqueStudentMap.set(e.student.userId, {
          ...e.student,
          classes: [c.name],
        });
      } else {
        uniqueStudentMap.get(e.student.userId).classes.push(c.name);
      }
    });
  });
  const uniqueStudents = Array.from(uniqueStudentMap.values());

  // Salary & payroll data
  const salary = activeSchool?.salary;
  const payrolls = activeSchool?.payrolls || [];
  const currentMonthSessions = activeSchool?.sessions || [];
  const now = new Date();
  const monthlyEarned = currentMonthSessions.reduce((s: number, sess: any) => s + (sess.amountEarned || 0), 0);
  const grossMonthly = salary ? salary.baseSalary + salary.housingAllowance + salary.transportAllowance + salary.otherAllowances : 0;
  const totalPaid = payrolls.filter((p: any) => p.status === "PAID").reduce((s: number, p: any) => s + p.netPay, 0);
  const currentMonthPayroll = payrolls.find((p: any) => p.month === now.getMonth() + 1 && p.year === now.getFullYear());
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Session credits from live sessions
  let sessionCredits: any[] = [];
  try {
    sessionCredits = await db.sessionCredit.findMany({
      where: {
        teacherId: teacher.id,
        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
    });
  } catch (_e) {}
  const creditTotal = sessionCredits.reduce((s, c) => s + c.creditAmount, 0);
  const combinedEarned = monthlyEarned + creditTotal;

  // Tasks based on scheme of work
  const today = new Date();
  const weekNumber = Math.ceil(((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(today.getFullYear(), 0, 1).getDay() + 1) / 7);
  const currentTerm = today.getMonth() < 4 ? "TERM_1" : today.getMonth() < 8 ? "TERM_2" : "TERM_3";
  const termWeek = weekNumber <= 13 ? weekNumber : weekNumber <= 26 ? weekNumber - 13 : weekNumber - 26;

  return (
    <>
      <DashboardHeader
        title={`Welcome, ${session.user.name.split(" ")[0]}!`}
        subtitle={activeSchool ? activeSchool.school.name : "Teacher Dashboard"}
      />
      <div className="p-6 lg:p-8 space-y-8">
        {/* Profile Setup Prompt */}
        {(!teacher.profilePicture || !teacher.profileSlug || !teacher.introVideoUrl) && (
          <a href="/teacher/profile" className="block p-4 bg-gradient-to-r from-brand-50 to-emerald-50 border-2 border-brand-200 rounded-2xl hover:shadow-md transition group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center text-xl shrink-0">👤</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-800">Complete your teacher profile!</p>
                <p className="text-[10px] text-brand-600 mt-0.5">
                  {!teacher.profilePicture && "📷 Upload photo "}
                  {!teacher.profileSlug && "🔗 Create shareable link "}
                  {!teacher.introVideoUrl && "🎥 Record intro video"}
                </p>
              </div>
              <span className="text-xs text-brand-600 font-medium group-hover:translate-x-1 transition">Set up →</span>
            </div>
          </a>
        )}

        {/* ============================================================ */}
        {/* STATUS BANNERS */}
        {/* ============================================================ */}

        {/* Interview Scheduled */}
        {interviewScheduled.map((st) => (
          <div key={st.id} className="p-5 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-purple-800">Interview Scheduled — {st.school.name}</h3>
                {st.interviews[0] && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-purple-600">
                      <strong>Date:</strong> {new Date(st.interviews[0].scheduledAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-purple-600">
                      <strong>Duration:</strong> {st.interviews[0].duration} minutes
                    </p>
                    {st.interviews[0].meetingLink && (
                      <a href={st.interviews[0].meetingLink} target="_blank" rel="noopener"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-purple-700 hover:underline mt-1">
                        <Video className="w-4 h-4" /> Join Meeting Link
                      </a>
                    )}
                    {st.interviews[0].meetingNotes && (
                      <p className="text-xs text-purple-500 mt-1">Note: {st.interviews[0].meetingNotes}</p>
                    )}
                    <p className="text-xs text-purple-400">Interviewer: {st.interviews[0].interviewer.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Interviewed — waiting for result */}
        {interviewed.map((st) => (
          <div key={st.id} className="p-5 bg-cyan-50 border border-cyan-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-cyan-200 text-cyan-700 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-cyan-800">Interview Complete — {st.school.name}</h3>
                <p className="text-sm text-cyan-600">Your interview has been completed. Awaiting the principal's decision.</p>
                {st.interviews[0] && st.interviews[0].result && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-cyan-100">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        st.interviews[0].result === "PASS" ? "bg-emerald-100 text-emerald-700" :
                        st.interviews[0].result === "FAIL" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{st.interviews[0].result}</span>
                      {st.interviews[0].scoreOverall != null && (
                        <span className="flex items-center gap-1 text-sm text-cyan-600"><Star className="w-3 h-3" /> Score: {st.interviews[0].scoreOverall}/100</span>
                      )}
                    </div>
                    {st.interviews[0].feedback && <p className="text-xs text-gray-600 mt-2">{st.interviews[0].feedback}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Pending approval (no interview yet) */}
        {pendingSchools.map((st) => (
          <div key={st.id} className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-800">Application Pending — {st.school.name}</h3>
                <p className="text-sm text-amber-600">Your request to join is pending. The principal may schedule an interview or approve directly.</p>
              </div>
            </div>
          </div>
        ))}

        {/* Rejected */}
        {rejectedSchools.map((st) => (
          <div key={st.id} className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-4">
              <XCircle className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="text-sm font-bold text-red-800">Not Approved — {st.school.name}</h3>
                <p className="text-xs text-red-600">Your application was not approved. You can apply to other schools or check the job board.</p>
              </div>
            </div>
          </div>
        ))}

        {/* Approved school info */}
        {activeSchool && (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center">
                <School className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-emerald-800">{activeSchool.school.name}</h3>
                  <span className="text-[10px] bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-bold">APPROVED</span>
                </div>
                {activeSchool.school.motto && <p className="text-xs text-emerald-600 italic">"{activeSchool.school.motto}"</p>}
                <div className="flex items-center gap-4 mt-1 text-xs text-emerald-500">
                  <span>Country: {activeSchool.school.countryCode}</span>
                  <span>Currency: {activeSchool.school.currency}</span>
                  <span>Joined: {new Date(activeSchool.hiredAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No school yet */}
        {teacher.schools.length === 0 && (
          <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 mb-2">No School Yet</h3>
            <p className="text-sm text-gray-500 mb-4">You haven't joined a school yet. Browse the job board or wait for a principal to invite you.</p>
            <Link href="/teacher/vacancies" className="btn-primary text-sm"><Briefcase className="w-4 h-4 mr-1" /> Browse Job Board</Link>
          </div>
        )}

        {/* ============================================================ */}
        {/* SALARY BALANCE */}
        {/* ============================================================ */}

        {salary && (
          <div className="p-5 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-emerald-200 text-[10px] font-medium uppercase tracking-wider">Salary Balance — {MONTHS[now.getMonth()]} {now.getFullYear()}</p>
                <div className="text-3xl font-bold mt-1">{salary.currency} {Math.round(combinedEarned).toLocaleString()}</div>
                <p className="text-emerald-200 text-xs mt-0.5">
                  of {salary.currency} {Math.round(grossMonthly).toLocaleString()} monthly · {sessionCredits.length} sessions · {currentMonthSessions.length} days
                </p>
              </div>
              <div className="text-right space-y-1">
                <div className="text-emerald-100 text-[10px]">
                  <DollarSign className="w-3 h-3 inline" /> Total Received: <span className="font-bold">{salary.currency} {Math.round(totalPaid).toLocaleString()}</span>
                </div>
                {currentMonthPayroll && (
                  <div className={`text-[10px] px-2 py-1 rounded-full inline-block ${currentMonthPayroll.status === "PAID" ? "bg-white/20 text-white" : "bg-amber-400/30 text-amber-100"}`}>
                    {currentMonthPayroll.status === "PAID" ? "✅ This month paid" : "⏳ " + currentMonthPayroll.status}
                  </div>
                )}
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5">
              <div className="bg-white rounded-full h-2.5 transition-all" style={{ width: `${Math.min(100, grossMonthly > 0 ? Math.round(combinedEarned / grossMonthly * 100) : 0)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-emerald-200 mt-1">
              <span>{grossMonthly > 0 ? Math.round(combinedEarned / grossMonthly * 100) : 0}% earned</span>
              <Link href="/teacher/payroll" className="underline hover:text-white">View Payroll →</Link>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STATS */}
        {/* ============================================================ */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <BookOpen className="w-8 h-8 text-brand-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{totalClasses}</div>
            <div className="text-xs text-gray-500 mt-1">Active Classes</div>
          </div>
          <div className="stat-card">
            <Users className="w-8 h-8 text-emerald-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{uniqueStudents.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total Students</div>
          </div>
          <div className="stat-card">
            <FolderOpen className="w-8 h-8 text-amber-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{totalMaterials}</div>
            <div className="text-xs text-gray-500 mt-1">Materials Uploaded</div>
          </div>
          <div className="stat-card">
            <Star className="w-8 h-8 text-purple-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{teacher.rating > 0 ? teacher.rating.toFixed(1) : "—"}</div>
            <div className="text-xs text-gray-500 mt-1">Rating</div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* WEEKLY TASKS / SCHEME OF WORK */}
        {/* ============================================================ */}

        {activeSchool && totalClasses > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Weekly Tasks — Week {termWeek} ({currentTerm.replace("_", " ")})
              </h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              The GDA scheme of work system generates weekly teaching plans per subject and grade.
              As a teacher, your tasks each week include:
            </p>
            <div className="space-y-3">
              {teacher.classes.map((cls) => {
                const latestAttendance = cls.attendances[0];
                const attendanceToday = latestAttendance && new Date(latestAttendance.date).toDateString() === today.toDateString();
                const ungradedAssessments = cls.assessments.filter((a) => !a.isPublished).length;

                return (
                  <div key={cls.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">{cls.name}</h4>
                        <p className="text-xs text-gray-500">{cls.schoolGrade.gradeLevel} • {cls.session.replace("SESSION_", "Session ")} • {cls.enrollments.length} students</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
                      <Link href="/teacher/attendance" className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium transition-colors ${
                        attendanceToday ? "bg-emerald-100 text-emerald-700" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        <UserCheck className="w-3.5 h-3.5" />
                        {attendanceToday ? "Attendance Done" : "Mark Attendance"}
                      </Link>
                      <Link href="/teacher/gradebook" className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium transition-colors ${
                        ungradedAssessments > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-gray-100 text-gray-600"
                      }`}>
                        <ClipboardList className="w-3.5 h-3.5" />
                        {ungradedAssessments > 0 ? `${ungradedAssessments} to Grade` : "Gradebook"}
                      </Link>
                      <Link href="/teacher/materials" className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
                        <FolderOpen className="w-3.5 h-3.5" /> Upload Materials
                      </Link>
                      <Link href="/teacher/classes" className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
                        <BookOpen className="w-3.5 h-3.5" /> Manage Class
                      </Link>
                    </div>
                    {/* Weekly teaching guide */}
                    <div className="mt-3 p-3 bg-brand-50 rounded-lg border border-brand-100">
                      <h5 className="text-[10px] font-bold text-brand-700 uppercase mb-1">Week {termWeek} Teaching Guide</h5>
                      <div className="text-xs text-brand-600 space-y-0.5">
                        <p>1. Deliver lesson content per scheme of work</p>
                        <p>2. Mark attendance for every session</p>
                        <p>3. Give and grade continuous assessments</p>
                        <p>4. Upload notes/materials for students to review</p>
                        <p>5. Record any student issues or achievements</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tax & Compensation Note */}
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="text-xs font-bold text-amber-800 uppercase mb-2">Compensation & Tax Handling</h4>
              <div className="text-xs text-amber-700 space-y-1">
                <p>Teachers on GDA are classified based on their school's country and employment type:</p>
                <p><strong>Full-Time Teachers:</strong> Salary is set by the school. Income tax (PAYE) is deducted at source by the school based on local tax laws. For Nigeria: 7%-24% progressive rate. For Kenya: 10%-30%. For Ghana: 5%-30%.</p>
                <p><strong>Part-Time / Contract:</strong> Paid per session or per term. Teachers are responsible for filing their own taxes as self-employed. GDA provides payment records for your tax filings.</p>
                <p><strong>Platform Fee:</strong> GDA charges the school (not the teacher) a platform fee. Your agreed salary is paid in full.</p>
                <p><strong>Pension:</strong> Where applicable (e.g., Nigeria NSITF/Pension), schools handle statutory deductions. Check with your school principal for details.</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MY STUDENTS */}
        {/* ============================================================ */}

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
                    <p className="text-[10px] text-gray-500 truncate">{student.user.email}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {student.classes.map((cls: string) => (
                        <span key={cls} className="text-[9px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded">{cls}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {uniqueStudents.length > 9 && <p className="text-xs text-gray-400 mt-3 text-center">+ {uniqueStudents.length - 9} more students</p>}
          </div>
        )}

        {/* ============================================================ */}
        {/* MY CLASSES */}
        {/* ============================================================ */}

        {teacher.classes.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title flex items-center gap-2"><BookOpen className="w-4 h-4" /> My Classes</h3>
              <Link href="/teacher/classes" className="text-xs text-brand-600 hover:underline">Manage <ArrowRight className="w-3 h-3 inline" /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teacher.classes.map((cls) => (
                <div key={cls.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-800">{cls.name}</h4>
                    <span className="text-[10px] bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full">{cls.schoolGrade.gradeLevel}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {cls.enrollments.length} students</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {cls.session.replace("SESSION_", "Session ")}</span>
                    <span className="flex items-center gap-1"><FolderOpen className="w-3 h-3" /> {cls.materials.length} materials</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VACANCY APPLICATIONS */}
        {/* ============================================================ */}

        {teacher.vacancyApplications.length > 0 && (
          <div className="card">
            <h3 className="section-title mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4" /> My Job Applications</h3>
            <div className="space-y-2">
              {teacher.vacancyApplications.map((app: any) => (
                <div key={app.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{app.vacancy.title}</p>
                    <p className="text-xs text-gray-500">{app.vacancy.school.name} • Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    app.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" :
                    app.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    app.status === "INTERVIEW_SCHEDULED" ? "bg-purple-100 text-purple-700" :
                    app.status === "INTERVIEWED" ? "bg-cyan-100 text-cyan-700" :
                    app.status === "SHORTLISTED" ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>{app.status.replace("_", " ")}</span>
                  {app.interviews[0]?.meetingLink && app.status === "INTERVIEW_SCHEDULED" && (
                    <a href={app.interviews[0].meetingLink} target="_blank" rel="noopener"
                      className="text-[10px] px-2 py-1 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 font-medium">
                      <Video className="w-3 h-3 inline mr-0.5" /> Join
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* QUICK ACTIONS */}
        {/* ============================================================ */}

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
            ].map((action) => (
              <Link key={action.href} href={action.href}
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors card">
                <action.icon className="w-6 h-6 text-brand-500" />
                <span className="text-xs font-medium text-gray-700">{action.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
