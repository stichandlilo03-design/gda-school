import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import Link from "next/link";
import { Monitor, Users, BookOpen, FileText, MessageSquare, Video } from "lucide-react";

export default async function ClassroomPage({ searchParams }: { searchParams: Promise<{ classId?: string }> }) {
  const params = await searchParams;
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
              enrollments: { where: { status: "ACTIVE" }, include: { student: { include: { user: { select: { name: true } } } } } },
              materials: { where: { isPublished: true }, orderBy: { createdAt: "desc" }, take: 10 },
              schoolGrade: true,
            },
          },
        },
      },
    },
  });

  const classId = params?.classId;
  const enrollment = classId ? student?.enrollments.find((e) => e.classId === classId) : student?.enrollments[0];
  const cls = enrollment?.class;

  return (
    <>
      <DashboardHeader title="My Classroom" subtitle={cls?.name || "Select a class"} />
      <div className="p-6 lg:p-8">
        {!cls ? (
          <div className="card text-center py-12">
            <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No class selected. Choose from your enrolled classes:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {student?.enrollments.map((e) => (
                <Link key={e.id} href={`/student/classroom?classId=${e.classId}`} className="btn-ghost text-sm border border-gray-200">
                  {e.class.name}
                </Link>
              ))}
            </div>
            {(!student?.enrollments || student.enrollments.length === 0) && (
              <Link href="/student/teachers" className="btn-primary mt-4">Browse & Choose Teachers</Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Class selector */}
            {student!.enrollments.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {student!.enrollments.map((e) => (
                  <Link key={e.id} href={`/student/classroom?classId=${e.classId}`}
                    className={`text-xs px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${e.classId === classId ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {e.class.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main classroom area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Virtual classroom / video area */}
                <div className="card bg-brand-900 text-white border-0 min-h-[300px] flex flex-col items-center justify-center">
                  <Video className="w-16 h-16 text-brand-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Virtual Classroom</h3>
                  <p className="text-brand-300 text-sm mb-4">{cls.session.replace("SESSION_", "Session ")} • {cls.schoolGrade.gradeLevel}</p>
                  <button className="btn-accent px-8 py-3">
                    <Video className="w-4 h-4 mr-2" /> Join Live Session
                  </button>
                  <p className="text-xs text-brand-400 mt-3">Live video will be enabled when Agora/Jitsi is configured</p>
                </div>

                {/* Materials */}
                <div className="card">
                  <h3 className="section-title mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Class Materials
                  </h3>
                  {cls.materials.length > 0 ? (
                    <div className="space-y-2">
                      {cls.materials.map((m: any) => (
                        <a key={m.id} href={m.url} target="_blank" rel="noopener"
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <FileText className="w-4 h-4 text-brand-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{m.title}</p>
                            <p className="text-xs text-gray-500">{m.type} • {new Date(m.createdAt).toLocaleDateString()}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No materials uploaded yet.</p>
                  )}
                </div>
              </div>

              {/* Sidebar - classmates & teacher */}
              <div className="space-y-6">
                {/* Teacher info */}
                <div className="card">
                  <h3 className="section-title mb-3">Teacher</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                      {cls.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{cls.teacher.user.name}</p>
                      <p className="text-xs text-gray-500">Class Teacher</p>
                    </div>
                  </div>
                </div>

                {/* Classmates */}
                <div className="card">
                  <h3 className="section-title mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Classmates ({cls.enrollments.length})
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {cls.enrollments.map((e: any) => (
                      <div key={e.id} className="flex items-center gap-2 py-1">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                          {e.student.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-xs text-gray-700">{e.student.user.name}</span>
                        {e.student.userId === session.user.id && <span className="text-[10px] text-brand-500">(You)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}