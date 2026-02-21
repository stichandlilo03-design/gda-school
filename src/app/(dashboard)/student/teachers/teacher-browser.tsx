"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Star, Users, Clock, Loader2, BookOpen, Search, GraduationCap,
  CheckCircle, ChevronDown, ChevronUp, Zap
} from "lucide-react";

const SESSIONS: Record<string, string> = {
  SESSION_A: "Morning", SESSION_B: "Afternoon", SESSION_C: "Evening",
};

export default function TeacherBrowser({
  teachers, enrolledClassIds, enrolledSubjectIds, studentId,
}: {
  teachers: any[]; enrolledClassIds: string[]; enrolledSubjectIds: string[]; studentId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const enrolledSet = new Set(enrolledClassIds);
  const enrolledSubjects = new Set(enrolledSubjectIds);

  // All unique subjects
  const allSubjects = [...new Set(teachers.flatMap((t) => t.subjects))].sort();

  // Filter
  const filtered = teachers.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
      !t.subjects.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterSubject && !t.subjects.includes(filterSubject)) return false;
    return true;
  });

  const handleEnroll = async (classId: string) => {
    setLoading(classId);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, studentId }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else router.refresh();
    } catch (_e) { alert("Failed to enroll"); }
    setLoading("");
  };

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-start gap-3">
        <GraduationCap className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-brand-800">How Teacher Selection Works</p>
          <p className="text-xs text-brand-600 mt-1">
            Each teacher may teach one or more subjects. Choose a teacher for each subject you want to study.
            Teachers with multiple subjects are highlighted — enrolling with them gives you consistency.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white rounded-lg border px-3 flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input className="flex-1 py-2.5 text-xs outline-none" placeholder="Search teacher name or subject..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field text-xs w-44" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
          <option value="">All Subjects</option>
          {allSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Teachers */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No teachers found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const isExp = expanded === t.id;
            const isMultiSubject = t.subjects.length > 1;
            return (
              <div key={t.id} className={`card hover:border-brand-200 transition ${isMultiSubject ? "border-amber-200" : ""}`}>
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExp ? null : t.id)}>
                  {/* Avatar */}
                  {t.image ? (
                    <img src={t.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center text-lg font-bold flex-shrink-0">
                      {t.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-800">{t.name}</h3>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${t.isOnline ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {t.isOnline ? "🟢 Online" : "⚪ Offline"}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs text-gray-600">{t.rating > 0 ? t.rating.toFixed(1) : "New"}</span>
                      </div>
                      {t.years > 0 && <span className="text-[10px] text-gray-400">{t.years} yrs exp</span>}
                      {t.isVerified && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">✓ Verified</span>}
                      {isMultiSubject && (
                        <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                          <Zap className="w-3 h-3" /> {t.subjects.length} subjects
                        </span>
                      )}
                      {t.profileSlug && (
                        <a href={`/profile/teacher/${t.profileSlug}`} target="_blank" onClick={e => e.stopPropagation()} className="text-[9px] text-brand-600 hover:underline">View Profile →</a>
                      )}
                    </div>
                    {/* Subject badges */}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {t.subjects.map((s: string) => (
                        <span key={s} className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${
                          enrolledSubjects.has(t.classes.find((c: any) => c.subjectName === s)?.subjectId || "")
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-50 text-blue-600"
                        }`}>
                          {s}
                          {enrolledSubjects.has(t.classes.find((c: any) => c.subjectName === s)?.subjectId || "") && " ✓"}
                        </span>
                      ))}
                    </div>
                    {t.style && <p className="text-[10px] text-purple-600 mt-0.5">{t.style}</p>}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 text-gray-400">
                    <span className="text-[10px]">{t.classes.length} classes</span>
                    {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {t.bio && !isExp && <p className="text-[10px] text-gray-500 mt-2 line-clamp-1">{t.bio}</p>}

                {/* Expanded: Classes */}
                {isExp && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    {t.headline && <p className="text-[10px] text-brand-600 font-medium mb-1">{t.headline}</p>}
                    {t.bio && <p className="text-xs text-gray-600 mb-2">{t.bio}</p>}
                    {t.introVideoUrl && (
                      <div className="mb-3">
                        <p className="text-[10px] font-medium text-gray-500 mb-1">🎥 Introduction:</p>
                        <video src={t.introVideoUrl} controls className="w-full rounded-lg max-h-[200px]" />
                      </div>
                    )}
                    {t.classes.map((cls: any) => {
                      const isEnrolled = enrolledSet.has(cls.id);
                      const isFull = cls.enrolled >= cls.max;
                      const subjectAlreadyEnrolled = enrolledSubjects.has(cls.subjectId) && !isEnrolled;

                      return (
                        <div key={cls.id} className={`flex items-center gap-3 p-3 rounded-lg ${
                          isEnrolled ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50"
                        }`}>
                          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {cls.subjectName.slice(0, 3).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-800">{cls.subjectName}</span>
                              <span className="text-[10px] text-gray-500">{cls.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                              <span><Clock className="w-3 h-3 inline" /> {SESSIONS[cls.session]}</span>
                              <span><Users className="w-3 h-3 inline" /> {cls.enrolled}/{cls.max}</span>
                              {cls.schedules.length > 0 && (
                                <span>{cls.schedules.map((s: any) => s.day.slice(0, 3)).join(", ")}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {isEnrolled ? (
                              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Enrolled</span>
                            ) : isFull ? (
                              <span className="text-[10px] text-gray-400">Full</span>
                            ) : subjectAlreadyEnrolled ? (
                              <span className="text-[10px] text-amber-600">Enrolled elsewhere</span>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); handleEnroll(cls.id); }} disabled={loading === cls.id}
                                className="text-[10px] px-3 py-1.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700">
                                {loading === cls.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enroll"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
