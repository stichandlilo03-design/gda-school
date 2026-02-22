"use client";

import { useState } from "react";
import { setFeeStructure, updateFeePolicy } from "@/lib/actions/school";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, DollarSign, Save, Edit3, AlertTriangle, Users, TrendingDown, CreditCard, Search, ChevronDown, ChevronUp, Settings } from "lucide-react";
import { getGradeLabelForCountry } from "@/lib/education-systems";

const TERMS = [{ value: "TERM_1", label: "Term 1" }, { value: "TERM_2", label: "Term 2" }, { value: "TERM_3", label: "Term 3" }];

export default function FeeManager({
  grades, fees, currency, studentDebts, pendingPaymentsCount, countryCode = "NG",
  feePaymentThreshold = 70, feePaymentPolicy = "PERCENTAGE", feeInstructions = "",
}: {
  grades: any[]; fees: any[]; currency: string; studentDebts?: any[]; pendingPaymentsCount?: number; countryCode?: string;
  feePaymentThreshold?: number; feePaymentPolicy?: string; feeInstructions?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [selectedGrade, setSelectedGrade] = useState(grades[0]?.id || "");
  const [selectedTerm, setSelectedTerm] = useState("TERM_1");
  const [form, setForm] = useState({ tuitionFee: 0, registrationFee: 0, examFee: 0, technologyFee: 0 });
  const [editingFee, setEditingFee] = useState<string | null>(null);
  const [debtSearch, setDebtSearch] = useState("");
  const [debtFilter, setDebtFilter] = useState<"all"|"critical"|"warning"|"low">("all");
  const [policyForm, setPolicyForm] = useState({
    feePaymentPolicy: feePaymentPolicy,
    feePaymentThreshold: feePaymentThreshold,
    feeInstructions: feeInstructions,
  });
  const [showPolicy, setShowPolicy] = useState(false);
  const [showDebts, setShowDebts] = useState(true);

  const loadExisting = (gradeId: string, term: string) => {
    const existing = fees.find((f: any) => f.schoolGradeId === gradeId && f.term === term);
    if (existing) setForm({ tuitionFee: existing.tuitionFee, registrationFee: existing.registrationFee, examFee: existing.examFee, technologyFee: existing.technologyFee });
    else setForm({ tuitionFee: 0, registrationFee: 0, examFee: 0, technologyFee: 0 });
  };

  const handleEdit = (fee: any) => {
    setEditingFee(fee.id);
    setSelectedGrade(fee.schoolGradeId);
    setSelectedTerm(fee.term);
    setForm({ tuitionFee: fee.tuitionFee, registrationFee: fee.registrationFee, examFee: fee.examFee, technologyFee: fee.technologyFee });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!selectedGrade) { alert("Select a grade level first"); return; }
    setLoading("save");
    const result = await setFeeStructure({ schoolGradeId: selectedGrade, term: selectedTerm, ...form });
    if (result.error) setMessage("Error: " + result.error);
    else { setMessage(editingFee ? "Fee updated!" : "Fee saved!"); setEditingFee(null); router.refresh(); }
    setLoading("");
    setTimeout(() => setMessage(""), 3000);
  };

  const total = form.tuitionFee + form.registrationFee + form.examFee + form.technologyFee;
  const debts = studentDebts || [];
  const totalOutstanding = debts.reduce((s: number, d: any) => s + d.balance, 0);

  const filteredDebts = debts.filter((d: any) => {
    if (debtSearch && !d.name.toLowerCase().includes(debtSearch.toLowerCase()) && !d.email.toLowerCase().includes(debtSearch.toLowerCase())) return false;
    if (debtFilter === "critical" && d.percent >= 30) return false;
    if (debtFilter === "warning" && (d.percent < 30 || d.percent >= 70)) return false;
    if (debtFilter === "low" && d.percent < 70) return false;
    return true;
  });

  const handleSavePolicy = async () => {
    setLoading("policy");
    const result = await updateFeePolicy(policyForm);
    if (result.error) setMessage("Error: " + result.error);
    else { setMessage("Fee policy saved!"); router.refresh(); }
    setLoading("");
  };

  return (
    <div className="space-y-6">
      {message && <div className={`rounded-lg p-3 text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</div>}

      {/* FEE PAYMENT POLICY */}
      <div className="card border-2 border-purple-200">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowPolicy(!showPolicy)}>
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-gray-800">Fee Payment Policy</h3>
              <p className="text-[10px] text-gray-500">
                Current: {policyForm.feePaymentPolicy === "FULL" ? "Full payment required" :
                  policyForm.feePaymentPolicy === "FLEXIBLE" ? "No minimum — flexible payment" :
                  `Minimum ${policyForm.feePaymentThreshold}% payment required`}
              </p>
            </div>
          </div>
          {showPolicy ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>

        {showPolicy && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div>
              <label className="label">Payment Policy *</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "PERCENTAGE", label: "Minimum Percentage", desc: "Students pay at least X% before accessing classes", icon: "📊" },
                  { value: "FULL", label: "Full Payment", desc: "Students must pay 100% before accessing classes", icon: "💯" },
                  { value: "FLEXIBLE", label: "Flexible / Owe", desc: "Students can access classes regardless of payment", icon: "🤝" },
                ].map(p => (
                  <button key={p.value} type="button"
                    onClick={() => setPolicyForm(prev => ({ ...prev, feePaymentPolicy: p.value }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      policyForm.feePaymentPolicy === p.value ? "border-purple-500 bg-purple-50 ring-1 ring-purple-300" : "border-gray-200 hover:border-purple-200"
                    }`}>
                    <span className="text-xl">{p.icon}</span>
                    <h4 className="text-xs font-bold text-gray-800 mt-1">{p.label}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {policyForm.feePaymentPolicy === "PERCENTAGE" && (
              <div>
                <label className="label">Minimum Payment Threshold (%)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={100} step={5}
                    value={policyForm.feePaymentThreshold}
                    onChange={(e) => setPolicyForm(prev => ({ ...prev, feePaymentThreshold: parseInt(e.target.value) }))}
                    className="flex-1 accent-purple-600" />
                  <span className="text-lg font-bold text-purple-700 w-16 text-center">{policyForm.feePaymentThreshold}%</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Students who paid at least {policyForm.feePaymentThreshold}% can access classes
                </p>
              </div>
            )}

            <div>
              <label className="label">Fee Instructions for Students</label>
              <textarea className="input-field min-h-[80px]" placeholder="e.g. Payment due by 15th of each month. Bank: ABC, Account: 1234567890..."
                value={policyForm.feeInstructions}
                onChange={(e) => setPolicyForm(prev => ({ ...prev, feeInstructions: e.target.value }))} />
              <p className="text-[10px] text-gray-500 mt-1">Students see this on their dashboard and fees page</p>
            </div>

            <button onClick={handleSavePolicy} disabled={loading === "policy"} className="btn-primary text-xs px-4 py-2">
              {loading === "policy" ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Saving...</> : <><Save className="w-3 h-3 mr-1" /> Save Fee Policy</>}
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mb-2"><DollarSign className="w-4 h-4 text-blue-600" /></div>
          <div className="text-2xl font-bold">{fees.length}</div>
          <div className="text-[10px] text-gray-500">Fee Structures Set</div>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center mb-2"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
          <div className="text-2xl font-bold text-red-600">{debts.length}</div>
          <div className="text-[10px] text-gray-500">Students With Debt</div>
        </div>
        <div className="stat-card">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mb-2"><TrendingDown className="w-4 h-4 text-amber-600" /></div>
          <div className="text-lg font-bold text-amber-700">{currency} {totalOutstanding.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500">Total Outstanding</div>
        </div>
        <Link href="/principal/payments" className="stat-card hover:border-brand-200 transition cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mb-2"><CreditCard className="w-4 h-4 text-purple-600" /></div>
          <div className="text-2xl font-bold text-purple-600">{pendingPaymentsCount || 0}</div>
          <div className="text-[10px] text-gray-500">Pending Reviews →</div>
        </Link>
      </div>

      {grades.length === 0 ? (
        <div className="card text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Add grade levels in Curriculum first, then set fees here.</p>
        </div>
      ) : (
        <>
          {/* Set / Edit Fee Form */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">{editingFee ? "Edit Fee Structure" : "Set Fee Structure"}</h3>
              {editingFee && <button onClick={() => { setEditingFee(null); setForm({ tuitionFee: 0, registrationFee: 0, examFee: 0, technologyFee: 0 }); }} className="text-xs text-gray-500 hover:text-red-500">Cancel Edit</button>}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label">Grade Level</label>
                <select className="input-field" value={selectedGrade} onChange={(e) => { setSelectedGrade(e.target.value); loadExisting(e.target.value, selectedTerm); }}>
                  {grades.map((g: any) => <option key={g.id} value={g.id}>{getGradeLabelForCountry(g.gradeLevel, countryCode)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Term</label>
                <select className="input-field" value={selectedTerm} onChange={(e) => { setSelectedTerm(e.target.value); loadExisting(selectedGrade, e.target.value); }}>
                  {TERMS.map((t: any) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { key: "tuitionFee", label: "Tuition Fee" },
                { key: "registrationFee", label: "Registration Fee" },
                { key: "examFee", label: "Exam Fee" },
                { key: "technologyFee", label: "Technology Fee" },
              ].map((f: any) => (
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
              {loading === "save" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> {editingFee ? "Update Fee" : "Save Fee"}</>}
            </button>
          </div>

          {/* Existing Fees Table with Edit */}
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
                      <th className="table-header px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((f: any) => {
                      const t = f.tuitionFee + f.registrationFee + f.examFee + f.technologyFee;
                      const isEditing = editingFee === f.id;
                      return (
                        <tr key={f.id} className={`border-b border-gray-50 ${isEditing ? "bg-brand-50" : "hover:bg-gray-50"}`}>
                          <td className="px-4 py-3 text-sm font-medium">{getGradeLabelForCountry(f.schoolGrade.gradeLevel, countryCode)}</td>
                          <td className="px-4 py-3 text-sm">{f.term.replace("_", " ")}</td>
                          <td className="px-4 py-3 text-sm">{f.tuitionFee.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm">{f.registrationFee.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm">{f.examFee.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm">{f.technologyFee.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm font-bold">{currency} {t.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleEdit(f)} className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 ${isEditing ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-600"}`}>
                              <Edit3 className="w-3 h-3" /> {isEditing ? "Editing..." : "Edit"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Outstanding Debts */}
          {debts.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowDebts(!showDebts)}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="section-title">Outstanding Student Debts ({debts.length})</h3>
                </div>
                {showDebts ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>

              {showDebts && (
                <>
                  <div className="flex gap-3 mb-4 flex-wrap">
                    <div className="flex-1 relative min-w-[180px]">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input className="input-field pl-9 text-xs" placeholder="Search student..." value={debtSearch} onChange={(e) => setDebtSearch(e.target.value)} />
                    </div>
                    <div className="flex gap-1">
                      {([["all","All",debts.length],["critical","Critical (<30%)",debts.filter((d:any)=>d.percent<30).length],["warning","Warning (30-69%)",debts.filter((d:any)=>d.percent>=30&&d.percent<70).length],["low","Low (70%+)",debts.filter((d:any)=>d.percent>=70).length]] as const).map(([v,l,c]) => (
                        <button key={v} onClick={() => setDebtFilter(v)} className={`text-[10px] px-2.5 py-1.5 rounded-lg ${debtFilter === v ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                          {l} ({c})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="table-header px-4 py-3">Student</th>
                          <th className="table-header px-4 py-3">Grade</th>
                          <th className="table-header px-4 py-3">Total Fees</th>
                          <th className="table-header px-4 py-3">Paid</th>
                          <th className="table-header px-4 py-3">Balance</th>
                          <th className="table-header px-4 py-3">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDebts.map((d: any) => (
                          <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {d.image ? <img src={d.image} alt="" className="w-7 h-7 rounded-full" /> : <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600">{d.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2)}</div>}
                                <div>
                                  <p className="text-xs font-medium text-gray-800">{d.name}</p>
                                  <p className="text-[10px] text-gray-400">{d.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs">{d.grade}</td>
                            <td className="px-4 py-3 text-xs">{currency} {d.totalFees.toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs text-emerald-600">{currency} {d.totalPaid.toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs font-bold text-red-600">{currency} {d.balance.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${d.percent < 30 ? "bg-red-500" : d.percent < 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: d.percent + "%" }} />
                                </div>
                                <span className={`text-[10px] font-bold ${d.percent < 30 ? "text-red-600" : d.percent < 70 ? "text-amber-600" : "text-emerald-600"}`}>{d.percent}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center justify-between">
                    <span className="text-xs font-medium text-red-700">Total Outstanding from {debts.length} students</span>
                    <span className="text-sm font-bold text-red-700">{currency} {totalOutstanding.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
