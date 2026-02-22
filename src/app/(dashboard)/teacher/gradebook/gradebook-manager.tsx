"use client";

import { useState } from "react";
import { createAssessment, enterScores, deleteAssessment } from "@/lib/actions/teacher";
import { submitGradesForApproval, createAssignment, gradeAssignment } from "@/lib/actions/grading";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, ClipboardList, Save, Send, CheckCircle, Clock, XCircle, FileText, AlertTriangle } from "lucide-react";

const TYPES = [
  { value: "CONTINUOUS_ASSESSMENT", label: "Continuous Assessment (CA)" },
  { value: "MID_TERM_TEST", label: "Mid-Term Test" },
  { value: "END_OF_TERM_EXAM", label: "End-of-Term Exam" },
  { value: "PROJECT", label: "Project / Portfolio" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-600", label: "Draft", icon: FileText },
  SUBMITTED: { bg: "bg-amber-100", text: "text-amber-700", label: "Awaiting Approval", icon: Clock },
  APPROVED: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Approved ✓", icon: CheckCircle },
  REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Rejected", icon: XCircle },
};

export default function GradebookManager({ classes, assignments = [] }: { classes: any[]; assignments?: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [tab, setTab] = useState<"assessments" | "assignments">("assessments");
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({ type: "CONTINUOUS_ASSESSMENT", title: "", description: "", maxScore: 100, weight: 1, dueDate: "" });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", description: "", dueDate: "", maxScore: 100, type: "HOMEWORK" });
  const [hwQuestions, setHwQuestions] = useState<any[]>([]);
  const [editingScores, setEditingScores] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  const currentClass = classes.find((c: any) => c.id === selectedClass);
  const classAssignments = assignments.filter((a: any) => a.classId === selectedClass);

  const handleCreateAssessment = async () => {
    if (!selectedClass || !assessmentForm.title) { alert("Fill in all fields"); return; }
    setLoading("create");
    const result = await createAssessment({ classId: selectedClass, ...assessmentForm });
    if (result.error) alert(result.error);
    else { router.refresh(); setShowNewAssessment(false); setAssessmentForm({ type: "CONTINUOUS_ASSESSMENT", title: "", description: "", maxScore: 100, weight: 1, dueDate: "" }); setMessage("Assessment created (Draft). Enter scores and submit for principal approval."); }
    setLoading("");
  };

  const handleCreateAssignment = async () => {
    if (!selectedClass || !assignmentForm.title) { alert("Fill in title"); return; }
    setLoading("assign");
    const result = await createAssignment({ classId: selectedClass, ...assignmentForm, questions: hwQuestions.length > 0 ? hwQuestions : undefined });
    if (result.error) alert(result.error);
    else { router.refresh(); setShowNewAssignment(false); setAssignmentForm({ title: "", description: "", dueDate: "", maxScore: 100, type: "HOMEWORK" }); setHwQuestions([]); setMessage("Assignment created!"); }
    setLoading("");
  };

  const startScoring = (assessment: any) => {
    setEditingScores(assessment.id);
    const initial: Record<string, number> = {};
    currentClass?.enrollments.forEach((e: any) => {
      const existing = assessment.scores.find((s: any) => s.studentId === e.student.id);
      initial[e.student.id] = existing?.score ?? 0;
    });
    setScores(initial);
  };

  const handleSaveScores = async () => {
    if (!editingScores) return;
    setLoading("scores");
    const result = await enterScores({
      assessmentId: editingScores,
      scores: Object.entries(scores).map(([studentId, score]) => ({ studentId, score })),
    });
    if (result.error) setMessage("Error: " + result.error);
    else { setMessage("Scores saved! Now submit for principal approval."); setEditingScores(null); router.refresh(); }
    setLoading("");
  };

  const handleSubmitForApproval = async (assessmentId: string) => {
    setLoading(assessmentId);
    const result = await submitGradesForApproval(assessmentId);
    if (result.error) setMessage("Error: " + result.error);
    else { setMessage("✅ Grades submitted for principal approval!"); router.refresh(); }
    setLoading("");
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm("Delete this assessment and all scores?")) return;
    setLoading(id);
    await deleteAssessment(id);
    router.refresh();
    setLoading("");
  };

  const handleGradeAssignment = async (subId: string, score: number) => {
    setLoading(subId);
    await gradeAssignment(subId, score);
    router.refresh();
    setLoading("");
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-xl p-3 text-sm flex items-center gap-2 ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message} <button onClick={() => setMessage("")} className="ml-auto text-xs">✕</button>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700">
          <strong>Anti-Manipulation System:</strong> All grades must be submitted for principal approval before students/parents can see them.
          The flow is: Create Assessment → Enter Scores → Submit for Approval → Principal Reviews → Approved/Rejected.
        </div>
      </div>

      <div className="card">
        <label className="label">Select Class</label>
        <select className="input-field max-w-md" value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setEditingScores(null); }}>
          <option value="">Choose a class...</option>
          {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.schoolGrade?.gradeLevel})</option>)}
        </select>
      </div>

      {currentClass && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b pb-2">
            <button onClick={() => setTab("assessments")} className={`px-4 py-2 rounded-t-lg text-sm font-medium ${tab === "assessments" ? "bg-brand-50 text-brand-700 border-b-2 border-brand-600" : "text-gray-500"}`}>
              📝 Assessments & Grades
            </button>
            <button onClick={() => setTab("assignments")} className={`px-4 py-2 rounded-t-lg text-sm font-medium ${tab === "assignments" ? "bg-brand-50 text-brand-700 border-b-2 border-brand-600" : "text-gray-500"}`}>
              📋 Assignments ({classAssignments.length})
            </button>
          </div>

          {/* ASSESSMENTS TAB */}
          {tab === "assessments" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{currentClass.assessments?.length || 0} assessment(s)</p>
                <button onClick={() => setShowNewAssessment(!showNewAssessment)} className="btn-primary text-sm">
                  <Plus className="w-4 h-4 mr-1" /> New Assessment
                </button>
              </div>

              {showNewAssessment && (
                <div className="card bg-emerald-50 border-emerald-200">
                  <h4 className="text-sm font-semibold mb-3">Create Assessment</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <select className="input-field" value={assessmentForm.type} onChange={(e) => setAssessmentForm((p) => ({ ...p, type: e.target.value }))}>
                        {TYPES.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <input className="input-field" placeholder="Title (e.g. Week 3 CA)" value={assessmentForm.title} onChange={(e) => setAssessmentForm((p) => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <input type="number" className="input-field" placeholder="Max Score" value={assessmentForm.maxScore} onChange={(e) => setAssessmentForm((p) => ({ ...p, maxScore: parseFloat(e.target.value) || 100 }))} />
                      <input type="number" className="input-field" placeholder="Weight" step="0.1" value={assessmentForm.weight} onChange={(e) => setAssessmentForm((p) => ({ ...p, weight: parseFloat(e.target.value) || 1 }))} />
                      <input type="date" className="input-field" value={assessmentForm.dueDate} onChange={(e) => setAssessmentForm((p) => ({ ...p, dueDate: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCreateAssessment} disabled={loading === "create"} className="btn-primary text-sm">
                        {loading === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                      </button>
                      <button onClick={() => setShowNewAssessment(false)} className="btn-ghost text-sm">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {(!currentClass.assessments || currentClass.assessments.length === 0) ? (
                <div className="card text-center py-12">
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No assessments yet. Create one to start grading.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentClass.assessments.map((a: any) => {
                    const st = STATUS_COLORS[a.gradeStatus] || STATUS_COLORS.DRAFT;
                    const StIcon = st.icon;
                    return (
                      <div key={a.id} className="card">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-gray-800">{a.title}</h4>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${st.bg} ${st.text}`}>
                                <StIcon className="w-3 h-3" /> {st.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{a.type.replace(/_/g, " ")} • Max: {a.maxScore} • Weight: {a.weight}</p>
                            {a.gradeStatus === "REJECTED" && a.rejectedReason && (
                              <p className="text-xs text-red-600 mt-1">⚠ Rejection reason: {a.rejectedReason}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{a.scores?.length || 0}/{currentClass.enrollments?.length || 0} graded</span>
                            {(a.gradeStatus === "DRAFT" || a.gradeStatus === "REJECTED") && (
                              <>
                                <button onClick={() => startScoring(a)} className="btn-ghost text-xs px-3 py-1 bg-brand-50 text-brand-600">
                                  Enter Scores
                                </button>
                                {(a.scores?.length || 0) > 0 && (
                                  <button onClick={() => handleSubmitForApproval(a.id)} disabled={!!loading}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1">
                                    <Send className="w-3 h-3" /> Submit for Approval
                                  </button>
                                )}
                                <button onClick={() => handleDeleteAssessment(a.id)} className="text-red-400 hover:text-red-600">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {editingScores === a.id && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            {currentClass.enrollments?.map((e: any) => (
                              <div key={e.id} className="flex items-center gap-4">
                                <span className="text-sm text-gray-700 flex-1">{e.student.user.name}</span>
                                <input type="number" className="input-field w-24" min={0} max={a.maxScore} value={scores[e.student.id] ?? 0}
                                  onChange={(ev) => setScores((p) => ({ ...p, [e.student.id]: parseFloat(ev.target.value) || 0 }))} />
                                <span className="text-xs text-gray-400">/ {a.maxScore}</span>
                              </div>
                            ))}
                            <div className="flex gap-2 mt-3">
                              <button onClick={handleSaveScores} disabled={loading === "scores"} className="btn-primary text-sm">
                                {loading === "scores" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save Scores</>}
                              </button>
                              <button onClick={() => setEditingScores(null)} className="btn-ghost text-sm">Cancel</button>
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

          {/* ASSIGNMENTS TAB */}
          {tab === "assignments" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{classAssignments.length} assignment(s)</p>
                <button onClick={() => setShowNewAssignment(!showNewAssignment)} className="btn-primary text-sm">
                  <Plus className="w-4 h-4 mr-1" /> New Assignment
                </button>
              </div>

              {showNewAssignment && (
                <div className="card bg-blue-50 border-blue-200">
                  <h4 className="text-sm font-semibold mb-3">Create Assignment / Homework</h4>
                  <div className="space-y-3">
                    <input className="input-field" placeholder="Title (e.g. Chapter 5 Homework)" value={assignmentForm.title} onChange={e => setAssignmentForm(p => ({ ...p, title: e.target.value }))} />
                    <textarea className="input-field" rows={2} placeholder="Description / instructions for students" value={assignmentForm.description} onChange={e => setAssignmentForm(p => ({ ...p, description: e.target.value }))} />
                    <div className="grid grid-cols-3 gap-3">
                      <select className="input-field" value={assignmentForm.type} onChange={e => setAssignmentForm(p => ({ ...p, type: e.target.value }))}>
                        <option value="HOMEWORK">Homework</option>
                        <option value="ASSIGNMENT">Assignment</option>
                        <option value="QUIZ">Quiz</option>
                      </select>
                      <input type="date" className="input-field" value={assignmentForm.dueDate} onChange={e => setAssignmentForm(p => ({ ...p, dueDate: e.target.value }))} />
                      <input type="number" className="input-field" placeholder="Max Score" value={assignmentForm.maxScore} onChange={e => setAssignmentForm(p => ({ ...p, maxScore: parseInt(e.target.value) || 100 }))} />
                    </div>

                    {/* Question Builder */}
                    <div className="border-t border-blue-300 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-bold text-blue-800">Questions ({hwQuestions.length}) — auto-graded for MCQ & Math</h5>
                        <div className="flex gap-1">
                          {[{t:"mcq",l:"+ MCQ",c:"bg-blue-600"},{t:"short",l:"+ Short",c:"bg-gray-600"},{t:"math",l:"+ Math",c:"bg-green-600"},{t:"essay",l:"+ Essay",c:"bg-purple-600"}].map(b => (
                            <button key={b.t} type="button" onClick={() => setHwQuestions(prev => [...prev, { id: `q${Date.now()}${Math.random().toString(36).slice(2,5)}`, type: b.t, question: "", options: b.t==="mcq" ? ["","","",""] : undefined, correctAnswer: "", points: 1 }])}
                              className={`${b.c} text-white text-[10px] px-2 py-1 rounded font-bold hover:opacity-80`}>{b.l}</button>
                          ))}
                        </div>
                      </div>

                      {hwQuestions.length === 0 && (
                        <p className="text-[10px] text-blue-600 bg-blue-100 p-2 rounded">No questions added yet. Add questions above for structured homework, or leave empty for free-form essay submission.</p>
                      )}

                      {hwQuestions.map((q, qi) => (
                        <div key={q.id} className="bg-white rounded-lg p-3 border mb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">{qi+1}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${q.type==="mcq"?"bg-blue-100 text-blue-700":q.type==="math"?"bg-green-100 text-green-700":q.type==="essay"?"bg-purple-100 text-purple-700":"bg-gray-200 text-gray-600"}`}>
                              {q.type==="mcq"?"Multiple Choice":q.type==="math"?"Math":q.type==="essay"?"Essay":"Short Answer"}
                            </span>
                            <input type="number" className="input-field w-16 text-[10px] py-0.5 ml-auto" min={1} placeholder="pts" value={q.points}
                              onChange={e => setHwQuestions(prev => prev.map((qq,i) => i===qi ? {...qq, points: parseInt(e.target.value)||1} : qq))} />
                            <span className="text-[9px] text-gray-400">pts</span>
                            <button type="button" onClick={() => setHwQuestions(prev => prev.filter((_,i) => i!==qi))} className="text-red-400 hover:text-red-600 text-xs ml-1">✕</button>
                          </div>

                          <input className="input-field text-sm mb-2" placeholder={q.type==="math" ? "e.g. Solve: 2x + 5 = 15, find x" : "Question text..."} value={q.question}
                            onChange={e => setHwQuestions(prev => prev.map((qq,i) => i===qi ? {...qq, question: e.target.value} : qq))} />

                          {/* MCQ options */}
                          {q.type === "mcq" && (
                            <div className="space-y-1 mb-2">
                              {(q.options||[]).map((opt: string, oi: number) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-gray-500 w-4">{String.fromCharCode(65+oi)}.</span>
                                  <input className="input-field flex-1 text-xs py-1" placeholder={`Option ${String.fromCharCode(65+oi)}`} value={opt}
                                    onChange={e => {
                                      const newOpts = [...(q.options||[])]; newOpts[oi] = e.target.value;
                                      setHwQuestions(prev => prev.map((qq,i) => i===qi ? {...qq, options: newOpts} : qq));
                                    }} />
                                  <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === opt && opt !== ""}
                                    onChange={() => setHwQuestions(prev => prev.map((qq,i) => i===qi ? {...qq, correctAnswer: opt} : qq))}
                                    title="Mark as correct answer" className="text-emerald-600" />
                                </div>
                              ))}
                              <button type="button" onClick={() => setHwQuestions(prev => prev.map((qq,i) => i===qi ? {...qq, options: [...(qq.options||[]), ""]} : qq))}
                                className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">+ Add option</button>
                              {q.correctAnswer && <p className="text-[10px] text-emerald-600 font-bold">✅ Correct: {q.correctAnswer}</p>}
                            </div>
                          )}

                          {/* Math / Short correct answer */}
                          {(q.type === "math" || q.type === "short") && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">Correct answer:</span>
                              <input className="input-field flex-1 text-xs py-1 font-mono" placeholder={q.type==="math" ? "e.g. 5 or x=5" : "Expected answer"} value={q.correctAnswer}
                                onChange={e => setHwQuestions(prev => prev.map((qq,i) => i===qi ? {...qq, correctAnswer: e.target.value} : qq))} />
                              {q.type==="math" && <span className="text-[9px] text-green-600">🤖 Auto-graded</span>}
                            </div>
                          )}

                          {/* Essay — no correct answer */}
                          {q.type === "essay" && (
                            <p className="text-[10px] text-purple-600">📝 Essay — you&apos;ll grade this manually</p>
                          )}
                        </div>
                      ))}

                      {hwQuestions.length > 0 && (
                        <div className="bg-blue-100 rounded-lg p-2 text-[10px] text-blue-700 font-medium">
                          Total: {hwQuestions.reduce((s,q) => s + (q.points||1), 0)} points · {hwQuestions.filter(q => q.type==="mcq"||q.type==="math").length} auto-graded · {hwQuestions.filter(q => q.type==="essay"||q.type==="short").length} manual
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={handleCreateAssignment} disabled={loading === "assign"} className="btn-primary text-sm">
                        {loading === "assign" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Assignment"}
                      </button>
                      <button onClick={() => { setShowNewAssignment(false); setHwQuestions([]); }} className="btn-ghost text-sm">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {classAssignments.length === 0 ? (
                <div className="card text-center py-8"><p className="text-gray-400 text-sm">No assignments yet</p></div>
              ) : (
                <div className="space-y-3">
                  {classAssignments.map((a: any) => {
                    const submitted = a.submissions?.length || 0;
                    const total = currentClass.enrollments?.length || 0;
                    const graded = a.submissions?.filter((s: any) => s.gradedAt).length || 0;
                    return (
                      <div key={a.id} className="card">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold">{a.title}</h4>
                            <p className="text-xs text-gray-500">Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "No deadline"} • Max: {a.maxScore}</p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {submitted}/{total} submitted • {graded} graded
                          </div>
                        </div>
                        {a.description && <p className="text-[10px] text-gray-500 mt-1">{a.description}</p>}

                        {/* Submissions */}
                        {submitted > 0 && (
                          <div className="mt-3 pt-3 border-t space-y-1.5">
                            {a.submissions.map((sub: any) => {
                              const studentName = currentClass.enrollments?.find((e: any) => e.student.id === sub.studentId)?.student?.user?.name || "Unknown";
                              return (
                                <div key={sub.id} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-[10px]">
                                  <span className="font-medium">{studentName}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-400">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                                    {sub.gradedAt ? (
                                      <span className="font-bold text-emerald-600">{sub.score}/{a.maxScore}</span>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <input type="number" className="input-field w-16 text-xs py-0.5" min={0} max={a.maxScore} placeholder="Score"
                                          onBlur={(e) => { const v = parseFloat(e.target.value); if (v >= 0) handleGradeAssignment(sub.id, v); }} />
                                        <span className="text-gray-400">/{a.maxScore}</span>
                                      </div>
                                    )}
                                  </div>
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
            </>
          )}
        </>
      )}
    </div>
  );
}
