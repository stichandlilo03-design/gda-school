"use client";

import { useState, useEffect, useRef } from "react";
import {
  approveStudent, rejectStudent, suspendStudent, unsuspendStudent,
  expelStudent, reinstateStudent, promoteStudent, changeStudentGrade,
  sendMessageToStudent, getStudentConversation, bulkApproveStudents,
} from "@/lib/actions/student-management";
import { scheduleStudentInterview } from "@/lib/actions/interview";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Search, UserX, UserCheck, Loader2, Clock, XCircle, CheckCircle,
  Calendar, Star, Send, MessageSquare, Phone, Mail, AlertTriangle, Ban, RefreshCw,
  ChevronDown, ChevronUp, X, BookOpen, Users, TrendingUp, ArrowUpCircle, Shield
} from "lucide-react";

const GRADES = [
  "K1", "K2", "K3", "G1", "G2", "G3", "G4", "G5", "G6",
  "G7", "G8", "G9", "G10", "G11", "G12", "UNDERGRADUATE", "POSTGRADUATE",
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  INTERVIEW_SCHEDULED: { label: "Interview Set", color: "bg-purple-100 text-purple-700" },
  INTERVIEWED: { label: "Interviewed", color: "bg-cyan-100 text-cyan-700" },
  APPROVED: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" },
};

