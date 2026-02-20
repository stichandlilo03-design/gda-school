"use client";

import { useState } from "react";
import { addTeacherToSchool, reinstateTeacher } from "@/lib/actions/school";
import { assignTeacherToClass, removeTeacherFromSchool } from "@/lib/actions/student-management";
import { useRouter } from "next/navigation";
import { Plus, UserX, UserCheck, Loader2, Users, Star, BookOpen, Mail, ChevronDown, ChevronUp, Briefcase, Search } from "lucide-react";
import { getGradeLabelForCountry } from "@/lib/education-systems";

export default function TeacherManager({ teachers, grades = [], countryCode = "NG" }: { teachers: any[]; grades?: any[]; countryCode?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [email, setEmail] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [removeReason, setRemoveReason] = useState("");
  const [assignGrade, setAssignGrade] = useState("");
  const [assignSubject, setAssignSubject] = useState("");

  const filtered = teachers.filter((st: any) => {
    if (!search) return true;
    const n = st.teacher?.user?.name?.toLowerCase() || "";
    const e = st.teacher?.user?.email?.toLowerCase() || "";
    return n.includes(search.toLowerCase()) || e.includes(search.toLowerCase());
  });

  const handleAdd = async () => {
    if (!email) return;
    setLoading("add"); setMessage("");
    const result = await addTeacherToSchool(email);
    if (result.error) setMessage(result.error);
    else { router.refresh(); setEmail(""); setShowAdd(false); setMessage("Teacher added!"); }
    setLoading("");
  };

  const handleRemove = async (id: string) => {
    const reason = removeReason || prompt("Reason for removal:") || "";
    setLoading(id);
    await removeTeacherFromSchool(id, reason);
    router.refresh(); setLoading(""); setRemoveReason("");
  };

  const handleReinstate = async (id: string) => {
    setLoading(id); await reinstateTeacher(id); router.refresh(); setLoading("");
  };

  const handleAssignClass = async (teacherId: string) => {
    if (!assignGrade || !assignSubject) { alert("Select grade and subject"); return; }
    setLoading("assign");
    const result = await assignTeacherToClass(teacherId, assignGrade, assignSubject);
    if (result.error) setMessage(result.error);
    else { setMessage("Class assigned! Teacher & students notified."); setAssignGrade(""); setAssignSubject(""); }
    router.refresh(); setLoading("");
  };

  const selectedGradeObj = grades.find((g: any) => g.id === assignGrade);
  const availableSubjects = selectedGradeObj?.subjects || [];
  const activeCount = teachers.filter((t: any) => t.isActive).length;
  const totalClasses = teachers.reduce((s: number, t: any) => s + (t.teacher?.classes?.length || 0), 0);
  const totalStudents = teachers.reduce((s: number, t: any) => s + (t.teacher?.classes?.reduce((a: number, c: any) => a + (c.enrollments?.length || 0), 0) || 0), 0);

  return (
    <div className="space-y-4">
      {message && <div className={`rounded-lg p-3 text-sm ${message.includes("Error") || message.includes("not found") || message.includes("already") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</div>}

      <div className="grid grid-cols-4 gap-3">
        <div className="card text-center py-3"><p className="text-2xl font-bold text-brand-700">{teachers.length}</p><p className="text-[10px] text-gray-500">Total</p></div>
        <div className="card text-center py-3"><p className="text-2xl font-bold text-emerald-600">{activeCount}</p><p className="text-[10px] text-gray-500">Active</p></div>
        <div className="card text-center py-3"><p className="text-2xl font-bold text-blue-600">{totalClasses}</p><p className="text-[10px] text-gray-500">Classes</p></div>
        <div className="card text-center py-3"><p className="text-2xl font-bold text-purple-600">{totalStudents}</p><p className="text-[10px] text-gray-500">Students</p></div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search teachers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm"><Plus className="w-4 h-4 mr-1" /> Add Teacher</button>
      </div>

      {showAdd && (
        <div className="card bg-blue-50 border-blue-200">
          <h4 className="text-sm font-semibold mb-2">Add Teacher by Email</h4>
          <p className="text-xs text-gray-500 mb-3">Teacher must be registered on the platform first.</p>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border px-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <input type="email" className="flex-1 py-2.5 text-sm outline-none" placeholder="teacher@example.com" value={email}
                onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} />
            </div>
            <button onClick={handleAdd} disabled={loading === "add"} className="btn-primary px-6">
              {loading === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card text-center py-12"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{search ? "No match" : "No teachers yet"}</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((st: any) => {
            const t = st.teacher; const isExp = expanded === st.id;
            return (
              <div key={st.id} className={`card ${!st.isActive ? "opacity-60 border-red-200" : ""}`}>
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExp ? null : st.id)}>
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {t.user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-gray-800">{t.user.name}</h4>
                      <span className={st.isActive ? "badge-success" : "badge-danger"}>{st.isActive ? "Active" : "Removed"}</span>
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {t.rating > 0 ? t.rating.toFixed(1) : "New"}
                        {t.totalRatings > 0 && <span className="text-gray-400">({t.totalRatings})</span>}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500">{t.user.email}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[10px] text-gray-500"><BookOpen className="w-3 h-3 inline mr-0.5" />{t.classes?.length || 0} classes</span>
                      <span className="text-[10px] text-gray-500">{t.classes?.reduce((a: number, c: any) => a + (c.enrollments?.length || 0), 0) || 0} students</span>
                    </div>
                  </div>
                  {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {isExp && (
                  <div className="mt-3 pt-3 border-t space-y-4">
                    {/* Current Classes */}
                    <div>
                      <h5 className="text-xs font-bold text-gray-700 mb-2">Current Classes</h5>
                      {t.classes?.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {t.classes.map((cls: any) => (
                            <div key={cls.id} className="bg-gray-50 p-2 rounded-lg">
                              <p className="text-xs font-medium">{cls.subject?.name || cls.name}</p>
                              <p className="text-[10px] text-gray-500">
                                {getGradeLabelForCountry(cls.schoolGrade?.gradeLevel || "", countryCode)} • {cls.enrollments?.length || 0} students
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-400">No classes yet</p>}
                    </div>

                    {/* Assign New Class */}
                    {st.isActive && grades.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                        <h5 className="text-xs font-bold text-blue-800 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Assign New Class</h5>
                        <div className="flex gap-2 flex-wrap">
                          <select className="input-field text-xs flex-1 min-w-[120px]" value={assignGrade} onChange={e => { setAssignGrade(e.target.value); setAssignSubject(""); }}>
                            <option value="">Grade...</option>
                            {grades.map((g: any) => <option key={g.id} value={g.id}>{getGradeLabelForCountry(g.gradeLevel, countryCode)}</option>)}
                          </select>
                          <select className="input-field text-xs flex-1 min-w-[120px]" value={assignSubject} onChange={e => setAssignSubject(e.target.value)} disabled={!assignGrade}>
                            <option value="">{assignGrade ? "Subject..." : "Pick grade"}</option>
                            {availableSubjects.map((gs: any) => <option key={gs.subject.id} value={gs.subject.id}>{gs.subject.name}</option>)}
                          </select>
                          <button onClick={() => handleAssignClass(t.id)} disabled={!assignGrade || !assignSubject || loading === "assign"} className="btn-primary text-xs px-4">
                            {loading === "assign" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Assign"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Remove/Reinstate */}
                    <div className="flex gap-2 flex-wrap">
                      {st.isActive ? (
                        <>
                          <input className="input-field text-xs flex-1" placeholder="Removal reason..." value={removeReason} onChange={e => setRemoveReason(e.target.value)} />
                          <button onClick={() => handleRemove(st.id)} disabled={!!loading} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 flex items-center gap-1">
                            <UserX className="w-3 h-3" /> Remove
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleReinstate(st.id)} disabled={!!loading} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Reinstate
                        </button>
                      )}
                    </div>
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
