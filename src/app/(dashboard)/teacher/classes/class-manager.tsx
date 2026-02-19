"use client";

import { useState } from "react";
import { createClass, deleteClass } from "@/lib/actions/teacher";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Users, Clock, Loader2, BookOpen } from "lucide-react";

const SESSIONS = [
  { value: "SESSION_A", label: "Morning (06:00–10:00 UTC)" },
  { value: "SESSION_B", label: "Afternoon (14:00–18:00 UTC)" },
  { value: "SESSION_C", label: "Evening (22:00–02:00 UTC)" },
];

export default function ClassManager({ classes, availableGrades }: { classes: any[]; availableGrades: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [showForm, setShowForm] = useState(false);
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
    if (!confirm("Deactivate this class?")) return;
    setLoading(classId);
    await deleteClass(classId);
    router.refresh();
    setLoading("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{classes.filter((c: any) => c.isActive).length} active class(es)</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus className="w-4 h-4 mr-1" /> Create Class
        </button>
      </div>

      {showForm && (
        <div className="card bg-emerald-50 border-emerald-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-4">Create New Class</h4>
          {availableGrades.length === 0 ? (
            <p className="text-sm text-amber-600">You need to be added to a school first. Ask a Principal to add you by your email.</p>
          ) : (
            <div className="space-y-3">
              <input className="input-field" placeholder="Class name (e.g. Mathematics - G7 Morning)" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <textarea className="input-field" rows={2} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              <div className="grid grid-cols-3 gap-3">
                <select className="input-field" value={form.schoolGradeId} onChange={(e) => setForm((p) => ({ ...p, schoolGradeId: e.target.value }))}>
                  <option value="">Select Grade</option>
                  {availableGrades.map((g: any) => <option key={g.id} value={g.id}>{g.gradeLevel}</option>)}
                </select>
                <select className="input-field" value={form.session} onChange={(e) => setForm((p) => ({ ...p, session: e.target.value }))}>
                  {SESSIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <input type="number" className="input-field" placeholder="Max students" min={5} max={100} value={form.maxStudents} onChange={(e) => setForm((p) => ({ ...p, maxStudents: parseInt(e.target.value) || 40 }))} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={loading === "create"} className="btn-primary text-sm px-6">
                  {loading === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Class"}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {classes.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No classes yet. Create your first class above.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {classes.map((cls: any) => (
            <div key={cls.id} className={`card ${!cls.isActive ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-800">{cls.name}</h4>
                <div className="flex items-center gap-2">
                  <span className={cls.isActive ? "badge-success" : "badge-danger"}>{cls.isActive ? "Active" : "Inactive"}</span>
                  {cls.isActive && (
                    <button onClick={() => handleDelete(cls.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {cls.description && <p className="text-xs text-gray-500 mb-3">{cls.description}</p>}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {cls.enrollments.length}/{cls.maxStudents}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {cls.session.replace("SESSION_", "Session ")}</span>
                <span className="badge-info text-[10px]">{cls.schoolGrade.gradeLevel}</span>
              </div>
              {cls.enrollments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Enrolled Students:</p>
                  <div className="flex flex-wrap gap-1">
                    {cls.enrollments.slice(0, 8).map((e: any) => (
                      <span key={e.id} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{e.student.user.name}</span>
                    ))}
                    {cls.enrollments.length > 8 && <span className="text-[10px] text-gray-400">+{cls.enrollments.length - 8} more</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