export default function StudentManager({
  pending, active, suspended, expelled, rejected, grades, principalUserId,
}: {
  pending: any[]; active: any[]; suspended: any[]; expelled: any[]; rejected: any[];
  grades: string[]; principalUserId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [tab, setTab] = useState<string>(pending.length > 0 ? "pending" : "active");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Forms
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ scheduledAt: "", duration: 30, meetingLink: "", meetingNotes: "" });
  const [suspendFor, setSuspendFor] = useState<string | null>(null);
  const [suspendForm, setSuspendForm] = useState({ reason: "", untilDate: "" });
  const [expelFor, setExpelFor] = useState<string | null>(null);
  const [expelReason, setExpelReason] = useState("");
  const [promoteFor, setPromoteFor] = useState<string | null>(null);
  const [promoteGrade, setPromoteGrade] = useState("");
  const [promoteNote, setPromoteNote] = useState("");
  const [chatFor, setChatFor] = useState<string | null>(null);
  const [chatName, setChatName] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const currentList = tab === "pending" ? pending : tab === "active" ? active : tab === "suspended" ? suspended : tab === "expelled" ? expelled : rejected;

  const filtered = currentList.filter((s: any) => {
    const matchSearch = !search || s.user.name.toLowerCase().includes(search.toLowerCase()) || s.user.email.toLowerCase().includes(search.toLowerCase()) || (s.parentName || "").toLowerCase().includes(search.toLowerCase());
    const matchGrade = !filterGrade || s.gradeLevel === filterGrade;
    return matchSearch && matchGrade;
  });

  const allGrades = [...new Set([...pending, ...active, ...suspended, ...expelled, ...rejected].map((s: any) => s.gradeLevel))].sort();

  // Action handlers
  const handleApprove = async (id: string) => { setLoading(id); await approveStudent(id); router.refresh(); setLoading(""); };
  const handleReject = async (id: string) => { if (!confirm("Reject this student's application?")) return; setLoading(id); await rejectStudent(id); router.refresh(); setLoading(""); };

  const handleSuspend = async (id: string) => {
    if (!suspendForm.reason) { setMessage("Enter a suspension reason"); return; }
    setLoading("sus-" + id);
    await suspendStudent(id, suspendForm.reason, suspendForm.untilDate || undefined);
    setSuspendFor(null); setSuspendForm({ reason: "", untilDate: "" }); router.refresh(); setLoading("");
  };
  const handleUnsuspend = async (id: string) => { setLoading(id); await unsuspendStudent(id); router.refresh(); setLoading(""); };

  const handleExpel = async (id: string) => {
    if (!expelReason) { setMessage("Enter reason for expulsion"); return; }
    if (!confirm("This will permanently remove the student and drop all their enrollments. Proceed?")) return;
    setLoading("exp-" + id); await expelStudent(id, expelReason); setExpelFor(null); setExpelReason(""); router.refresh(); setLoading("");
  };
  const handleReinstate = async (id: string) => { if (!confirm("Reinstate this student?")) return; setLoading(id); await reinstateStudent(id); router.refresh(); setLoading(""); };

  const handlePromote = async (id: string) => {
    if (!promoteGrade) { setMessage("Select the new grade level"); return; }
    setLoading("prom-" + id); await promoteStudent(id, promoteGrade, promoteNote); setPromoteFor(null); setPromoteGrade(""); setPromoteNote(""); router.refresh(); setLoading("");
  };

  const handleScheduleInterview = async (studentId: string) => {
    if (!scheduleForm.scheduledAt) { setMessage("Set date & time"); return; }
    setLoading(studentId); await scheduleStudentInterview({ studentId, ...scheduleForm }); router.refresh(); setScheduleFor(null); setLoading("");
  };

  const handleBulkApprove = async () => {
    const eligible = pending.filter((s) => s.approvalStatus === "PENDING" || s.approvalStatus === "INTERVIEWED");
    if (!eligible.length) { setMessage("No eligible students to approve"); return; }
    if (!confirm(`Approve all ${eligible.length} eligible students?`)) return;
    setLoading("bulk"); await bulkApproveStudents(eligible.map((s) => s.id)); router.refresh(); setLoading("");
  };

  // Chat
  const openChat = async (userId: string, name: string) => {
    setChatFor(userId); setChatName(name); setChatMessages([]);
    const r = await getStudentConversation(userId);
    if (r.messages) setChatMessages(r.messages);
  };
  const sendChat = async () => {
    if (!chatFor || !chatInput.trim()) return; setLoading("chat");
    await sendMessageToStudent(chatFor, "Direct Message", chatInput);
    setChatInput("");
    const r = await getStudentConversation(chatFor);
    if (r.messages) setChatMessages(r.messages);
    setLoading("");
  };
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [chatMessages]);

  // Helper: attendance %
  const getAttendance = (s: any) => {
    if (!s.attendances || s.attendances.length === 0) return null;
    const present = s.attendances.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length;
    return Math.round((present / s.attendances.length) * 100);
  };

  // Helper: avg score
  const getAvgScore = (s: any) => {
    const graded = (s.scores || []).filter((sc: any) => sc.score !== null);
    if (graded.length === 0) return null;
    return Math.round(graded.reduce((sum: number, sc: any) => sum + ((sc.score / sc.assessment.maxScore) * 100), 0) / graded.length);
  };

  const tabs = [
    { key: "pending", label: `Pending (${pending.length})`, alert: pending.length > 0 },
    { key: "active", label: `Active (${active.length})` },
    { key: "suspended", label: `Suspended (${suspended.length})`, warn: suspended.length > 0 },
    { key: "expelled", label: `Expelled (${expelled.length})`, danger: expelled.length > 0 },
    { key: "rejected", label: `Rejected (${rejected.length})` },
  ];

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-3 text-sm flex justify-between ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          <span>{message}</span><button onClick={() => setMessage("")}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`text-xs px-3.5 py-2 rounded-lg font-medium ${
                tab === t.key ? "bg-brand-600 text-white" :
                t.alert ? "bg-amber-100 text-amber-700" :
                t.warn ? "bg-orange-100 text-orange-700" :
                t.danger ? "bg-red-100 text-red-700" :
                "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === "pending" && pending.length > 0 && (
          <button onClick={handleBulkApprove} disabled={loading === "bulk"} className="btn-primary text-xs px-4">
            {loading === "bulk" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
            Approve All Eligible
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" className="flex-1 py-2.5 text-sm outline-none" placeholder="Search by name, email, or parent..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <select className="input-field w-40" value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
          <option value="">All Grades</option>
          {allGrades.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <span className="text-xs text-gray-400 self-center">{filtered.length} students</span>
      </div>

      {/* Chat Overlay */}
      {chatFor && (
        <div className="card border-brand-300 bg-brand-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-brand-800 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Chat with {chatName}</h4>
            <button onClick={() => setChatFor(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div ref={chatRef} className="h-[250px] overflow-y-auto bg-white rounded-lg p-3 space-y-2 mb-3 border">
            {chatMessages.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No messages yet. Start a conversation!</p>}
            {chatMessages.map((m: any) => (
              <div key={m.id} className={`flex ${m.senderId === principalUserId ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-xl px-3 py-2 ${m.senderId === principalUserId ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                  <p className="text-xs">{m.content}</p>
                  <p className={`text-[9px] mt-0.5 ${m.senderId === principalUserId ? "text-brand-200" : "text-gray-400"}`}>
                    {m.sender?.name || "You"} • {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input-field flex-1" placeholder="Type a message..." value={chatInput}
              onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
            <button onClick={sendChat} disabled={loading === "chat" || !chatInput.trim()} className="btn-primary px-4">
              {loading === "chat" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Student List */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No students in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s: any) => {
            const statusInfo = STATUS_LABELS[s.approvalStatus] || STATUS_LABELS.PENDING;
            const lastInterview = s.interviews?.[0];
            const isExpanded = expanded === s.id;
            const attPct = getAttendance(s);
            const avgScore = getAvgScore(s);
            const initials = s.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
            const enrollCount = s.enrollments?.length || 0;

            return (
              <div key={s.id} className={`card ${s.isSuspended ? "border-orange-300 bg-orange-50/30" : s.isExpelled ? "border-red-300 bg-red-50/30" : ""}`}>
                {/* Header */}
                <div className="flex items-start gap-4">
                  {s.user.image ? (
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                      <img src={s.user.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      s.isSuspended ? "bg-orange-200 text-orange-700" :
                      s.isExpelled ? "bg-red-200 text-red-700" :
                      "bg-blue-100 text-blue-600"
                    }`}>{initials}</div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-gray-800">{s.user.name}</h4>
                      <span className="badge-info text-[10px]">{s.gradeLevel}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                      {s.isSuspended && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-200 text-orange-800 animate-pulse">SUSPENDED</span>}
                      {s.isExpelled && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-200 text-red-800">EXPELLED</span>}
                      {!s.user.isActive && !s.isSuspended && !s.isExpelled && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Inactive</span>}
                    </div>
                    <p className="text-xs text-gray-500">{s.user.email}{s.user.countryCode ? ` • ${s.user.countryCode}` : ""}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      {s.parentName && <span>👨‍👩‍👦 {s.parentName}</span>}
                      <span>{s.preferredSession.replace("SESSION_", "Session ")}</span>
                      <span>{enrollCount} class{enrollCount !== 1 ? "es" : ""}</span>
                      {attPct !== null && (
                        <span className={attPct >= 80 ? "text-emerald-600" : attPct >= 60 ? "text-amber-600" : "text-red-600"}>
                          📊 {attPct}% attendance
                        </span>
                      )}
                      {avgScore !== null && <span className="text-purple-600">📈 {avgScore}% avg</span>}
                      <span>Applied: {new Date(s.enrolledAt).toLocaleDateString()}</span>
                    </div>

                    {/* Interview info */}
                    {lastInterview && (
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-purple-600">
                        <Calendar className="w-3 h-3" />
                        Interview: {new Date(lastInterview.scheduledAt).toLocaleDateString()}
                        {lastInterview.result && (
                          <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${lastInterview.result === "PASS" ? "bg-emerald-100 text-emerald-700" : lastInterview.result === "FAIL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                            {lastInterview.result}
                          </span>
                        )}
                        {lastInterview.scoreOverall && <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />{lastInterview.scoreOverall}/100</span>}
                      </div>
                    )}

                    {s.suspendReason && <p className="text-[10px] text-orange-600 mt-1">⚠️ Suspended: {s.suspendReason}{s.suspendUntil ? ` (until ${new Date(s.suspendUntil).toLocaleDateString()})` : ""}</p>}
                    {s.expelReason && <p className="text-[10px] text-red-600 mt-1">🚫 Expelled: {s.expelReason}</p>}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 flex-wrap flex-shrink-0">
                    {/* Communication — always visible */}
                    <button onClick={() => openChat(s.user.id, s.user.name)} className="text-[10px] px-2 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100" title="Chat">
                      <MessageSquare className="w-3 h-3" />
                    </button>
                    {s.user.phone && (
                      <a href={`tel:${s.user.phone}`} className="text-[10px] px-2 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="Call">
                        <Phone className="w-3 h-3" />
                      </a>
                    )}
                    <a href={`mailto:${s.user.email}`} className="text-[10px] px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="Email">
                      <Mail className="w-3 h-3" />
                    </a>
                    {s.parentEmail && (
                      <a href={`mailto:${s.parentEmail}`} className="text-[10px] px-2 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100" title="Email Parent">
                        <Mail className="w-3 h-3" />
                      </a>
                    )}

                    {/* Pending Actions */}
                    {tab === "pending" && (
                      <>
                        {["PENDING", "INTERVIEWED"].includes(s.approvalStatus) && (
                          <>
                            <button onClick={() => setScheduleFor(scheduleFor === s.id ? null : s.id)}
                              className="text-[10px] px-2 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100" title="Schedule Interview">
                              <Calendar className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleApprove(s.id)} disabled={loading === s.id}
                              className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium flex items-center gap-1">
                              {loading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3" /> Approve</>}
                            </button>
                            <button onClick={() => handleReject(s.id)}
                              className="text-[10px] px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        {s.approvalStatus === "INTERVIEW_SCHEDULED" && (
                          <span className="text-[10px] text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Awaiting Interview
                          </span>
                        )}
                      </>
                    )}

                    {/* Active Student Actions */}
                    {tab === "active" && (
                      <>
                        <button onClick={() => setPromoteFor(promoteFor === s.id ? null : s.id)}
                          className="text-[10px] px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="Promote">
                          <ArrowUpCircle className="w-3 h-3" />
                        </button>
                        <button onClick={() => setSuspendFor(suspendFor === s.id ? null : s.id)}
                          className="text-[10px] px-2 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100" title="Suspend">
                          <AlertTriangle className="w-3 h-3" />
                        </button>
                        <button onClick={() => setExpelFor(expelFor === s.id ? null : s.id)}
                          className="text-[10px] px-2 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Expel">
                          <Ban className="w-3 h-3" />
                        </button>
                      </>
                    )}

                    {/* Suspended */}
                    {tab === "suspended" && (
                      <button onClick={() => handleUnsuspend(s.id)} disabled={loading === s.id}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium flex items-center gap-1">
                        {loading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RefreshCw className="w-3 h-3" /> Lift Suspension</>}
                      </button>
                    )}

                    {/* Expelled */}
                    {tab === "expelled" && (
                      <button onClick={() => handleReinstate(s.id)} disabled={loading === s.id}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium flex items-center gap-1">
                        {loading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RefreshCw className="w-3 h-3" /> Reinstate</>}
                      </button>
                    )}

                    {/* Rejected */}
                    {tab === "rejected" && (
                      <button onClick={() => handleApprove(s.id)} disabled={loading === s.id}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium flex items-center gap-1">
                        {loading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3" /> Approve</>}
                      </button>
                    )}

                    {/* Expand toggle */}
                    <button onClick={() => setExpanded(isExpanded ? null : s.id)} className="text-gray-400 p-1 hover:text-gray-600">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Schedule Interview Form */}
                {scheduleFor === s.id && (
                  <div className="mt-3 pt-3 border-t p-3 bg-purple-50 rounded-lg space-y-3">
                    <h5 className="text-xs font-semibold text-purple-800">📅 Schedule Admission Interview</h5>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div><label className="text-[10px] text-gray-500">Date & Time *</label>
                        <input type="datetime-local" className="input-field text-xs" value={scheduleForm.scheduledAt} onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledAt: e.target.value }))} /></div>
                      <div><label className="text-[10px] text-gray-500">Duration (min)</label>
                        <input type="number" className="input-field text-xs" value={scheduleForm.duration} onChange={(e) => setScheduleForm((p) => ({ ...p, duration: parseInt(e.target.value) || 30 }))} /></div>
                      <div><label className="text-[10px] text-gray-500">Meeting Link</label>
                        <input className="input-field text-xs" placeholder="Zoom/Meet URL" value={scheduleForm.meetingLink} onChange={(e) => setScheduleForm((p) => ({ ...p, meetingLink: e.target.value }))} /></div>
                      <div><label className="text-[10px] text-gray-500">Notes</label>
                        <input className="input-field text-xs" placeholder="For the student" value={scheduleForm.meetingNotes} onChange={(e) => setScheduleForm((p) => ({ ...p, meetingNotes: e.target.value }))} /></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleScheduleInterview(s.id)} disabled={loading === s.id} className="btn-primary text-xs px-4 py-1.5">
                        {loading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Schedule Interview"}
                      </button>
                      <button onClick={() => setScheduleFor(null)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Suspend Form */}
                {suspendFor === s.id && (
                  <div className="mt-3 pt-3 border-t p-3 bg-orange-50 rounded-lg space-y-3">
                    <h5 className="text-xs font-semibold text-orange-800">⚠️ Suspend Student</h5>
                    <p className="text-[10px] text-orange-600">Suspended students cannot access their dashboard, classes, or materials. They will see a suspension notice when they log in.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-[10px] text-gray-500">Reason *</label>
                        <input className="input-field" placeholder="Reason for suspension" value={suspendForm.reason} onChange={(e) => setSuspendForm((p) => ({ ...p, reason: e.target.value }))} /></div>
                      <div><label className="text-[10px] text-gray-500">Suspend Until (optional)</label>
                        <input type="date" className="input-field" value={suspendForm.untilDate} onChange={(e) => setSuspendForm((p) => ({ ...p, untilDate: e.target.value }))} /></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSuspend(s.id)} disabled={loading === "sus-" + s.id || !suspendForm.reason}
                        className="text-xs px-4 py-1.5 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-50">
                        {loading === "sus-" + s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Suspend Student"}
                      </button>
                      <button onClick={() => setSuspendFor(null)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Expel Form */}
                {expelFor === s.id && (
                  <div className="mt-3 pt-3 border-t p-3 bg-red-50 rounded-lg space-y-3">
                    <h5 className="text-xs font-semibold text-red-800">🚫 Expel Student</h5>
                    <p className="text-[10px] text-red-600">This is a permanent action. All active enrollments will be dropped. The student will lose access to everything. You can reinstate later if needed.</p>
                    <input className="input-field" placeholder="Reason for expulsion *" value={expelReason} onChange={(e) => setExpelReason(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => handleExpel(s.id)} disabled={loading === "exp-" + s.id || !expelReason}
                        className="text-xs px-4 py-1.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50">
                        {loading === "exp-" + s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Expel Student"}
                      </button>
                      <button onClick={() => setExpelFor(null)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Promote Form */}
                {promoteFor === s.id && (
                  <div className="mt-3 pt-3 border-t p-3 bg-blue-50 rounded-lg space-y-3">
                    <h5 className="text-xs font-semibold text-blue-800">🎓 Promote Student</h5>
                    <p className="text-[10px] text-blue-600">Current grade: <strong>{s.gradeLevel}</strong>. Select the new grade level.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-[10px] text-gray-500">New Grade Level *</label>
                        <select className="input-field" value={promoteGrade} onChange={(e) => setPromoteGrade(e.target.value)}>
                          <option value="">Select grade</option>
                          {GRADES.filter((g) => g !== s.gradeLevel).map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div><label className="text-[10px] text-gray-500">Note (optional)</label>
                        <input className="input-field" placeholder="Promotion note" value={promoteNote} onChange={(e) => setPromoteNote(e.target.value)} /></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handlePromote(s.id)} disabled={loading === "prom-" + s.id || !promoteGrade}
                        className="btn-primary text-xs px-4 py-1.5">
                        {loading === "prom-" + s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : `Promote to ${promoteGrade || "..."}`}
                      </button>
                      <button onClick={() => setPromoteFor(null)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {/* Stats grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      <div className="p-2.5 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">Session</p><p className="text-xs font-medium">{s.preferredSession.replace("SESSION_", "Session ")}</p></div>
                      <div className="p-2.5 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">Phone</p><p className="text-xs font-medium">{s.user.phone || "—"}</p></div>
                      <div className="p-2.5 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">Date of Birth</p><p className="text-xs font-medium">{s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : "—"}</p></div>
                      <div className="p-2.5 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">Attendance</p><p className={`text-xs font-medium ${attPct !== null ? (attPct >= 80 ? "text-emerald-600" : attPct >= 60 ? "text-amber-600" : "text-red-600") : ""}`}>{attPct !== null ? `${attPct}%` : "—"}</p></div>
                      <div className="p-2.5 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">Avg Score</p><p className={`text-xs font-medium ${avgScore !== null ? (avgScore >= 70 ? "text-emerald-600" : avgScore >= 50 ? "text-amber-600" : "text-red-600") : ""}`}>{avgScore !== null ? `${avgScore}%` : "—"}</p></div>
                    </div>

                    {/* Parent info */}
                    {(s.parentName || s.parentEmail || s.parentPhone) && (
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <p className="text-[10px] font-bold text-indigo-800 uppercase mb-1">Parent / Guardian</p>
                        <div className="flex items-center gap-4 text-xs text-indigo-700">
                          {s.parentName && <span>👨‍👩‍👦 {s.parentName}</span>}
                          {s.parentEmail && <a href={`mailto:${s.parentEmail}`} className="hover:underline flex items-center gap-1"><Mail className="w-3 h-3" /> {s.parentEmail}</a>}
                          {s.parentPhone && <a href={`tel:${s.parentPhone}`} className="hover:underline flex items-center gap-1"><Phone className="w-3 h-3" /> {s.parentPhone}</a>}
                        </div>
                      </div>
                    )}

                    {/* Enrolled classes */}
                    {s.enrollments && s.enrollments.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Enrolled Classes ({s.enrollments.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {s.enrollments.map((e: any) => (
                            <span key={e.id} className="text-[10px] bg-brand-50 text-brand-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> {e.class.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certificates */}
                    {s.certificates && s.certificates.length > 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {s.certificates.length} certificate{s.certificates.length > 1 ? "s" : ""} earned</p>
                    )}

                    {/* Promotion note */}
                    {s.promotionNote && <p className="text-[10px] text-blue-600">📝 Promotion: {s.promotionNote}</p>}
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
