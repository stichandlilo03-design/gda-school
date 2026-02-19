import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import Link from "next/link";
import { BookOpen, Users, UserCheck, ClipboardList, ChevronRight, Star, Clock } from "lucide-react";

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: {
        where: { isActive: true },
        include: {
          enrollments: { where: { status: "ACTIVE" } },
          schoolGrade: true,
        },
      },
      user: true,
    },
  });

  const totalStudents = teacher?.classes.reduce((acc, c) => acc + c.enrollments.length, 0) || 0;
  const totalClasses = teacher?.classes.length || 0;

  return (
    <>
      <DashboardHeader
        title={`Welcome, ${session.user.name.split(" ")[0]}!`}
        subtitle="Teacher Portal"
      />
      <div className="p-6 lg:p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Classes", value: totalClasses, icon: BookOpen, color: "text-blue-600 bg-blue-100" },
            { label: "Total Students", value: totalStudents, icon: Users, color: "text-emerald-600 bg-emerald-100" },
            { label: "Rating", value: teacher?.rating ? `${teacher.rating.toFixed(1)}/5` : "New", icon: Star, color: "text-amber-600 bg-amber-100" },
            { label: "Experience", value: `${teacher?.yearsExperience || 0} yrs`, icon: Clock, color: "text-purple-600 bg-purple-100" },
          ].map((stat, i) => (
            <div key={i} className="stat-card">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Classes */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">My Classes</h2>
              <Link href="/teacher/classes" className="text-sm text-brand-500 hover:underline flex items-center gap-1">
                Manage <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {totalClasses > 0 ? (
              <div className="space-y-3">
                {teacher?.classes.map((cls) => (
                  <div key={cls.id} className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                      {cls.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{cls.name}</p>
                      <p className="text-xs text-gray-500">
                        {cls.enrollments.length} students • {cls.session.replace("SESSION_", "Session ")} • {cls.schoolGrade.gradeLevel}
                      </p>
                    </div>
                    <Link href={`/teacher/classes?id=${cls.id}`} className="btn-ghost text-xs px-3 py-1.5">
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-600 mb-1">No classes yet</h3>
                <p className="text-xs text-gray-400 mb-4">Create your first class to start teaching</p>
                <Link href="/teacher/classes" className="btn-primary text-xs px-4 py-2">
                  Create Class
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="section-title mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: "/teacher/attendance", icon: UserCheck, label: "Mark Attendance", color: "text-blue-600" },
                { href: "/teacher/gradebook", icon: ClipboardList, label: "Enter Grades", color: "text-emerald-600" },
                { href: "/teacher/materials", icon: BookOpen, label: "Upload Materials", color: "text-amber-600" },
                { href: "/teacher/schedule", icon: Clock, label: "Set Schedule", color: "text-purple-600" },
              ].map((action, i) => (
                <Link key={i} href={action.href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{action.label}</span>
                  <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
