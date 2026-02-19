import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import Link from "next/link";
import { BookOpen, Users, Clock, Play } from "lucide-react";

export default async function SubjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            include: {
              teacher: { include: { user: { select: { name: true, image: true } } } },
              enrollments: { where: { status: "ACTIVE" } },
              schoolGrade: true,
            },
          },
        },
      },
    },
  });

  return (
    <>
      <DashboardHeader title="My Subjects" subtitle={`${student?.enrollments.length || 0} enrolled classes`} />
      <div className="p-6 lg:p-8">
        {student?.enrollments && student.enrollments.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {student.enrollments.map((enrollment) => (
              <div key={enrollment.id} className="card hover:border-brand-200 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                    {enrollment.class.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{enrollment.class.name}</h3>
                    <p className="text-xs text-gray-500">{enrollment.class.schoolGrade.gradeLevel}</p>
                  </div>
                  <span className="badge-success">Active</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Users className="w-3 h-3" /> Teacher: {enrollment.class.teacher.user.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3" /> {enrollment.class.session.replace("SESSION_", "Session ")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Users className="w-3 h-3" /> {enrollment.class.enrollments.length} classmates
                  </div>
                </div>
                <Link href={`/student/classroom?classId=${enrollment.classId}`} className="btn-primary w-full text-xs py-2">
                  <Play className="w-3 h-3 mr-1" /> Go to Classroom
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No subjects enrolled yet.</p>
            <Link href="/student/teachers" className="btn-primary">Browse & Choose Teachers</Link>
          </div>
        )}
      </div>
    </>
  );
}
