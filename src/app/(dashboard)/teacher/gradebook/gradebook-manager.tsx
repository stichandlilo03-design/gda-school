"use client";

import { useState } from "react";
import { createAssessment, enterScores, deleteAssessment } from "@/lib/actions/teacher";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, ClipboardList, Save } from "lucide-react";

const TYPES = [
  { value: "CONTINUOUS_ASSESSMENT", label: "Continuous Assessment (CA)" },
  { value: "MID_TERM_TEST", label: "Mid-Term Test" },
  { value: "END_OF_TERM_EXAM", label: "End-of-Term Exam" },
  { value: "PROJECT", label: "Project / Portfolio" },
];

export default function GradebookManager({ classes }: { classes: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({ type: "CONTINUOUS_ASSESSMENT", title: "", description: "", maxScore: 100, weight: 1, dueDate: "" });
  const [editingScores, setEditingScores] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  const currentClass = classes.find((c: any) => c.id === selectedClass);

  const handleCreateAssessment = async () => {
    if (!selectedClass || !assessmentForm.title) { alert("Fill in all fields"); return; }
    setLoading("create");
    const result = await createAssessment({ classId: selectedClass, ...assessmentForm });
    if (result.error) alert(result.error);
    else { router.refresh(); setShowNewAssessment(false); setAssessmentForm({ type: "CONTINUOUS_ASSESSMENT", title: "", description: "", maxScore: 100, weight: 1, dueDate: "" }); }
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
    else { setMessage("Scores saved!"); setEditingScores(null); router.refresh(); }
    setLoading("");
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm("Delete this assessment and all scores?")) return;
    setLoading(id);
    await deleteAssessment(id);
    router.refresh();
    setLoading("");
  };

  return (
    <div className="space-y-6">
      {message && <div className="rounded-lg p-3 text-sm bg-emerald-50 text-emerald-700">{message}</div>}

      <div className="card">
        <label className="label">Select Class</label>
        <select className="input-field max-w-md" value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setEditingScores(null); }}>
          <option value="">Choose a class...</option>
          {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.schoolGrade.gradeLevel})</option>)}
        </select>
      </div>

      {currentClass && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{currentClass.assessments.length} assessment(s)</p>
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
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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

          {/* Assessments list */}
          {currentClass.assessments.length === 0 ? (
            <div className="card text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No assessments yet. Create one to start grading.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentClass.assessments.map((a: any) => (
                <div key={a.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">{a.title}</h4>
                      <p className="text-xs text-gray-500">{a.type.replace(/_/g, " ")} • Max: {a.maxScore} • Weight: {a.weight}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{a.scores.length}/{currentClass.enrollments.length} graded</span>
                      <button onClick={() => startScoring(a)} className="btn-ghost text-xs px-3 py-1 bg-brand-50 text-brand-600">
                        Enter Scores
                      </button>
                      <button onClick={() => handleDeleteAssessment(a.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {editingScores === a.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      {currentClass.enrollments.map((e: any) => (
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
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
