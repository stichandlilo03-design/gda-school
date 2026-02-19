"use client";

import { useState } from "react";
import { approveSession, rejectSession, adjustSessionHours, bulkApproveSessions } from "@/lib/actions/session-tracking";
import { useRouter } from "next/navigation";
import {
  CheckCircle, XCircle, Clock, Loader2, Timer, AlertTriangle, Edit, ChevronDown, ChevronUp,
  Play, Square, Check, X
} from "lucide-react";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  SCHEDULED: { bg: "bg-gray-100", text: "text-gray-600", label: "Scheduled" },
  LIVE: { bg: "bg-red-100", text: "text-red-700", label: "LIVE" },
  ENDED: { bg: "bg-blue-100", text: "text-blue-700", label: "Ended" },
  PENDING_REVIEW: { bg: "bg-amber-100", text: "text-amber-700", label: "Needs Review" },
  APPROVED: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Approved" },
  REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
};

export default function SessionReview({ teachers, currency }: { teachers: any[]; currency: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustHours, setAdjustHours] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [filter, setFilter] = useState<string>("PENDING_REVIEW");
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);

  // Collect all sessions
  const allSessions = teachers.flatMap((t: any) =>
    (t.sessions || []).map((s: any) => ({ ...s, teacherName: t.teacher.user.name, teacherId: t.teacher.id }))
  );

  const filtered = filter === "ALL" ? allSessions : allSessions.filter((s: any) => s.status === filter);
  const pendingCount = allSessions.filter((s: any) => s.status === "PENDING_REVIEW").length;
  const liveCount = allSessions.filter((s: any) => s.status === "LIVE").length;
  const pendingIds = allSessions.filter((s: any) => s.status === "PENDING_REVIEW").map((s: any) => s.id);

  const handleApprove = async (id: string) => {
    setLoading("a-" + id); await approveSession(id); router.refresh(); setLoading("");
  };

  const handleReject = async (id: string) => {
    if (!rejectReason) return;
    setLoading("r-" + id); await rejectSession(id, rejectReason); setRejectId(null); setRejectReason(""); router.refresh(); setLoading("");
  };

  const handleAdjust = async (id: string) => {
    if (!adjustReason || adjustHours <= 0) return;
    setLoading("adj-" + id); await adjustSessionHours(id, adjustHours, adjustReason); setAdjustId(null); router.refresh(); setLoading("");
  };

  const handleBulkApprove = async () => {
    if (!confirm(`Approve all ${pendingIds.length} pending sessions?`)) return;
    setLoading("bulk"); await bulkApproveSessions(pendingIds); router.refresh(); setLoading("");
  };

  const formatDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-4">
      {/* Alert bar */}
      {(pendingCount > 0 || liveCount > 0) && (
        <div className="flex items-center gap-3 flex-wrap">
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-800 font-medium">{pendingCount} session{pendingCount > 1 ? "s" : ""} awaiting your review</span>
              <button onClick={handleBulkApprove} disabled={loading === "bulk"} className="text-xs px-3 py-1 rounded-lg bg-emerald-600 text-white font-medium ml-2">
                {loading === "bulk" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve All"}
              </button>
            </div>
          )}
          {liveCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-800 font-medium">{liveCount} live session{liveCount > 1 ? "s" : ""} right now</span>
            </div>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { key: "PENDING_REVIEW", label: `Needs Review (${allSessions.filter((s: any) => s.status === "PENDING_REVIEW").length})` },
          { key: "LIVE", label: `Live (${liveCount})` },
          { key: "APPROVED", label: `Approved (${allSessions.filter((s: any) => s.status === "APPROVED").length})` },
          { key: "REJECTED", label: `Rejected (${allSessions.filter((s: any) => s.status === "REJECTED").length})` },
          { key: "ALL", label: `All (${allSessions.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium ${filter === t.key ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Sessions */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12"><Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">No sessions in this category.</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s: any) => {
            const st = STATUS_COLORS[s.status] || STATUS_COLORS.SCHEDULED;
            return (
              <div key={s.id} className={`card border-l-4 ${s.status === "PENDING_REVIEW" ? "border-l-amber-500" : s.status === "LIVE" ? "border-l-red-500" : s.status === "APPROVED" ? "border-l-emerald-500" : s.status === "REJECTED" ? "border-l-red-300" : "border-l-gray-300"}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-gray-800">{s.teacherName}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${st.bg} ${st.text}`}>{st.label}</span>
                      {s.status === "LIVE" && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                    </div>
                    <p className="text-xs text-gray-500">{new Date(s.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                    {s.topic && <p className="text-xs text-gray-600 mt-0.5">Topic: {s.topic}</p>}

                    {/* Real timestamps */}
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500 flex-wrap">
                      {s.startedAt && (
                        <span className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded">
                          <Play className="w-3 h-3 text-green-600" />
                          Started: {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      )}
                      {s.endedAt && (
                        <span className="flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded">
                          <Square className="w-3 h-3 text-red-600" />
                          Ended: {new Date(s.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      )}
                      {s.startedAt && s.endedAt && (
                        <span className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded font-bold">
                          <Timer className="w-3 h-3 text-blue-600" />
                          Duration: {formatDuration(s.startedAt, s.endedAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 text-xs">
                      <span className="text-gray-600">Hours: <strong>{s.hoursWorked}h</strong></span>
                      <span className="text-gray-600">Rate: {currency}{Math.round(s.dailyRate).toLocaleString()}/day</span>
                      <span className="font-bold text-emerald-700">{currency}{Math.round(s.amountEarned).toLocaleString()}</span>
                    </div>

                    {s.reviewNote && (
                      <p className="text-[10px] mt-1 px-2 py-1 bg-gray-50 rounded italic text-gray-500">
                        Review: {s.reviewNote} {s.verifiedBy && `— ${s.verifiedBy}`}
                      </p>
                    )}
                    {s.notes && <p className="text-[10px] mt-1 text-gray-400">Notes: {s.notes}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {s.status === "PENDING_REVIEW" && (
                      <>
                        <button onClick={() => handleApprove(s.id)} disabled={loading === "a-" + s.id}
                          className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium flex items-center gap-1">
                          {loading === "a-" + s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3" /> Approve</>}
                        </button>
                        <button onClick={() => setAdjustId(adjustId === s.id ? null : s.id)}
                          className="text-[10px] px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="Adjust hours">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button onClick={() => setRejectId(rejectId === s.id ? null : s.id)}
                          className="text-[10px] px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50">
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    {s.status === "APPROVED" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    {s.status === "REJECTED" && <XCircle className="w-5 h-5 text-red-400" />}
                  </div>
                </div>

                {/* Reject form */}
                {rejectId === s.id && (
                  <div className="mt-3 pt-3 border-t p-3 bg-red-50 rounded-lg space-y-2">
                    <input className="input-field text-xs" placeholder="Reason for rejection *" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => handleReject(s.id)} disabled={loading === "r-" + s.id || !rejectReason}
                        className="text-xs px-4 py-1.5 rounded-lg bg-red-600 text-white font-medium">{loading === "r-" + s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reject"}</button>
                      <button onClick={() => { setRejectId(null); setRejectReason(""); }} className="btn-ghost text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Adjust hours form */}
                {adjustId === s.id && (
                  <div className="mt-3 pt-3 border-t p-3 bg-blue-50 rounded-lg space-y-2">
                    <p className="text-[10px] text-blue-700">Teacher reported {s.hoursWorked}h. Adjust if needed:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-gray-500">Actual Hours</label>
                        <input type="number" step="0.25" min="0" max="8" className="input-field text-xs" value={adjustHours} onChange={(e) => setAdjustHours(parseFloat(e.target.value) || 0)} /></div>
                      <div><label className="text-[10px] text-gray-500">Reason *</label>
                        <input className="input-field text-xs" placeholder="Why adjusting?" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} /></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAdjust(s.id)} disabled={loading === "adj-" + s.id || !adjustReason || adjustHours <= 0}
                        className="text-xs px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium">{loading === "adj-" + s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Adjust & Approve"}</button>
                      <button onClick={() => { setAdjustId(null); setAdjustHours(0); setAdjustReason(""); }} className="btn-ghost text-xs">Cancel</button>
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
