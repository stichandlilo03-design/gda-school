import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import StudentInterviewBanner from "./interview-banner";
import Link from "next/link";
import { BookOpen, Users, Clock, Award, GraduationCap, School } from "lucide-react";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      school: { select: { name: true, motto: true, primaryColor: true, countryCode: true, currency: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              teacher: { include: { user: { select: { name: true } } } },
              schoolGrade: true,
            },
          },
        },
      },
      certificates: true,
      interviews: {
        orderBy: { scheduledAt: "desc" },
        include: { interviewer: { select: { name: true } } },
      },
    },
  });

  if (!student) return <div className="p-8">Student profile not found.</div>;

  const isApproved = student.approvalStatus === "APPROVED";
  const latestInterview = student.interviews[0] || null;

  return (
    <>
      <DashboardHeader title={`Welcome, ${session.user.name.split(" ")[0]}!`} subtitle={student.school.name} />
      <div className="p-6 lg:p-8 space-y-8">

        {/* Interview Banner with Chat (client component) */}
        <StudentInterviewBanner
          approvalStatus={student.approvalStatus}
          schoolName={student.school.name}
          latestInterview={latestInterview ? JSON.parse(JSON.stringify(latestInterview)) : null}
        />

        {/* School Info */}
        <div className="card">
          <h3 className="section-title mb-3 flex items-center gap-2"><School className="w-4 h-4" /> School Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">School:</span> <strong>{student.school.name}</strong></div>
            <div><span className="text-gray-500">Country:</span> <strong>{student.school.countryCode}</strong></div>
            <div><span className="text-gray-500">Currency:</span> <strong>{student.school.currency}</strong></div>
            <div><span className="text-gray-500">Grade:</span> <strong>{student.gradeLevel}</strong></div>
            <div><span className="text-gray-500">Session:</span> <strong>{student.preferredSession.replace("SESSION_", "Session ")}</strong></div>
            <div><span className="text-gray-500">Status:</span> <strong className={isApproved ? "text-emerald-600" : "text-amber-600"}>{student.approvalStatus}</strong></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card"><BookOpen className="w-8 h-8 text-brand-500 mb-2" /><div className="text-2xl font-bold text-gray-900">{student.enrollments.length}</div><div className="text-xs text-gray-500 mt-1">Enrolled Classes</div></div>
          <div className="stat-card"><GraduationCap className="w-8 h-8 text-emerald-500 mb-2" /><div className="text-2xl font-bold text-gray-900">{student.gradeLevel}</div><div className="text-xs text-gray-500 mt-1">Grade Level</div></div>
          <div className="stat-card"><Award className="w-8 h-8 text-amber-500 mb-2" /><div className="text-2xl font-bold text-gray-900">{student.certificates.length}</div><div className="text-xs text-gray-500 mt-1">Certificates</div></div>
          <div className="stat-card"><Clock className="w-8 h-8 text-purple-500 mb-2" /><div className="text-2xl font-bold text-gray-900">{student.preferredSession.replace("SESSION_", "")}</div><div className="text-xs text-gray-500 mt-1">Session</div></div>
        </div>

        {isApproved && (
          <>
            {/* My Classes */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">My Classes</h3>
                <Link href="/student/teachers" className="text-xs text-brand-600 hover:underline font-medium">+ Browse Teachers</Link>
              </div>
              {student.enrollments.length > 0 ? (
                <div className="space-y-3">
                  {student.enrollments.map((enrollment) => (
                    <Link key={enrollment.id} href={`/student/classroom?classId=${enrollment.classId}`}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                        {enrollment.class.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{enrollment.class.name}</p>
                        <p className="text-xs text-gray-500">Teacher: {enrollment.class.teacher.user.name} • {enrollment.class.schoolGrade.gradeLevel} • {enrollment.class.session.replace("SESSION_", "Session ")}</p>
                      </div>
                      <span className="badge-success text-[10px]">Active</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-3">No classes yet.</p>
                  <Link href="/student/teachers" className="btn-primary text-sm">Browse Teachers</Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { href: "/student/subjects", label: "My Subjects", icon: BookOpen },
                { href: "/student/timetable", label: "Timetable", icon: Clock },
                { href: "/student/grades", label: "My Grades", icon: GraduationCap },
                { href: "/student/certificates", label: "Certificates", icon: Award },
              ].map((action) => (
                <Link key={action.href} href={action.href} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors card">
                  <action.icon className="w-6 h-6 text-brand-500" />
                  <span className="text-xs font-medium text-gray-700">{action.label}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
