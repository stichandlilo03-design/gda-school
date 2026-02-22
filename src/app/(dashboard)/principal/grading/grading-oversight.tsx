"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveGrades, rejectGrades, generateTermReports, approveTermReport, rejectTermReport } from "@/lib/actions/grading";
import { getGradeLabelForCountry, getEducationSystem } from "@/lib/education-systems";
import { CheckCircle, XCircle, Loader2, FileText, Award, AlertTriangle, Send, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";

export default function GradingOversight({ pendingAssessments, approvedAssessments, terms, termReports, assignments = [], countryCode }: {
  pendingAssessments: any[]; approvedAssessments: any[]; terms: any[]; termReports: any[]; assignments?: any[]; countryCode: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"pending" | "approved" | "reports" | "assignments">("pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState(terms.find((t: any) => t.isActive)?.id || terms[0]?.id || "");
  const [rejectReason, setRejectReason] = useState("");
  const [reportExpanded, setReportExpanded] = useState<string | null>(null);
  const [promoteGrade, setPromoteGrade] = useState("");
  const [principalRemarks, setPrincipalRemarks] = useState("");

  const eduSystem = getEducationSystem(countryCode);
  const allGrades = eduSystem.levels.flatMap(l => l.grades);

  const filteredReports = termReports.filter((r: any) => !selectedTerm || r.termId === selectedTerm);
  const pendingReports = filteredReports.filter((r: any) => r.status === "SUBMITTED" || r.status === "DRAFT");
  const approvedReports = filteredReports.filter((r: any) => r.status === "APPROVED");

  const handleApproveGrade = async (id: string) => {
    setLoading(id); await approveGrades(id);
    setMessage("✅ Grades approved!"); router.refresh(); setLoading("");
  };

  const handleRejectGrade = async (id: string) => {
    const reason = rejectReason || prompt("Reason for rejection:") || "Needs revision";
    setLoading(id); await rejectGrades(id, reason);
    setMessage("Grades returned to teacher for revision."); router.refresh(); setLoading(""); setRejectReason("");
  };

  const handleGenerateReports = async () => {
    if (!selectedTerm) { setMessage("Error: Select a term first"); return; }
    setLoading("generate");
    const result = await generateTermReports(selectedTerm);
    if (result.error) setMessage("Error: " + result.error);
    else setMessage(`✅ Generated ${result.generated} term reports!`);
    router.refresh(); setLoading("");
  };

  const handleApproveReport = async (reportId: string, promote: boolean) => {
    setLoading(reportId);
    await approveTermReport(reportId, principalRemarks, promote, promote ? promoteGrade : undefined);
    setMessage(promote ? "✅ Report approved & student promoted!" : "✅ Report approved!");
    router.refresh(); setLoading(""); setPrincipalRemarks(""); setPromoteGrade("");
  };

  const handleRejectReport = async (reportId: string) => {
    const reason = prompt("Reason for rejection:") || "Needs revision";
    setLoading(reportId); await rejectTermReport(reportId, reason);
    router.refresh(); setLoading("");
  };

  const gradeColor = (g: string) => {
    if (g === "A") return "text-emerald-700 bg-emerald-100";
    if (g === "B") return "text-blue-700 bg-blue-100";
    if (g === "C") return "text-amber-700 bg-amber-100";
    return "text-red-700 bg-red-100";
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-xl text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message} <button onClick={() => setMessage("")} className="float-right">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center py-3 border-amber-200">
          <p className="text-2xl font-bold text-amber-600">{pendingAssessments.length}</p>
          <p className="text-[10px] text-gray-500">Pending Grade Approval</p>
        </div>
        <div className="card text-center py-3 border-emerald-200">
          <p className="text-2xl font-bold text-emerald-600">{approvedAssessments.length}</p>
          <p className="text-[10px] text-gray-500">Approved (Recent)</p>
        </div>
        <div className="card text-center py-3 border-blue-200">
          <p className="text-2xl font-bold text-blue-600">{pendingReports.length}</p>
          <p className="text-[10px] text-gray-500">Pending Reports</p>
        </div>
        <div className="card text-center py-3 border-purple-200">
          <p className="text-2xl font-bold text-purple-600">{approvedReports.length}</p>
          <p className="text-[10px] text-gray-500">Signed Reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: "pending", label: `⏳ Pending Grades (${pendingAssessments.length})` },
          { key: "approved", label: "✅ Approved Grades" },
          { key: "assignments", label: `📝 Assignments (${assignments.length})` },
          { key: "reports", label: "📋 Term Reports & Promotions" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-sm font-medium ${tab === t.key ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* PENDING GRADES TAB */}
      {tab === "pending" && (
        <div className="space-y-3">
          {pendingAssessments.length === 0 ? (
            <div className="card text-center py-12"><p className="text-gray-400 text-sm">No grades pending approval</p></div>
          ) : pendingAssessments.map((a: any) => {
            const isExp = expanded === a.id;
            return (
              <div key={a.id} className="card border-l-4 border-l-amber-400">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : a.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold">{a.title}</h4>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-amber-100 text-amber-700">{a.type.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {a.class?.subject?.name} • {getGradeLabelForCountry(a.class?.schoolGrade?.gradeLevel, countryCode)} •
                      Teacher: <strong>{a.class?.teacher?.user?.name}</strong> • {a.scores?.length || 0} students graded • Max: {a.maxScore}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleApproveGrade(a.id); }} disabled={!!loading}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1">
                      {loading === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3" /> Approve</>}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleRejectGrade(a.id); }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                    {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isExp && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-[10px] text-gray-500 mb-2">Review all scores below before approving:</p>
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                      {a.scores?.map((s: any) => {
                        const pct = a.maxScore > 0 ? Math.round((s.score / a.maxScore) * 100) : 0;
                        return (
                          <div key={s.id} className="flex items-center justify-between py-1 text-xs">
                            <span className="font-medium">{s.student?.user?.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-gray-200 rounded-full">
                                <div className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="font-bold w-16 text-right">{s.score}/{a.maxScore} ({pct}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <p className="text-[10px] text-gray-500">
                        Average: <strong>{a.scores?.length > 0 ? Math.round(a.scores.reduce((s: number, sc: any) => s + (sc.score || 0), 0) / a.scores.length) : 0}/{a.maxScore}</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* APPROVED GRADES TAB */}
      {tab === "approved" && (
        <div className="space-y-2">
          {approvedAssessments.length === 0 ? (
            <div className="card text-center py-8"><p className="text-gray-400 text-sm">No approved grades yet</p></div>
          ) : approvedAssessments.map((a: any) => (
            <div key={a.id} className="card flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">{a.title}</h4>
                <p className="text-[10px] text-gray-500">{a.class?.subject?.name} • {a.class?.schoolGrade?.gradeLevel} • {a.scores?.length} scores</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Approved</span>
                <span className="text-[10px] text-gray-400">{a.approvedAt ? new Date(a.approvedAt).toLocaleDateString() : ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TERM REPORTS TAB */}
      {tab === "reports" && (
        <div className="space-y-4">
          {/* Term selector + Generate */}
          <div className="card bg-purple-50 border-purple-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="label">Select Term</label>
                <select className="input-field" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
                  <option value="">All Terms</option>
                  {terms.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} {t.isActive ? "(Active)" : ""} — {new Date(t.startDate).toLocaleDateString()}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleGenerateReports} disabled={!selectedTerm || loading === "generate"}
                className="btn-primary flex items-center gap-2 mt-4">
                {loading === "generate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate Term Reports
              </button>
            </div>
            <p className="text-[10px] text-purple-600 mt-2">
              💡 Reports are auto-calculated from: Approved grades (CA 40% + Exam 60%), attendance, assignment completion, and participation.
              Only approved grades are included — unapproved grades are excluded to prevent manipulation.
            </p>
          </div>

          {/* Report cards */}
          {filteredReports.length === 0 ? (
            <div className="card text-center py-8">
              <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No term reports yet. Select a term and click Generate.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReports.map((report: any) => {
                const isExp = reportExpanded === report.id;
                const isTerm3 = report.term?.termNumber === "TERM_3";
                return (
                  <div key={report.id} className={`card ${isTerm3 ? "border-l-4 border-l-purple-400" : ""}`}>
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setReportExpanded(isExp ? null : report.id)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold">{report.student?.user?.name}</h4>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">{getGradeLabelForCountry(report.gradeLevel, countryCode)}</span>
                          {isTerm3 && <span className="text-[9px] px-2 py-0.5 rounded bg-purple-100 text-purple-700">🎓 Promotion Term</span>}
                          <span className={`text-[9px] px-2 py-0.5 rounded ${
                            report.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                            report.status === "SUBMITTED" ? "bg-amber-100 text-amber-700" :
                            report.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                          }`}>{report.status}</span>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          Average: <strong>{report.overallAverage}%</strong> •
                          Attendance: {report.attendanceRate}% •
                          Assignments: {report.assignmentRate}% •
                          {report.subjectReports?.length} subjects
                        </p>
                      </div>
                      {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>

                    {isExp && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        {/* Subject breakdown */}
                        <div className="bg-gray-50 rounded-xl overflow-hidden">
                          <div className="grid grid-cols-6 gap-2 p-2 text-[9px] font-bold text-gray-500 border-b">
                            <span className="col-span-2">Subject</span><span>CA (40%)</span><span>Exam (60%)</span><span>Total</span><span>Grade</span>
                          </div>
                          {report.subjectReports?.map((sr: any) => (
                            <div key={sr.id} className="grid grid-cols-6 gap-2 p-2 text-[10px] border-b border-gray-100">
                              <span className="col-span-2 font-medium">{sr.subjectName}</span>
                              <span>{sr.caScore?.toFixed(1)}</span>
                              <span>{sr.examScore?.toFixed(1)}</span>
                              <span className="font-bold">{sr.totalScore}</span>
                              <span className={`font-bold text-center px-1 py-0.5 rounded ${gradeColor(sr.grade)}`}>{sr.grade}</span>
                            </div>
                          ))}
                        </div>

                        {/* Performance metrics */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 bg-blue-50 rounded-lg text-center">
                            <p className="text-[9px] text-blue-500">Attendance</p>
                            <p className={`text-sm font-bold ${report.attendanceRate >= 80 ? "text-emerald-600" : report.attendanceRate >= 60 ? "text-amber-600" : "text-red-600"}`}>{report.attendanceRate}%</p>
                          </div>
                          <div className="p-2 bg-purple-50 rounded-lg text-center">
                            <p className="text-[9px] text-purple-500">Assignments Done</p>
                            <p className={`text-sm font-bold ${report.assignmentRate >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{report.assignmentRate}%</p>
                          </div>
                          <div className="p-2 bg-amber-50 rounded-lg text-center">
                            <p className="text-[9px] text-amber-500">Participation</p>
                            <p className="text-sm font-bold text-amber-600">{report.participationScore}%</p>
                          </div>
                        </div>

                        {/* Teacher remarks */}
                        {report.teacherRemarks && (
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <p className="text-[9px] font-bold text-blue-600">Teacher Remarks:</p>
                            <p className="text-[10px] text-blue-700">{report.teacherRemarks}</p>
                          </div>
                        )}

                        {/* Actions */}
                        {(report.status === "DRAFT" || report.status === "SUBMITTED") && (
                          <div className="bg-purple-50 p-3 rounded-xl space-y-2">
                            <textarea className="input-field text-xs" rows={2} placeholder="Principal remarks / comments..."
                              value={principalRemarks} onChange={e => setPrincipalRemarks(e.target.value)} />

                            {isTerm3 && (
                              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-200">
                                <GraduationCap className="w-4 h-4 text-purple-600" />
                                <span className="text-xs text-purple-700 font-medium">Promotion Decision (Term 3):</span>
                                <select className="input-field text-xs w-auto" value={promoteGrade} onChange={e => setPromoteGrade(e.target.value)}>
                                  <option value="">Don&apos;t promote</option>
                                  {allGrades.map(g => <option key={g.value} value={g.value}>Promote to {g.label}</option>)}
                                </select>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button onClick={() => handleApproveReport(report.id, !!promoteGrade)} disabled={!!loading}
                                className="flex-1 btn-primary text-sm flex items-center justify-center gap-1">
                                {loading === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> {promoteGrade ? "Approve & Promote" : "Sign & Approve"}</>}
                              </button>
                              <button onClick={() => handleRejectReport(report.id)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700">
                                Reject
                              </button>
                            </div>
                          </div>
                        )}

                        {report.status === "APPROVED" && (
                          <div className="p-3 bg-emerald-50 rounded-xl flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <div>
                              <p className="text-xs font-bold text-emerald-700">✅ Signed & Approved</p>
                              {report.principalRemarks && <p className="text-[10px] text-emerald-600">Remarks: {report.principalRemarks}</p>}
                              {report.isPromoted && <p className="text-[10px] text-purple-600 font-bold">🎓 Promoted to {getGradeLabelForCountry(report.nextGrade, countryCode)}</p>}
                              <p className="text-[10px] text-gray-400">{new Date(report.approvedAt).toLocaleDateString()}</p>
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
      )}

      {/* ===== ASSIGNMENTS TAB ===== */}
      {tab === "assignments" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">View all assignments, student submissions, and answers across the school.</p>
          {assignments.length === 0 ? (
            <div className="card text-center py-12"><p className="text-gray-400 text-sm">No assignments yet</p></div>
          ) : assignments.map((a: any) => {
            const questions = (a.questions || []) as any[];
            const isOpen = expanded === `a-${a.id}`;
            return (
              <div key={a.id} className="card">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : `a-${a.id}`)}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${a.type === "QUIZ" ? "bg-purple-100" : a.type === "ASSIGNMENT" ? "bg-blue-100" : "bg-amber-100"}`}>
                    {a.type === "QUIZ" ? "🧪" : a.type === "ASSIGNMENT" ? "📋" : "📝"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold">{a.title}</h4>
                    <p className="text-[10px] text-gray-500">
                      {a.class?.subject?.name || a.class?.name} • {a.class?.schoolGrade?.gradeLevel} •
                      Teacher: {a.class?.teacher?.user?.name || "—"} •
                      {questions.length} questions • {a.submissions?.length || 0} submissions
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition ${isOpen ? "rotate-180" : ""}`} />
                </div>

                {isOpen && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    {/* Questions overview */}
                    {questions.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Questions Set by Teacher</p>
                        {questions.map((q: any, qi: number) => (
                          <div key={q.id} className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
                            <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[9px] font-bold shrink-0">{qi + 1}</span>
                            <div className="flex-1">
                              <p className="text-xs text-gray-800">{q.question}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${q.type === "mcq" ? "bg-blue-100 text-blue-700" : q.type === "math" ? "bg-green-100 text-green-700" : q.type === "essay" ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-600"}`}>{q.type?.toUpperCase()}</span>
                                <span className="text-[9px] text-gray-400">{q.points || 1} pts</span>
                                {q.correctAnswer && <span className="text-[9px] text-emerald-600">Answer: {q.correctAnswer}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Student submissions */}
                    {(!a.submissions || a.submissions.length === 0) ? (
                      <p className="text-xs text-gray-400 text-center py-3">No submissions yet</p>
                    ) : a.submissions.map((sub: any) => {
                      const subAnswers = (sub.answers || []) as any[];
                      const isSubOpen = expandedSub === sub.id;
                      return (
                        <div key={sub.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-3 p-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100" onClick={() => setExpandedSub(isSubOpen ? null : sub.id)}>
                            <span className="text-xs font-semibold">{sub.student?.user?.name || "Unknown"}</span>
                            <span className="text-[9px] text-gray-400">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                            {sub.autoScore != null && <span className="text-[9px] text-blue-600">Auto: {sub.autoScore}</span>}
                            {sub.gradedAt ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 ml-auto">{sub.score}/{a.maxScore || a.totalPoints}</span>
                            ) : (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 ml-auto">Ungraded</span>
                            )}
                            <ChevronDown className={`w-3 h-3 text-gray-400 transition ${isSubOpen ? "rotate-180" : ""}`} />
                          </div>
                          {isSubOpen && (
                            <div className="p-3 space-y-2">
                              {/* Show assignment description as the prompt/question */}
                              {a.description && (
                                <div className="bg-gray-100 rounded-lg p-2 text-[10px]">
                                  <p className="font-bold text-gray-600">📋 Assignment Prompt:</p>
                                  <p className="text-gray-700 mt-0.5">{a.description}</p>
                                </div>
                              )}
                              {sub.content && (
                                <div className="bg-blue-50 rounded-lg p-2 text-xs text-gray-800">
                                  <p className="font-bold text-blue-700 text-[10px] mb-1">📝 Student&apos;s Written Answer:</p>
                                  <p className="whitespace-pre-wrap">{sub.content}</p>
                                </div>
                              )}
                              {sub.fileUrl && (
                                <div className="bg-purple-50 rounded-lg p-2 text-[10px]">
                                  <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="text-purple-700 underline">📎 View Attached File</a>
                                </div>
                              )}
                              {questions.length > 0 && questions.map((q: any, qi: number) => {
                                const sa = subAnswers.find((ans: any) => ans.questionId === q.id);
                                return (
                                  <div key={q.id || qi} className={`rounded-lg p-2.5 border text-[10px] ${sa?.isCorrect === true ? "bg-emerald-50 border-emerald-200" : sa?.isCorrect === false ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[8px] font-bold">{qi + 1}</span>
                                      <span className={`text-[8px] px-1 py-0.5 rounded font-bold ${q.type === "mcq" ? "bg-blue-100 text-blue-700" : q.type === "math" ? "bg-green-100 text-green-700" : q.type === "essay" ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-600"}`}>{(q.type || "text").toUpperCase()}</span>
                                      {sa?.isCorrect === true && <span className="text-emerald-600 font-bold">✅ Correct</span>}
                                      {sa?.isCorrect === false && <span className="text-red-600 font-bold">❌ Wrong</span>}
                                      {sa?.isCorrect == null && sa && <span className="text-amber-600">⏳ Manual</span>}
                                    </div>
                                    <p className="font-semibold text-gray-800 mb-1">❓ {q.question}</p>
                                    {q.type === "mcq" && q.options && (
                                      <div className="space-y-0.5 mb-1 ml-4">
                                        {q.options.map((opt: string, oi: number) => (
                                          <div key={oi} className={`px-1.5 py-0.5 rounded ${opt === q.correctAnswer ? "bg-emerald-100 text-emerald-800 font-bold" : opt === sa?.answer && opt !== q.correctAnswer ? "bg-red-100 text-red-700 line-through" : "text-gray-500"}`}>
                                            {String.fromCharCode(65 + oi)}. {opt}
                                            {opt === q.correctAnswer && " ✓"}
                                            {opt === sa?.answer && opt !== q.correctAnswer && " ← student"}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <p>Student answered: <span className="font-bold text-gray-800">{sa?.answer || "— no answer —"}</span></p>
                                    {q.correctAnswer && <p className="text-emerald-600">Correct answer: <strong>{q.correctAnswer}</strong></p>}
                                    {sa?.points != null && <p className="font-bold text-brand-600">Points: {sa.points}/{q.points || 1}</p>}
                                  </div>
                                );
                              })}
                              {questions.length === 0 && !sub.content && !sub.fileUrl && (
                                <p className="text-[10px] text-gray-400 text-center py-2">No detailed answer data available</p>
                              )}
                              {sub.feedback && <p className="text-[10px] text-blue-600 italic mt-1">💬 Teacher feedback: &quot;{sub.feedback}&quot;</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
