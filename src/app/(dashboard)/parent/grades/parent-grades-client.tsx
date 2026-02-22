"use client";

import { useState } from "react";
import { ShieldCheck, TrendingUp, FileText, BookOpen, Award, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";

export default function ParentGradesClient({ children: childrenData }: { children: any[] }) {
  const [selectedChild, setSelectedChild] = useState(childrenData[0]?.id || "");
  const [tab, setTab] = useState<"grades" | "assignments" | "reports">("grades");
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const child = childrenData.find((c) => c.id === selectedChild);

  const gradeColor = (g: string) => {
    if (g === "A") return "bg-emerald-100 text-emerald-700";
    if (g === "B") return "bg-blue-100 text-blue-700";
    if (g === "C") return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const pctColor = (pct: number) =>
    pct >= 70 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600";

  // Group scores by subject
  const bySubject: Record<string, any[]> = {};
  (child?.scores || []).forEach((s: any) => {
    const sub = s.assessment?.class?.subject?.name || "Other";
    if (!bySubject[sub]) bySubject[sub] = [];
    bySubject[sub].push(s);
  });

  const totalScores = child?.scores?.length || 0;
  const avgScore = totalScores > 0 ? Math.round(child.scores.reduce((sum: number, s: any) => {
    const pct = s.assessment?.maxScore > 0 ? (s.score / s.assessment.maxScore) * 100 : 0;
    return sum + pct;
  }, 0) / totalScores) : 0;

  const pendingAssignments = (child?.assignments || []).filter((a: any) => !a.submitted);
  const completedAssignments = (child?.assignments || []).filter((a: any) => a.submitted);

  return (
    <div className="space-y-6">
      {/* Anti-cheat notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-blue-700">
          <strong>Verified Records:</strong> Only grades reviewed and approved by the school principal are displayed.
          Report cards are auto-generated from attendance, assignments, assessments, and participation — making them tamper-proof.
        </p>
      </div>

      {/* Child selector */}
      {childrenData.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {childrenData.map((c: any) => (
            <button key={c.id} onClick={() => { setSelectedChild(c.id); setTab("grades"); }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition ${
                selectedChild === c.id ? "bg-brand-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {!child ? (
        <div className="card text-center py-12"><p className="text-sm text-gray-500">Link your children to see their grades</p></div>
      ) : (
        <>
          {/* Child header */}
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
              {child.image ? <img src={child.image} className="w-10 h-10 rounded-full object-cover" alt="" /> : child.name?.[0]}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold">{child.name}</h3>
              <p className="text-[10px] text-gray-500">{child.school} · {child.gradeLevel}</p>
            </div>
            {child.relationship && <span className="text-[9px] px-2 py-0.5 rounded bg-rose-50 text-rose-600">{child.relationship}</span>}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="stat-card">
              <TrendingUp className="w-6 h-6 text-brand-500 mb-1" />
              <div className="text-xl font-bold text-gray-900">{avgScore}%</div>
              <div className="text-[10px] text-gray-500">Average Score</div>
            </div>
            <div className="stat-card">
              <BookOpen className="w-6 h-6 text-purple-500 mb-1" />
              <div className="text-xl font-bold text-gray-900">{Object.keys(bySubject).length}</div>
              <div className="text-[10px] text-gray-500">Subjects</div>
            </div>
            <div className="stat-card">
              <FileText className="w-6 h-6 text-amber-500 mb-1" />
              <div className="text-xl font-bold text-gray-900">{pendingAssignments.length}</div>
              <div className="text-[10px] text-gray-500">Pending Tasks</div>
            </div>
            <div className="stat-card">
              <Award className="w-6 h-6 text-emerald-500 mb-1" />
              <div className="text-xl font-bold text-gray-900">{child.termReports?.length || 0}</div>
              <div className="text-[10px] text-gray-500">Report Cards</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {[
              { key: "grades", label: `📊 Verified Grades (${totalScores})`, count: totalScores },
              { key: "assignments", label: `📝 Assignments (${child.assignments?.length || 0})`, count: child.assignments?.length || 0 },
              { key: "reports", label: `📋 Report Cards (${child.termReports?.length || 0})`, count: child.termReports?.length || 0 },
            ].map((t: any) => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={`px-4 py-2 text-xs font-medium ${tab === t.key ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* GRADES TAB */}
          {tab === "grades" && (
            <div className="space-y-4">
              {Object.keys(bySubject).length === 0 ? (
                <div className="card text-center py-8"><p className="text-[10px] text-gray-400">No approved grades yet</p></div>
              ) : Object.entries(bySubject).map(([subject, subScores]) => {
                const avg = Math.round(subScores.reduce((s: number, sc: any) => {
                  return s + (sc.assessment?.maxScore > 0 ? (sc.score / sc.assessment.maxScore) * 100 : 0);
                }, 0) / subScores.length);
                return (
                  <div key={subject} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-gray-700">📚 {subject}</h4>
                      <span className={`text-xs font-bold ${pctColor(avg)}`}>Average: {avg}%</span>
                    </div>
                    <div className="space-y-1">
                      {subScores.map((s: any) => {
                        const pct = s.assessment?.maxScore > 0 ? Math.round((s.score / s.assessment.maxScore) * 100) : 0;
                        return (
                          <div key={s.id} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg text-[10px]">
                            <span className="font-medium">{s.assessment?.title || "Assessment"}</span>
                            <span className="text-gray-400">{s.assessment?.type?.replace(/_/g, " ")}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                                <div className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              <span className={`font-bold ${pctColor(pct)}`}>{s.score}/{s.assessment?.maxScore} ({pct}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ASSIGNMENTS TAB */}
          {tab === "assignments" && (
            <div className="space-y-4">
              {/* Pending */}
              {pendingAssignments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Not Submitted ({pendingAssignments.length})</h4>
                  <div className="space-y-1">
                    {pendingAssignments.map((a: any) => (
                      <div key={a.id} className="card flex items-center justify-between border-l-4 border-l-amber-300">
                        <div>
                          <p className="text-xs font-medium">{a.title}</p>
                          <p className="text-[10px] text-gray-500">{a.className} {a.dueDate ? `· Due: ${new Date(a.dueDate).toLocaleDateString()}` : ""}</p>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-amber-100 text-amber-700">Pending</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed */}
              {completedAssignments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Submitted ({completedAssignments.length})</h4>
                  <div className="space-y-1">
                    {completedAssignments.map((a: any) => {
                      const sub = a.submission;
                      const graded = sub?.gradedAt;
                      return (
                        <div key={a.id} className="card flex items-center justify-between border-l-4 border-l-emerald-300">
                          <div>
                            <p className="text-xs font-medium">{a.title}</p>
                            <p className="text-[10px] text-gray-500">{a.className} · Submitted {sub ? new Date(sub.submittedAt).toLocaleDateString() : ""}</p>
                          </div>
                          <div className="text-right">
                            {graded ? (
                              <div>
                                <span className={`text-xs font-bold ${pctColor(a.maxScore > 0 ? (sub.score / a.maxScore) * 100 : 0)}`}>
                                  {sub.score}/{a.maxScore}
                                </span>
                                <p className="text-[9px] text-gray-400">Graded</p>
                              </div>
                            ) : (
                              <span className="text-[9px] px-2 py-0.5 rounded bg-blue-100 text-blue-700">Awaiting grade</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(child.assignments?.length || 0) === 0 && (
                <div className="card text-center py-8"><p className="text-[10px] text-gray-400">No assignments yet</p></div>
              )}
            </div>
          )}

          {/* REPORT CARDS TAB */}
          {tab === "reports" && (
            <div className="space-y-3">
              {(child.termReports?.length || 0) === 0 ? (
                <div className="card text-center py-8">
                  <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-[10px] text-gray-400">No signed report cards yet. Report cards appear after the principal generates and approves them at the end of each term.</p>
                </div>
              ) : child.termReports.map((report: any) => {
                const isExp = expandedReport === report.id;
                const isTerm3 = report.term?.termNumber === "TERM_3";
                return (
                  <div key={report.id} className={`card ${isTerm3 ? "border-l-4 border-l-purple-400" : ""}`}>
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedReport(isExp ? null : report.id)}>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Award className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold">{report.term?.name || "Term Report"}</h4>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">✓ Signed by Principal</span>
                          {isTerm3 && <span className="text-[9px] px-2 py-0.5 rounded bg-purple-100 text-purple-700">Promotion Term</span>}
                        </div>
                        <p className="text-[10px] text-gray-500">
                          Overall: <strong className={pctColor(report.overallAverage)}>{report.overallAverage}%</strong> ·
                          {report.subjectReports?.length} subjects ·
                          Approved {new Date(report.approvedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>

                    {isExp && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        {/* Subject breakdown table */}
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
                          <div className="p-2.5 bg-blue-50 rounded-lg text-center">
                            <p className="text-[9px] text-blue-500">Attendance</p>
                            <p className={`text-sm font-bold ${report.attendanceRate >= 80 ? "text-emerald-600" : report.attendanceRate >= 60 ? "text-amber-600" : "text-red-600"}`}>
                              {report.attendanceRate}%
                            </p>
                          </div>
                          <div className="p-2.5 bg-purple-50 rounded-lg text-center">
                            <p className="text-[9px] text-purple-500">Assignments Done</p>
                            <p className={`text-sm font-bold ${report.assignmentRate >= 80 ? "text-emerald-600" : "text-amber-600"}`}>
                              {report.assignmentRate}%
                            </p>
                          </div>
                          <div className="p-2.5 bg-amber-50 rounded-lg text-center">
                            <p className="text-[9px] text-amber-500">Participation</p>
                            <p className="text-sm font-bold text-amber-600">{report.participationScore}%</p>
                          </div>
                        </div>

                        {/* Teacher remarks */}
                        {report.teacherRemarks && (
                          <div className="p-2.5 bg-blue-50 rounded-lg">
                            <p className="text-[9px] font-bold text-blue-600 mb-0.5">Teacher Remarks:</p>
                            <p className="text-[10px] text-blue-700">{report.teacherRemarks}</p>
                          </div>
                        )}

                        {/* Principal remarks */}
                        {report.principalRemarks && (
                          <div className="p-2.5 bg-emerald-50 rounded-lg">
                            <p className="text-[9px] font-bold text-emerald-600 mb-0.5">Principal&apos;s Remarks:</p>
                            <p className="text-[10px] text-emerald-700">{report.principalRemarks}</p>
                          </div>
                        )}

                        {/* Promotion status */}
                        {report.isPromoted && (
                          <div className="p-3 bg-purple-50 rounded-xl flex items-center gap-2 border border-purple-200">
                            <GraduationCap className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="text-xs font-bold text-purple-700">🎓 Promoted to {report.nextGrade}</p>
                              <p className="text-[10px] text-purple-500">Promotion approved by principal</p>
                            </div>
                          </div>
                        )}

                        {/* Signature */}
                        <div className="p-2.5 bg-gray-50 rounded-lg flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <p className="text-[10px] text-gray-600">
                            Digitally signed by principal on {new Date(report.approvedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
