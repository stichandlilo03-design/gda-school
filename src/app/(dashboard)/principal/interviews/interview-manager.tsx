"use client";

import { useState } from "react";
import { submitInterviewResult, markInterviewNoShow, cancelInterview } from "@/lib/actions/interview";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, CheckCircle, XCircle, Clock, Star, Video, FileText, ChevronDown, ChevronUp } from "lucide-react";

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
  const [tab, setTab] = useState<"scheduled" | "completed" | "all">("scheduled");
  const [scoreForm, setScoreForm] = useState<Record<string, any>>({});

  const scheduled = interviews.filter((i: any) => i.status === "SCHEDULED");
  const completed = interviews.filter((i: any) => i.status === "COMPLETED");
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

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "scheduled", label: `Scheduled (${scheduled.length})` },
          { key: "completed", label: `Completed (${completed.length})` },
          { key: "all", label: `All (${interviews.length})` },
        ].map((t: any) => (
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
        <div className="space-y-3">
          {current.map((interview: any) => (
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
                  </div>
                  <p className="text-xs text-gray-500">{getCandidateEmail(interview)}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(interview.scheduledAt).toLocaleString()}</span>
                    <span>{interview.duration} min</span>
                    <span>{getTypeLabel(interview)}</span>
                    {interview.scoreOverall && <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {interview.scoreOverall}/100</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {interview.status === "SCHEDULED" && (
                    <>
                      {interview.meetingLink && (
                        <a href={interview.meetingLink} target="_blank" rel="noopener" className="btn-ghost text-xs px-3 py-1.5 bg-brand-50 text-brand-600">
                          <Video className="w-3 h-3 mr-1" /> Join
                        </a>
                      )}
                      <button onClick={() => expanded === interview.id ? setExpanded(null) : initScoreForm(interview.id)} className="btn-primary text-xs px-3 py-1.5">
                        <FileText className="w-3 h-3 mr-1" /> Submit Result
                      </button>
                      <button onClick={() => handleNoShow(interview.id)} className="text-amber-500 hover:text-amber-700 text-xs px-2">No-show</button>
                      <button onClick={() => handleCancel(interview.id)} className="text-red-400 hover:text-red-600 text-xs px-2">Cancel</button>
                    </>
                  )}
                  {interview.status === "COMPLETED" && (
                    <button onClick={() => setExpanded(expanded === interview.id ? null : interview.id)} className="text-gray-400">
                      {expanded === interview.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Score form for scheduled */}
              {expanded === interview.id && interview.status === "SCHEDULED" && scoreForm[interview.id] && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  <h4 className="text-sm font-semibold">Interview Evaluation</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {[
                      { key: "scoreCommunication", label: "Communication" },
                      { key: "scoreKnowledge", label: "Knowledge" },
                      { key: "scoreAttitude", label: "Attitude" },
                      { key: "scoreExperience", label: "Experience" },
                      { key: "scoreOverall", label: "Overall (/100)" },
                    ].map((s: any) => (
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
                    <textarea className="input-field min-h-[80px]" placeholder="Detailed feedback about the interview..."
                      value={scoreForm[interview.id].feedback}
                      onChange={(e) => setScoreForm((p: any) => ({ ...p, [interview.id]: { ...p[interview.id], feedback: e.target.value } }))} />
                  </div>
                  <div>
                    <label className="label">Recommendation</label>
                    <textarea className="input-field" rows={2} placeholder="Your recommendation for the principal..."
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

              {/* View result for completed */}
              {expanded === interview.id && interview.status === "COMPLETED" && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-5 gap-3 mb-4">
                    {[
                      { label: "Communication", value: interview.scoreCommunication },
                      { label: "Knowledge", value: interview.scoreKnowledge },
                      { label: "Attitude", value: interview.scoreAttitude },
                      { label: "Experience", value: interview.scoreExperience },
                      { label: "Overall", value: interview.scoreOverall },
                    ].map((s: any) => (
                      <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">{s.value ?? "—"}{s.label !== "Overall" ? "/10" : "/100"}</div>
                        <div className="text-[10px] text-gray-500 uppercase">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {interview.feedback && (
                    <div className="mb-3"><span className="text-xs font-semibold text-gray-600">Feedback:</span><p className="text-sm text-gray-700 mt-1">{interview.feedback}</p></div>
                  )}
                  {interview.recommendation && (
                    <div><span className="text-xs font-semibold text-gray-600">Recommendation:</span><p className="text-sm text-gray-700 mt-1">{interview.recommendation}</p></div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Interviewed by: {interview.interviewer.name} • Completed: {new Date(interview.completedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
