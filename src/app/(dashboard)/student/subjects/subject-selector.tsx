"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Users, Clock, Star, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  Loader2, Play, Zap, Award, Search, GraduationCap, Package,
} from "lucide-react";
import Link from "next/link";

const SESSIONS: Record<string, string> = {
  SESSION_A: "Morning (06:00-10:00)",
  SESSION_B: "Afternoon (14:00-18:00)",
  SESSION_C: "Evening (22:00-02:00)",
};

const SUBJECT_ICONS: Record<string, string> = {
  MATH: "\u{1F522}", ENG: "\u{1F4DD}", SCI: "\u{1F52C}", SOC: "\u{1F30D}", ICT: "\u{1F4BB}", ART: "\u{1F3A8}",
  PHE: "\u{26BD}", CIV: "\u{1F3DB}", REL: "\u{1F4D6}", FRN: "\u{1F1EB}\u{1F1F7}", PHY: "\u{26A1}", CHM: "\u{1F9EA}",
  BIO: "\u{1F9EC}", HIS: "\u{1F4DC}", GEO: "\u{1F5FA}", ECO: "\u{1F4CA}", BUS: "\u{1F4BC}", LIT: "\u{1F4DA}",
  AGR: "\u{1F33E}", TDR: "\u{1F4D0}", HEC: "\u{1F3E0}", LOC: "\u{1F5E3}",
};

