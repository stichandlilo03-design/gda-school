import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import Link from "next/link";
import { Users, GraduationCap, DollarSign, BookOpen, ChevronRight, TrendingUp, AlertCircle, Settings } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function PrincipalDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: {
      school: {
        include: {
          students: true,
          teachers: { include: { teacher: { include: { user: true } } } },
          grades: true,
        },
      },
    },
  });

  const school = principal?.school;
  const studentCount = school?.students.length || 0;
  const teacherCount = school?.teachers.length || 0;
  const gradeCount = school?.grades.length || 0;

  return (
    <>
      <DashboardHeader
        title={school?.name || "School Dashboard"}
        subtitle={`Principal: ${session.user.name}`}
      />
      <div className="p-6 lg:p-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Students", value: studentCount, icon: GraduationCap, color: "text-blue-600 bg-blue-100", trend: "+12% this term" },
            { label: "Teachers", value: teacherCount, icon: Users, color: "text-emerald-600 bg-emerald-100", trend: `${teacherCount} active` },
            { label: "Grade Levels", value: gradeCount, icon: BookOpen, color: "text-amber-600 bg-amber-100", trend: "Active grades" },
            { label: "Revenue", value: formatCurrency(0, school?.currency || "USD"), icon: DollarSign, color: "text-purple-600 bg-purple-100", trend: "This term" },
          ].map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              <div className="text-xs text-emerald-600 mt-1">{stat.trend}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Teachers */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">Teachers</h2>
              <Link href="/principal/teachers" className="text-sm text-brand-500 hover:underline flex items-center gap-1">
                Manage All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {teacherCount > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="table-header px-4 py-3">Name</th>
                      <th className="table-header px-4 py-3">Status</th>
                      <th className="table-header px-4 py-3">Hired</th>
                      <th className="table-header px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {school?.teachers.slice(0, 5).map((st) => (
                      <tr key={st.id} className="border-b border-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                              {st.teacher.user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{st.teacher.user.name}</p>
                              <p className="text-xs text-gray-500">{st.teacher.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={st.isActive ? "badge-success" : "badge-danger"}>
                            {st.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(st.hiredAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button className="btn-ghost text-xs px-2 py-1">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-600 mb-1">No teachers yet</h3>
                <p className="text-xs text-gray-400 mb-4">Teachers will appear here once they join your school</p>
              </div>
            )}
          </div>

          {/* Admin Actions */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="section-title mb-4">School Management</h2>
              <div className="space-y-2">
                {[
                  { href: "/principal/fees", icon: DollarSign, label: "Set School Fees", color: "text-emerald-600" },
                  { href: "/principal/curriculum", icon: BookOpen, label: "Configure Curriculum", color: "text-blue-600" },
                  { href: "/principal/students", icon: GraduationCap, label: "Manage Students", color: "text-amber-600" },
                  { href: "/principal/settings", icon: Settings, label: "School Settings", color: "text-purple-600" },
                ].map((action, i) => (
                  <Link key={i} href={action.href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{action.label}</span>
                    <ChevronRight className="w-3 h-3 text-gray-400 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>

            {/* School Info Card */}
            {school && (
              <div className="card border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <h3 className="font-bold text-lg mb-1">{school.name}</h3>
                {school.motto && <p className="text-amber-100 text-sm italic mb-3">&ldquo;{school.motto}&rdquo;</p>}
                <div className="space-y-1 text-xs text-amber-200">
                  <p>Country: {school.countryCode}</p>
                  <p>Currency: {school.currency}</p>
                  <p>Status: {school.isActive ? "Active" : "Inactive"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
