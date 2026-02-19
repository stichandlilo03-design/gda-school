import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import Link from "next/link";
import {
  BookOpen, Users, Clock, GraduationCap, FolderOpen, FileText, Video, ChevronLeft,
  Star, Linkedin, Twitter, Globe, Award
} from "lucide-react";

export default async function ClassroomPage({ searchParams }: { searchParams: { classId?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const classId = searchParams.classId;
  if (!classId) {
    return (
      <>
        <DashboardHeader title="Classroom" subtitle="Select a class" />
        <div className="p-6 lg:p-8">
          <div className="card text-center py-16">
            <BookOpen className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Select a class from your dashboard to view classroom details.</p>
            <Link href="/student" className="btn-primary text-xs px-4 py-2 mt-4 inline-block">Go to Dashboard</Link>
          </div>
        </div>
      </>
    );
  }

  const classData = await db.class.findUnique({
    where: { id: classId },
    include: {
      teacher: {
        include: { user: { select: { name: true, email: true, image: true } } },
      },
      schoolGrade: true,
      schedules: { orderBy: { dayOfWeek: "asc" } },
      materials: { where: { isPublished: true }, orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { enrollments: true } },
    },
  });

  if (!classData) {
    return (
      <>
        <DashboardHeader title="Classroom" subtitle="Class not found" />
        <div className="p-6 lg:p-8"><div className="card text-center py-12"><p className="text-sm text-gray-500">This class was not found.</p></div></div>
      </>
    );
  }

  const teacher = classData.teacher;
  const profilePic = teacher.profilePicture || teacher.user.image;
  const initials = teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
  const qualifications = ((teacher.qualifications as string[]) || []).filter(Boolean);

  const DAY_SHORT: Record<string, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun" };

  return (
    <>
      <DashboardHeader title={classData.name} subtitle={`${classData.schoolGrade.gradeLevel} • ${classData.session.replace("SESSION_", "Session ")}`} />
      <div className="p-6 lg:p-8 space-y-6">
        <Link href="/student" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
          <ChevronLeft className="w-3 h-3" /> Back to Dashboard
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Class info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="stat-card text-center">
                <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-bold">{classData._count.enrollments}/{classData.maxStudents}</div>
                <div className="text-[10px] text-gray-500">Students</div>
              </div>
              <div className="stat-card text-center">
                <FolderOpen className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <div className="text-lg font-bold">{classData.materials.length}</div>
                <div className="text-[10px] text-gray-500">Materials</div>
              </div>
              <div className="stat-card text-center">
                <Clock className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <div className="text-lg font-bold">{classData.schedules.length}</div>
                <div className="text-[10px] text-gray-500">Classes/Week</div>
              </div>
            </div>

            {classData.description && (
              <div className="card">
                <h3 className="section-title mb-2">About This Class</h3>
                <p className="text-sm text-gray-700">{classData.description}</p>
              </div>
            )}

            {/* Schedule */}
            {classData.schedules.length > 0 && (
              <div className="card">
                <h3 className="section-title mb-3">Class Schedule</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {classData.schedules.map((sch: any) => (
                    <div key={sch.id} className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs font-bold text-gray-800">{DAY_SHORT[sch.dayOfWeek] || sch.dayOfWeek}</p>
                      <p className="text-[10px] text-gray-500">{sch.startTime} — {sch.endTime}</p>
                      <p className="text-[10px] text-gray-400">Period {sch.periodNumber}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-title">Recent Materials</h3>
                <Link href={`/student/materials?classId=${classId}`} className="text-xs text-brand-600 hover:underline">View all</Link>
              </div>
              {classData.materials.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No materials uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {classData.materials.slice(0, 5).map((m: any) => (
                    <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.type === "VIDEO" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                        {m.type === "VIDEO" ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{m.title}</p>
                        <p className="text-[10px] text-gray-400">{m.type} • {new Date(m.createdAt).toLocaleDateString()}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Teacher card */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="section-title mb-4">Your Teacher</h3>
              <div className="text-center">
                {profilePic ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-brand-200 mx-auto mb-3">
                    <img src={profilePic} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto mb-3 border-4 border-brand-200">
                    <span className="text-xl font-bold text-white">{initials}</span>
                  </div>
                )}
                <h4 className="text-sm font-bold text-gray-900">{teacher.user.name}</h4>
                {teacher.headline && <p className="text-xs text-brand-600 mt-0.5">{teacher.headline}</p>}
                {teacher.teachingStyle && <p className="text-[10px] text-gray-500 mt-0.5">{teacher.teachingStyle}</p>}

                {/* Rating */}
                {teacher.rating > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= teacher.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />)}
                    <span className="text-[10px] text-gray-500 ml-1">{teacher.rating.toFixed(1)}</span>
                  </div>
                )}

                {/* Social */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  {teacher.linkedinUrl && <a href={teacher.linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center hover:bg-blue-200"><Linkedin className="w-3.5 h-3.5" /></a>}
                  {teacher.twitterUrl && <a href={teacher.twitterUrl} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-sky-100 text-sky-700 flex items-center justify-center hover:bg-sky-200"><Twitter className="w-3.5 h-3.5" /></a>}
                  {teacher.websiteUrl && <a href={teacher.websiteUrl} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200"><Globe className="w-3.5 h-3.5" /></a>}
                </div>
              </div>

              {teacher.bio && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-600 leading-relaxed">{teacher.bio}</p>
                </div>
              )}

              {qualifications.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Qualifications</p>
                  <div className="space-y-0.5">
                    {qualifications.map((q: string, i: number) => (
                      <p key={i} className="text-[10px] text-gray-600 flex items-center gap-1"><GraduationCap className="w-3 h-3 text-purple-500" /> {q}</p>
                    ))}
                  </div>
                </div>
              )}

              {teacher.yearsExperience > 0 && (
                <p className="text-[10px] text-gray-400 mt-2">{teacher.yearsExperience} years teaching experience</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
