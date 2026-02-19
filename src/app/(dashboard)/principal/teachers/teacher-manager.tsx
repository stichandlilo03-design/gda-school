"use client";

import { useState } from "react";
import { addTeacherToSchool, removeTeacherFromSchool, reinstateTeacher } from "@/lib/actions/school";
import { useRouter } from "next/navigation";
import { Plus, UserX, UserCheck, Loader2, Users, Star, BookOpen, Mail } from "lucide-react";

export default function TeacherManager({ teachers }: { teachers: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [email, setEmail] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [message, setMessage] = useState("");

  const handleAdd = async () => {
    if (!email) return;
    setLoading("add");
    setMessage("");
    const result = await addTeacherToSchool(email);
    if (result.error) setMessage(result.error);
    else { router.refresh(); setEmail(""); setShowAdd(false); setMessage("Teacher added successfully!"); }
    setLoading("");
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this teacher from your school?")) return;
    setLoading(id);
    await removeTeacherFromSchool(id);
    router.refresh();
    setLoading("");
  };

  const handleReinstate = async (id: string) => {
    setLoading(id);
    await reinstateTeacher(id);
    router.refresh();
    setLoading("");
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.includes("Error") || message.includes("not found") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{teachers.length} teacher(s) in your school</p>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm">
          <Plus className="w-4 h-4 mr-1" /> Add Teacher
        </button>
      </div>

      {showAdd && (
        <div className="card bg-blue-50 border-blue-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Add Teacher by Email</h4>
          <p className="text-xs text-gray-500 mb-3">The teacher must have already registered on the platform.</p>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <input type="email" className="flex-1 py-2.5 text-sm outline-none" placeholder="teacher@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            </div>
            <button onClick={handleAdd} disabled={loading === "add"} className="btn-primary px-6">
              {loading === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {teachers.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No teachers yet. Add teachers by their registered email.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teachers.map((st: any) => (
            <div key={st.id} className={`card ${!st.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  {st.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-800">{st.teacher.user.name}</h4>
                    <span className={st.isActive ? "badge-success" : "badge-danger"}>{st.isActive ? "Active" : "Removed"}</span>
                  </div>
                  <p className="text-xs text-gray-500">{st.teacher.user.email}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="w-3 h-3" /> {st.teacher.rating > 0 ? st.teacher.rating.toFixed(1) : "New"}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <BookOpen className="w-3 h-3" /> {st.teacher.classes.length} classes
                    </span>
                    <span className="text-xs text-gray-500">
                      {st.teacher.classes.reduce((a: number, c: any) => a + c.enrollments.length, 0)} students
                    </span>
                    <span className="text-xs text-gray-400">
                      Hired: {new Date(st.hiredAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div>
                  {st.isActive ? (
                    <button onClick={() => handleRemove(st.id)} disabled={loading === st.id} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50">
                      {loading === st.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><UserX className="w-3.5 h-3.5" /> Remove</>}
                    </button>
                  ) : (
                    <button onClick={() => handleReinstate(st.id)} disabled={loading === st.id} className="text-emerald-500 hover:text-emerald-700 text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-emerald-50">
                      {loading === st.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><UserCheck className="w-3.5 h-3.5" /> Reinstate</>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
