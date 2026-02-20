"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitAssignment } from "@/lib/actions/grading";
import { TrendingUp, BookOpen, Award, FileText, Upload, Loader2, CheckCircle, Clock, ShieldCheck } from "lucide-react";

export default function StudentGradesClient({ scores, assignments, submissions, termReports }: {
  scores: any[]; assignments: any[]; submissions: any[]; termReports: any[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"grades" | "assignments" | "reports">("grades");
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [submitContent, setSubmitContent] = useState("");
  const [submitFile, setSubmitFile] = useState<string | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<string | null>(null);

  // Group scores by class
  const scoresByClass: Record<string, { className: string; teacherName: string; scores: any[] }> = {};
  scores.forEach((score) => {
    const classId = score.assessment.class.id;
    if (!scoresByClass[classId]) {
      scoresByClass[classId] = { className: score.assessment.class.name, teacherName: score.assessment.class.teacher.user.name, scores: [] };
    }
    scoresByClass[classId].scores.push(score);
  });

  const totalScores = scores.length;
  const avgScore = totalScores > 0 ? (scores.reduce((sum, s) => sum + (s.score || 0), 0) / totalScores).toFixed(1) : "—";
  const pendingAssignments = assignments.filter((a: any) => !a.submitted);

  const handleSubmitAssignment = async (assignmentId: string) => {
    setLoading(assignmentId);
    const result = await submitAssignment(assignmentId, submitContent || undefined, submitFile || undefined);
    if (result.error) setMessage("Error: " + result.error);
    else { setMessage("✅ Assignment submitted!"); setActiveAssignment(null); setSubmitContent(""); setSubmitFile(null); router.refresh(); }
    setLoading("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMessage("Error: File too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setSubmitFile(reader.result as string);
    reader.readAsDataURL(file);
  };

  const gradeColor = (g: string) => {
    if (g === "A") return "bg-emerald-100 text-emerald-700";
    if (g === "B") return "bg-blue-100 text-blue-700";
    if (g === "C") return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-xl text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message} <button onClick={() => setMessage("")} className="float-right text-xs">✕</button>
        </div>
      )}

      {/* Anti-cheat notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-blue-700">
          <strong>Verified Grades:</strong> Only grades that have been reviewed and approved by your school principal are displayed here.
          This ensures the integrity of your academic records.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card">
          <TrendingUp className="w-6 h-6 text-brand-500 mb-1" />
          <div className="text-xl font-bold text-gray-900">{avgScore}</div>
          <div className="text-[10px] text-gray-500">Average Score</div>
        </div>
        <div className="stat-card">
          <BookOpen className="w-6 h-6 text-emerald-500 mb-1" />
          <div className="text-xl font-bold text-gray-900">{totalScores}</div>
          <div className="text-[10px] text-gray-500">Verified Grades</div>
        </div>
        <div className="stat-card">
          <FileText className="w-6 h-6 text-amber-500 mb-1" />
          <div className="text-xl font-bold text-gray-900">{pendingAssignments.length}</div>
          <div className="text-[10px] text-gray-500">Pending Assignments</div>
        </div>
        <div className="stat-card">
          <Award className="w-6 h-6 text-purple-500 mb-1" />
          <div className="text-xl font-bold text-gray-900">{termReports.length}</div>
          <div className="text-[10px] text-gray-500">Term Reports</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: "grades", label: `📊 Grades (${totalScores})` },
          { key: "assignments", label: `📋 Assignments (${pendingAssignments.length} pending)` },
          { key: "reports", label: `🏆 Term Reports (${termReports.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-xs font-medium ${tab === t.key ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* GRADES TAB */}
      {tab === "grades" && (
        Object.keys(scoresByClass).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(scoresByClass).map(([classId, data]) => (
              <div key={classId} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
                    {data.className.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{data.className}</h3>
                    <p className="text-[10px] text-gray-500">Teacher: {data.teacherName}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left text-[10px] font-bold text-gray-500 px-3 py-2">Assessment</th>
                        <th className="text-left text-[10px] font-bold text-gray-500 px-3 py-2">Type</th>
                        <th className="text-right text-[10px] font-bold text-gray-500 px-3 py-2">Score</th>
                        <th className="text-right text-[10px] font-bold text-gray-500 px-3 py-2">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.scores.map((score: any) => {
                        const pct = score.assessment.maxScore > 0 ? Math.round((score.score || 0) / score.assessment.maxScore * 100) : 0;
                        return (
                          <tr key={score.id} className="border-b border-gray-50">
                            <td className="px-3 py-2 text-xs font-medium">{score.assessment.title}</td>
                            <td className="px-3 py-2"><span className="text-[9px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">{score.assessment.type.replace(/_/g, " ")}</span></td>
                            <td className="px-3 py-2 text-right text-xs font-bold">{score.score}/{score.assessment.maxScore}</td>
                            <td className="px-3 py-2 text-right">
                              <span className={`text-xs font-bold ${pct >= 70 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>{pct}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No approved grades yet. Grades appear here after the principal verifies them.</p>
          </div>
        )
      )}

      {/* ASSIGNMENTS TAB */}
      {tab === "assignments" && (
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <div className="card text-center py-8"><p className="text-gray-400 text-sm">No assignments yet</p></div>
          ) : assignments.map((a: any) => {
            const sub = submissions.find((s: any) => s.assignmentId === a.id);
            const isOverdue = a.dueDate && new Date(a.dueDate) < new Date() && !a.submitted;
            return (
              <div key={a.id} className={`card ${isOverdue ? "border-l-4 border-l-red-400" : a.submitted ? "border-l-4 border-l-emerald-400" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold">{a.title}</h4>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">{a.className}</span>
                      {isOverdue && <span className="text-[9px] px-2 py-0.5 rounded bg-red-100 text-red-700">OVERDUE</span>}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "No deadline"} • Max: {a.maxScore} pts
                    </p>
                    {a.description && <p className="text-[10px] text-gray-500 mt-1">{a.description}</p>}
                  </div>
                  {a.submitted ? (
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Submitted</span>
                      </div>
                      {sub?.gradedAt ? (
                        <p className="text-xs font-bold text-brand-600 mt-1">{sub.score}/{a.maxScore}</p>
                      ) : (
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> Awaiting grade</p>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => setActiveAssignment(activeAssignment === a.id ? null : a.id)}
                      className="btn-primary text-xs flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Submit
                    </button>
                  )}
                </div>

                {/* Submit form */}
                {activeAssignment === a.id && !a.submitted && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <textarea className="input-field text-xs" rows={3} placeholder="Your answer or notes..."
                      value={submitContent} onChange={e => setSubmitContent(e.target.value)} />
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] text-gray-500 flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3" /> Attach file (max 5MB)
                        <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} />
                      </label>
                      {submitFile && <span className="text-[10px] text-emerald-600">✓ File attached</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSubmitAssignment(a.id)} disabled={loading === a.id}
                        className="btn-primary text-xs flex items-center gap-1">
                        {loading === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Submit Assignment"}
                      </button>
                      <button onClick={() => { setActiveAssignment(null); setSubmitContent(""); setSubmitFile(null); }}
                        className="btn-ghost text-xs">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TERM REPORTS TAB */}
      {tab === "reports" && (
        <div className="space-y-4">
          {termReports.length === 0 ? (
            <div className="card text-center py-12">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No approved term reports yet. Reports appear after the principal signs them.</p>
            </div>
          ) : termReports.map((report: any) => (
            <div key={report.id} className="card border-l-4 border-l-purple-400">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold">{report.term?.name || "Term Report"}</h3>
                  <p className="text-[10px] text-gray-500">{report.gradeLevel} • Signed by Principal ✓</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${report.overallAverage >= 70 ? "text-emerald-600" : report.overallAverage >= 50 ? "text-amber-600" : "text-red-600"}`}>
                    {report.overallAverage}%
                  </p>
                  <p className="text-[10px] text-gray-400">Overall Average</p>
                </div>
              </div>

              {/* Subject table */}
              <div className="bg-gray-50 rounded-xl overflow-hidden mb-3">
                <div className="grid grid-cols-6 gap-2 p-2 text-[9px] font-bold text-gray-500 border-b bg-gray-100">
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

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg text-center">
                  <p className="text-[9px] text-blue-500">Attendance</p>
                  <p className="text-sm font-bold text-blue-700">{report.attendanceRate}%</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg text-center">
                  <p className="text-[9px] text-purple-500">Assignments</p>
                  <p className="text-sm font-bold text-purple-700">{report.assignmentRate}%</p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg text-center">
                  <p className="text-[9px] text-amber-500">Participation</p>
                  <p className="text-sm font-bold text-amber-700">{report.participationScore}%</p>
                </div>
              </div>

              {/* Remarks */}
              {report.teacherRemarks && (
                <div className="p-2 bg-blue-50 rounded-lg mb-2">
                  <p className="text-[9px] font-bold text-blue-600">Teacher Remarks:</p>
                  <p className="text-[10px] text-blue-700">{report.teacherRemarks}</p>
                </div>
              )}
              {report.principalRemarks && (
                <div className="p-2 bg-purple-50 rounded-lg mb-2">
                  <p className="text-[9px] font-bold text-purple-600">Principal Remarks:</p>
                  <p className="text-[10px] text-purple-700">{report.principalRemarks}</p>
                </div>
              )}
              {report.isPromoted && (
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-700">🎓 Promoted to {report.nextGrade}</p>
                </div>
              )}

              <p className="text-[9px] text-gray-400 mt-2 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Approved {new Date(report.approvedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function gradeColor(g: string) {
  if (g === "A") return "bg-emerald-100 text-emerald-700";
  if (g === "B") return "bg-blue-100 text-blue-700";
  if (g === "C") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}
