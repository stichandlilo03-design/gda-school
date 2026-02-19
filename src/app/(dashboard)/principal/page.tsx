import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import Link from "next/link";
import { Users, GraduationCap, BookOpen, DollarSign, Clock, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

export default async function PrincipalDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const principal = await db.principal.findUnique({
    where: { userId: session.user.id },
    include: {
      school: {
        include: {
          students: true,
          teachers: true,
          grades: true,
        },
      },
    },
  });

  if (!principal) return <div className="p-8">Principal profile not found.</div>;

  const school = principal.school;
  const pendingStudents = school.students.filter((s) => s.approvalStatus === "PENDING").length;
  const approvedStudents = school.students.filter((s) => s.approvalStatus === "APPROVED").length;
  const pendingTeachers = school.teachers.filter((t) => t.status === "PENDING").length;
  const activeTeachers = school.teachers.filter((t) => t.status === "APPROVED" && t.isActive).length;

  return (
    <>
      <DashboardHeader title={`Welcome back!`} subtitle={school.name} />
      <div className="p-6 lg:p-8 space-y-8">
        {/* Pending Alerts */}
        {(pendingStudents > 0 || pendingTeachers > 0) && (
          <div className="space-y-3">
            {pendingStudents > 0 && (
              <Link href="/principal/students" className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-800">{pendingStudents} Student Application{pendingStudents > 1 ? "s" : ""} Pending</h3>
                  <p className="text-xs text-amber-600">Review and approve or reject student registrations</p>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-500" />
              </Link>
            )}
            {pendingTeachers > 0 && (
              <Link href="/principal/teachers" className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-800">{pendingTeachers} Teacher Request{pendingTeachers > 1 ? "s" : ""} Pending</h3>
                  <p className="text-xs text-blue-600">Review teacher requests to join your school</p>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500" />
              </Link>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-8 h-8 text-blue-500" />
              {pendingStudents > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{pendingStudents} pending</span>}
            </div>
            <div className="text-2xl font-bold text-gray-900">{approvedStudents}</div>
            <div className="text-xs text-gray-500 mt-1">Approved Students</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-emerald-500" />
              {pendingTeachers > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{pendingTeachers} pending</span>}
            </div>
            <div className="text-2xl font-bold text-gray-900">{activeTeachers}</div>
            <div className="text-xs text-gray-500 mt-1">Active Teachers</div>
          </div>
          <div className="stat-card">
            <BookOpen className="w-8 h-8 text-amber-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{school.grades.length}</div>
            <div className="text-xs text-gray-500 mt-1">Grade Levels</div>
          </div>
          <div className="stat-card">
            <DollarSign className="w-8 h-8 text-purple-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{school.currency}</div>
            <div className="text-xs text-gray-500 mt-1">Currency</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="section-title mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: "/principal/students", label: "Review Students", icon: GraduationCap, badge: pendingStudents },
              { href: "/principal/teachers", label: "Manage Teachers", icon: Users, badge: pendingTeachers },
              { href: "/principal/curriculum", label: "Setup Curriculum", icon: BookOpen },
              { href: "/principal/fees", label: "Set Fees", icon: DollarSign },
            ].map((action) => (
              <Link key={action.href} href={action.href} className="relative flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <action.icon className="w-6 h-6 text-brand-500" />
                <span className="text-xs font-medium text-gray-700 text-center">{action.label}</span>
                {action.badge && action.badge > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {action.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* School Info */}
        <div className="card">
          <h3 className="section-title mb-4">School Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">School Name:</span> <strong>{school.name}</strong></div>
            <div><span className="text-gray-500">Country:</span> <strong>{school.countryCode}</strong></div>
            <div><span className="text-gray-500">Currency:</span> <strong>{school.currency}</strong></div>
            <div><span className="text-gray-500">Slug:</span> <strong>{school.slug}</strong></div>
            {school.motto && <div className="col-span-2"><span className="text-gray-500">Motto:</span> <strong>{school.motto}</strong></div>}
          </div>
        </div>
      </div>
    </>
  );
}
