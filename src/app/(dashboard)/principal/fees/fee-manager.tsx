"use client";

import { useState } from "react";
import { setFeeStructure } from "@/lib/actions/school";
import { useRouter } from "next/navigation";
import { Loader2, DollarSign, Save } from "lucide-react";

const TERMS = [
  { value: "TERM_1", label: "Term 1" },
  { value: "TERM_2", label: "Term 2" },
  { value: "TERM_3", label: "Term 3" },
];

const GRADE_LABELS: Record<string,string> = {
  K1:"Kindergarten 1",K2:"Kindergarten 2",K3:"Kindergarten 3",
  G1:"Grade 1",G2:"Grade 2",G3:"Grade 3",G4:"Grade 4",G5:"Grade 5",G6:"Grade 6",
  G7:"Grade 7",G8:"Grade 8",G9:"Grade 9",G10:"Grade 10",G11:"Grade 11",G12:"Grade 12",
};

export default function FeeManager({ grades, fees, currency }: { grades: any[]; fees: any[]; currency: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [selectedGrade, setSelectedGrade] = useState(grades[0]?.id || "");
  const [selectedTerm, setSelectedTerm] = useState("TERM_1");
  const [form, setForm] = useState({ tuitionFee: 0, registrationFee: 0, examFee: 0, technologyFee: 0 });

  const loadExisting = (gradeId: string, term: string) => {
    const existing = fees.find((f: any) => f.schoolGradeId === gradeId && f.term === term);
    if (existing) {
      setForm({ tuitionFee: existing.tuitionFee, registrationFee: existing.registrationFee, examFee: existing.examFee, technologyFee: existing.technologyFee });
    } else {
      setForm({ tuitionFee: 0, registrationFee: 0, examFee: 0, technologyFee: 0 });
    }
  };

  const handleGradeChange = (gradeId: string) => { setSelectedGrade(gradeId); loadExisting(gradeId, selectedTerm); };
  const handleTermChange = (term: string) => { setSelectedTerm(term); loadExisting(selectedGrade, term); };

  const handleSave = async () => {
    if (!selectedGrade) { alert("Select a grade level first"); return; }
    setLoading("save");
    const result = await setFeeStructure({ schoolGradeId: selectedGrade, term: selectedTerm, ...form });
    if (result.error) setMessage("Error: " + result.error);
    else { setMessage("Fees saved successfully!"); router.refresh(); }
    setLoading("");
  };

  const total = form.tuitionFee + form.registrationFee + form.examFee + form.technologyFee;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</div>
      )}

      {grades.length === 0 ? (
        <div className="card text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Add grade levels in Curriculum first, then set fees here.</p>
        </div>
      ) : (
        <>
          <div className="card">
            <h3 className="section-title mb-4">Set Fee Structure</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label">Grade Level</label>
                <select className="input-field" value={selectedGrade} onChange={(e) => handleGradeChange(e.target.value)}>
                  {grades.map((g: any) => <option key={g.id} value={g.id}>{GRADE_LABELS[g.gradeLevel] || g.gradeLevel}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Term</label>
                <select className="input-field" value={selectedTerm} onChange={(e) => handleTermChange(e.target.value)}>
                  {TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { key: "tuitionFee", label: "Tuition Fee" },
                { key: "registrationFee", label: "Registration Fee" },
                { key: "examFee", label: "Exam Fee" },
                { key: "technologyFee", label: "Technology Fee" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="label">{f.label} ({currency})</label>
                  <input type="number" className="input-field" min={0} value={(form as any)[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: parseFloat(e.target.value) || 0 }))} />
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">Total per Student</span>
              <span className="text-xl font-bold text-brand-600">{currency} {total.toLocaleString()}</span>
            </div>

            <button onClick={handleSave} disabled={loading === "save"} className="btn-primary">
              {loading === "save" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Fee Structure</>}
            </button>
          </div>

          {/* Existing Fees Table */}
          {fees.length > 0 && (
            <div className="card">
              <h3 className="section-title mb-4">All Fee Structures</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="table-header px-4 py-3">Grade</th>
                      <th className="table-header px-4 py-3">Term</th>
                      <th className="table-header px-4 py-3">Tuition</th>
                      <th className="table-header px-4 py-3">Registration</th>
                      <th className="table-header px-4 py-3">Exam</th>
                      <th className="table-header px-4 py-3">Tech</th>
                      <th className="table-header px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((f: any) => (
                      <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{f.schoolGrade.gradeLevel}</td>
                        <td className="px-4 py-3 text-sm">{f.term.replace("_", " ")}</td>
                        <td className="px-4 py-3 text-sm">{f.tuitionFee.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">{f.registrationFee.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">{f.examFee.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm">{f.technologyFee.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-bold">
                          {(f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
