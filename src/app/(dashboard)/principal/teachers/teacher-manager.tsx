"use client";

import { useState, useEffect, useRef } from "react";
import {
  inviteTeacherToSchool, approveTeacher, rejectTeacher, removeTeacherFromSchool, reinstateTeacher,
  suspendTeacher, unsuspendTeacher, terminateTeacher,
  assignTeacherToClass, reassignClass, deactivateClass, reactivateClass, updateTeacherSubjects,
  sendMessageToTeacher, getTeacherConversation,
} from "@/lib/actions/school";
import { scheduleTeacherInterview } from "@/lib/actions/interview";
import { useRouter } from "next/navigation";
import {
  Plus, UserX, UserCheck, Loader2, Users, Star, BookOpen, Mail, Clock, XCircle, CheckCircle,
  Calendar, GraduationCap, Send, MessageSquare, Phone, AlertTriangle, Ban, RefreshCw,
  ChevronDown, ChevronUp, Settings, Briefcase, X
} from "lucide-react";

const SUBJECTS = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Further Mathematics",
  "Economics", "Government", "History", "Geography", "Computer Science", "ICT",
  "French", "Arabic", "Literature", "Civic Education", "Social Studies",
  "Basic Science", "Basic Technology", "Physical Education", "Fine Arts", "Music",
  "Business Studies", "Accounting", "Commerce", "Health Science", "Religious Studies",
  "Agricultural Science", "Home Economics", "Technical Drawing",
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  INTERVIEW_SCHEDULED: { label: "Interview Set", color: "bg-purple-100 text-purple-700" },
  INTERVIEWED: { label: "Interviewed", color: "bg-cyan-100 text-cyan-700" },
  APPROVED: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" },
};

