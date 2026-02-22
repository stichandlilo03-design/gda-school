"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitAssignment } from "@/lib/actions/grading";
import {
  BookOpen, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp,
  FileText, Send, Loader2, Award, Calculator, PenTool,
} from "lucide-react";

const MATH_SYMBOLS = ["π", "√", "∛", "²", "³", "⁴", "÷", "×", "±", "≠", "≈", "≤", "≥", "∞", "∑", "∫", "Δ", "θ", "α", "β", "∠", "⊥", "∥", "½", "⅓", "¼", "⅕"];

export default function StudentGradesClient({ scores, assignments, submissions, termReports }: {
  scores: any[]; assignments: any[]; submissions: any[]; termReports: any[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"grades" | "homework" | "reports">(scores.length > 0 ? "grades" : "homework");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
  const [essayContent, setEssayContent] = useState<Record<string, string>>({});
  const [showMathPad, setShowMathPad] = useState<string | null>(null);

  const pendingAssignments = assignments.filter((a: any) => {
    const sub = submissions.find((s: any) => s.assignmentId === a.id);
    return !sub;
  });
  const submittedAssignments = assignments.filter((a: any) => {
    return submissions.find((s: any) => s.assignmentId === a.id);
  });

  const getSubmission = (aId: string) => submissions.find((s: any) => s.assignmentId === aId);

  const handleSubmitHomework = async (assignment: any) => {
    setLoading(assignment.id);
    const questions = assignment.questions || [];
    const myAnswers = answers[assignment.id] || {};
    const essay = essayContent[assignment.id] || "";

    if (questions.length > 0) {
      const answerList = questions.map((q: any) => ({
        questionId: q.id,
        answer: myAnswers[q.id] || "",
      }));
      const unanswered = answerList.filter((a: any) => !a.answer.trim());
      if (unanswered.length > 0) {
        setMessage(`Please answer all ${unanswered.length} remaining question(s)`);
        setLoading(null);
        return;
      }
      const result = await submitAssignment(assignment.id, essay || undefined, undefined, answerList);
      if (result.error) setMessage(result.error);
      else {
        const msg = result.autoScore !== null && result.autoScore !== undefined
          ? `✅ Submitted! Auto-graded score: ${result.autoScore}/${assignment.totalPoints || assignment.maxScore}`
          : "✅ Homework submitted! Teacher will grade it.";
        setMessage(msg);
        setExpandedAssignment(null);
        router.refresh();
      }
    } else {
      if (!essay.trim()) { setMessage("Please write your answer"); setLoading(null); return; }
      const result = await submitAssignment(assignment.id, essay);
      if (result.error) setMessage(result.error);
      else { setMessage("✅ Submitted!"); setExpandedAssignment(null); router.refresh(); }
    }
    setLoading(null);
  };

  const updateAnswer = (assignmentId: string, questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [assignmentId]: { ...(prev[assignmentId] || {}), [questionId]: value },
    }));
  };

  const insertMathSymbol = (assignmentId: string, questionId: string, symbol: string) => {
    const current = answers[assignmentId]?.[questionId] || "";
    updateAnswer(assignmentId, questionId, current + symbol);
  };

  const totalGrades = scores.length;
  const avgScore = totalGrades > 0 ? Math.round(scores.reduce((s, sc) => s + (sc.score || 0) / (sc.assessment?.maxScore || 100) * 100, 0) / totalGrades) : 0;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${message.includes("✅") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message}
          <button onClick={() => setMessage("")} className="float-right text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <div className="text-xl font-bold text-amber-600">{pendingAssignments.length}</div>
          <div className="text-[10px] text-gray-500">Pending</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xl font-bold text-brand-600">{totalGrades}</div>
          <div className="text-[10px] text-gray-500">Grades</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xl font-bold text-emerald-600">{avgScore}%</div>
          <div className="text-[10px] text-gray-500">Average</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {[
          { key: "homework", label: `📝 Homework (${pendingAssignments.length})` },
          { key: "grades", label: `📊 Grades (${totalGrades})` },
          { key: "reports", label: `🏆 Reports (${termReports.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 text-xs py-2 rounded-lg font-medium transition ${tab === t.key ? "bg-white shadow text-brand-700" : "text-gray-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ HOMEWORK TAB ============ */}
      {tab === "homework" && (
        <div className="space-y-3">
          {pendingAssignments.length === 0 && submittedAssignments.length === 0 && (
            <div className="card text-center py-12">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">No homework yet</p>
              <p className="text-[10px] text-gray-400 mt-1">Your teachers will assign homework here</p>
            </div>
          )}

          {/* Pending homework */}
          {pendingAssignments.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Pending ({pendingAssignments.length})
              </h3>
              {pendingAssignments.map((a: any) => {
                const questions = (a.questions || []) as any[];
                const isExpanded = expandedAssignment === a.id;
                const myAnswers = answers[a.id] || {};
                const answered = questions.filter(q => myAnswers[q.id]?.trim()).length;
                const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();

                return (
                  <div key={a.id} className={`card border-2 ${isOverdue ? "border-red-200" : "border-amber-200"}`}>
                    <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpandedAssignment(isExpanded ? null : a.id)}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                        a.type === "QUIZ" ? "bg-purple-100" : a.type === "ASSIGNMENT" ? "bg-blue-100" : "bg-amber-100"
                      }`}>
                        {a.type === "QUIZ" ? "🧪" : a.type === "ASSIGNMENT" ? "📋" : "📝"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-800 truncate">{a.title}</h4>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            a.type === "QUIZ" ? "bg-purple-100 text-purple-700" : a.type === "ASSIGNMENT" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                          }`}>{a.type}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">{a.class?.subject?.name || a.class?.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {questions.length > 0 && (
                            <span className="text-[10px] text-gray-500">{questions.length} question{questions.length > 1 ? "s" : ""} · {a.totalPoints || a.maxScore} pts</span>
                          )}
                          {a.dueDate && (
                            <span className={`text-[10px] ${isOverdue ? "text-red-600 font-bold" : "text-gray-400"}`}>
                              {isOverdue ? "⚠️ OVERDUE" : `Due: ${new Date(a.dueDate).toLocaleDateString()}`}
                            </span>
                          )}
                          {questions.length > 0 && answered > 0 && (
                            <span className="text-[10px] text-brand-600 font-bold">{answered}/{questions.length} done</span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        {a.description && <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">{a.description}</p>}

                        {/* Structured questions */}
                        {questions.length > 0 ? (
                          <div className="space-y-4">
                            {questions.map((q: any, qi: number) => (
                              <div key={q.id} className="bg-gray-50 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">{qi + 1}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                    q.type === "mcq" ? "bg-blue-100 text-blue-700" :
                                    q.type === "math" ? "bg-green-100 text-green-700" :
                                    q.type === "essay" ? "bg-purple-100 text-purple-700" :
                                    "bg-gray-200 text-gray-600"
                                  }`}>
                                    {q.type === "mcq" ? "Multiple Choice" : q.type === "math" ? "Math" : q.type === "essay" ? "Essay" : "Short Answer"}
                                  </span>
                                  <span className="text-[9px] text-gray-400 ml-auto">{q.points || 1} pt{(q.points || 1) > 1 ? "s" : ""}</span>
                                </div>
                                <p className="text-sm text-gray-800 font-medium mb-2">{q.question}</p>

                                {/* MCQ options */}
                                {q.type === "mcq" && q.options && (
                                  <div className="space-y-1.5">
                                    {q.options.map((opt: string, oi: number) => (
                                      <label key={oi} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                                        myAnswers[q.id] === opt ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"
                                      }`}>
                                        <input type="radio" name={`q-${a.id}-${q.id}`} value={opt}
                                          checked={myAnswers[q.id] === opt}
                                          onChange={() => updateAnswer(a.id, q.id, opt)}
                                          className="text-brand-600" />
                                        <span className="text-sm text-gray-700">{String.fromCharCode(65 + oi)}. {opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {/* Math answer with symbol pad */}
                                {q.type === "math" && (
                                  <div>
                                    <div className="flex gap-2">
                                      <input type="text" className="input-field flex-1 font-mono text-sm"
                                        placeholder="Enter your answer..."
                                        value={myAnswers[q.id] || ""}
                                        onChange={(e) => updateAnswer(a.id, q.id, e.target.value)} />
                                      <button type="button" onClick={() => setShowMathPad(showMathPad === q.id ? null : q.id)}
                                        className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200">
                                        <Calculator className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    {showMathPad === q.id && (
                                      <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                                        <p className="text-[9px] text-green-600 font-bold mb-1">Math Symbols — click to insert:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {MATH_SYMBOLS.map(sym => (
                                            <button key={sym} type="button"
                                              onClick={() => insertMathSymbol(a.id, q.id, sym)}
                                              className="w-7 h-7 bg-white border rounded text-sm hover:bg-green-100 font-mono">
                                              {sym}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Short answer */}
                                {q.type === "short" && (
                                  <input type="text" className="input-field text-sm"
                                    placeholder="Type your answer..."
                                    value={myAnswers[q.id] || ""}
                                    onChange={(e) => updateAnswer(a.id, q.id, e.target.value)} />
                                )}

                                {/* Essay */}
                                {q.type === "essay" && (
                                  <textarea rows={4} className="input-field text-sm"
                                    placeholder="Write your answer..."
                                    value={myAnswers[q.id] || ""}
                                    onChange={(e) => updateAnswer(a.id, q.id, e.target.value)} />
                                )}

                                {/* Answer status indicator */}
                                {myAnswers[q.id]?.trim() && (
                                  <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Answered
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* No structured questions — free-form essay */
                          <textarea rows={6} className="input-field text-sm"
                            placeholder="Write your homework answer here..."
                            value={essayContent[a.id] || ""}
                            onChange={(e) => setEssayContent(prev => ({ ...prev, [a.id]: e.target.value }))} />
                        )}

                        <div className="flex justify-between items-center">
                          {questions.length > 0 && (
                            <span className="text-xs text-gray-500">{answered}/{questions.length} answered</span>
                          )}
                          <button onClick={() => handleSubmitHomework(a)} disabled={!!loading}
                            className="btn-primary text-sm px-6 ml-auto">
                            {loading === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5 mr-1" /> Submit</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Submitted homework */}
          {submittedAssignments.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mt-4">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Submitted ({submittedAssignments.length})
              </h3>
              {submittedAssignments.map((a: any) => {
                const sub = getSubmission(a.id);
                const questions = (a.questions || []) as any[];
                const subAnswers = (sub?.answers || []) as any[];
                const isExpanded = expandedAssignment === a.id;
                const hasAutoScore = sub?.autoScore !== null && sub?.autoScore !== undefined;
                const finalScore = sub?.score ?? sub?.autoScore;

                return (
                  <div key={a.id} className={`card border ${sub?.gradedAt || hasAutoScore ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200"}`}>
                    <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpandedAssignment(isExpanded ? null : a.id)}>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-lg flex-shrink-0">
                        {sub?.gradedAt || hasAutoScore ? "✅" : "📤"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-800 truncate">{a.title}</h4>
                        <p className="text-[10px] text-gray-500">{a.class?.subject?.name || a.class?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">Submitted {new Date(sub?.submittedAt).toLocaleDateString()}</span>
                          {finalScore !== null && finalScore !== undefined && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              (finalScore / (a.totalPoints || a.maxScore)) >= 0.7 ? "bg-emerald-100 text-emerald-700" :
                              (finalScore / (a.totalPoints || a.maxScore)) >= 0.5 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {finalScore}/{a.totalPoints || a.maxScore}
                              ({Math.round((finalScore / (a.totalPoints || a.maxScore)) * 100)}%)
                            </span>
                          )}
                          {!sub?.gradedAt && !hasAutoScore && (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Awaiting grade</span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>

                    {isExpanded && questions.length > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {questions.map((q: any, qi: number) => {
                          const sa = subAnswers.find((a: any) => a.questionId === q.id);
                          return (
                            <div key={q.id} className="bg-white rounded-lg p-2.5 border text-xs">
                              <p className="font-medium text-gray-800 mb-1"><span className="text-brand-600">Q{qi + 1}.</span> {q.question}</p>
                              <p className="text-gray-600">Your answer: <span className="font-bold">{sa?.answer || "—"}</span></p>
                              {sa?.isCorrect === true && <p className="text-emerald-600 font-bold mt-0.5">✅ Correct (+{sa.points} pts)</p>}
                              {sa?.isCorrect === false && (
                                <p className="text-red-600 mt-0.5">❌ Incorrect {q.correctAnswer && <span className="text-gray-500">(Answer: {q.correctAnswer})</span>}</p>
                              )}
                              {sa?.isCorrect === null && <p className="text-gray-400 mt-0.5">⏳ Awaiting teacher grade</p>}
                            </div>
                          );
                        })}
                        {sub?.feedback && (
                          <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-200 text-xs">
                            <p className="font-bold text-blue-800 mb-0.5">Teacher Feedback:</p>
                            <p className="text-blue-700">{sub.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ============ GRADES TAB ============ */}
      {tab === "grades" && (() => {
        const gradedSubs = submissions.filter((s: any) => s.gradedAt && s.score != null);
        const hasAny = scores.length > 0 || gradedSubs.length > 0;
        return (
        <div className="space-y-3">
          {!hasAny && (
            <div className="card text-center py-8"><p className="text-gray-400 text-sm">No grades yet</p></div>
          )}

          {/* Assessment Scores (Principal Approved) */}
          {scores.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">📋 Assessments (Principal Approved)</p>
              {scores.map((s: any) => (
                <div key={s.id} className="card flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                    s.score / (s.assessment?.maxScore || 100) >= 0.7 ? "bg-emerald-100 text-emerald-700" :
                    s.score / (s.assessment?.maxScore || 100) >= 0.5 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {Math.round(s.score / (s.assessment?.maxScore || 100) * 100)}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 truncate">{s.assessment?.title}</h4>
                    <p className="text-[10px] text-gray-500">{s.assessment?.class?.subject?.name || s.assessment?.class?.name}</p>
                    <p className="text-[10px] text-gray-400">{s.score}/{s.assessment?.maxScore} · {s.assessment?.type?.replace(/_/g, " ")}</p>
                  </div>
                  {s.feedback && <p className="text-[9px] text-gray-500 max-w-[120px] truncate">{s.feedback}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Graded Homework / Assignments */}
          {gradedSubs.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">📝 Homework & Assignments (Teacher Graded)</p>
              {gradedSubs.map((sub: any) => {
                const a = sub.assignment;
                const pct = a?.maxScore > 0 ? (sub.score / a.maxScore) * 100 : 0;
                const questions = (a?.questions || []) as any[];
                const subAnswers = (sub.answers || []) as any[];
                return (
                  <div key={sub.id} className="card mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${pct >= 70 ? "bg-emerald-100 text-emerald-700" : pct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {Math.round(pct)}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-800 truncate">{a?.title || "Homework"}</h4>
                        <p className="text-[10px] text-gray-500">{a?.class?.subject?.name || a?.class?.name}</p>
                        <p className="text-[10px] text-gray-400">{sub.score}/{a?.maxScore || a?.totalPoints} · {a?.type || "HOMEWORK"}</p>
                      </div>
                      {sub.feedback && <p className="text-[9px] text-blue-500 max-w-[120px] truncate italic">{sub.feedback}</p>}
                    </div>

                    {/* Show Q&A details */}
                    {questions.length > 0 && (
                      <div className="mt-2 pt-2 border-t space-y-1">
                        {questions.map((q: any, qi: number) => {
                          const sa = subAnswers.find((ans: any) => ans.questionId === q.id);
                          return (
                            <div key={q.id} className={`text-[10px] rounded-lg p-2 ${sa?.isCorrect === true ? "bg-emerald-50" : sa?.isCorrect === false ? "bg-red-50" : "bg-gray-50"}`}>
                              <span className="font-bold">Q{qi + 1}. {q.question}</span>
                              <span className="ml-2">Your answer: <strong>{sa?.answer || "—"}</strong></span>
                              {sa?.isCorrect === true && <span className="text-emerald-600 ml-1">✅</span>}
                              {sa?.isCorrect === false && <span className="text-red-600 ml-1">❌ (Correct: {q.correctAnswer})</span>}
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
      })()}

      {/* ============ REPORTS TAB ============ */}
      {tab === "reports" && (
        <div className="space-y-3">
          {termReports.length === 0 ? (
            <div className="card text-center py-8">
              <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No term reports yet</p>
              <p className="text-[10px] text-gray-400 mt-1">Reports are generated at the end of each term</p>
            </div>
          ) : termReports.map((r: any) => (
            <div key={r.id} className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-lg">🏆</div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-800">{r.term?.name || "Term Report"}</h4>
                  <p className="text-[10px] text-gray-500">Average: {r.averageScore?.toFixed(1)}% · Position: {r.position || "—"}</p>
                  <p className="text-[10px] text-gray-400">{r.status}</p>
                </div>
                {r.principalRemarks && <p className="text-[10px] text-brand-600 max-w-[150px] truncate italic">{r.principalRemarks}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
