"use client";

import { useState } from "react";
import { createClass, deleteClass } from "@/lib/actions/teacher";
import { addClassRequirement, deleteClassRequirement } from "@/lib/actions/class-requirements";
import { useRouter } from "next/navigation";
import { to12h } from "@/lib/time-utils";
import {
  Plus, Trash2, Users, Clock, Loader2, BookOpen, ChevronDown, ChevronUp,
  Package, AlertCircle, CheckCircle, Settings, Calendar
} from "lucide-react";

const SESSIONS = [
  { value: "SESSION_A", label: "Morning (06:00–10:00)" },
  { value: "SESSION_B", label: "Afternoon (14:00–18:00)" },
  { value: "SESSION_C", label: "Evening (22:00–02:00)" },
];

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const REQ_CATEGORIES = [
  { value: "TEXTBOOK", label: "Textbook" },
  { value: "NOTEBOOK", label: "Notebook/Stationery" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "SOFTWARE", label: "Software/App" },
  { value: "UNIFORM", label: "Uniform/Attire" },
  { value: "GENERAL", label: "General" },
];

const CAT_ICONS: Record<string, string> = {
  TEXTBOOK: "📚", NOTEBOOK: "📓", EQUIPMENT: "🔧", SOFTWARE: "💻", UNIFORM: "👔", GENERAL: "📌",
};

