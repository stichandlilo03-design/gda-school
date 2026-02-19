import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, Clock } from "lucide-react";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({ where: { userId: session.user.id }, include: { school: true } });
  if (!principal) return null;

  const [studentCount, teacherCount, classCount, enrollmentCount, gradeCount, attendanceCount] = await Promise.all([
    db.student.count({ where: { schoolId: principal.schoolId } }),
    db.schoolTeacher.count({ where: { schoolId: principal.schoolId, isActive: true } }),
    db.class.count({ where: { schoolGrade: { schoolId: principal.schoolId }, isActive: true } }),
    db.enrollment.count({ where: { status: "ACTIVE", class: { schoolGrade: { schoolId: principal.schoolId } } } }),
    db.schoolGrade.count({ where: { schoolId: principal.schoolId } }),
    db.attendanceRecord.count({ where: { class: { schoolGrade: { schoolId: principal.schoolId } } } }),
  ]);

  const gradeDist = await db.student.groupBy({
    by: ["gradeLevel"],
    where: { schoolId: principal.schoolId },
    _count: { id: true },
    orderBy: { gradeLevel: "asc" },
  });

  return (
    <>
      <DashboardHeader title="Reports & Analytics" subtitle={principal.school.name} />
      <div className="p-6 lg:p-8 space-y-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Total Students", value: studentCount, icon: GraduationCap, color: "text-blue-600 bg-blue-100" },
            { label: "Active Teachers", value: teacherCount, icon: Users, color: "text-emerald-600 bg-emerald-100" },
            { label: "Active Classes", value: classCount, icon: BookOpen, color: "text-amber-600 bg-amber-100" },
            { label: "Total Enrollments", value: enrollmentCount, icon: TrendingUp, color: "text-purple-600 bg-purple-100" },
            { label: "Grade Levels", value: gradeCount, icon: BookOpen, color: "text-cyan-600 bg-cyan-100" },
            { label: "Attendance Records", value: attendanceCount, icon: Clock, color: "text-rose-600 bg-rose-100" },
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

        {/* Grade Distribution */}
        <div className="card">
          <h3 className="section-title mb-4">Students by Grade Level</h3>
          {gradeDist.length > 0 ? (
            <div className="space-y-3">
              {gradeDist.map((g) => (
                <div key={g.gradeLevel} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 w-16">{g.gradeLevel}</span>
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-lg flex items-center px-3 transition-all"
                      style={{ width: `${Math.max((g._count.id / Math.max(studentCount, 1)) * 100, 8)}%` }}
                    >
                      <span className="text-xs font-bold text-white">{g._count.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No student data to display yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
