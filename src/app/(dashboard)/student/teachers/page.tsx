import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import { Star, Users, Clock, BookOpen, GraduationCap } from "lucide-react";
import { getGradeLevelLabel, getSessionLabel } from "@/lib/utils";
import EnrollButton from "./enroll-button";

export default async function StudentTeachersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: { enrollments: { where: { status: "ACTIVE" } } },
  });

  if (!student) return null;

  // Find all classes available for this student's grade level at their school
  const availableClasses = await db.class.findMany({
    where: {
      schoolGrade: { schoolId: student.schoolId, gradeLevel: student.gradeLevel },
      isActive: true,
    },
    include: {
      teacher: {
        include: {
          user: { select: { name: true, image: true, email: true } },
        },
      },
      enrollments: { where: { status: "ACTIVE" } },
      schoolGrade: true,
    },
    orderBy: { teacher: { rating: "desc" } },
  });

  const enrolledClassIds = new Set(student.enrollments.map((e) => e.classId));

  return (
    <>
      <DashboardHeader
        title="Choose Your Teachers"
        subtitle={`Browse available teachers for ${getGradeLevelLabel(student.gradeLevel)}`}
      />
      <div className="p-6 lg:p-8">
        {/* Info Banner */}
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <GraduationCap className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-brand-800">How Teacher Selection Works</p>
            <p className="text-xs text-brand-600 mt-1">
              Browse available teachers for each subject in your grade. You can enroll in one teacher&apos;s class per subject.
              Review their profile, experience, ratings, and teaching style before choosing.
            </p>
          </div>
        </div>

        {/* Teacher Cards */}
        {availableClasses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableClasses.map((cls) => {
              const isEnrolled = enrolledClassIds.has(cls.id);
              const isFull = cls.enrollments.length >= cls.maxStudents;

              return (
                <div key={cls.id} className={`card hover:border-brand-200 transition-all ${isEnrolled ? "ring-2 ring-brand-500 border-brand-300" : ""}`}>
                  {/* Teacher Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold">
                      {cls.teacher.user.image ? (
                        <img src={cls.teacher.user.image} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        cls.teacher.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">{cls.teacher.user.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs text-gray-600">
                          {cls.teacher.rating > 0 ? cls.teacher.rating.toFixed(1) : "New"} • {cls.teacher.yearsExperience} yrs exp
                        </span>
                      </div>
                    </div>
                    {isEnrolled && <span className="badge-success text-[10px]">Enrolled</span>}
                  </div>

                  {/* Class Info */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">{cls.name}</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        {cls.session.replace("SESSION_", "Session ")}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Users className="w-3 h-3" />
                        {cls.enrollments.length}/{cls.maxStudents} students
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <BookOpen className="w-3 h-3" />
                        {cls.schoolGrade.gradeLevel}
                      </div>
                    </div>
                  </div>

                  {/* Teacher Bio */}
                  {cls.teacher.bio && (
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{cls.teacher.bio}</p>
                  )}

                  {cls.teacher.teachingStyle && (
                    <div className="mb-4">
                      <span className="badge-info text-[10px]">{cls.teacher.teachingStyle}</span>
                    </div>
                  )}

                  {/* Capacity Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>Capacity</span>
                      <span>{Math.round((cls.enrollments.length / cls.maxStudents) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${cls.enrollments.length / cls.maxStudents > 0.8 ? "bg-red-500" : "bg-brand-500"}`}
                        style={{ width: `${Math.min((cls.enrollments.length / cls.maxStudents) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action */}
                  {isEnrolled ? (
                    <button disabled className="w-full py-2.5 rounded-lg bg-brand-50 text-brand-600 text-sm font-medium cursor-default">
                      ✓ Already Enrolled
                    </button>
                  ) : isFull ? (
                    <button disabled className="w-full py-2.5 rounded-lg bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed">
                      Class Full
                    </button>
                  ) : (
                    <EnrollButton classId={cls.id} studentId={student.id} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No classes available yet</h3>
            <p className="text-sm text-gray-400">Classes for your grade level will appear here once teachers create them.</p>
          </div>
        )}
      </div>
    </>
  );
}
