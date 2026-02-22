"use client";

import { useState, useTransition } from "react";
import {
  approveStudent, rejectStudent, suspendStudent, reinstateStudent,
  promoteStudent, changeStudentGrade,
} from "@/lib/actions/student-management";
import { scheduleStudentInterview, submitInterviewResult } from "@/lib/actions/interview";
import { useRouter } from "next/navigation";
import {
  Search, Loader2, ChevronDown, ChevronUp, ArrowUp, Shield,
  UserCheck, Calendar, ClipboardCheck,
} from "lucide-react";
import { getGradeLabelForCountry, getEducationSystem } from "@/lib/education-systems";

const KG_GRADES = ["KG1", "KG2", "KG3", "NURSERY1", "NURSERY2", "NURSERY3", "RECEPTION", "PRE_PRIMARY"];
function isKGGrade(grade: string) { return KG_GRADES.includes(grade); }

export default function StudentManager({ students, countryCode = "NG", interviews = [] }: {
  students: any[]; countryCode?: string; interviews?: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState("");
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [promoteGrade, setPromoteGrade] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("10:00");
  const [interviewDuration, setInterviewDuration] = useState(30);
  const [interviewNotes, setInterviewNotes] = useState("");
  const [interviewLink, setInterviewLink] = useState("");
  const [scoringFor, setScoringFor] = useState<string | null>(null);
  const [iResult, setIResult] = useState("PASS");
  const [iScoreOverall, setIScoreOverall] = useState(8);
  const [iScoreComm, setIScoreComm] = useState(8);
  const [iScoreKnow, setIScoreKnow] = useState(8);
  const [iScoreAtt, setIScoreAtt] = useState(8);
  const [iFeedback, setIFeedback] = useState("");
  const [iRecommendation, setIRecommendation] = useState("");

  const eduSystem = getEducationSystem(countryCode);
  const allGrades = eduSystem.levels.flatMap((l: any) => l.grades);

  const filtered = students.filter((s: any) => {
    const name = s.user?.name || "";
    const email = s.user?.email || "";
    const ok1 = !search || name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
    const ok2 = !filterGrade || s.gradeLevel === filterGrade;
    const ok3 = !filterStatus || s.approvalStatus === filterStatus;
    return ok1 && ok2 && ok3;
  });

  const grades = [...new Set(students.map((s: any) => s.gradeLevel))].sort();
  const pending = students.filter((s: any) => s.approvalStatus === "PENDING");
  const scheduled = students.filter((s: any) => s.approvalStatus === "INTERVIEW_SCHEDULED");
  const interviewed = students.filter((s: any) => s.approvalStatus === "INTERVIEWED");
  const approved = students.filter((s: any) => s.approvalStatus === "APPROVED");
  const awaitPay = approved.filter((s: any) => !s.feePaid);

  const getIV = (sid: string) => interviews.find((i: any) => i.studentId === sid && i.status !== "CANCELLED");

  const wrap = (id: string, fn: () => Promise<any>) => {
    setLoading(id);
    startTransition(async () => { try { await fn(); } catch(_e){} router.refresh(); setLoading(""); });
  };

  const doSchedule = (studentId: string) => {
    if (!interviewDate) return alert("Pick a date");
    wrap(studentId, () => scheduleStudentInterview({
      studentId, scheduledAt: `${interviewDate}T${interviewTime}:00`,
      duration: interviewDuration, meetingLink: interviewLink || undefined, meetingNotes: interviewNotes || undefined,
    }));
    setScheduleFor(null); setInterviewDate(""); setInterviewNotes(""); setInterviewLink("");
  };

  const doScore = (ivId: string) => {
    if (!iFeedback.trim()) return alert("Write feedback");
    wrap(ivId, () => submitInterviewResult({
      interviewId: ivId, result: iResult, scoreOverall: iScoreOverall,
      scoreCommunication: iScoreComm, scoreKnowledge: iScoreKnow, scoreAttitude: iScoreAtt,
      feedback: iFeedback, recommendation: iRecommendation || undefined,
    }));
    setScoringFor(null); setIFeedback(""); setIRecommendation("");
  };

  const statusBadge = (s: string) => {
    const c: Record<string,string> = {
      PENDING: "bg-amber-100 text-amber-700", INTERVIEW_SCHEDULED: "bg-blue-100 text-blue-700",
      INTERVIEWED: "bg-purple-100 text-purple-700", APPROVED: "bg-emerald-100 text-emerald-700",
      REJECTED: "bg-red-100 text-red-700", SUSPENDED: "bg-orange-100 text-orange-700",
    };
    return c[s] || "bg-gray-100 text-gray-600";
  };

  const stepLabel = (s: string) => {
    const l: Record<string,string> = {
      PENDING: "① New", INTERVIEW_SCHEDULED: "② Interview Set",
      INTERVIEWED: "③ Interviewed", APPROVED: "④ Approved",
      REJECTED: "Rejected", SUSPENDED: "Suspended",
    };
    return l[s] || s;
  };

  return (
    <div className="space-y-6">
      {/* ===== ENROLLMENT PIPELINE ===== */}
      <div className="bg-white rounded-2xl border p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4">📋 Enrollment Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "① New", count: pending.length, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: "📩", f: "PENDING" },
            { label: "② Interview", count: scheduled.length, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: "📅", f: "INTERVIEW_SCHEDULED" },
            { label: "③ Reviewed", count: interviewed.length, color: "text-purple-600", bg: "bg-purple-50 border-purple-200", icon: "✅", f: "INTERVIEWED" },
            { label: "④ Approved", count: approved.length, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: "🎓", f: "APPROVED" },
            { label: "⏳ Pay", count: awaitPay.length, color: "text-rose-600", bg: "bg-rose-50 border-rose-200", icon: "💳", f: "" },
          ].map(p => (
            <button key={p.label} onClick={() => setFilterStatus(filterStatus === p.f ? "" : p.f)}
              className={`p-3 rounded-xl border-2 text-center transition hover:shadow-md ${filterStatus === p.f ? p.bg : "border-gray-100"}`}>
              <span className="text-2xl">{p.icon}</span>
              <p className={`text-2xl font-black ${p.count > 0 ? p.color : "text-gray-300"}`}>{p.count}</p>
              <p className="text-[9px] text-gray-500 font-medium">{p.label}</p>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-1 text-[9px] text-gray-400 font-medium flex-wrap">
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Register</span><span>→</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Interview</span><span>→</span>
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Score</span><span>→</span>
          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Approve</span><span>→</span>
          <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">Pay Fees</span><span>→</span>
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Full Access</span>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="bg-white rounded-2xl border p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input-field pl-10" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field w-auto" value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
            <option value="">All Grades</option>
            {grades.map(g => <option key={g} value={g}>{getGradeLabelForCountry(g, countryCode)}</option>)}
          </select>
          <select className="input-field w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Stages</option>
            <option value="PENDING">① New</option><option value="INTERVIEW_SCHEDULED">② Interview</option>
            <option value="INTERVIEWED">③ Reviewed</option><option value="APPROVED">④ Approved</option>
            <option value="REJECTED">Rejected</option><option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* ===== ① NEW APPLICATIONS ===== */}
      {pending.length > 0 && (!filterStatus || filterStatus === "PENDING") && (
        <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-5 space-y-3">
          <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-black">①</span>
            New Applications — Schedule Interview ({pending.length})
          </h3>
          {pending.map((s: any) => {
            const kg = isKGGrade(s.gradeLevel);
            return (
              <div key={s.id} className="bg-white rounded-xl p-4 border border-amber-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">{s.user?.name?.charAt(0) || "?"}</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">{s.user?.name}</h4>
                    <p className="text-[10px] text-gray-500">{s.user?.email} · {getGradeLabelForCountry(s.gradeLevel, countryCode)} · {new Date(s.enrolledAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-1 rounded-full font-bold ${kg ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`}>
                    {kg ? "👶 Interview Parent" : "🎓 Interview Student + Parent"}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-2 text-[10px]">
                  <span>👤 Parent: <strong>{s.parentName || "—"}</strong></span>
                  <span>📞 Phone: <strong>{s.parentPhone || "—"}</strong></span>
                  <span>📧 Email: <strong>{s.parentEmail || "—"}</strong></span>
                </div>
                {scheduleFor === s.id ? (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-3">
                    <h5 className="text-xs font-bold text-blue-800">📅 Schedule {kg ? "Parent" : "Student & Parent"} Interview</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-gray-500">Date *</label><input type="date" className="input-field text-xs" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} /></div>
                      <div><label className="text-[10px] text-gray-500">Time *</label><input type="time" className="input-field text-xs" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} /></div>
                      <div><label className="text-[10px] text-gray-500">Duration</label><select className="input-field text-xs" value={interviewDuration} onChange={e => setInterviewDuration(+e.target.value)}>{[15,20,30,45,60].map(m=><option key={m} value={m}>{m} min</option>)}</select></div>
                      <div><label className="text-[10px] text-gray-500">Meeting Link</label><input className="input-field text-xs" placeholder="https://..." value={interviewLink} onChange={e => setInterviewLink(e.target.value)} /></div>
                    </div>
                    <textarea className="input-field text-xs w-full" rows={2} placeholder="Interview notes..." value={interviewNotes} onChange={e => setInterviewNotes(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => doSchedule(s.id)} disabled={!!loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                        {loading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />} Schedule
                      </button>
                      <button onClick={() => setScheduleFor(null)} className="px-4 py-2 text-gray-500 text-xs hover:bg-gray-100 rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => { setScheduleFor(s.id); setInterviewNotes(kg ? "Parent interview for KG admission" : "Student & parent admission interview"); }}
                      className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Schedule Interview
                    </button>
                    <button onClick={() => { const r = prompt("Reason for rejection:"); if (r !== null) wrap(s.id, () => rejectStudent(s.id, r)); }}
                      className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100">Reject</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== ② INTERVIEWS SCHEDULED ===== */}
      {scheduled.length > 0 && (!filterStatus || filterStatus === "INTERVIEW_SCHEDULED") && (
        <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-5 space-y-3">
          <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-black">②</span>
            Interviews Scheduled — Complete & Score ({scheduled.length})
          </h3>
          {scheduled.map((s: any) => {
            const iv = getIV(s.id);
            const kg = isKGGrade(s.gradeLevel);
            return (
              <div key={s.id} className="bg-white rounded-xl p-4 border border-blue-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">{s.user?.name?.charAt(0)||"?"}</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">{s.user?.name}</h4>
                    <p className="text-[10px] text-gray-500">{getGradeLabelForCountry(s.gradeLevel, countryCode)} · {kg ? "👶 KG" : "🎓"}</p>
                  </div>
                  {iv && <span className="text-[10px] bg-blue-200 text-blue-800 px-3 py-1 rounded-full font-bold">📅 {new Date(iv.scheduledAt).toLocaleDateString()} {new Date(iv.scheduledAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>}
                </div>
                {iv?.meetingLink && <p className="text-[10px] text-blue-600">🔗 <a href={iv.meetingLink} target="_blank" className="underline">{iv.meetingLink}</a></p>}
                {iv?.meetingNotes && <p className="text-[10px] text-gray-500 bg-gray-50 p-2 rounded-lg">📝 {iv.meetingNotes}</p>}
                {scoringFor === s.id && iv ? (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 space-y-3">
                    <h5 className="text-xs font-bold text-purple-800">📋 Interview Assessment</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-gray-500">Result *</label><select className="input-field text-xs" value={iResult} onChange={e=>setIResult(e.target.value)}><option value="PASS">✅ Pass</option><option value="CONDITIONAL">⚠️ Conditional</option><option value="FAIL">❌ Fail</option></select></div>
                      <div><label className="text-[10px] text-gray-500">Overall (1-10)</label><input type="number" min={1} max={10} className="input-field text-xs" value={iScoreOverall} onChange={e=>setIScoreOverall(+e.target.value)} /></div>
                      <div><label className="text-[10px] text-gray-500">Communication</label><input type="number" min={1} max={10} className="input-field text-xs" value={iScoreComm} onChange={e=>setIScoreComm(+e.target.value)} /></div>
                      <div><label className="text-[10px] text-gray-500">{kg?"Parent Knowledge":"Knowledge"}</label><input type="number" min={1} max={10} className="input-field text-xs" value={iScoreKnow} onChange={e=>setIScoreKnow(+e.target.value)} /></div>
                      <div><label className="text-[10px] text-gray-500">Attitude</label><input type="number" min={1} max={10} className="input-field text-xs" value={iScoreAtt} onChange={e=>setIScoreAtt(+e.target.value)} /></div>
                    </div>
                    <textarea className="input-field text-xs w-full" rows={3} placeholder="How did the interview go?..." value={iFeedback} onChange={e=>setIFeedback(e.target.value)} />
                    <input className="input-field text-xs w-full" placeholder="Recommendation (optional)" value={iRecommendation} onChange={e=>setIRecommendation(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => doScore(iv.id)} disabled={!!loading} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5">
                        {loading === iv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5" />} Submit Assessment
                      </button>
                      <button onClick={() => setScoringFor(null)} className="px-4 py-2 text-gray-500 text-xs hover:bg-gray-100 rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setScoringFor(s.id)} className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center justify-center gap-1.5">
                    <ClipboardCheck className="w-3.5 h-3.5" /> Complete Interview & Score
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== ③ INTERVIEWED — APPROVE/REJECT ===== */}
      {interviewed.length > 0 && (!filterStatus || filterStatus === "INTERVIEWED") && (
        <div className="bg-purple-50 rounded-2xl border-2 border-purple-200 p-5 space-y-3">
          <h3 className="text-sm font-bold text-purple-800 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-xs font-black">③</span>
            Interviewed — Awaiting Your Decision ({interviewed.length})
          </h3>
          {interviewed.map((s: any) => {
            const iv = getIV(s.id);
            return (
              <div key={s.id} className="bg-white rounded-xl p-4 border border-purple-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">{s.user?.name?.charAt(0)||"?"}</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">{s.user?.name}</h4>
                    <p className="text-[10px] text-gray-500">{getGradeLabelForCountry(s.gradeLevel, countryCode)} · {s.user?.email}</p>
                  </div>
                </div>
                {iv && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${iv.result==="PASS"?"bg-emerald-100 text-emerald-700":iv.result==="CONDITIONAL"?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}>{iv.result==="PASS"?"✅ Passed":iv.result==="CONDITIONAL"?"⚠️ Conditional":"❌ Failed"}</span>
                      <span>Overall: <strong>{iv.scoreOverall}/10</strong></span>
                      {iv.scoreCommunication&&<span>Comm: {iv.scoreCommunication}/10</span>}
                      {iv.scoreKnowledge&&<span>Know: {iv.scoreKnowledge}/10</span>}
                      {iv.scoreAttitude&&<span>Att: {iv.scoreAttitude}/10</span>}
                    </div>
                    {iv.feedback && <p className="text-[10px] text-gray-600">💬 {iv.feedback}</p>}
                    {iv.recommendation && <p className="text-[10px] text-blue-600 font-medium">📌 {iv.recommendation}</p>}
                    <p className="text-[9px] text-gray-400">By {iv.interviewer?.name} on {new Date(iv.completedAt||iv.scheduledAt).toLocaleDateString()}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => wrap(s.id, () => approveStudent(s.id))} disabled={!!loading}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {loading===s.id?<Loader2 className="w-3 h-3 animate-spin" />:<UserCheck className="w-3.5 h-3.5" />} Approve Enrollment
                  </button>
                  <button onClick={() => { const r = prompt("Reason:"); if (r !== null) wrap(s.id, () => rejectStudent(s.id, r)); }}
                    className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100">Reject</button>
                </div>
                <p className="text-[9px] text-gray-400 text-center">After approval → student pays fees → gets full dashboard access</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== ALL STUDENTS LIST ===== */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-700 px-1">All Students ({filtered.length})</h3>
        {filtered.length===0&&<p className="text-center text-gray-400 py-8 text-sm">No students found</p>}
        {filtered.map((s: any) => {
          const isExp = expanded === s.id;
          const iv = getIV(s.id);
          return (
            <div key={s.id} className="bg-white rounded-xl border">
              <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={()=>setExpanded(isExp?null:s.id)}>
                {s.profilePicture||s.user?.image
                  ? <img src={s.profilePicture||s.user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                  : <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">{s.user?.name?.charAt(0)||"?"}</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-gray-800">{s.user?.name}</h4>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${statusBadge(s.approvalStatus)}`}>{stepLabel(s.approvalStatus)}</span>
                    <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded-full">{getGradeLabelForCountry(s.gradeLevel, countryCode)}</span>
                    {s.approvalStatus==="APPROVED"&&!s.feePaid&&<span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">💳 Fees Due</span>}
                    {s.approvalStatus==="APPROVED"&&s.feePaid&&<span className="text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">✅ Full Access</span>}
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{s.user?.email} · {s.enrollments?.length||0} classes</p>
                </div>
                {isExp?<ChevronUp className="w-4 h-4 text-gray-400" />:<ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
              {isExp&&(
                <div className="px-4 pb-4 border-t space-y-3 pt-3">
                  <div className="text-[10px] text-gray-500 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl">
                    <span>📅 Applied: {new Date(s.enrolledAt).toLocaleDateString()}</span>
                    <span>🪪 ID: <strong className="font-mono">{s.idNumber||"—"}</strong></span>
                    <span>🎓 Grade: <strong>{getGradeLabelForCountry(s.gradeLevel, countryCode)}</strong></span>
                    <span>📸 Photo: {s.profilePicture?"✅":"❌"}</span>
                    <span>💰 Fees: <strong className={s.feePaid?"text-emerald-600":"text-amber-600"}>{s.feePaid?"✅ Paid":"⏳ Due"}</strong></span>
                    <span>📚 Classes: {s.enrollments?.length||0}</span>
                  </div>
                  <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    <p className="text-[10px] font-bold text-rose-700 mb-1">👨‍👩‍👧 Parent / Guardian</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div><p>Name: <strong>{s.parentName||"—"}</strong></p><p>Phone: <strong>{s.parentPhone||"—"}</strong></p><p>Email: <strong>{s.parentEmail||"—"}</strong></p></div>
                      <div>{(s.parentLinks?.length>0)?s.parentLinks.map((pl:any)=>(<div key={pl.id} className="p-1.5 bg-white rounded-lg mb-1"><p className="font-bold">{pl.parent?.user?.name}</p><p className="text-gray-500">{pl.relation} · {pl.parent?.user?.email}</p></div>)):<p className="text-gray-400">No linked account</p>}</div>
                    </div>
                  </div>
                  {iv&&iv.status==="COMPLETED"&&(
                    <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                      <p className="text-[10px] font-bold text-purple-700 mb-1">📋 Interview Result</p>
                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${iv.result==="PASS"?"bg-emerald-100 text-emerald-700":iv.result==="CONDITIONAL"?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}>{iv.result}</span>
                        <span>Score: {iv.scoreOverall}/10</span>
                        {iv.feedback&&<span className="text-gray-500">{iv.feedback}</span>}
                      </div>
                    </div>
                  )}
                  {(s.enrollments?.length>0)&&(<div><p className="text-[10px] font-bold text-gray-500 mb-1">📚 Subjects</p><div className="flex flex-wrap gap-1">{s.enrollments.map((en:any)=>(<span key={en.id} className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{en.class?.subject?.name||"Class"}</span>))}</div></div>)}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {s.approvalStatus==="PENDING"&&<button onClick={()=>setScheduleFor(s.id)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"><Calendar className="w-3 h-3" /> Schedule Interview</button>}
                    {s.approvalStatus==="INTERVIEW_SCHEDULED"&&<button onClick={()=>setScoringFor(s.id)} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"><ClipboardCheck className="w-3 h-3" /> Complete Interview</button>}
                    {s.approvalStatus==="INTERVIEWED"&&(<><button onClick={()=>wrap(s.id,()=>approveStudent(s.id))} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"><UserCheck className="w-3 h-3" /> Approve</button><button onClick={()=>{const r=prompt("Reason:");if(r!==null)wrap(s.id,()=>rejectStudent(s.id,r));}} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-bold">Reject</button></>)}
                    {s.approvalStatus==="APPROVED"&&(<div className="flex items-center gap-2 w-full"><input className="input-field text-xs flex-1" placeholder="Suspension reason..." value={suspendReason} onChange={e=>setSuspendReason(e.target.value)} /><button onClick={()=>{if(!suspendReason)return;wrap(s.id,()=>suspendStudent(s.id,suspendReason));setSuspendReason("");}} className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"><Shield className="w-3 h-3" /> Suspend</button></div>)}
                    {(s.approvalStatus==="SUSPENDED"||s.approvalStatus==="REJECTED")&&<button onClick={()=>wrap(s.id,()=>reinstateStudent(s.id))} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"><UserCheck className="w-3 h-3" /> Reinstate</button>}
                    {s.approvalStatus==="APPROVED"&&(<div className="flex items-center gap-2 w-full mt-1"><select className="input-field text-xs flex-1" value={promoteGrade} onChange={e=>setPromoteGrade(e.target.value)}><option value="">Change grade...</option>{allGrades.map((g:any)=>(<option key={g.value} value={g.value}>{g.label}</option>))}</select><button onClick={()=>{if(!promoteGrade)return;wrap(s.id,()=>promoteStudent(s.id,promoteGrade));setPromoteGrade("");}} disabled={!promoteGrade} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 disabled:opacity-50"><ArrowUp className="w-3 h-3" /> Promote</button></div>)}
                  </div>
                  {(s.payments?.length>0)&&(<div><p className="text-[10px] font-bold text-gray-500 mb-1">💰 Payments</p>{s.payments.map((p:any)=>(<div key={p.id} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-[10px]"><span>{p.description}</span><div className="flex items-center gap-2"><span className="font-bold">{p.currency} {p.amount?.toLocaleString()}</span><span className={`px-1 py-0.5 rounded text-[8px] font-medium ${p.status==="COMPLETED"?"bg-emerald-100 text-emerald-700":p.status==="UNDER_REVIEW"?"bg-amber-100 text-amber-700":"bg-gray-100"}`}>{p.status}</span></div></div>))}</div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
