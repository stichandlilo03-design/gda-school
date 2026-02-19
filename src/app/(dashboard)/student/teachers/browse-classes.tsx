"use client";

import { useState } from "react";
import { requestEnrollment } from "@/lib/actions/enrollment";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, Users, Check, Clock, X, Send, Search, Filter } from "lucide-react";

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

  const filtered = classes.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.teacher.user.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (gradeFilter !== "all" && c.schoolGrade.gradeLevel !== gradeFilter) return false;
    if (showMyGrade && gradeFilter === "all" && c.schoolGrade.gradeLevel !== studentGrade) return false;
    return true;
  });

  const grades = [...new Set(classes.map((c) => c.schoolGrade.gradeLevel))].sort();

  const handleRequest = async (classId: string) => {
    setLoading(classId);
    const result = await requestEnrollment(classId, enrollMsg[classId]);
    if (result.error) setMessage("Error: " + result.error);
    else setMessage(result.message || "Request sent!");
    router.refresh();
    setLoading("");
  };

  if (!studentApproved) {
    return (
      <div className="card text-center py-12">
        <Clock className="w-12 h-12 text-amber-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-800 mb-2">Admission Pending</h3>
        <p className="text-sm text-gray-500">You need to be approved by the school principal before enrolling in classes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-3 text-sm flex items-center justify-between ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          <span>{message}</span>
          <button onClick={() => setMessage("")} className="opacity-60">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search by class or teacher name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field max-w-[180px]" value={gradeFilter} onChange={(e) => { setGradeFilter(e.target.value); if (e.target.value !== "all") setShowMyGrade(false); }}>
          <option value="all">All Grades</option>
          {grades.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
          <input type="checkbox" checked={showMyGrade && gradeFilter === "all"} onChange={(e) => { setShowMyGrade(e.target.checked); if (e.target.checked) setGradeFilter("all"); }} />
          My grade only ({studentGrade})
        </label>
      </div>

      <p className="text-xs text-gray-500">{filtered.length} class{filtered.length !== 1 ? "es" : ""} available</p>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No classes found. Try changing filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cls) => {
            const enrolled = enrolledClassIds.includes(cls.id);
            const pending = pendingRequestIds.includes(cls.id);
            const declined = declinedRequestIds.includes(cls.id);
            const isFull = cls._count.enrollments >= cls.maxStudents;
            const subjects = (cls.teacher.subjects as string[]) || [];

            return (
              <div key={cls.id} className={`card ${enrolled ? "border-emerald-300 bg-emerald-50/30" : pending ? "border-blue-200 bg-blue-50/30" : ""}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold ${enrolled ? "bg-emerald-200 text-emerald-700" : "bg-brand-100 text-brand-600"}`}>
                    {cls.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 truncate">{cls.name}</h4>
                    <p className="text-xs text-gray-500">by {cls.teacher.user.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">{cls.schoolGrade.gradeLevel}</span>
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">{cls.session.replace("SESSION_", "Session ")}</span>
                      <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {cls._count.enrollments}/{cls.maxStudents}</span>
                    </div>
                  </div>
                </div>

                {/* Teacher subjects */}
                {subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {subjects.slice(0, 4).map((s: string) => (
                      <span key={s} className="text-[9px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                    {subjects.length > 4 && <span className="text-[9px] text-gray-400">+{subjects.length - 4} more</span>}
                  </div>
                )}

                {cls.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{cls.description}</p>}

                {/* Status / Action */}
                {enrolled ? (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-100 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">Enrolled</span>
                  </div>
                ) : pending ? (
                  <div className="flex items-center gap-2 p-2.5 bg-blue-100 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700">Request Pending — waiting for teacher</span>
                  </div>
                ) : declined ? (
                  <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg">
                    <X className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-600">Request was declined</span>
                  </div>
                ) : isFull ? (
                  <div className="p-2.5 bg-gray-100 rounded-lg text-center">
                    <span className="text-xs text-gray-500 font-medium">Class is full</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      className="input-field text-xs"
                      placeholder="Optional message to teacher (e.g. why you want to join)"
                      value={enrollMsg[cls.id] || ""}
                      onChange={(e) => setEnrollMsg((p) => ({ ...p, [cls.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => handleRequest(cls.id)}
                      disabled={loading === cls.id}
                      className="btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-1.5"
                    >
                      {loading === cls.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3" /> Request to Enroll</>}
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