export default function ClassManager({ classes, availableGrades }: { classes: any[]; availableGrades: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showReqForm, setShowReqForm] = useState<string | null>(null);
  const [reqForm, setReqForm] = useState({ item: "", description: "", category: "GENERAL", isRequired: true });
  const [form, setForm] = useState({ name: "", description: "", schoolGradeId: "", session: "SESSION_A", maxStudents: 40 });

  const handleCreate = async () => {
    if (!form.name || !form.schoolGradeId) { alert("Fill in class name and grade level"); return; }
    setLoading("create");
    const result = await createClass(form);
    if (result.error) alert(result.error);
    else { router.refresh(); setShowForm(false); setForm({ name: "", description: "", schoolGradeId: "", session: "SESSION_A", maxStudents: 40 }); }
    setLoading("");
  };

  const handleDelete = async (classId: string) => {
    if (!confirm("Deactivate this class? Students will lose access.")) return;
    setLoading(classId);
    await deleteClass(classId);
    router.refresh();
    setLoading("");
  };

  const handleAddReq = async (classId: string) => {
    if (!reqForm.item) { alert("Enter item name"); return; }
    setLoading("req-" + classId);
    await addClassRequirement({ classId, ...reqForm });
    setReqForm({ item: "", description: "", category: "GENERAL", isRequired: true });
    router.refresh();
    setLoading("");
  };

  const handleDeleteReq = async (id: string) => {
    setLoading("delreq-" + id);
    await deleteClassRequirement(id);
    router.refresh();
    setLoading("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{classes.filter((c: any) => c.isActive).length} active class(es)</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> Create Class
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card bg-emerald-50 border-emerald-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-4">Create New Class</h4>
          {availableGrades.length === 0 ? (
            <p className="text-sm text-amber-600">You need to be added to a school first. Ask a Principal to approve you.</p>
          ) : (
            <div className="space-y-3">
              <input className="input-field" placeholder="Class name (e.g. Mathematics - G7 Morning)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <textarea className="input-field" rows={2} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-3 gap-3">
                <select className="input-field" value={form.schoolGradeId} onChange={(e) => setForm({ ...form, schoolGradeId: e.target.value })}>
                  <option value="">Select Grade</option>
                  {availableGrades.map((g: any) => <option key={g.id} value={g.id}>{g.gradeLevel}</option>)}
                </select>
                <select className="input-field" value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })}>
                  {SESSIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <input type="number" className="input-field" placeholder="Max students" min={5} max={100} value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: parseInt(e.target.value) || 40 })} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={loading === "create"} className="btn-primary text-sm px-6 flex items-center gap-1">
                  {loading === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Class"}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Classes */}
      {classes.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No classes yet. Create your first class above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls: any) => {
            const isExp = expanded === cls.id;
            return (
              <div key={cls.id} className={`card ${!cls.isActive ? "opacity-50 border-dashed" : ""}`}>
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                    {cls.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-800 truncate">{cls.name}</h3>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{cls.schoolGrade.gradeLevel}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{cls.session.replace("SESSION_", "Session ")}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                      <span><Users className="w-3 h-3 inline" /> {cls.enrollments.length}/{cls.maxStudents}</span>
                      <span>{cls._count.materials} materials</span>
                      <span>{cls._count.assessments} assessments</span>
                      <span>{cls.requirements.length} requirements</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowReqForm(showReqForm === cls.id ? null : cls.id)}
                      className="text-[10px] px-2 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center gap-1">
                      <Package className="w-3 h-3" /> Requirements
                    </button>
                    {cls.isActive && (
                      <button onClick={() => handleDelete(cls.id)} disabled={loading === cls.id}
                        className="text-[10px] px-2 py-1.5 rounded-lg hover:bg-red-50 text-red-500">
                        {loading === cls.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </button>
                    )}
                    <button onClick={() => setExpanded(isExp ? null : cls.id)} className="text-gray-400 p-1">
                      {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {cls.description && <p className="text-[10px] text-gray-500 mt-2">{cls.description}</p>}

                {/* Requirements Form */}
                {showReqForm === cls.id && (
                  <div className="mt-3 pt-3 border-t p-3 bg-amber-50 rounded-lg space-y-3">
                    <h4 className="text-xs font-bold text-amber-800 flex items-center gap-2">
                      <Package className="w-4 h-4" /> Class Requirements & Equipment
                    </h4>
                    <p className="text-[10px] text-amber-600">Students will see these items when they enroll. Add textbooks, notebooks, software, etc.</p>

                    {/* Existing requirements */}
                    {cls.requirements.length > 0 && (
                      <div className="space-y-1">
                        {cls.requirements.map((r: any) => (
                          <div key={r.id} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                            <span className="text-sm">{CAT_ICONS[r.category] || "📌"}</span>
                            <div className="flex-1">
                              <span className="text-xs font-medium text-gray-800">{r.item}</span>
                              {r.description && <span className="text-[10px] text-gray-500 ml-1">— {r.description}</span>}
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${r.isRequired ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                              {r.isRequired ? "Required" : "Optional"}
                            </span>
                            <button onClick={() => handleDeleteReq(r.id)} disabled={loading === "delreq-" + r.id}
                              className="text-gray-400 hover:text-red-500">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new */}
                    <div className="grid grid-cols-4 gap-2">
                      <input className="input-field text-xs col-span-2" placeholder="Item name *" value={reqForm.item} onChange={(e) => setReqForm({ ...reqForm, item: e.target.value })} />
                      <select className="input-field text-xs" value={reqForm.category} onChange={(e) => setReqForm({ ...reqForm, category: e.target.value })}>
                        {REQ_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] flex items-center gap-1">
                          <input type="checkbox" checked={reqForm.isRequired} onChange={(e) => setReqForm({ ...reqForm, isRequired: e.target.checked })} className="rounded" />
                          Required
                        </label>
                      </div>
                    </div>
                    <input className="input-field text-xs" placeholder="Description (optional)" value={reqForm.description} onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })} />
                    <button onClick={() => handleAddReq(cls.id)} disabled={loading === "req-" + cls.id}
                      className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1">
                      {loading === "req-" + cls.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Add Requirement
                    </button>
                  </div>
                )}

                {/* Expanded: Students, Schedule, Requirements */}
                {isExp && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {/* Schedule */}
                    {cls.schedules.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Schedule</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cls.schedules.sort((a: any, b: any) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek)).map((s: any) => (
                            <span key={s.id} className="text-[10px] px-2 py-1 rounded-lg bg-brand-50 text-brand-700">
                              {DAY_SHORT[DAYS.indexOf(s.dayOfWeek)]} {to12h(s.startTime)}–{to12h(s.endTime)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Requirements summary */}
                    {cls.requirements.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">What Students Need</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cls.requirements.map((r: any) => (
                            <span key={r.id} className={`text-[10px] px-2 py-1 rounded-lg ${r.isRequired ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                              {CAT_ICONS[r.category] || "📌"} {r.item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Students */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Enrolled Students ({cls.enrollments.length})</p>
                      {cls.enrollments.length === 0 ? (
                        <p className="text-[10px] text-gray-400 italic">No students enrolled yet.</p>
                      ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5">
                          {cls.enrollments.map((e: any) => (
                            <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                              {e.student.user.image ? (
                                <img src={e.student.user.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[8px] font-bold">
                                  {e.student.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] text-gray-700 truncate block">{e.student.user.name}</span>
                                <span className="text-[8px] text-gray-400">{e.student.user.email}</span>
                              </div>
                            </div>
                          ))}
                        </div>
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
