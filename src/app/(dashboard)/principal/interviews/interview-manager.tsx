"use client";

import { useState } from "react";
import { submitInterviewResult, markInterviewNoShow, cancelInterview } from "@/lib/actions/interview";
import { approveStudent, rejectStudent } from "@/lib/actions/school";
import { approveTeacher, rejectTeacher } from "@/lib/actions/school";
import { acceptApplicant, rejectApplicant } from "@/lib/actions/vacancy";
import { setTeacherSalary } from "@/lib/actions/payroll";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, CheckCircle, XCircle, Clock, Star, Video, FileText, ChevronDown, ChevronUp, MessageSquare, Phone, UserCheck, UserX, DollarSign } from "lucide-react";
import InterviewChat from "@/components/interview-chat";

const STATUS_COLORS: Record<string, string> = { SCHEDULED: "bg-blue-100 text-blue-700", COMPLETED: "bg-emerald-100 text-emerald-700", CANCELLED: "bg-gray-100 text-gray-500", NO_SHOW: "bg-red-100 text-red-700" };
const RESULT_COLORS: Record<string, string> = { PASS: "bg-emerald-100 text-emerald-700", FAIL: "bg-red-100 text-red-700", PENDING_REVIEW: "bg-amber-100 text-amber-700", CONDITIONAL: "bg-blue-100 text-blue-700" };

