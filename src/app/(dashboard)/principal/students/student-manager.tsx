"use client";

import { useState } from "react";
import { approveStudent, rejectStudent, suspendStudent, reinstateStudent } from "@/lib/actions/school";
import { scheduleStudentInterview } from "@/lib/actions/interview";
import { useRouter } from "next/navigation";
import { GraduationCap, Search, UserX, UserCheck, Loader2, Clock, XCircle, CheckCircle, Calendar, Star, Video } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", color: "bg-purple-100 text-purple-700" },
  INTERVIEWED: { label: "Interviewed", color: "bg-cyan-100 text-cyan-700" },
  APPROVED: { label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" },
};

export default function StudentManager({ pending, approved, rejected }: { pending: any[]; approved: any[]; rejected: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">(pending.length > 0 ? "pending" : "approved");
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ scheduledAt: "", duration: 30, meetingLink: "", meetingNotes: "" });

  const currentList = tab === "pending" ? pending : tab === "approved" ? approved : rejected;
  const filtered = currentList.filter((s: any) => {
    const matchSearch = !search || s.user.name.toLowerCase().includes(search.toLowerCase()) || s.user.email.toLowerCase().includes(search.toLowerCase());
    const matchGrade = !filterGrade || s.gradeLevel === filterGrade;
    return matchSearch && matchGrade;
  });

  const allGrades = [...new Set([...pending, ...approved, ...rejected].map((s: any) => s.gradeLevel))].sort();

  const handleApprove = async (id: string) => { setLoading(id); await approveStudent(id); router.refresh(); setLoading(""); };
  const handleReject = async (id: string) => { if (!confirm("Reject?")) return; setLoading(id); await rejectStudent(id); router.refresh(); setLoading(""); };
  const handleSuspend = async (id: string) => { if (!confirm("Suspend?")) return; setLoading(id); await suspendStudent(id); router.refresh(); setLoading(""); };
  const handleReinstate = async (id: string) => { setLoading(id); await reinstateStudent(id); router.refresh(); setLoading(""); };

  const handleScheduleInterview = async (studentId: string) => {
    if (!scheduleForm.scheduledAt) { alert("Set date/time"); return; }
    setLoading(studentId);
    await scheduleStudentInterview({ studentId, ...scheduleForm });
    router.refresh();
    setScheduleFor(null);
    setLoading("");
  };

  const handleBulkApprove = async () => {
    if (!confirm(`Approve all ${pending.filter(s => s.approvalStatus !== "INTERVIEW_SCHEDULED").length} eligible students?`)) return;
    setLoading("bulk");
    for (const s of pending.filter(s => s.approvalStatus === "INTERVIEWED" || s.approvalStatus === "PENDING")) {
      await approveStudent(s.id);
    }
    router.refresh();
    setLoading("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {[
            { key: "pending", label: `Pending (${pending.length})`, extra: pending.length > 0 ? "bg-amber-100 text-amber-700" : "" },
            { key: "approved", label: `Approved (${approved.length})` },
            { key: "rejected", label: `Rejected (${rejected.length})` },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`text-xs px-4 py-2 rounded-lg font-medium ${tab === t.key ? "bg-brand-600 text-white" : t.extra || "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === "pending" && pending.length > 0 && (
          <button onClick={handleBulkApprove} disabled={loading === "bulk"} className="btn-primary text-xs px-4">
            {loading === "bulk" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
            Approve Eligible
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" className="flex-1 py-2.5 text-sm outline-none" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-40" value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
          <option value="">All Grades</option>
          {allGrades.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12"><GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No students to show.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s: any) => {
            const statusInfo = STATUS_LABELS[s.approvalStatus] || STATUS_LABELS.PENDING;
            const lastInterview = s.interviews?.[0];
            return (
              <div key={s.id} className="card">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                    {s.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-gray-800">{s.user.name}</h4>
                      <span className="badge-info text-[10px]">{s.gradeLevel}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">{s.user.email}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 flex-wrap">
                      {s.parentName && <span>Parent: {s.parentName}</span>}
                      <span>{s.preferredSession.replace("SESSION_", "Session ")}</span>
                      <span>Applied: {new Date(s.enrolledAt).toLocaleDateString()}</span>
                      {lastInterview && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Interview: {new Date(lastInterview.scheduledAt).toLocaleDateString()}
                          {lastInterview.result && <span className={`ml-1 px-1 py-0.5 rounded text-[9px] font-bold ${lastInterview.result === "PASS" ? "bg-emerald-100 text-emerald-700" : lastInterview.result === "FAIL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{lastInterview.result}</span>}
                          {lastInterview.scoreOverall && <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />{lastInterview.scoreOverall}/100</span>}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {tab === "pending" && (
                      <>
                        {(s.approvalStatus === "PENDING" || s.approvalStatus === "INTERVIEWED") && (
                          <>
                            <button onClick={() => setScheduleFor(scheduleFor === s.id ? null : s.id)}
                              className="text-[10px] px-2 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Interview
                            </button>
                            <button onClick={() => handleApprove(s.id)} disabled={loading === s.id}
                              className="text-[10px] px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium flex items-center gap-1">
                              {loading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3" /> Approve</>}
                            </button>
                            <button onClick={() => handleReject(s.id)}
                              className="text-[10px] px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        {s.approvalStatus === "INTERVIEW_SCHEDULED" && (
                          <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-1.5 rounded-lg font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Awaiting Interview
                          </span>
                        )}
                      </>
                    )}
                    {tab === "approved" && (
                      s.user.isActive ? (
                        <button onClick={() => handleSuspend(s.id)} className="text-[10px] px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 flex items-center gap-1">
                          <UserX className="w-3 h-3" /> Suspend
                        </button>
                      ) : (
                        <button onClick={() => handleReinstate(s.id)} className="text-[10px] px-2 py-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Reinstate
                        </button>
                      )
                    )}
                    {tab === "rejected" && (
                      <button onClick={() => handleApprove(s.id)} className="text-[10px] px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                    )}
                  </div>
                </div>

                {/* Schedule interview form */}
                {scheduleFor === s.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 p-3 bg-purple-50 rounded-lg space-y-3">
                    <h5 className="text-xs font-semibold text-purple-800">Schedule Admission Interview</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-500">Date & Time *</label>
                        <input type="datetime-local" className="input-field text-xs" value={scheduleForm.scheduledAt} onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledAt: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Duration (min)</label>
                        <input type="number" className="input-field text-xs" value={scheduleForm.duration} onChange={(e) => setScheduleForm((p) => ({ ...p, duration: parseInt(e.target.value) || 30 }))} />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Meeting Link</label>
                        <input className="input-field text-xs" placeholder="Zoom/Meet link" value={scheduleForm.meetingLink} onChange={(e) => setScheduleForm((p) => ({ ...p, meetingLink: e.target.value }))} />
                      </div>
                    </div>
                    <textarea className="input-field text-xs" rows={2} placeholder="Notes for the interviewer..." value={scheduleForm.meetingNotes} onChange={(e) => setScheduleForm((p) => ({ ...p, meetingNotes: e.target.value }))} />
                    <div className="flex gap-2">
                      <button onClick={() => handleScheduleInterview(s.id)} disabled={loading === s.id} className="btn-primary text-xs px-4 py-1.5">
                        {loading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Schedule Interview"}
                      </button>
                      <button onClick={() => setScheduleFor(null)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
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
