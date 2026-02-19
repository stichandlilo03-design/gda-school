"use client";

import { useState } from "react";
import { inviteTeacherToSchool, approveTeacher, rejectTeacher, removeTeacherFromSchool, reinstateTeacher } from "@/lib/actions/school";
import { scheduleTeacherInterview } from "@/lib/actions/interview";
import { useRouter } from "next/navigation";
import { Plus, UserX, UserCheck, Loader2, Users, Star, BookOpen, Mail, Clock, XCircle, CheckCircle, Calendar } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", color: "bg-purple-100 text-purple-700" },
  INTERVIEWED: { label: "Interviewed", color: "bg-cyan-100 text-cyan-700" },
  APPROVED: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" },
};

export default function TeacherManager({ pending, approved, rejected }: { pending: any[]; approved: any[]; rejected: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [email, setEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">(pending.length > 0 ? "pending" : "approved");
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ scheduledAt: "", duration: 30, meetingLink: "", meetingNotes: "" });

  const handleInvite = async () => {
    if (!email) return; setLoading("invite"); setMessage("");
    const result = await inviteTeacherToSchool(email);
    if (result.error) setMessage("Error: " + result.error);
    else { router.refresh(); setEmail(""); setShowInvite(false); setMessage(result.message || "Done!"); }
    setLoading("");
  };

  const handleApprove = async (id: string) => { setLoading(id); await approveTeacher(id); router.refresh(); setLoading(""); };
  const handleReject = async (id: string) => { if (!confirm("Reject?")) return; setLoading(id); await rejectTeacher(id); router.refresh(); setLoading(""); };
  const handleRemove = async (id: string) => { if (!confirm("Remove?")) return; setLoading(id); await removeTeacherFromSchool(id); router.refresh(); setLoading(""); };
  const handleReinstate = async (id: string) => { setLoading(id); await reinstateTeacher(id); router.refresh(); setLoading(""); };

  const handleScheduleInterview = async (stId: string) => {
    if (!scheduleForm.scheduledAt) { alert("Set date/time"); return; }
    setLoading(stId);
    await scheduleTeacherInterview({ schoolTeacherId: stId, ...scheduleForm });
    router.refresh(); setScheduleFor(null); setLoading("");
  };

  const TeacherCard = ({ st, actions }: { st: any; actions: React.ReactNode }) => {
    const statusInfo = STATUS_LABELS[st.status] || STATUS_LABELS.PENDING;
    const lastInterview = st.interviews?.[0];
    return (
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
            {st.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-gray-800">{st.teacher.user.name}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
              {st.requestedBy === "TEACHER" && st.status === "PENDING" && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Requested</span>}
            </div>
            <p className="text-xs text-gray-500">{st.teacher.user.email}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 flex-wrap">
              <span>{st.teacher.yearsExperience} yrs exp</span>
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {st.teacher.classes.length} classes</span>
              {st.teacher.teachingStyle && <span>{st.teacher.teachingStyle}</span>}
              {lastInterview && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Interview: {new Date(lastInterview.scheduledAt).toLocaleDateString()}
                  {lastInterview.result && <span className={`ml-1 px-1 py-0.5 rounded text-[9px] font-bold ${lastInterview.result === "PASS" ? "bg-emerald-100 text-emerald-700" : lastInterview.result === "FAIL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{lastInterview.result}</span>}
                  {lastInterview.scoreOverall != null && <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />{lastInterview.scoreOverall}/100</span>}
                </span>
              )}
            </div>
            {st.teacher.bio && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{st.teacher.bio}</p>}
          </div>
          <div className="flex items-center gap-1 flex-wrap">{actions}</div>
        </div>

        {scheduleFor === st.id && (
          <div className="mt-3 pt-3 border-t border-gray-100 p-3 bg-purple-50 rounded-lg space-y-3">
            <h5 className="text-xs font-semibold text-purple-800">Schedule Hiring Interview</h5>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-[10px] text-gray-500">Date & Time *</label>
                <input type="datetime-local" className="input-field text-xs" value={scheduleForm.scheduledAt} onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledAt: e.target.value }))} /></div>
              <div><label className="text-[10px] text-gray-500">Duration (min)</label>
                <input type="number" className="input-field text-xs" value={scheduleForm.duration} onChange={(e) => setScheduleForm((p) => ({ ...p, duration: parseInt(e.target.value) || 30 }))} /></div>
              <div><label className="text-[10px] text-gray-500">Meeting Link</label>
                <input className="input-field text-xs" placeholder="Zoom/Meet" value={scheduleForm.meetingLink} onChange={(e) => setScheduleForm((p) => ({ ...p, meetingLink: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleScheduleInterview(st.id)} disabled={loading === st.id} className="btn-primary text-xs px-4 py-1.5">
                {loading === st.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Schedule"}
              </button>
              <button onClick={() => setScheduleFor(null)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {message && <div className={`rounded-lg p-3 text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</div>}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { key: "pending", label: `Pending (${pending.length})`, extra: pending.length > 0 ? "bg-amber-100 text-amber-700" : "" },
            { key: "approved", label: `Active (${approved.length})` },
            { key: "rejected", label: `Rejected (${rejected.length})` },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`text-xs px-4 py-2 rounded-lg font-medium ${tab === t.key ? "bg-brand-600 text-white" : t.extra || "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowInvite(!showInvite)} className="btn-primary text-sm"><Plus className="w-4 h-4 mr-1" /> Invite Teacher</button>
      </div>

      {showInvite && (
        <div className="card bg-blue-50 border-blue-200">
          <h4 className="text-sm font-semibold mb-3">Invite Teacher by Email (skips interview)</h4>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <input type="email" className="flex-1 py-2.5 text-sm outline-none" placeholder="teacher@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleInvite()} />
            </div>
            <button onClick={handleInvite} disabled={loading === "invite"} className="btn-primary px-6">{loading === "invite" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite & Add"}</button>
            <button onClick={() => setShowInvite(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Pending */}
      {tab === "pending" && (pending.length === 0 ? (
        <div className="card text-center py-12"><Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No pending requests.</p></div>
      ) : (
        <div className="space-y-3">{pending.map((st) => (
          <TeacherCard key={st.id} st={st} actions={
            <>
              {(st.status === "PENDING" || st.status === "INTERVIEWED") && (
                <>
                  <button onClick={() => setScheduleFor(scheduleFor === st.id ? null : st.id)}
                    className="text-[10px] px-2 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Interview
                  </button>
                  <button onClick={() => handleApprove(st.id)} disabled={loading === st.id}
                    className="text-[10px] px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium flex items-center gap-1">
                    {loading === st.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3" /> Approve</>}
                  </button>
                  <button onClick={() => handleReject(st.id)} className="text-[10px] px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </>
              )}
              {st.status === "INTERVIEW_SCHEDULED" && (
                <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-1.5 rounded-lg font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Awaiting</span>
              )}
            </>
          } />
        ))}</div>
      ))}

      {/* Approved */}
      {tab === "approved" && (approved.length === 0 ? (
        <div className="card text-center py-12"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No active teachers.</p></div>
      ) : (
        <div className="space-y-3">{approved.map((st) => (
          <TeacherCard key={st.id} st={st} actions={
            st.isActive ? (
              <button onClick={() => handleRemove(st.id)} className="text-[10px] px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 flex items-center gap-1"><UserX className="w-3 h-3" /> Remove</button>
            ) : (
              <button onClick={() => handleReinstate(st.id)} className="text-[10px] px-2 py-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Reinstate</button>
            )
          } />
        ))}</div>
      ))}

      {/* Rejected */}
      {tab === "rejected" && (rejected.length === 0 ? (
        <div className="card text-center py-12"><XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No rejected requests.</p></div>
      ) : (
        <div className="space-y-3">{rejected.map((st) => (
          <TeacherCard key={st.id} st={st} actions={
            <button onClick={() => handleApprove(st.id)} className="text-[10px] px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approve</button>
          } />
        ))}</div>
      ))}
    </div>
  );
}