export default function TeacherManager({
  pending, active, suspended, terminated, rejected, schoolGrades, allTeachers, principalUserId,
}: {
  pending: any[]; active: any[]; suspended: any[]; terminated: any[]; rejected: any[];
  schoolGrades: any[]; allTeachers: { id: string; name: string }[]; principalUserId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [email, setEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<string>(pending.length > 0 ? "pending" : "active");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Forms
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ scheduledAt: "", duration: 30, meetingLink: "", meetingNotes: "" });
  const [suspendFor, setSuspendFor] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [terminateFor, setTerminateFor] = useState<string | null>(null);
  const [terminateReason, setTerminateReason] = useState("");
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ schoolGradeId: "", subjectName: "", className: "", session: "SESSION_A", maxStudents: 40, description: "" });
  const [reassignData, setReassignData] = useState<{ classId: string; teacherId: string } | null>(null);
  const [chatFor, setChatFor] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const current = tab === "pending" ? pending : tab === "active" ? active : tab === "suspended" ? suspended : tab === "terminated" ? terminated : rejected;

  const handleInvite = async () => {
    if (!email) return; setLoading("invite");
    const r = await inviteTeacherToSchool(email);
    setMessage(r.error ? "Error: " + r.error : r.message || "Done!"); if (!r.error) { setEmail(""); setShowInvite(false); }
    router.refresh(); setLoading("");
  };

  const handleApprove = async (id: string) => { setLoading(id); await approveTeacher(id); router.refresh(); setLoading(""); };
  const handleReject = async (id: string) => { if (!confirm("Reject?")) return; setLoading(id); await rejectTeacher(id); router.refresh(); setLoading(""); };

  const handleSuspend = async (id: string) => {
    if (!suspendReason) { setMessage("Enter a reason"); return; }
    setLoading("sus-" + id); await suspendTeacher(id, suspendReason); setSuspendFor(null); setSuspendReason(""); router.refresh(); setLoading("");
  };
  const handleUnsuspend = async (id: string) => { setLoading(id); await unsuspendTeacher(id); router.refresh(); setLoading(""); };

  const handleTerminate = async (id: string) => {
    if (!terminateReason) { setMessage("Enter a reason"); return; }
    if (!confirm("This will deactivate all their classes. Proceed?")) return;
    setLoading("term-" + id); await terminateTeacher(id, terminateReason); setTerminateFor(null); setTerminateReason(""); router.refresh(); setLoading("");
  };
  const handleReinstate = async (id: string) => { setLoading(id); await reinstateTeacher(id); router.refresh(); setLoading(""); };

  const handleScheduleInterview = async (stId: string) => {
    if (!scheduleForm.scheduledAt) return; setLoading(stId);
    await scheduleTeacherInterview({ schoolTeacherId: stId, ...scheduleForm });
    router.refresh(); setScheduleFor(null); setLoading("");
  };

  const handleAssignClass = async (teacherId: string) => {
    if (!assignForm.schoolGradeId || !assignForm.subjectName || !assignForm.className) { setMessage("Fill all required fields"); return; }
    setLoading("assign"); await assignTeacherToClass({ teacherId, ...assignForm }); setAssignFor(null); router.refresh(); setLoading("");
  };

  const handleReassign = async () => {
    if (!reassignData) return; setLoading("reassign");
    await reassignClass(reassignData.classId, reassignData.teacherId);
    setReassignData(null); router.refresh(); setLoading("");
  };

  const handleDeactivateClass = async (id: string) => { setLoading("dc-" + id); await deactivateClass(id); router.refresh(); setLoading(""); };
  const handleReactivateClass = async (id: string) => { setLoading("rc-" + id); await reactivateClass(id); router.refresh(); setLoading(""); };

  // Chat
  const openChat = async (teacherUserId: string) => {
    setChatFor(teacherUserId); setChatMessages([]);
    const r = await getTeacherConversation(teacherUserId);
    if (r.messages) setChatMessages(r.messages);
  };
  const sendChat = async () => {
    if (!chatFor || !chatInput.trim()) return; setLoading("chat");
    await sendMessageToTeacher(chatFor, "Direct Message", chatInput);
    setChatInput("");
    const r = await getTeacherConversation(chatFor);
    if (r.messages) setChatMessages(r.messages);
    setLoading("");
  };
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, [chatMessages]);

  const tabs = [
    { key: "pending", label: `Pending (${pending.length})`, alert: pending.length > 0 },
    { key: "active", label: `Active (${active.length})` },
    { key: "suspended", label: `Suspended (${suspended.length})`, warn: suspended.length > 0 },
    { key: "terminated", label: `Terminated (${terminated.length})` },
    { key: "rejected", label: `Rejected (${rejected.length})` },
  ];

  return (
    <div className="space-y-6">
      {message && <div className={`rounded-lg p-3 text-sm flex justify-between ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}><span>{message}</span><button onClick={() => setMessage("")}>✕</button></div>}

      {/* Tabs + Invite */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`text-xs px-3.5 py-2 rounded-lg font-medium relative ${tab === t.key ? "bg-brand-600 text-white" : t.alert ? "bg-amber-100 text-amber-700" : t.warn ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowInvite(!showInvite)} className="btn-primary text-sm"><Plus className="w-4 h-4 mr-1" /> Invite</button>
      </div>

      {showInvite && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <input type="email" className="flex-1 py-2.5 text-sm outline-none" placeholder="teacher@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleInvite()} />
            </div>
            <button onClick={handleInvite} disabled={loading === "invite"} className="btn-primary px-6">{loading === "invite" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}</button>
            <button onClick={() => setShowInvite(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Chat overlay */}
      {chatFor && (
        <div className="card border-brand-300 bg-brand-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-brand-800 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Chat with Teacher</h4>
            <button onClick={() => setChatFor(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div ref={chatRef} className="h-[250px] overflow-y-auto bg-white rounded-lg p-3 space-y-2 mb-3 border">
            {chatMessages.length === 0 && <p className="text-xs text-gray-400 text-center py-8">No messages yet. Start a conversation!</p>}
            {chatMessages.map((m: any) => (
              <div key={m.id} className={`flex ${m.senderId === principalUserId ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-xl px-3 py-2 ${m.senderId === principalUserId ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                  <p className="text-xs">{m.content}</p>
                  <p className={`text-[9px] mt-0.5 ${m.senderId === principalUserId ? "text-brand-200" : "text-gray-400"}`}>
                    {m.sender.name} • {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

      {/* Teacher list */}
      {current.length === 0 ? (
        <div className="card text-center py-12"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No teachers in this category.</p></div>
      ) : (
        <div className="space-y-3">
          {current.map((st: any) => {
            const statusInfo = STATUS_LABELS[st.status] || STATUS_LABELS.PENDING;
            const teacherSubjects = (st.teacher.subjects as string[]) || [];
            const appliedSubjects = (st.subjectsAppliedFor as string[]) || [];
            const assignedSubjects = (st.assignedSubjects as string[]) || [];
            const qualifications = (st.teacher.qualifications as string[]) || [];
            const isExpanded = expanded === st.id;
            const activeClasses = st.teacher.classes.filter((c: any) => c.isActive);
            const inactiveClasses = st.teacher.classes.filter((c: any) => !c.isActive);
            const totalStudents = activeClasses.reduce((s: number, c: any) => s + c.enrollments.length, 0);

            return (
              <div key={st.id} className={`card ${st.isSuspended ? "border-orange-300 bg-orange-50/30" : st.terminatedAt ? "border-red-300 bg-red-50/30" : ""}`}>
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${st.isSuspended ? "bg-orange-200 text-orange-700" : st.terminatedAt ? "bg-red-200 text-red-700" : "bg-emerald-100 text-emerald-600"}`}>
                    {st.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-gray-800">{st.teacher.user.name}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                      {st.isSuspended && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-200 text-orange-800">SUSPENDED</span>}
                      {st.terminatedAt && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-200 text-red-800">TERMINATED</span>}
                      {st.salary && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">{st.salary.currency} {Math.round(st.salary.baseSalary).toLocaleString()}/mo</span>}
                    </div>
                    <p className="text-xs text-gray-500">{st.teacher.user.email} • {st.teacher.user.countryCode}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      <span>{st.teacher.yearsExperience}yr exp</span>
                      <span>{activeClasses.length} classes</span>
                      <span>{totalStudents} students</span>
                      {st.teacher.user.phone && <span>{st.teacher.user.phone}</span>}
                    </div>

                    {/* Subjects */}
                    {(appliedSubjects.length > 0 || assignedSubjects.length > 0 || teacherSubjects.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(assignedSubjects.length > 0 ? assignedSubjects : appliedSubjects.length > 0 ? appliedSubjects : teacherSubjects).map((s: string) => (
                          <span key={s} className="text-[9px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}

                    {st.suspendReason && <p className="text-[10px] text-orange-600 mt-1">Reason: {st.suspendReason}</p>}
                    {st.terminateReason && <p className="text-[10px] text-red-600 mt-1">Reason: {st.terminateReason}</p>}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {/* Communication */}
                    <button onClick={() => openChat(st.teacher.user.id)} className="text-[10px] px-2 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100" title="Chat"><MessageSquare className="w-3 h-3" /></button>
                    {st.teacher.user.phone && <a href={`tel:${st.teacher.user.phone}`} className="text-[10px] px-2 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="Call"><Phone className="w-3 h-3" /></a>}
                    <a href={`mailto:${st.teacher.user.email}`} className="text-[10px] px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="Email"><Mail className="w-3 h-3" /></a>

                    {/* Pending actions */}
                    {["PENDING", "INTERVIEWED"].includes(st.status) && (
                      <>
                        <button onClick={() => setScheduleFor(scheduleFor === st.id ? null : st.id)} className="text-[10px] px-2 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100"><Calendar className="w-3 h-3" /></button>
                        <button onClick={() => handleApprove(st.id)} disabled={loading === st.id} className="text-[10px] px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                          {loading === st.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        </button>
                        <button onClick={() => handleReject(st.id)} className="text-[10px] px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50"><XCircle className="w-3 h-3" /></button>
                      </>
                    )}

                    {/* Active teacher actions */}
                    {st.status === "APPROVED" && st.isActive && !st.isSuspended && !st.terminatedAt && (
                      <>
                        <button onClick={() => setSuspendFor(suspendFor === st.id ? null : st.id)} className="text-[10px] px-2 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100" title="Suspend"><AlertTriangle className="w-3 h-3" /></button>
                        <button onClick={() => setTerminateFor(terminateFor === st.id ? null : st.id)} className="text-[10px] px-2 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Terminate"><Ban className="w-3 h-3" /></button>
                      </>
                    )}

                    {/* Suspended */}
                    {st.isSuspended && (
                      <button onClick={() => handleUnsuspend(st.id)} disabled={loading === st.id} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium">
                        {loading === st.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RefreshCw className="w-3 h-3 inline mr-0.5" /> Unsuspend</>}
                      </button>
                    )}

                    {/* Terminated */}
                    {st.terminatedAt && (
                      <button onClick={() => handleReinstate(st.id)} disabled={loading === st.id} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium">
                        {loading === st.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RefreshCw className="w-3 h-3 inline mr-0.5" /> Reinstate</>}
                      </button>
                    )}

                    {/* Rejected */}
                    {st.status === "REJECTED" && (
                      <button onClick={() => handleApprove(st.id)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium"><CheckCircle className="w-3 h-3 inline mr-0.5" /> Approve</button>
                    )}

                    {/* Expand */}
                    <button onClick={() => setExpanded(isExpanded ? null : st.id)} className="text-gray-400 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Schedule interview form */}
                {scheduleFor === st.id && (
                  <div className="mt-3 pt-3 border-t p-3 bg-purple-50 rounded-lg space-y-3">
                    <h5 className="text-xs font-semibold text-purple-800">Schedule Interview {appliedSubjects.length > 0 && `— for ${appliedSubjects.join(", ")}`}</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="text-[10px] text-gray-500">Date *</label><input type="datetime-local" className="input-field text-xs" value={scheduleForm.scheduledAt} onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledAt: e.target.value }))} /></div>
                      <div><label className="text-[10px] text-gray-500">Duration</label><input type="number" className="input-field text-xs" value={scheduleForm.duration} onChange={(e) => setScheduleForm((p) => ({ ...p, duration: parseInt(e.target.value) || 30 }))} /></div>
                      <div><label className="text-[10px] text-gray-500">Meeting Link</label><input className="input-field text-xs" placeholder="Zoom/Meet" value={scheduleForm.meetingLink} onChange={(e) => setScheduleForm((p) => ({ ...p, meetingLink: e.target.value }))} /></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleScheduleInterview(st.id)} disabled={loading === st.id} className="btn-primary text-xs">{loading === st.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Schedule"}</button>
                      <button onClick={() => setScheduleFor(null)} className="btn-ghost text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Suspend form */}
                {suspendFor === st.id && (
                  <div className="mt-3 pt-3 border-t p-3 bg-orange-50 rounded-lg space-y-3">
                    <h5 className="text-xs font-semibold text-orange-800">Suspend Teacher</h5>
                    <p className="text-[10px] text-orange-600">Suspended teachers can only see their dashboard. No access to classes, students, or materials.</p>
                    <input className="input-field" placeholder="Reason for suspension *" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => handleSuspend(st.id)} disabled={loading === "sus-" + st.id || !suspendReason} className="text-xs px-4 py-1.5 rounded-lg bg-orange-600 text-white font-medium">{loading === "sus-" + st.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Suspend"}</button>
                      <button onClick={() => setSuspendFor(null)} className="btn-ghost text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Terminate form */}
                {terminateFor === st.id && (
                  <div className="mt-3 pt-3 border-t p-3 bg-red-50 rounded-lg space-y-3">
                    <h5 className="text-xs font-semibold text-red-800">Terminate Teacher</h5>
                    <p className="text-[10px] text-red-600">This will deactivate ALL their classes and remove access. Students will need to be reassigned.</p>
                    <input className="input-field" placeholder="Reason for termination *" value={terminateReason} onChange={(e) => setTerminateReason(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => handleTerminate(st.id)} disabled={loading === "term-" + st.id || !terminateReason} className="text-xs px-4 py-1.5 rounded-lg bg-red-600 text-white font-medium">{loading === "term-" + st.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Terminate"}</button>
                      <button onClick={() => setTerminateFor(null)} className="btn-ghost text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Expanded: Classes + Assign + Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {/* Profile details */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">Style</p><p className="text-xs font-medium">{st.teacher.teachingStyle || "—"}</p></div>
                      <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">Phone</p><p className="text-xs font-medium">{st.teacher.user.phone || "—"}</p></div>
                      <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">Hired</p><p className="text-xs font-medium">{new Date(st.hiredAt).toLocaleDateString()}</p></div>
                      <div className="p-2 bg-gray-50 rounded-lg"><p className="text-[10px] text-gray-500">Rating</p><p className="text-xs font-medium">{st.teacher.rating > 0 ? st.teacher.rating.toFixed(1) + "/5" : "No ratings"}</p></div>
                    </div>

                    {qualifications.length > 0 && qualifications[0] && (
                      <div><p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Qualifications</p>
                        <div className="flex flex-wrap gap-1">{qualifications.filter(Boolean).map((q: string, i: number) => <span key={i} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded">{q}</span>)}</div></div>
                    )}

                    {st.teacher.bio && <div className="p-3 bg-gray-50 rounded-lg"><p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Bio</p><p className="text-xs text-gray-600">{st.teacher.bio}</p></div>}

                    {/* Active Classes */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-bold text-gray-800">Classes ({activeClasses.length})</h5>
                        {st.status === "APPROVED" && !st.terminatedAt && (
                          <button onClick={() => setAssignFor(assignFor === st.id ? null : st.id)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 font-medium"><Plus className="w-3 h-3 inline mr-0.5" /> Assign Class</button>
                        )}
                      </div>

                      {activeClasses.length === 0 && <p className="text-xs text-gray-400">No active classes.</p>}
                      {activeClasses.map((c: any) => (
                        <div key={c.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg mb-1.5">
                          <BookOpen className="w-4 h-4 text-brand-500" />
                          <div className="flex-1">
                            <p className="text-xs font-medium">{c.name}</p>
                            <p className="text-[10px] text-gray-500">{c.schoolGrade.gradeLevel} • {c.session.replace("SESSION_", "S")} • {c.enrollments.length} students</p>
                          </div>
                          <button onClick={() => setReassignData({ classId: c.id, teacherId: "" })} className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-600">Reassign</button>
                          <button onClick={() => handleDeactivateClass(c.id)} disabled={loading === "dc-" + c.id} className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-500">{loading === "dc-" + c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Deactivate"}</button>
                        </div>
                      ))}
                      {inactiveClasses.length > 0 && (
                        <div className="mt-2"><p className="text-[10px] text-gray-400 mb-1">Inactive:</p>
                          {inactiveClasses.map((c: any) => (
                            <div key={c.id} className="flex items-center gap-2 p-2 bg-gray-50/50 rounded-lg mb-1 opacity-60">
                              <span className="text-[10px] text-gray-500">{c.name} ({c.schoolGrade.gradeLevel})</span>
                              <button onClick={() => handleReactivateClass(c.id)} className="text-[10px] text-brand-600 hover:underline">Reactivate</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assign new class form */}
                    {assignFor === st.id && (
                      <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg space-y-3">
                        <h5 className="text-xs font-semibold text-brand-800">Assign New Class</h5>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          <div><label className="text-[10px] text-gray-500">Grade *</label>
                            <select className="input-field text-xs" value={assignForm.schoolGradeId} onChange={(e) => setAssignForm((p) => ({ ...p, schoolGradeId: e.target.value }))}>
                              <option value="">Select grade</option>
                              {schoolGrades.map((g: any) => <option key={g.id} value={g.id}>{g.gradeLevel}</option>)}
                            </select></div>
                          <div><label className="text-[10px] text-gray-500">Subject *</label>
                            <select className="input-field text-xs" value={assignForm.subjectName} onChange={(e) => setAssignForm((p) => ({ ...p, subjectName: e.target.value, className: e.target.value ? `${e.target.value} Class` : "" }))}>
                              <option value="">Select subject</option>
                              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select></div>
                          <div><label className="text-[10px] text-gray-500">Class Name *</label>
                            <input className="input-field text-xs" placeholder="e.g. Mathematics G10A" value={assignForm.className} onChange={(e) => setAssignForm((p) => ({ ...p, className: e.target.value }))} /></div>
                          <div><label className="text-[10px] text-gray-500">Session</label>
                            <select className="input-field text-xs" value={assignForm.session} onChange={(e) => setAssignForm((p) => ({ ...p, session: e.target.value }))}>
                              <option value="SESSION_A">Session A (Morning)</option><option value="SESSION_B">Session B (Afternoon)</option><option value="SESSION_C">Session C (Evening)</option>
                            </select></div>
                          <div><label className="text-[10px] text-gray-500">Max Students</label>
                            <input type="number" className="input-field text-xs" value={assignForm.maxStudents} onChange={(e) => setAssignForm((p) => ({ ...p, maxStudents: parseInt(e.target.value) || 40 }))} /></div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAssignClass(st.teacher.id)} disabled={loading === "assign"} className="btn-primary text-xs">{loading === "assign" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Create & Assign"}</button>
                          <button onClick={() => setAssignFor(null)} className="btn-ghost text-xs">Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Reassign class modal */}
                    {reassignData && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                        <h5 className="text-xs font-semibold text-blue-800">Reassign Class to Another Teacher</h5>
                        <select className="input-field text-xs" value={reassignData.teacherId} onChange={(e) => setReassignData({ ...reassignData, teacherId: e.target.value })}>
                          <option value="">Select teacher</option>
                          {allTeachers.filter((t) => t.id !== st.teacher.id).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={handleReassign} disabled={loading === "reassign" || !reassignData.teacherId} className="btn-primary text-xs">{loading === "reassign" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reassign"}</button>
                          <button onClick={() => setReassignData(null)} className="btn-ghost text-xs">Cancel</button>
                        </div>
                      </div>
                    )}
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
