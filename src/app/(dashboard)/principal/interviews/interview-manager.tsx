"use client";

import { useState } from "react";
import { submitInterviewResult, markInterviewNoShow, cancelInterview } from "@/lib/actions/interview";
import { approveStudent, rejectStudent } from "@/lib/actions/school";
import { approveTeacher, rejectTeacher } from "@/lib/actions/school";
import { acceptApplicant, rejectApplicant } from "@/lib/actions/vacancy";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, CheckCircle, XCircle, Clock, Star, Video, FileText, ChevronDown, ChevronUp, MessageSquare, Phone, UserCheck, UserX } from "lucide-react";
import InterviewChat from "@/components/interview-chat";

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  NO_SHOW: "bg-red-100 text-red-700",
};

const RESULT_COLORS: Record<string, string> = {
  PASS: "bg-emerald-100 text-emerald-700",
  FAIL: "bg-red-100 text-red-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-700",
  CONDITIONAL: "bg-blue-100 text-blue-700",
};

export default function InterviewManager({ interviews }: { interviews: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<"scheduled" | "completed" | "all">("scheduled");
  const [scoreForm, setScoreForm] = useState<Record<string, any>>({});

  const scheduled = interviews.filter((i) => i.status === "SCHEDULED");
  const completed = interviews.filter((i) => i.status === "COMPLETED");
  const current = tab === "scheduled" ? scheduled : tab === "completed" ? completed : interviews;

  const getCandidateName = (i: any) => {
    if (i.student) return i.student.user.name;
    if (i.schoolTeacher) return i.schoolTeacher.teacher.user.name;
    if (i.vacancyApp) return i.vacancyApp.applicantName || "Applicant";
    return "Unknown";
  };

  const getCandidateEmail = (i: any) => {
    if (i.student) return i.student.user.email;
    if (i.schoolTeacher) return i.schoolTeacher.teacher.user.email;
    if (i.vacancyApp) return i.vacancyApp.applicantEmail;
    return "";
  };

  const getTypeLabel = (i: any) => {
    if (i.type === "ADMISSION") return "Student Admission";
    if (i.type === "HIRING") return "Teacher Hiring";
    if (i.type === "VACANCY") return `Vacancy: ${i.vacancyApp?.vacancy?.title || ""}`;
    return i.type;
  };

  const initScoreForm = (id: string) => {
    setScoreForm({
      ...scoreForm,
      [id]: { result: "PASS", scoreOverall: 80, scoreCommunication: 8, scoreKnowledge: 8, scoreAttitude: 8, scoreExperience: 8, feedback: "", recommendation: "" },
    });
    setExpanded(id);
    setChatOpen(null);
  };

  const handleSubmitResult = async (interviewId: string) => {
    const form = scoreForm[interviewId];
    if (!form) return;
    setLoading(interviewId);
    await submitInterviewResult({ interviewId, ...form });
    router.refresh();
    setExpanded(null);
    setLoading("");
  };

  const handleNoShow = async (id: string) => {
    if (!confirm("Mark as no-show?")) return;
    setLoading(id);
    await markInterviewNoShow(id);
    router.refresh();
    setLoading("");
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this interview?")) return;
    setLoading(id);
    await cancelInterview(id);
    router.refresh();
    setLoading("");
  };

  // Approve/Decline after interview
  const handleApproveCandidate = async (interview: any) => {
    setLoading("approve-" + interview.id);
    if (interview.studentId) {
      await approveStudent(interview.studentId);
    } else if (interview.schoolTeacherId) {
      await approveTeacher(interview.schoolTeacherId);
    } else if (interview.vacancyAppId) {
      await acceptApplicant(interview.vacancyAppId);
    }
    router.refresh();
    setLoading("");
  };

  const handleDeclineCandidate = async (interview: any) => {
    if (!confirm("Decline this candidate?")) return;
    setLoading("decline-" + interview.id);
    if (interview.studentId) {
      await rejectStudent(interview.studentId);
    } else if (interview.schoolTeacherId) {
      await rejectTeacher(interview.schoolTeacherId);
    } else if (interview.vacancyAppId) {
      await rejectApplicant(interview.vacancyAppId);
    }
    router.refresh();
    setLoading("");
  };

  // Check if candidate is still pending decision
  const isPendingDecision = (interview: any) => {
    if (interview.status !== "COMPLETED") return false;
    if (interview.student && (interview.student.approvalStatus === "INTERVIEWED" || interview.student.approvalStatus === "INTERVIEW_SCHEDULED")) return true;
    if (interview.schoolTeacher && (interview.schoolTeacher.status === "INTERVIEWED" || interview.schoolTeacher.status === "INTERVIEW_SCHEDULED")) return true;
    if (interview.vacancyApp && interview.vacancyApp.status === "INTERVIEWED") return true;
    return false;
  };

  const isAlreadyDecided = (interview: any) => {
    if (interview.student && (interview.student.approvalStatus === "APPROVED" || interview.student.approvalStatus === "REJECTED")) return interview.student.approvalStatus;
    if (interview.schoolTeacher && (interview.schoolTeacher.status === "APPROVED" || interview.schoolTeacher.status === "REJECTED")) return interview.schoolTeacher.status;
    if (interview.vacancyApp && (interview.vacancyApp.status === "ACCEPTED" || interview.vacancyApp.status === "REJECTED")) return interview.vacancyApp.status;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "scheduled", label: `Scheduled (${scheduled.length})` },
          { key: "completed", label: `Completed (${completed.length})` },
          { key: "all", label: `All (${interviews.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`text-xs px-4 py-2 rounded-lg font-medium ${tab === t.key ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No interviews to show.</p>
        </div>
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
                      {decided && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          decided === "APPROVED" || decided === "ACCEPTED" ? "bg-emerald-200 text-emerald-800" : "bg-red-200 text-red-800"
                        }`}>{decided === "APPROVED" || decided === "ACCEPTED" ? "APPROVED" : "DECLINED"}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{getCandidateEmail(interview)}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(interview.scheduledAt).toLocaleString()}</span>
                      <span>{interview.duration} min</span>
                      <span>{getTypeLabel(interview)}</span>
                      {interview.scoreOverall != null && <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {interview.scoreOverall}/100</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {interview.status === "SCHEDULED" && (
                      <>
                        {/* Interview Mode Buttons */}
                        <button onClick={() => setChatOpen(chatOpen === interview.id ? null : interview.id)}
                          className={`text-[10px] px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 ${chatOpen === interview.id ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600 hover:bg-brand-100"}`}>
                          <MessageSquare className="w-3 h-3" /> Chat
                        </button>
                        {interview.meetingLink && (
                          <a href={interview.meetingLink} target="_blank" rel="noopener"
                            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 font-medium flex items-center gap-1">
                            <Video className="w-3 h-3" /> Zoom/Meet
                          </a>
                        )}
                        <a href={`tel:${getCandidateEmail(interview)}`}
                          className="text-[10px] px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Call
                        </a>
                        <button onClick={() => expanded === interview.id ? setExpanded(null) : initScoreForm(interview.id)}
                          className="text-[10px] px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 font-medium flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Submit Result
                        </button>
                        <button onClick={() => handleNoShow(interview.id)} className="text-amber-400 hover:text-amber-600 text-[10px] px-1.5">No-show</button>
                        <button onClick={() => handleCancel(interview.id)} className="text-red-400 hover:text-red-600 text-[10px] px-1.5">Cancel</button>
                      </>
                    )}
                    {interview.status === "COMPLETED" && (
                      <button onClick={() => setExpanded(expanded === interview.id ? null : interview.id)} className="text-gray-400">
                        {expanded === interview.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Chat panel */}
                {chatOpen === interview.id && (
                  <div className="mt-4">
                    <InterviewChat interviewId={interview.id} onClose={() => setChatOpen(null)} />
                  </div>
                )}

                {/* Score form for scheduled */}
                {expanded === interview.id && interview.status === "SCHEDULED" && scoreForm[interview.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <h4 className="text-sm font-semibold">Interview Evaluation</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      {[
                        { key: "scoreCommunication", label: "Communication (/10)" },
                        { key: "scoreKnowledge", label: "Knowledge (/10)" },
                        { key: "scoreAttitude", label: "Attitude (/10)" },
                        { key: "scoreExperience", label: "Experience (/10)" },
                        { key: "scoreOverall", label: "Overall (/100)" },
                      ].map((s) => (
                        <div key={s.key}>
                          <label className="text-[10px] font-medium text-gray-500 uppercase">{s.label}</label>
                          <input type="number" className="input-field" min={0} max={s.key === "scoreOverall" ? 100 : 10}
                            value={scoreForm[interview.id][s.key]}
                            onChange={(e) => setScoreForm((p: any) => ({ ...p, [interview.id]: { ...p[interview.id], [s.key]: parseInt(e.target.value) || 0 } }))} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="label">Result</label>
                      <select className="input-field max-w-xs" value={scoreForm[interview.id].result}
                        onChange={(e) => setScoreForm((p: any) => ({ ...p, [interview.id]: { ...p[interview.id], result: e.target.value } }))}>
                        <option value="PASS">Pass — Recommend Approval</option>
                        <option value="CONDITIONAL">Conditional — Needs Follow-up</option>
                        <option value="FAIL">Fail — Do Not Approve</option>
                        <option value="PENDING_REVIEW">Pending — Need More Info</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Feedback *</label>
                      <textarea className="input-field min-h-[80px]" placeholder="Detailed feedback..."
                        value={scoreForm[interview.id].feedback}
                        onChange={(e) => setScoreForm((p: any) => ({ ...p, [interview.id]: { ...p[interview.id], feedback: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="label">Recommendation</label>
                      <textarea className="input-field" rows={2} placeholder="Recommendation..."
                        value={scoreForm[interview.id].recommendation}
                        onChange={(e) => setScoreForm((p: any) => ({ ...p, [interview.id]: { ...p[interview.id], recommendation: e.target.value } }))} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSubmitResult(interview.id)} disabled={loading === interview.id || !scoreForm[interview.id].feedback} className="btn-primary text-sm">
                        {loading === interview.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Evaluation"}
                      </button>
                      <button onClick={() => setExpanded(null)} className="btn-ghost text-sm">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Completed view with APPROVE / DECLINE buttons */}
                {expanded === interview.id && interview.status === "COMPLETED" && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {/* Scores */}
                    <div className="grid grid-cols-5 gap-3 mb-4">
                      {[
                        { label: "Communication", value: interview.scoreCommunication, max: "/10" },
                        { label: "Knowledge", value: interview.scoreKnowledge, max: "/10" },
                        { label: "Attitude", value: interview.scoreAttitude, max: "/10" },
                        { label: "Experience", value: interview.scoreExperience, max: "/10" },
                        { label: "Overall", value: interview.scoreOverall, max: "/100" },
                      ].map((s) => (
                        <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-900">{s.value ?? "—"}<span className="text-xs text-gray-400">{s.max}</span></div>
                          <div className="text-[10px] text-gray-500 uppercase">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {interview.feedback && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs font-semibold text-gray-600">Feedback:</span>
                        <p className="text-sm text-gray-700 mt-1">{interview.feedback}</p>
                      </div>
                    )}
                    {interview.recommendation && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs font-semibold text-gray-600">Recommendation:</span>
                        <p className="text-sm text-gray-700 mt-1">{interview.recommendation}</p>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mb-4">Interviewed by: {interview.interviewer.name} • {new Date(interview.completedAt).toLocaleString()}</p>

                    {/* APPROVE / DECLINE BUTTONS */}
                    {pendingDecision && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <h4 className="text-sm font-bold text-amber-800 mb-3">Decision Required</h4>
                        <p className="text-xs text-amber-600 mb-4">
                          Based on the interview results ({interview.result}), do you want to approve or decline this candidate?
                        </p>
                        <div className="flex gap-3">
                          <button onClick={() => handleApproveCandidate(interview)}
                            disabled={loading === "approve-" + interview.id}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold transition-colors">
                            {loading === "approve-" + interview.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserCheck className="w-4 h-4" /> Approve & Admit</>}
                          </button>
                          <button onClick={() => handleDeclineCandidate(interview)}
                            disabled={loading === "decline-" + interview.id}
                            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold transition-colors">
                            {loading === "decline-" + interview.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserX className="w-4 h-4" /> Decline</>}
                          </button>
                        </div>
                      </div>
                    )}

                    {decided && (
                      <div className={`p-4 rounded-xl ${decided === "APPROVED" || decided === "ACCEPTED" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                        <div className="flex items-center gap-2">
                          {decided === "APPROVED" || decided === "ACCEPTED" ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                          <span className={`text-sm font-bold ${decided === "APPROVED" || decided === "ACCEPTED" ? "text-emerald-800" : "text-red-800"}`}>
                            Candidate has been {decided === "APPROVED" || decided === "ACCEPTED" ? "APPROVED" : "DECLINED"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Chat history button */}
                    <div className="mt-3">
                      <button onClick={() => setChatOpen(chatOpen === interview.id ? null : interview.id)}
                        className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {chatOpen === interview.id ? "Hide" : "View"} Chat History
                      </button>
                    </div>
                  </div>
                )}

                {/* Chat for completed interviews */}
                {chatOpen === interview.id && interview.status === "COMPLETED" && (
                  <div className="mt-3">
                    <InterviewChat interviewId={interview.id} onClose={() => setChatOpen(null)} />
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
