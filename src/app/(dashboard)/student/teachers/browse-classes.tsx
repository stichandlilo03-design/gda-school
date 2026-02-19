"use client";

import { useState } from "react";
import { requestEnrollment } from "@/lib/actions/enrollment";
import { useRouter } from "next/navigation";
import {
  Loader2, BookOpen, Users, Check, Clock, X, Send, Search, Filter,
  Star, Linkedin, Twitter, Globe, GraduationCap, Award, ChevronDown, ChevronUp, Languages
} from "lucide-react";

export default function BrowseClasses({
  classes, enrolledClassIds, pendingRequestIds, declinedRequestIds, studentApproved, studentGrade,
}: {
  classes: any[]; enrolledClassIds: string[]; pendingRequestIds: string[];
  declinedRequestIds: string[]; studentApproved: boolean; studentGrade: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [enrollMsg, setEnrollMsg] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [showMyGrade, setShowMyGrade] = useState(true);
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);

  const filtered = classes.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.teacher.user.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (gradeFilter !== "all" && c.schoolGrade.gradeLevel !== gradeFilter) return false;
    if (showMyGrade && gradeFilter === "all" && c.schoolGrade.gradeLevel !== studentGrade) return false;
    return true;
  });

  const grades = [...new Set(classes.map((c: any) => c.schoolGrade.gradeLevel))].sort();

  const handleEnroll = async (classId: string) => {
    setLoading(classId);
    const result = await requestEnrollment(classId, enrollMsg[classId]);
    if (result.error) setMessage("Error: " + result.error);
    else setMessage("Enrollment request sent!");
    router.refresh();
    setLoading("");
  };

  if (!studentApproved) {
    return (
      <div className="card text-center py-16">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"><Clock className="w-8 h-8 text-amber-600" /></div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Admission Pending</h3>
        <p className="text-sm text-gray-500">You need to be approved by the school principal before enrolling in classes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded-lg text-sm flex justify-between ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          <span>{message}</span><button onClick={() => setMessage("")}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search classes or teachers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={gradeFilter} onChange={(e) => { setGradeFilter(e.target.value); if (e.target.value !== "all") setShowMyGrade(false); }}>
          <option value="all">All grades</option>
          {grades.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showMyGrade && gradeFilter === "all"} onChange={(e) => { setShowMyGrade(e.target.checked); if (e.target.checked) setGradeFilter("all"); }}
            className="w-4 h-4 rounded border-gray-300 text-brand-600" />
          My grade ({studentGrade})
        </label>
        <span className="text-xs text-gray-400">{filtered.length} classes</span>
      </div>

      {/* Class cards */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12"><BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">No classes found.</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((cls: any) => {
            const isEnrolled = enrolledClassIds.includes(cls.id);
            const isPending = pendingRequestIds.includes(cls.id);
            const isDeclined = declinedRequestIds.includes(cls.id);
            const isFull = cls._count.enrollments >= cls.maxStudents;
            const subjects = (cls.teacher.subjects as string[]) || [];
            const qualifications = ((cls.teacher.qualifications as string[]) || []).filter(Boolean);
            const achievements = ((cls.teacher.achievements as string[]) || []).filter(Boolean);
            const languages = ((cls.teacher.languages as string[]) || []).filter(Boolean);
            const isTeacherExpanded = expandedTeacher === cls.teacher.id;
            const profilePic = cls.teacher.profilePicture || cls.teacher.user.image;
            const initials = cls.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);

            return (
              <div key={cls.id} className={`card hover:shadow-md transition-shadow ${isEnrolled ? "border-emerald-300" : ""}`}>
                {/* Teacher header */}
                <div className="flex items-start gap-3 mb-3">
                  {profilePic ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-200 flex-shrink-0">
                      <img src={profilePic} alt={cls.teacher.user.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isEnrolled ? "bg-emerald-100 text-emerald-700" : "bg-gradient-to-br from-brand-400 to-brand-600 text-white"}`}>
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900">{cls.name}</h4>
                    <p className="text-xs text-gray-600">{cls.teacher.user.name}</p>
                    {cls.teacher.headline && <p className="text-[10px] text-brand-600 font-medium truncate">{cls.teacher.headline}</p>}
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 flex-wrap">
                      <span>{cls.schoolGrade.gradeLevel}</span>
                      <span>•</span>
                      <span>{cls.session.replace("SESSION_", "S")}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {cls._count.enrollments}/{cls.maxStudents}</span>
                      {cls.teacher.yearsExperience > 0 && <><span>•</span><span>{cls.teacher.yearsExperience}yr exp</span></>}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex-shrink-0">
                    {isEnrolled && <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">Enrolled ✓</span>}
                    {isPending && <span className="text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-bold">Pending ⏳</span>}
                    {isDeclined && <span className="text-[10px] px-2 py-1 rounded-full bg-red-100 text-red-600 font-bold">Declined ✗</span>}
                    {isFull && !isEnrolled && !isPending && <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-bold">Full</span>}
                  </div>
                </div>

                {/* Rating */}
                {cls.teacher.rating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-3 h-3 ${s <= cls.teacher.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />)}
                    <span className="text-[10px] text-gray-500 ml-1">{cls.teacher.rating.toFixed(1)} ({cls.teacher.totalRatings})</span>
                  </div>
                )}

                {/* Social links */}
                {(cls.teacher.linkedinUrl || cls.teacher.twitterUrl || cls.teacher.websiteUrl) && (
                  <div className="flex items-center gap-1.5 mb-2">
                    {cls.teacher.linkedinUrl && <a href={cls.teacher.linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center hover:bg-blue-200"><Linkedin className="w-3 h-3" /></a>}
                    {cls.teacher.twitterUrl && <a href={cls.teacher.twitterUrl} target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded bg-sky-100 text-sky-700 flex items-center justify-center hover:bg-sky-200"><Twitter className="w-3 h-3" /></a>}
                    {cls.teacher.websiteUrl && <a href={cls.teacher.websiteUrl} target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200"><Globe className="w-3 h-3" /></a>}
                  </div>
                )}

                {/* Subjects */}
                {subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {subjects.slice(0, 5).map((s: string) => <span key={s} className="text-[9px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded">{s}</span>)}
                    {subjects.length > 5 && <span className="text-[9px] text-gray-400">+{subjects.length - 5} more</span>}
                  </div>
                )}

                {/* Expandable teacher details */}
                <button
                  onClick={() => setExpandedTeacher(isTeacherExpanded ? null : cls.teacher.id)}
                  className="text-[10px] text-brand-600 hover:text-brand-700 flex items-center gap-1 mb-2"
                >
                  {isTeacherExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {isTeacherExpanded ? "Hide profile" : "View teacher profile"}
                </button>

                {isTeacherExpanded && (
                  <div className="p-3 bg-gray-50 rounded-xl mb-3 space-y-2.5 border border-gray-100">
                    {cls.teacher.bio && (
                      <div><p className="text-[10px] font-bold text-gray-500 uppercase mb-1">About</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{cls.teacher.bio}</p></div>
                    )}
                    {cls.teacher.teachingStyle && (
                      <p className="text-xs text-gray-600"><strong>Style:</strong> {cls.teacher.teachingStyle}</p>
                    )}
                    {qualifications.length > 0 && (
                      <div><p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Qualifications</p>
                        <div className="space-y-0.5">{qualifications.map((q: string, i: number) => (
                          <p key={i} className="text-xs text-gray-600 flex items-center gap-1"><GraduationCap className="w-3 h-3 text-purple-500" /> {q}</p>
                        ))}</div></div>
                    )}
                    {achievements.length > 0 && (
                      <div><p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Achievements</p>
                        <div className="space-y-0.5">{achievements.map((a: string, i: number) => (
                          <p key={i} className="text-xs text-gray-600 flex items-center gap-1"><Award className="w-3 h-3 text-amber-500" /> {a}</p>
                        ))}</div></div>
                    )}
                    {languages.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <Languages className="w-3 h-3 text-gray-400 mt-0.5" />
                        {languages.map((l: string) => <span key={l} className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{l}</span>)}
                      </div>
                    )}
                  </div>
                )}

                {cls.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{cls.description}</p>}

                {/* Enroll */}
                {!isEnrolled && !isPending && !isDeclined && !isFull && (
                  <div className="flex gap-2 mt-2">
                    <input
                      className="input-field flex-1 text-xs"
                      placeholder="Why you want to join (optional)"
                      value={enrollMsg[cls.id] || ""}
                      onChange={(e) => setEnrollMsg({ ...enrollMsg, [cls.id]: e.target.value })}
                    />
                    <button
                      onClick={() => handleEnroll(cls.id)}
                      disabled={loading === cls.id}
                      className="text-xs px-4 py-2 rounded-lg bg-brand-600 text-white font-medium flex items-center gap-1 hover:bg-brand-700 disabled:opacity-50"
                    >
                      {loading === cls.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Enroll
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
