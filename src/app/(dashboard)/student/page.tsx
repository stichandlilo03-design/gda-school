import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkStudentAccess } from "@/lib/student-access";
import DashboardHeader from "@/components/layout/dashboard-header";
import KGDashboard from "@/components/kg-dashboard";
import Link from "next/link";
import { getGradeLabelForCountry } from "@/lib/education-systems";
import { to12h } from "@/lib/time-utils";
import {
  BookOpen, Users, Calendar, Award, Clock, TrendingUp,
  ChevronRight, Play, CheckCircle, AlertCircle, CreditCard,
  Package, Lock, Unlock, Bell, GraduationCap, MapPin, Star,
} from "lucide-react";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  let student: any = null;
  try {
    student = await db.student.findUnique({
      where: { userId: session.user.id },
      include: {
        school: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            class: {
              include: {
                subject: true,
                teacher: { include: { user: { select: { name: true, image: true } } } },
                schedules: true,
                requirements: { orderBy: { createdAt: "asc" } },
                enrollments: {
                  where: { status: "ACTIVE" },
                  include: { student: { include: { user: { select: { name: true, image: true } } } } },
                },
                _count: { select: { materials: true, assessments: true } },
              },
            },
          },
        },
        payments: true,
        certificates: { orderBy: { issuedAt: "desc" }, take: 3 },
      },
    });
  } catch (dbErr: any) {
    console.error("Student dashboard DB error:", dbErr?.message || dbErr);
    return (
      <>
        <DashboardHeader title="Student Dashboard" subtitle="Loading..." />
        <div className="p-6 lg:p-8">
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-base font-bold text-amber-800 mb-1">Dashboard Loading Issue</h3>
            <p className="text-sm text-amber-600 mb-4">There was a temporary issue loading your data. Please try refreshing.</p>
            <a href="/student" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700">Refresh</a>
          </div>
        </div>
      </>
    );
  }

  if (!student) return null;

  // Enrollment access status
  let enrollAccess: any = null;
  try {
    enrollAccess = await checkStudentAccess(session.user.id);
  } catch (_e) {
    // Access check failed, allow full access
  }

  // Calculate fee info
  const schoolGrade = await db.schoolGrade.findFirst({
    where: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
  });
  let totalFees = 0;
  if (schoolGrade) {
    const feeStructures = await db.feeStructure.findMany({
      where: { schoolGradeId: schoolGrade.id, isActive: true },
    });
    totalFees = feeStructures.reduce(
      (sum, fs) => sum + fs.tuitionFee + fs.registrationFee + fs.examFee + fs.technologyFee, 0
    );
  }

  const approvedPaid = student.payments
    .filter((p: any) => p.status === "COMPLETED")
    .reduce((sum: number, p: any) => sum + p.amount, 0);
  const pendingAmount = student.payments
    .filter((p: any) => p.status === "UNDER_REVIEW")
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  const feePercent = totalFees > 0 ? Math.round((approvedPaid / totalFees) * 100) : 100;
  const feeThreshold = student.school.feePaymentThreshold ?? 70;
  const feePolicy = student.school.feePaymentPolicy || "PERCENTAGE";
  const hasAccess = feePolicy === "FLEXIBLE" ? true
    : feePolicy === "FULL" ? (feePercent >= 100 || student.feePaid)
    : (feePercent >= feeThreshold || student.feePaid);
  const balanceDue = Math.max(0, totalFees - approvedPaid);

  // Get active term
  const activeTerm = await db.term.findFirst({
    where: { schoolId: student.schoolId, isActive: true },
  });

  // Get recent announcements
  const announcements = await db.classAnnouncement.findMany({
    where: { classId: { in: student.enrollments.map((e) => e.classId) } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { class: { select: { name: true } } },
  });

  const enrollmentCount = student.enrollments.length;
  const firstName = session.user.name.split(" ")[0];
  const currency = student.school.currency;
  const fmt = (n: number) => {
    try { return new Intl.NumberFormat("en", { style: "currency", currency }).format(n); }
    catch (_e) { return `${currency} ${n.toLocaleString()}`; }
  };

  // Collect all requirements across classes
  const allRequirements = student.enrollments.flatMap((e) =>
    e.class.requirements.map((r: any) => ({ ...r, className: e.class.name }))
  );

  // Collect all classmates (unique)
  const classmateMap = new Map<string, any>();
  student.enrollments.forEach((e) => {
    e.class.enrollments.forEach((en: any) => {
      if (en.student.user.name !== session.user.name) {
        classmateMap.set(en.studentId, en.student.user);
      }
    });
  });
  const classmates = Array.from(classmateMap.values());

  // Today's schedule
  const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = DAYS[new Date().getDay()];
  const todaysClasses = student.enrollments
    .filter((e) => e.class.schedules.some((s: any) => s.dayOfWeek === today))
    .map((e) => ({
      ...e.class,
      todaySchedule: e.class.schedules.find((s: any) => s.dayOfWeek === today),
    }))
    .sort((a: any, b: any) => (a.todaySchedule?.startTime || "").localeCompare(b.todaySchedule?.startTime || ""));

  // KG Detection — ages 1-5 / Kindergarten grades
  const isKG = ["K1", "K2", "K3"].includes(student.gradeLevel);

  if (isKG) {
    // If KG student not enrolled, show limited KG dashboard
    if (enrollAccess && !enrollAccess.hasFullAccess) {
      return (
        <>
          <DashboardHeader title={`Hi ${firstName}! 🎒`} subtitle={student.school.name} />
          <div className="p-6 lg:p-8 space-y-4">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
              <div className="text-center">
                <div className="text-5xl mb-3">🏫</div>
                <h3 className="text-lg font-bold text-amber-800">Almost There!</h3>
                <p className="text-sm text-amber-700 mt-1">Your enrollment is being processed.</p>
              </div>
              <div className="mt-4 space-y-2">
                <div className={`flex items-center gap-3 p-3 rounded-xl ${enrollAccess.isApproved ? "bg-emerald-100" : "bg-white"}`}>
                  <span className="text-xl">{enrollAccess.isApproved ? "✅" : "⏳"}</span>
                  <span className="text-sm font-medium">{enrollAccess.isApproved ? "Admission approved!" : "Waiting for principal approval"}</span>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl ${enrollAccess.feesMet ? "bg-emerald-100" : "bg-white"}`}>
                  <span className="text-xl">{enrollAccess.feesMet ? "✅" : "💰"}</span>
                  <span className="text-sm font-medium">{enrollAccess.feesMet ? "Fees paid!" : `Pay school fees (${enrollAccess.feePercent}% done)`}</span>
                </div>
              </div>
              {!enrollAccess.feesMet && enrollAccess.totalFees > 0 && (
                <a href="/student/fees" className="block mt-4 text-center py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700">Pay Fees Now →</a>
              )}
            </div>
          </div>
        </>
      );
    }

    // Get live sessions for KG dashboard
    const liveSessions = await db.liveClassSession.findMany({
      where: {
        status: "IN_PROGRESS",
        classId: { in: student.enrollments.map((e) => e.classId) },
      },
      include: {
        class: {
          include: {
            subject: true,
            teacher: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });

    // Attendance streak
    const recentAtt = await db.attendanceRecord.findMany({
      where: { studentId: student.id, status: "PRESENT" },
      orderBy: { date: "desc" },
      take: 30,
    });
    let streak = 0;
    const dates = new Set(recentAtt.map((a) => a.date.toISOString().split("T")[0]));
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      const key = d.toISOString().split("T")[0];
      if (dates.has(key)) streak++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }

    const recentGrades = await db.assessment.findMany({
      where: { classId: { in: student.enrollments.map((e) => e.classId) } },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    const todayScheduleItems = todaysClasses.map((c: any) => ({
      classId: c.id,
      subjectName: c.subject?.name || c.name,
      teacherName: c.teacher?.user?.name || "Teacher",
      startTime: c.todaySchedule?.startTime || "",
      endTime: c.todaySchedule?.endTime || "",
    }));

    return (
      <KGDashboard
        studentName={session.user.name}
        enrollments={JSON.parse(JSON.stringify(student.enrollments))}
        liveSessions={JSON.parse(JSON.stringify(liveSessions))}
        todaySchedule={JSON.parse(JSON.stringify(todayScheduleItems))}
        recentGrades={JSON.parse(JSON.stringify(recentGrades))}
        attendanceStreak={streak}
      />
    );
  }

  return (
    <>
      <DashboardHeader
        title={`Welcome back, ${firstName}!`}
        subtitle={student.school.name}
      />
      <div className="p-6 lg:p-8 space-y-6">
        {/* ENROLLMENT STATUS — show if not fully enrolled */}
        {enrollAccess && !enrollAccess.hasFullAccess && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-200 flex items-center justify-center text-2xl shrink-0">🎓</div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-amber-900">Complete Your Enrollment</h3>
                <p className="text-xs text-amber-700 mt-0.5">You need to complete these steps to access classes, grades, timetable and more.</p>

                <div className="mt-3 grid gap-2">
                  {/* Step 1: Principal Approval */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                    enrollAccess.isApproved ? "bg-emerald-50 border-emerald-200" : "bg-white border-amber-200"
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      enrollAccess.isApproved ? "bg-emerald-200 text-emerald-700" : "bg-amber-200 text-amber-700"
                    }`}>
                      {enrollAccess.isApproved ? "✓" : "1"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">Principal Approval</p>
                      <p className={`text-[11px] ${enrollAccess.isApproved ? "text-emerald-600" : "text-amber-600"}`}>
                        {enrollAccess.isApproved ? "Approved ✅" :
                         enrollAccess.approvalStatus === "PENDING" ? "Pending — the principal will review your application" :
                         enrollAccess.approvalStatus === "INTERVIEW_SCHEDULED" ? "Interview scheduled — please attend your interview" :
                         enrollAccess.approvalStatus === "INTERVIEWED" ? "Interview complete — awaiting principal's decision" :
                         enrollAccess.approvalStatus === "REJECTED" ? "Not approved — contact the school for next steps" :
                         "In progress..."}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Fee Payment */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                    enrollAccess.feesMet ? "bg-emerald-50 border-emerald-200" : "bg-white border-amber-200"
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      enrollAccess.feesMet ? "bg-emerald-200 text-emerald-700" : "bg-amber-200 text-amber-700"
                    }`}>
                      {enrollAccess.feesMet ? "✓" : "2"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">Fee Payment</p>
                      {enrollAccess.feesMet ? (
                        <p className="text-[11px] text-emerald-600">Fees met ✅</p>
                      ) : enrollAccess.totalFees > 0 ? (
                        <div>
                          <p className="text-[11px] text-amber-600">
                            {enrollAccess.feePolicy === "FULL" ? "Full payment required" : `Minimum ${enrollAccess.feeThreshold}% required`}
                            {" — "}currently at {enrollAccess.feePercent}%
                          </p>
                          <div className="w-full bg-amber-200 rounded-full h-1.5 mt-1">
                            <div className="bg-amber-600 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(enrollAccess.feePercent, 100)}%` }} />
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-500">No fees configured yet</p>
                      )}
                    </div>
                    {!enrollAccess.feesMet && enrollAccess.totalFees > 0 && (
                      <a href="/student/fees" className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-brand-700 shrink-0">
                        Pay Now →
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-amber-600 mt-3 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Classroom, subjects, timetable, grades, and other features are locked until enrollment is complete.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Profile Setup Prompt */}
        {(!student.profilePicture || !student.idNumber) && (
          <a href="/student/profile" className="block p-4 bg-gradient-to-r from-brand-50 to-purple-50 border-2 border-brand-200 rounded-2xl hover:shadow-md transition group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center text-xl shrink-0">🪪</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-800">Complete your student profile!</p>
                <p className="text-[10px] text-brand-600 mt-0.5">
                  {!student.profilePicture && "📷 Upload your photo"}
                  {!student.profilePicture && !student.idNumber && " · "}
                  {!student.idNumber && "🆔 Generate your student ID card"}
                </p>
              </div>
              <span className="text-xs text-brand-600 font-medium group-hover:translate-x-1 transition">Set up →</span>
            </div>
          </a>
        )}

        {/* Fee Status Banner */}
        {totalFees > 0 && !student.feePaid && (
          <div className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${
            hasAccess
              ? "bg-emerald-50 border-emerald-300"
              : feePercent >= 50
              ? "bg-amber-50 border-amber-300"
              : "bg-red-50 border-red-300"
          }`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
              hasAccess ? "bg-emerald-100" : "bg-amber-100"
            }`}>
              {hasAccess ? (
                <Unlock className="w-7 h-7 text-emerald-600" />
              ) : (
                <Lock className="w-7 h-7 text-amber-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-sm font-bold ${hasAccess ? "text-emerald-800" : "text-amber-800"}`}>
                  {hasAccess
                    ? `${feePercent}% Paid — Full Access Unlocked!`
                    : feePolicy === "FULL"
                    ? `${feePercent}% Paid — Full payment required to unlock classes`
                    : `${feePercent}% Paid — Pay ${Math.max(0, feeThreshold - feePercent)}% more to unlock classes (${feeThreshold}% required)`
                  }
                </h3>
              </div>
              <div className="w-full h-2.5 bg-white/50 rounded-full overflow-hidden mb-1.5">
                <div className={`h-full rounded-full transition-all ${
                  hasAccess ? "bg-emerald-500" : feePercent >= 50 ? "bg-amber-500" : "bg-red-500"
                }`} style={{ width: `${Math.min(100, feePercent)}%` }} />
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <span className={hasAccess ? "text-emerald-600" : "text-amber-600"}>Paid: {fmt(approvedPaid)}</span>
                {pendingAmount > 0 && <span className="text-gray-500">Pending: {fmt(pendingAmount)}</span>}
                <span className={balanceDue > 0 ? "text-red-600 font-medium" : "text-emerald-600"}>
                  Due: {fmt(balanceDue)}
                </span>
              </div>
            </div>
            <Link href="/student/fees" className="btn-primary text-xs px-4 py-2 flex-shrink-0">
              {hasAccess ? "View Fees" : "Pay Now"}
            </Link>
          </div>
        )}

        {/* Fee Instructions from School */}
        {student.school.feeInstructions && !student.feePaid && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs font-bold text-blue-800 mb-1">📋 Fee Payment Instructions</p>
            <p className="text-xs text-blue-700 whitespace-pre-wrap">{student.school.feeInstructions}</p>
          </div>
        )}

        {student.feePaid && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-800">All fees paid — you have full access to everything!</span>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Enrolled Classes", value: enrollmentCount, icon: BookOpen, color: "text-blue-600 bg-blue-100" },
            { label: "Grade Level", value: getGradeLabelForCountry(student.gradeLevel, student.school.countryCode), icon: TrendingUp, color: "text-emerald-600 bg-emerald-100" },
            { label: "Classmates", value: classmates.length, icon: Users, color: "text-purple-600 bg-purple-100" },
            { label: "Fees", value: student.feePaid ? "Paid ✓" : `${feePercent}%`, icon: CreditCard, color: student.feePaid ? "text-emerald-600 bg-emerald-100" : "text-amber-600 bg-amber-100" },
          ].map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Term Info + Today's Schedule */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Active Term */}
          {activeTerm && (
            <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-brand-200" />
                <h3 className="text-sm font-bold">{activeTerm.name}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-[10px] text-brand-300">Starts</p>
                  <p className="text-sm font-bold">{new Date(activeTerm.startDate).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-[10px] text-brand-300">Ends</p>
                  <p className="text-sm font-bold">{new Date(activeTerm.endDate).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>
              {new Date(activeTerm.startDate) > new Date() && (
                <div className="mt-3 bg-white/10 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-brand-200">School starts in</p>
                  <p className="text-lg font-bold">
                    {Math.ceil((new Date(activeTerm.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Today's Schedule */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-brand-600" />
              <h3 className="text-sm font-bold text-gray-800">Today&apos;s Schedule — {DAY_SHORT[new Date().getDay()]}</h3>
              <Link href="/student/timetable" className="ml-auto text-[10px] text-brand-600 hover:underline">Full timetable →</Link>
            </div>
            {todaysClasses.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No classes scheduled today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todaysClasses.map((cls: any) => {
                  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
                  const startMin = parseInt(cls.todaySchedule.startTime.split(":")[0]) * 60 + parseInt(cls.todaySchedule.startTime.split(":")[1] || "0");
                  const endMin = parseInt(cls.todaySchedule.endTime.split(":")[0]) * 60 + parseInt(cls.todaySchedule.endTime.split(":")[1] || "0");
                  const isCurrent = nowMinutes >= startMin && nowMinutes <= endMin;
                  const isPast = nowMinutes > endMin;
                  const isUpcoming = nowMinutes < startMin;
                  return (
                  <div key={cls.id} className={`flex items-center gap-3 p-3 rounded-lg ${isCurrent ? "bg-emerald-50 border-2 border-emerald-300 ring-1 ring-emerald-200" : isPast ? "bg-gray-50 opacity-60" : "bg-brand-50/30 border border-brand-100"}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${isCurrent ? "bg-emerald-500 text-white" : isPast ? "bg-gray-200 text-gray-500" : "bg-brand-100 text-brand-600"}`}>
                      {isCurrent ? "🟢" : isPast ? "✓" : to12h(cls.todaySchedule.startTime)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{cls.name}</p>
                      <p className="text-[10px] text-gray-500">
                        {to12h(cls.todaySchedule.startTime)} – {to12h(cls.todaySchedule.endTime)} • {cls.teacher.user.name}
                      </p>
                      {isCurrent && <span className="text-[9px] text-emerald-600 font-bold animate-pulse">● LIVE NOW</span>}
                      {isPast && <span className="text-[9px] text-gray-400">Completed</span>}
                      {isUpcoming && <span className="text-[9px] text-brand-500">Upcoming</span>}
                    </div>
                    {isCurrent && (
                      <Link href="/student/classroom" className="text-[10px] px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 animate-pulse">
                        <Play className="w-3 h-3 inline mr-0.5" /> Join Now
                      </Link>
                    )}
                    {isUpcoming && (
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 text-gray-500">
                        in {startMin - nowMinutes}min
                      </span>
                    )}
                    {isPast && (
                      <Link href="/student/classroom" className="text-[10px] px-2 py-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100">
                        ⭐ Rate
                      </Link>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* My Classes — Full Details (visible when 70%+ paid) */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              My Classes
              {!hasAccess && <Lock className="w-4 h-4 text-amber-500" />}
            </h2>
            <Link href="/student/subjects" className="text-xs text-brand-500 hover:underline flex items-center gap-1">
              My Subjects <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {enrollmentCount === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-600 mb-1">No classes yet</h3>
              <p className="text-xs text-gray-400 mb-4">Browse your subjects and choose teachers to get started</p>
              <Link href="/student/subjects" className="btn-primary text-xs px-4 py-2">Choose Subjects</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {student.enrollments.map((enrollment) => {
                const cls = enrollment.class;
                const classmates = cls.enrollments.filter((e: any) => e.studentId !== student.id);
                return (
                  <div key={enrollment.id} className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 transition-colors">
                    {/* Class Header */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                        {cls.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-800 truncate">{cls.name}</h3>
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                            {cls.session.replace("SESSION_", "Session ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {cls.teacher.user.image ? (
                            <img src={cls.teacher.user.image} alt="" className="w-4 h-4 rounded-full" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[7px] font-bold">
                              {cls.teacher.user.name.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                          )}
                          <span className="text-[10px] text-gray-500">{cls.teacher.user.name}</span>
                          <span className="text-[10px] text-gray-400">• {cls._count.materials} materials • {cls._count.assessments} tests</span>
                        </div>
                      </div>
                      <Link href="/student/classroom" className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                        <Play className="w-3 h-3" /> Classroom
                      </Link>
                    </div>

                    {/* Details (gated by 70% fee payment) */}
                    {hasAccess ? (
                      <div className="grid sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                        {/* Schedule */}
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Schedule</p>
                          {cls.schedules.length > 0 ? (
                            <div className="space-y-1">
                              {cls.schedules.sort((a: any, b: any) =>
                                DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek)
                              ).map((s: any) => (
                                <div key={s.id} className={`text-[10px] px-2 py-1 rounded-lg ${
                                  s.dayOfWeek === today ? "bg-brand-100 text-brand-700 font-medium" : "bg-gray-100 text-gray-600"
                                }`}>
                                  {DAY_SHORT[DAYS.indexOf(s.dayOfWeek)]} {to12h(s.startTime)}–{to12h(s.endTime)}
                                  {s.dayOfWeek === today && " (Today)"}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">Schedule not set yet</p>
                          )}
                        </div>

                        {/* Requirements */}
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                            What You Need ({cls.requirements.length})
                          </p>
                          {cls.requirements.length > 0 ? (
                            <div className="space-y-1">
                              {cls.requirements.map((r: any) => (
                                <div key={r.id} className={`text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 ${
                                  r.isRequired ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"
                                }`}>
                                  {r.category === "TEXTBOOK" ? "📚" : r.category === "NOTEBOOK" ? "📓" : r.category === "EQUIPMENT" ? "🔧" : r.category === "SOFTWARE" ? "💻" : r.category === "UNIFORM" ? "👔" : "📌"}
                                  <span className="truncate">{r.item}</span>
                                  {r.isRequired && <span className="text-[8px] ml-auto text-red-500">*</span>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">No special requirements</p>
                          )}
                        </div>

                        {/* Classmates */}
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">
                            Classmates ({classmates.length})
                          </p>
                          {classmates.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {classmates.slice(0, 8).map((e: any, i: number) => (
                                <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5">
                                  {e.student.user.image ? (
                                    <img src={e.student.user.image} alt="" className="w-4 h-4 rounded-full" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[7px] font-bold">
                                      {e.student.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                    </div>
                                  )}
                                  <span className="text-[10px] text-gray-700">{e.student.user.name.split(" ")[0]}</span>
                                </div>
                              ))}
                              {classmates.length > 8 && (
                                <span className="text-[10px] text-gray-400 px-2 py-0.5">+{classmates.length - 8} more</span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">No classmates yet</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                        <Lock className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-xs font-medium text-amber-800">Pay at least 70% of your fees to see class details</p>
                          <p className="text-[10px] text-amber-600">Schedule, requirements, and classmates will be visible once you reach 70% payment.</p>
                        </div>
                        <Link href="/student/fees" className="btn-primary text-[10px] px-3 py-1.5 flex-shrink-0">Pay Fees</Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Grid */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Requirements Checklist (all classes combined) */}
          {hasAccess && allRequirements.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-800">Things You Need to Get</h3>
              </div>
              <div className="space-y-1.5">
                {allRequirements.map((r: any, i: number) => (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${r.isRequired ? "bg-red-50" : "bg-gray-50"}`}>
                    <span className="text-sm">
                      {r.category === "TEXTBOOK" ? "📚" : r.category === "NOTEBOOK" ? "📓" : r.category === "EQUIPMENT" ? "🔧" : r.category === "SOFTWARE" ? "💻" : r.category === "UNIFORM" ? "👔" : "📌"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{r.item}</p>
                      <p className="text-[10px] text-gray-500">{r.className}</p>
                      {r.description && <p className="text-[10px] text-gray-400">{r.description}</p>}
                    </div>
                    {r.isRequired ? (
                      <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Required</span>
                    ) : (
                      <span className="text-[9px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Optional</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-bold text-gray-800">Recent Announcements</h3>
              </div>
              <div className="space-y-2">
                {announcements.map((a: any) => (
                  <div key={a.id} className={`p-2.5 rounded-lg ${
                    a.type === "URGENT" ? "bg-red-50 border border-red-100" :
                    a.type === "CLASS_REMINDER" ? "bg-blue-50 border border-blue-100" :
                    "bg-gray-50"
                  }`}>
                    <div className="flex items-center gap-1 mb-0.5">
                      {a.type === "URGENT" && <AlertCircle className="w-3 h-3 text-red-500" />}
                      <span className="text-[10px] font-bold text-gray-800">{a.title}</span>
                    </div>
                    <p className="text-[10px] text-gray-600 line-clamp-2">{a.content}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{a.class.name} • {new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions + School Info */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-sm font-bold text-gray-800 mb-3">Quick Actions</h3>
              <div className="space-y-1.5">
                {[
                  { href: "/student/classroom", icon: Play, label: "Live Classroom", color: "text-red-600" },
                  { href: "/student/subjects", icon: BookOpen, label: "My Subjects & Enroll", color: "text-blue-600" },
                  { href: "/student/teachers", icon: Users, label: "Browse Teachers", color: "text-indigo-600" },
                  { href: "/student/materials", icon: BookOpen, label: "Class Materials", color: "text-emerald-600" },
                  { href: "/student/grades", icon: TrendingUp, label: "My Grades", color: "text-amber-600" },
                  { href: "/student/fees", icon: CreditCard, label: "School Fees", color: "text-purple-600" },
                  { href: "/student/messages", icon: Bell, label: "Messages", color: "text-brand-600" },
                  { href: "/student/certificates", icon: Award, label: "Certificates", color: "text-pink-600" },
                ].map((action, i) => (
                  <Link key={i} href={action.href} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-xs text-gray-700 group-hover:text-gray-900">{action.label}</span>
                    <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>

            {/* All Classmates */}
            {hasAccess && classmates.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-gray-800">My Classmates ({classmates.length})</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {classmates.slice(0, 12).map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-2.5 py-1">
                      {c.image ? (
                        <img src={c.image} alt="" className="w-5 h-5 rounded-full" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[8px] font-bold">
                          {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                      )}
                      <span className="text-[10px] text-gray-700">{c.name.split(" ")[0]}</span>
                    </div>
                  ))}
                  {classmates.length > 12 && (
                    <span className="text-[10px] text-gray-400 px-2 py-1">+{classmates.length - 12} more</span>
                  )}
                </div>
              </div>
            )}

            {/* School Info */}
            {student.school && (
              <div className="card bg-brand-600 text-white border-0">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-5 h-5 text-brand-200" />
                  <h3 className="font-semibold text-sm">{student.school.name}</h3>
                </div>
                {student.school.motto && (
                  <p className="text-brand-200 text-xs italic mb-2">&ldquo;{student.school.motto}&rdquo;</p>
                )}
                <div className="text-[10px] text-brand-300 space-y-0.5">
                  <p>Country: {student.school.countryCode} • Currency: {student.school.currency}</p>
                  <p>Grade: {getGradeLabelForCountry(student.gradeLevel, student.school.countryCode)} • Session: {student.enrollments[0]?.class.session.replace("SESSION_", "Session ") || "—"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
