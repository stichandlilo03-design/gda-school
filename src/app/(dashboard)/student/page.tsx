import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import Link from "next/link";
import {
  BookOpen, Users, Calendar, Award, Clock, TrendingUp,
  ChevronRight, Play, CheckCircle2, AlertCircle,
} from "lucide-react";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      school: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              teacher: { include: { user: true } },
            },
          },
        },
      },
      certificates: { orderBy: { issuedAt: "desc" }, take: 3 },
    },
  });

  const enrollmentCount = student?.enrollments.length || 0;
  const firstName = session.user.name.split(" ")[0];

  return (
    <>
      <DashboardHeader
        title={`Welcome back, ${firstName}!`}
        subtitle={student?.school?.name || "Global Digital Academy"}
      />
      <div className="p-6 lg:p-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Enrolled Classes", value: enrollmentCount, icon: BookOpen, color: "text-blue-600 bg-blue-100" },
            { label: "Grade Level", value: student?.gradeLevel || "—", icon: TrendingUp, color: "text-emerald-600 bg-emerald-100" },
            { label: "Certificates", value: student?.certificates.length || 0, icon: Award, color: "text-amber-600 bg-amber-100" },
            { label: "Preferred Session", value: student?.preferredSession === "SESSION_A" ? "Morning" : student?.preferredSession === "SESSION_B" ? "Afternoon" : "Evening", icon: Clock, color: "text-purple-600 bg-purple-100" },
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Classes */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">My Classes</h2>
              <Link href="/student/subjects" className="text-sm text-brand-500 hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {enrollmentCount > 0 ? (
              <div className="space-y-3">
                {student?.enrollments.slice(0, 5).map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                      {enrollment.class.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{enrollment.class.name}</p>
                      <p className="text-xs text-gray-500">
                        Teacher: {enrollment.class.teacher.user.name} • {enrollment.class.session.replace("SESSION_", "Session ")}
                      </p>
                    </div>
                    <Link href={`/student/classroom?classId=${enrollment.classId}`} className="btn-ghost text-xs px-3 py-1.5 bg-brand-50 text-brand-600">
                      <Play className="w-3 h-3 mr-1" /> Join
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-600 mb-1">No classes yet</h3>
                <p className="text-xs text-gray-400 mb-4">Browse teachers and enroll in classes to get started</p>
                <Link href="/student/teachers" className="btn-primary text-xs px-4 py-2">
                  Browse Teachers
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="section-title mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { href: "/student/teachers", icon: Users, label: "Browse & Choose Teachers", color: "text-blue-600" },
                  { href: "/student/timetable", icon: Calendar, label: "View Timetable", color: "text-emerald-600" },
                  { href: "/student/grades", icon: TrendingUp, label: "Check My Grades", color: "text-amber-600" },
                  { href: "/student/certificates", icon: Award, label: "View Certificates", color: "text-purple-600" },
                ].map((action, i) => (
                  <Link
                    key={i}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{action.label}</span>
                    <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>

            {/* School Info */}
            {student?.school && (
              <div className="card bg-brand-600 text-white border-0">
                <h3 className="font-semibold mb-2">{student.school.name}</h3>
                {student.school.motto && (
                  <p className="text-brand-200 text-sm italic mb-3">&ldquo;{student.school.motto}&rdquo;</p>
                )}
                <div className="text-xs text-brand-300">
                  Country: {student.school.countryCode} • Currency: {student.school.currency}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