export default function InterviewManager({ interviews, schoolCurrency }: { interviews: any[]; schoolCurrency?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<"scheduled" | "completed" | "all">("scheduled");
  const [scoreForm, setScoreForm] = useState<Record<string, any>>({});
  const [salaryFor, setSalaryFor] = useState<string | null>(null);
  const [salaryForm, setSalaryForm] = useState({ baseSalary: 0, currency: schoolCurrency || "USD", payFrequency: "MONTHLY", housingAllowance: 0, transportAllowance: 0, otherAllowances: 0, taxRate: 0, pensionRate: 0, otherDeductions: 0, notes: "" });

  const scheduled = interviews.filter((i) => i.status === "SCHEDULED");
  const completed = interviews.filter((i) => i.status === "COMPLETED");
  const current = tab === "scheduled" ? scheduled : tab === "completed" ? completed : interviews;

  const getCandidateName = (i: any) => { if (i.student) return i.student.user.name; if (i.schoolTeacher) return i.schoolTeacher.teacher.user.name; if (i.vacancyApp) return i.vacancyApp.applicantName; return "Unknown"; };
  const getCandidateEmail = (i: any) => { if (i.student) return i.student.user.email; if (i.schoolTeacher) return i.schoolTeacher.teacher.user.email; if (i.vacancyApp) return i.vacancyApp.applicantEmail; return ""; };
  const getTypeLabel = (i: any) => { if (i.type === "ADMISSION") return "Student Admission"; if (i.type === "HIRING") return "Teacher Hiring"; if (i.type === "VACANCY") return `Vacancy: ${i.vacancyApp?.vacancy?.title || ""}`; return i.type; };
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const initScoreForm = (id: string) => { setScoreForm({ ...scoreForm, [id]: { result: "PASS", scoreOverall: 80, scoreCommunication: 8, scoreKnowledge: 8, scoreAttitude: 8, scoreExperience: 8, feedback: "", recommendation: "" } }); setExpanded(id); setChatOpen(null); };
  const handleSubmitResult = async (id: string) => { const form = scoreForm[id]; if (!form) return; setLoading(id); await submitInterviewResult({ interviewId: id, ...form }); router.refresh(); setExpanded(null); setLoading(""); };
  const handleNoShow = async (id: string) => { if (!confirm("Mark as no-show?")) return; setLoading(id); await markInterviewNoShow(id); router.refresh(); setLoading(""); };
  const handleCancel = async (id: string) => { if (!confirm("Cancel?")) return; setLoading(id); await cancelInterview(id); router.refresh(); setLoading(""); };

  const handleApproveCandidate = async (interview: any) => {
    setLoading("approve-" + interview.id);
    if (interview.studentId) { await approveStudent(interview.studentId); }
    else if (interview.schoolTeacherId) {
      await approveTeacher(interview.schoolTeacherId);
      // Show salary form for teachers
      setSalaryFor(interview.schoolTeacherId);
      setSalaryForm({ ...salaryForm, currency: schoolCurrency || "USD" });
    }
    else if (interview.vacancyAppId) { await acceptApplicant(interview.vacancyAppId); }
    router.refresh();
    setLoading("");
  };

  const handleDeclineCandidate = async (interview: any) => {
    if (!confirm("Decline?")) return; setLoading("decline-" + interview.id);
    if (interview.studentId) await rejectStudent(interview.studentId);
    else if (interview.schoolTeacherId) await rejectTeacher(interview.schoolTeacherId);
    else if (interview.vacancyAppId) await rejectApplicant(interview.vacancyAppId);
    router.refresh(); setLoading("");
  };

  const handleSaveSalary = async (stId: string) => {
    if (salaryForm.baseSalary <= 0) { alert("Enter a salary amount"); return; }
    setLoading("salary"); await setTeacherSalary({ schoolTeacherId: stId, ...salaryForm }); setSalaryFor(null); router.refresh(); setLoading("");
  };

  const isPendingDecision = (i: any) => {
    if (i.status !== "COMPLETED") return false;
    if (i.student && ["INTERVIEWED", "INTERVIEW_SCHEDULED"].includes(i.student.approvalStatus)) return true;
    if (i.schoolTeacher && ["INTERVIEWED", "INTERVIEW_SCHEDULED"].includes(i.schoolTeacher.status)) return true;
    if (i.vacancyApp && i.vacancyApp.status === "INTERVIEWED") return true;
    return false;
  };

  const isAlreadyDecided = (i: any) => {
    if (i.student && ["APPROVED", "REJECTED"].includes(i.student.approvalStatus)) return i.student.approvalStatus;
    if (i.schoolTeacher && ["APPROVED", "REJECTED"].includes(i.schoolTeacher.status)) return i.schoolTeacher.status;
    if (i.vacancyApp && ["ACCEPTED", "REJECTED"].includes(i.vacancyApp.status)) return i.vacancyApp.status;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Salary form overlay */}
      {salaryFor && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center"><DollarSign className="w-5 h-5" /></div>
            <div>
              <h3 className="text-base font-bold text-emerald-800">Set Salary for New Teacher</h3>
              <p className="text-xs text-emerald-600">Teacher has been approved! Set their salary now or do it later from Payroll.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] font-medium text-gray-500 uppercase">Base Salary *</label>
              <input type="number" className="input-field" placeholder="e.g. 150000" value={salaryForm.baseSalary || ""} onChange={(e) => setSalaryForm((p) => ({ ...p, baseSalary: parseFloat(e.target.value) || 0 }))} /></div>
            <div><label className="text-[10px] font-medium text-gray-500 uppercase">Currency</label>
              <select className="input-field" value={salaryForm.currency} onChange={(e) => setSalaryForm((p) => ({ ...p, currency: e.target.value }))}>
                <option value="NGN">NGN</option><option value="KES">KES</option><option value="GHS">GHS</option><option value="ZAR">ZAR</option>
                <option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option><option value="XOF">XOF</option>
                <option value="TZS">TZS</option><option value="UGX">UGX</option>
              </select></div>
            <div><label className="text-[10px] font-medium text-gray-500 uppercase">Frequency</label>
              <select className="input-field" value={salaryForm.payFrequency} onChange={(e) => setSalaryForm((p) => ({ ...p, payFrequency: e.target.value }))}>
                <option value="MONTHLY">Monthly</option><option value="BI_WEEKLY">Bi-Weekly</option><option value="WEEKLY">Weekly</option>
              </select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] text-gray-500">Housing Allow.</label><input type="number" className="input-field" value={salaryForm.housingAllowance || ""} onChange={(e) => setSalaryForm((p) => ({ ...p, housingAllowance: parseFloat(e.target.value) || 0 }))} /></div>
            <div><label className="text-[10px] text-gray-500">Transport Allow.</label><input type="number" className="input-field" value={salaryForm.transportAllowance || ""} onChange={(e) => setSalaryForm((p) => ({ ...p, transportAllowance: parseFloat(e.target.value) || 0 }))} /></div>
            <div><label className="text-[10px] text-gray-500">Tax Rate %</label><input type="number" className="input-field" step="0.1" value={salaryForm.taxRate || ""} onChange={(e) => setSalaryForm((p) => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))} /></div>
          </div>
          {salaryForm.baseSalary > 0 && (() => {
            const gross = salaryForm.baseSalary + salaryForm.housingAllowance + salaryForm.transportAllowance;
            const net = gross - (gross * salaryForm.taxRate / 100);
            return <div className="p-3 bg-white rounded-lg text-center"><span className="text-xs text-gray-500">Net Pay: </span><span className="text-lg font-bold text-emerald-700">{salaryForm.currency} {fmt(net)}/mo</span></div>;
          })()}
          <div className="flex gap-2">
            <button onClick={() => handleSaveSalary(salaryFor)} disabled={loading === "salary"} className="btn-primary text-sm">{loading === "salary" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Salary"}</button>
            <button onClick={() => setSalaryFor(null)} className="btn-ghost text-sm">Skip — Set Later</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ key: "scheduled", label: `Scheduled (${scheduled.length})` }, { key: "completed", label: `Completed (${completed.length})` }, { key: "all", label: `All (${interviews.length})` }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`text-xs px-4 py-2 rounded-lg font-medium ${tab === t.key ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}>{t.label}</button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="card text-center py-12"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No interviews to show.</p></div>
      ) : (
        <div className="space-y-4">
          {current.map((interview: any) => {
            const decided = isAlreadyDecided(interview);
            const pendingDecision = isPendingDecision(interview);
            return (
              <div key={interview.id} className="card">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${interview.type === "ADMISSION" ? "bg-blue-100 text-blue-600" : interview.type === "VACANCY" ? "bg-purple-100 text-purple-600" : "bg-emerald-100 text-emerald-600"}`}>
                    {interview.type === "ADMISSION" ? "S" : interview.type === "VACANCY" ? "V" : "T"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-gray-800">{getCandidateName(interview)}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[interview.status]}`}>{interview.status}</span>
                      {interview.result && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RESULT_COLORS[interview.result]}`}>{interview.result}</span>}
                      {decided && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${decided === "APPROVED" || decided === "ACCEPTED" ? "bg-emerald-200 text-emerald-800" : "bg-red-200 text-red-800"}`}>{decided === "APPROVED" || decided === "ACCEPTED" ? "APPROVED" : "DECLINED"}</span>}
                    </div>
                    <p className="text-xs text-gray-500">{getCandidateEmail(interview)}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(interview.scheduledAt).toLocaleString()}</span>
                      <span>{interview.duration} min</span><span>{getTypeLabel(interview)}</span>
                      {interview.scoreOverall != null && <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {interview.scoreOverall}/100</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {interview.status === "SCHEDULED" && (
                      <>
                        <button onClick={() => setChatOpen(chatOpen === interview.id ? null : interview.id)} className={`text-[10px] px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 ${chatOpen === interview.id ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600"}`}><MessageSquare className="w-3 h-3" /> Chat</button>
                        {interview.meetingLink && <a href={interview.meetingLink} target="_blank" rel="noopener" className="text-[10px] px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-600 font-medium flex items-center gap-1"><Video className="w-3 h-3" /> Zoom</a>}
                        <a href={`tel:`} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> Call</a>
                        <button onClick={() => expanded === interview.id ? setExpanded(null) : initScoreForm(interview.id)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-600 font-medium flex items-center gap-1"><FileText className="w-3 h-3" /> Result</button>
                        <button onClick={() => handleNoShow(interview.id)} className="text-amber-400 text-[10px] px-1.5">No-show</button>
                        <button onClick={() => handleCancel(interview.id)} className="text-red-400 text-[10px] px-1.5">Cancel</button>
                      </>
                    )}
                    {interview.status === "COMPLETED" && <button onClick={() => setExpanded(expanded === interview.id ? null : interview.id)} className="text-gray-400">{expanded === interview.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>}
                  </div>
                </div>

                {chatOpen === interview.id && <div className="mt-4"><InterviewChat interviewId={interview.id} onClose={() => setChatOpen(null)} /></div>}

                {/* Score form */}
                {expanded === interview.id && interview.status === "SCHEDULED" && scoreForm[interview.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <h4 className="text-sm font-semibold">Interview Evaluation</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      {[{ key: "scoreCommunication", label: "Communication /10" }, { key: "scoreKnowledge", label: "Knowledge /10" }, { key: "scoreAttitude", label: "Attitude /10" }, { key: "scoreExperience", label: "Experience /10" }, { key: "scoreOverall", label: "Overall /100" }].map((s) => (
                        <div key={s.key}><label className="text-[10px] font-medium text-gray-500 uppercase">{s.label}</label>
                          <input type="number" className="input-field" min={0} max={s.key === "scoreOverall" ? 100 : 10} value={scoreForm[interview.id][s.key]}
                            onChange={(e) => setScoreForm((p: any) => ({ ...p, [interview.id]: { ...p[interview.id], [s.key]: parseInt(e.target.value) || 0 } }))} /></div>
                      ))}
                    </div>
                    <select className="input-field max-w-xs" value={scoreForm[interview.id].result} onChange={(e) => setScoreForm((p: any) => ({ ...p, [interview.id]: { ...p[interview.id], result: e.target.value } }))}>
                      <option value="PASS">Pass</option><option value="CONDITIONAL">Conditional</option><option value="FAIL">Fail</option><option value="PENDING_REVIEW">Pending</option>
                    </select>
                    <textarea className="input-field min-h-[80px]" placeholder="Feedback *" value={scoreForm[interview.id].feedback} onChange={(e) => setScoreForm((p: any) => ({ ...p, [interview.id]: { ...p[interview.id], feedback: e.target.value } }))} />
                    <div className="flex gap-2">
                      <button onClick={() => handleSubmitResult(interview.id)} disabled={loading === interview.id || !scoreForm[interview.id].feedback} className="btn-primary text-sm">{loading === interview.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}</button>
                      <button onClick={() => setExpanded(null)} className="btn-ghost text-sm">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Completed + approve/decline */}
                {expanded === interview.id && interview.status === "COMPLETED" && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-5 gap-3 mb-4">
                      {[{ l: "Communication", v: interview.scoreCommunication, m: "/10" }, { l: "Knowledge", v: interview.scoreKnowledge, m: "/10" }, { l: "Attitude", v: interview.scoreAttitude, m: "/10" }, { l: "Experience", v: interview.scoreExperience, m: "/10" }, { l: "Overall", v: interview.scoreOverall, m: "/100" }].map((s) => (
                        <div key={s.l} className="text-center p-2 bg-gray-50 rounded-lg"><div className="text-lg font-bold">{s.v ?? "—"}<span className="text-xs text-gray-400">{s.m}</span></div><div className="text-[10px] text-gray-500 uppercase">{s.l}</div></div>
                      ))}
                    </div>
                    {interview.feedback && <div className="mb-3 p-3 bg-gray-50 rounded-lg"><span className="text-xs font-semibold text-gray-600">Feedback:</span><p className="text-sm text-gray-700 mt-1">{interview.feedback}</p></div>}
                    {interview.recommendation && <div className="mb-3 p-3 bg-gray-50 rounded-lg"><span className="text-xs font-semibold text-gray-600">Recommendation:</span><p className="text-sm text-gray-700 mt-1">{interview.recommendation}</p></div>}
                    <p className="text-xs text-gray-400 mb-4">By: {interview.interviewer.name} • {interview.completedAt && new Date(interview.completedAt).toLocaleString()}</p>

                    {pendingDecision && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-3">
                        <h4 className="text-sm font-bold text-amber-800 mb-2">Decision Required</h4>
                        <p className="text-xs text-amber-600 mb-4">Result: <strong>{interview.result}</strong>. Approve or decline?</p>
                        <div className="flex gap-3">
                          <button onClick={() => handleApproveCandidate(interview)} disabled={loading === "approve-" + interview.id}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold">
                            {loading === "approve-" + interview.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserCheck className="w-4 h-4" /> Approve</>}
                          </button>
                          <button onClick={() => handleDeclineCandidate(interview)} disabled={loading === "decline-" + interview.id}
                            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold">
                            {loading === "decline-" + interview.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserX className="w-4 h-4" /> Decline</>}
                          </button>
                        </div>
                      </div>
                    )}

                    {decided && (
                      <div className={`p-4 rounded-xl ${decided === "APPROVED" || decided === "ACCEPTED" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                        <div className="flex items-center gap-2">
                          {decided === "APPROVED" || decided === "ACCEPTED" ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                          <span className={`text-sm font-bold ${decided === "APPROVED" || decided === "ACCEPTED" ? "text-emerald-800" : "text-red-800"}`}>{decided === "APPROVED" || decided === "ACCEPTED" ? "APPROVED" : "DECLINED"}</span>
                        </div>
                      </div>
                    )}

                    <button onClick={() => setChatOpen(chatOpen === interview.id ? null : interview.id)} className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-3">
                      <MessageSquare className="w-3 h-3" /> {chatOpen === interview.id ? "Hide" : "View"} Chat
                    </button>
                  </div>
                )}
                {chatOpen === interview.id && interview.status === "COMPLETED" && <div className="mt-3"><InterviewChat interviewId={interview.id} onClose={() => setChatOpen(null)} /></div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