const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function SubjectSelector({
  gradeSubjects, availableClasses, enrollments, studentId,
}: {
  gradeSubjects: any[]; availableClasses: any[]; enrollments: any[]; studentId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"enrolled"|"available"|"no-teacher">("all");
  const [selectedForBulk, setSelectedForBulk] = useState<Record<string,string>>({});

  const enrolledClassIds = new Set(enrollments.map((e: any) => e.classId));
  const enrolledSubjectIds = new Map<string, any>();
  enrollments.forEach((e: any) => {
    if (e.class?.subject?.id) enrolledSubjectIds.set(e.class.subject.id, e);
  });

  // Group classes by subject
  const classesBySubject = new Map<string, any[]>();
  availableClasses.forEach((cls: any) => {
    const subId = cls.subject?.id || cls.subjectId;
    if (!classesBySubject.has(subId)) classesBySubject.set(subId, []);
    classesBySubject.get(subId)!.push(cls);
  });

  const subjectList = gradeSubjects.map((gs: any) => {
    const subId = gs.subject.id;
    const classes = classesBySubject.get(subId) || [];
    const enrolled = enrolledSubjectIds.get(subId);
    return { ...gs, classes, enrolled, status: enrolled ? "enrolled" : classes.length > 0 ? "available" : "no-teacher" };
  });

  // Find multi-subject teachers
  const teacherSubjectMap = new Map<string, Set<string>>();
  availableClasses.forEach((cls: any) => {
    const tid = cls.teacher?.id;
    if (tid) {
      if (!teacherSubjectMap.has(tid)) teacherSubjectMap.set(tid, new Set());
      teacherSubjectMap.get(tid)!.add(cls.subject?.name || "");
    }
  });

  const filtered = subjectList.filter((s: any) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search && !s.subject.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = gradeSubjects.length;
  const enrolledCount = subjectList.filter((s: any) => s.status === "enrolled").length;
  const availableCount = subjectList.filter((s: any) => s.status === "available").length;
  const noTeacherCount = subjectList.filter((s: any) => s.status === "no-teacher").length;

  const handleEnroll = async (classId: string) => {
    setLoading(classId);
    try {
      const res = await fetch("/api/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId, studentId }) });
      const data = await res.json();
      if (data.error) alert(data.error); else router.refresh();
    } catch { alert("Failed to enroll"); }
    setLoading("");
  };

  const handleEnrollAll = async () => {
    const toEnroll: string[] = [];
    subjectList.forEach((s: any) => {
      if (s.status === "available") {
        const pick = selectedForBulk[s.subject.id] || s.classes[0]?.id;
        if (pick) toEnroll.push(pick);
      }
    });
    if (toEnroll.length === 0) { alert("Nothing to enroll in!"); return; }
    if (!confirm("Enroll in " + toEnroll.length + " subject(s)?")) return;
    setLoading("bulk");
    for (const cid of toEnroll) {
      try { await fetch("/api/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId: cid, studentId }) }); } catch {}
    }
    router.refresh();
    setLoading("");
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Subjects", value: total, icon: BookOpen, color: "bg-blue-100 text-blue-600" },
          { label: "Enrolled", value: enrolledCount, icon: CheckCircle, color: "bg-emerald-100 text-emerald-600" },
          { label: "Need to Enroll", value: availableCount, icon: Clock, color: "bg-amber-100 text-amber-600" },
          { label: "No Teacher", value: noTeacherCount, icon: AlertCircle, color: "bg-gray-100 text-gray-400" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={"w-8 h-8 rounded-lg flex items-center justify-center mb-2 " + s.color}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-[10px] text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700">Enrollment Progress</span>
            <span className="text-xs font-bold text-brand-600">{enrolledCount}/{total}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all" style={{ width: (enrolledCount / total * 100) + "%" }} />
          </div>
          {enrolledCount === total && <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> All enrolled!</p>}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {availableCount > 0 && (
          <button onClick={handleEnrollAll} disabled={loading === "bulk"} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
            {loading === "bulk" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Enroll All ({availableCount})
          </button>
        )}
        <div className="flex-1 relative min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9 text-xs" placeholder="Search subjects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {([["all","All",total],["enrolled","Enrolled",enrolledCount],["available","Available",availableCount],["no-teacher","No Teacher",noTeacherCount]] as const).map(([v,l,c]) => (
            <button key={v} onClick={() => setFilter(v)} className={"text-[10px] px-2.5 py-1.5 rounded-lg transition-all " + (filter === v ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
              {l} ({c})
            </button>
          ))}
        </div>
      </div>

      {/* Subject List */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{gradeSubjects.length === 0 ? "No subjects set for your grade. Ask your principal." : "No matches."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item: any) => {
            const isExp = expanded === item.subject.id;
            const icon = SUBJECT_ICONS[item.subject.code] || "\u{1F4D8}";
            const ec = item.enrolled?.class;

            return (
              <div key={item.id} className={"card transition-all " + (item.status === "enrolled" ? "border-emerald-200 bg-emerald-50/30" : item.status === "no-teacher" ? "border-gray-200 opacity-60" : "hover:border-brand-200")}>
                {/* Header */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => item.classes.length > 0 && setExpanded(isExp ? null : item.subject.id)}>
                  <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center text-xl shadow-sm">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-800">{item.subject.name}</h3>
                      <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{item.subject.code}</span>
                      {item.isRequired
                        ? <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Required</span>
                        : <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Elective</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500">
                      <span>{item.weeklyPeriods} periods/wk</span>
                      <span>{item.classes.length} teacher{item.classes.length !== 1 ? "s" : ""}</span>
                      {ec && <span className="text-emerald-600 font-medium">Enrolled: {ec.teacher.user.name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "enrolled"
                      ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Enrolled</span>
                      : item.status === "no-teacher"
                      ? <span className="text-[10px] bg-gray-200 text-gray-500 px-2.5 py-1 rounded-lg">No teacher</span>
                      : <span className="text-[10px] bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg font-medium animate-pulse">Choose</span>}
                    {item.classes.length > 0 && (isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />)}
                  </div>
                </div>

                {/* Enrolled quick */}
                {item.status === "enrolled" && ec && !isExp && (
                  <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center gap-3">
                    {ec.teacher.user.image
                      ? <img src={ec.teacher.user.image} alt="" className="w-8 h-8 rounded-full" />
                      : <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-[10px] font-bold">{ec.teacher.user.name.split(" ").map((n:string) => n[0]).join("")}</div>}
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-700">{ec.teacher.user.name}</p>
                      <p className="text-[10px] text-gray-500">{ec.name} &bull; {SESSIONS[ec.session] || ec.session}</p>
                    </div>
                    <Link href="/student/classroom" className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center gap-1"><Play className="w-3 h-3" /> Class</Link>
                  </div>
                )}

                {/* Teachers expanded */}
                {isExp && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{item.classes.length} Teacher{item.classes.length !== 1 ? "s" : ""} for {item.subject.name}</p>
                    {item.classes.map((cls: any) => {
                      const enrolled = enrolledClassIds.has(cls.id);
                      const full = cls.enrollments.length >= cls.maxStudents;
                      const alreadyEnrolledOther = item.status === "enrolled" && !enrolled;
                      const multi = (teacherSubjectMap.get(cls.teacher.id) || new Set()).size > 1;
                      const otherSubjects = Array.from(teacherSubjectMap.get(cls.teacher.id) || []).filter((s) => s !== item.subject.name);
                      const isSel = selectedForBulk[item.subject.id] === cls.id;

                      return (
                        <div key={cls.id} className={"p-3 rounded-xl border transition-all " + (enrolled ? "border-emerald-300 bg-emerald-50" : isSel ? "border-brand-400 bg-brand-50 ring-1 ring-brand-300" : "border-gray-200 bg-white hover:border-brand-200")}>
                          <div className="flex items-center gap-3">
                            {cls.teacher.user.image
                              ? <img src={cls.teacher.user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                              : <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">{cls.teacher.user.name.split(" ").map((n:string) => n[0]).join("").slice(0,2)}</div>}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-gray-800">{cls.teacher.user.name}</h4>
                                {cls.teacher.rating > 0 && <span className="text-[10px] text-amber-600 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-amber-500" /> {cls.teacher.rating.toFixed(1)}</span>}
                                {cls.teacher.isVerified && <span className="text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded-full">Verified</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 flex-wrap">
                                <span>{SESSIONS[cls.session] || cls.session}</span>
                                <span>&bull;</span>
                                <span><Users className="w-2.5 h-2.5 inline" /> {cls.enrollments.length}/{cls.maxStudents}</span>
                                {cls.teacher.yearsExperience > 0 && <><span>&bull;</span><span>{cls.teacher.yearsExperience}yr exp</span></>}
                              </div>
                              {multi && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Award className="w-2.5 h-2.5 text-purple-500" />
                                  <span className="text-[9px] text-purple-600 font-medium">Also teaches: {otherSubjects.join(", ")}</span>
                                </div>
                              )}
                              {cls.schedules.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {cls.schedules.sort((a:any,b:any) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek)).map((s:any) => (
                                    <span key={s.id} className="text-[8px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{DAY_SHORT[DAYS.indexOf(s.dayOfWeek)]} {s.startTime}</span>
                                  ))}
                                </div>
                              )}
                              {cls.requirements.length > 0 && (
                                <div className="flex items-center gap-1 mt-1"><Package className="w-2.5 h-2.5 text-amber-500" /><span className="text-[9px] text-amber-600">{cls.requirements.length} items needed</span></div>
                              )}
                              {cls.teacher.bio && <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{cls.teacher.bio}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5 flex-shrink-0">
                              {enrolled ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Enrolled</span>
                              ) : full ? (
                                <span className="text-[10px] bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg">Full</span>
                              ) : alreadyEnrolledOther ? (
                                <span className="text-[10px] bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg italic">Other selected</span>
                              ) : (
                                <>
                                  <button onClick={() => handleEnroll(cls.id)} disabled={!!loading} className="text-[10px] bg-brand-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1">
                                    {loading === cls.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enroll"}
                                  </button>
                                  {item.classes.length > 1 && (
                                    <button onClick={() => setSelectedForBulk(p => ({...p, [item.subject.id]: cls.id}))}
                                      className={"text-[9px] px-2 py-1 rounded-lg border " + (isSel ? "border-brand-400 bg-brand-50 text-brand-600" : "border-gray-300 text-gray-500 hover:border-brand-300")}>
                                      {isSel ? "\u2605 Preferred" : "Prefer for bulk"}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="mt-2"><div className="h-1 bg-gray-200 rounded-full overflow-hidden"><div className={"h-full rounded-full " + (cls.enrollments.length/cls.maxStudents > 0.8 ? "bg-red-400" : "bg-brand-400")} style={{ width: Math.min(100, cls.enrollments.length/cls.maxStudents*100) + "%" }} /></div></div>
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

      {/* Info */}
      <div className="card bg-brand-50 border-brand-200">
        <div className="flex items-start gap-3">
          <GraduationCap className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-brand-800 mb-1">How It Works</h4>
            <div className="text-[10px] text-brand-600 space-y-0.5">
              <p><strong>Required</strong> subjects are part of your curriculum. <strong>Elective</strong> subjects are optional.</p>
              <p>Click a subject to see all teachers. Choose one per subject, or <strong>Enroll All</strong> to pick the top-rated teacher for each.</p>
              <p>Teachers with a purple <Award className="w-2.5 h-2.5 inline text-purple-500" /> badge teach multiple subjects in your grade.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
