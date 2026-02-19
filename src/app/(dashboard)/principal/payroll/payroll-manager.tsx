"use client";

import { useState } from "react";
import { setTeacherSalary, generatePayroll, processPayroll, batchProcessPayroll, cancelPayroll, adjustPayroll } from "@/lib/actions/payroll";
import { useRouter } from "next/navigation";
import { Loader2, DollarSign, Users, ChevronDown, ChevronUp, Plus, Check, X, TrendingUp, TrendingDown, CreditCard, Clock, Banknote, AlertCircle } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-700", PENDING: "bg-blue-100 text-blue-700", PROCESSING: "bg-purple-100 text-purple-700",
  PAID: "bg-emerald-100 text-emerald-700", FAILED: "bg-red-100 text-red-700", CANCELLED: "bg-gray-100 text-gray-500",
};

export default function PayrollManager({ teachers, currency, currentMonth, currentYear }: { teachers: any[]; currency: string; currentMonth: number; currentYear: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [tab, setTab] = useState<"salaries" | "payroll">("salaries");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [salaryForm, setSalaryForm] = useState<Record<string, any>>({});
  const [adjustForm, setAdjustForm] = useState<{ id: string; amount: number; notes: string } | null>(null);
  const [message, setMessage] = useState("");

  const teachersWithSalary = teachers.filter((t) => t.salary);
  const teachersWithoutSalary = teachers.filter((t) => !t.salary);
  const totalMonthlyBill = teachersWithSalary.reduce((s, t) => s + (t.salary?.baseSalary || 0) + (t.salary?.housingAllowance || 0) + (t.salary?.transportAllowance || 0) + (t.salary?.otherAllowances || 0), 0);

  const initSalaryForm = (stId: string, existing?: any) => {
    setSalaryForm({
      ...salaryForm,
      [stId]: {
        baseSalary: existing?.baseSalary || 0, currency: existing?.currency || currency,
        payFrequency: existing?.payFrequency || "MONTHLY",
        housingAllowance: existing?.housingAllowance || 0, transportAllowance: existing?.transportAllowance || 0,
        otherAllowances: existing?.otherAllowances || 0, taxRate: existing?.taxRate || 0,
        pensionRate: existing?.pensionRate || 0, otherDeductions: existing?.otherDeductions || 0, notes: "",
      },
    });
    setExpanded(stId);
  };

  const handleSaveSalary = async (stId: string) => {
    const form = salaryForm[stId];
    if (!form || form.baseSalary <= 0) { setMessage("Enter a valid salary"); return; }
    setLoading(stId);
    const result = await setTeacherSalary({ schoolTeacherId: stId, ...form });
    if (result.error) setMessage("Error: " + result.error);
    else { setMessage("Salary saved!"); setExpanded(null); router.refresh(); }
    setLoading("");
  };

  const handleGeneratePayroll = async () => {
    setLoading("generate");
    const result = await generatePayroll(currentMonth, currentYear);
    if (result.error) setMessage("Error: " + result.error);
    else setMessage(result.message || "Done!");
    router.refresh();
    setLoading("");
  };

  const handleBatchPay = async () => {
    if (!confirm(`Mark all draft payrolls for ${MONTHS[currentMonth - 1]} ${currentYear} as PAID?`)) return;
    setLoading("batch");
    const result = await batchProcessPayroll(currentMonth, currentYear);
    if (result.error) setMessage("Error: " + result.error);
    else setMessage(result.message || "Done!");
    router.refresh();
    setLoading("");
  };

  const handlePay = async (id: string) => { setLoading(id); await processPayroll(id); router.refresh(); setLoading(""); };
  const handleCancel = async (id: string) => { setLoading(id); await cancelPayroll(id); router.refresh(); setLoading(""); };

  const handleAdjust = async () => {
    if (!adjustForm) return;
    setLoading("adjust");
    await adjustPayroll(adjustForm.id, adjustForm.amount, adjustForm.notes);
    setAdjustForm(null); router.refresh(); setLoading("");
  };

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {message && <div className={`rounded-lg p-3 text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card"><Users className="w-7 h-7 text-brand-500 mb-1" /><div className="text-2xl font-bold">{teachers.length}</div><div className="text-xs text-gray-500">Active Teachers</div></div>
        <div className="stat-card"><DollarSign className="w-7 h-7 text-emerald-500 mb-1" /><div className="text-2xl font-bold">{currency} {fmt(totalMonthlyBill)}</div><div className="text-xs text-gray-500">Monthly Bill (Gross)</div></div>
        <div className="stat-card"><CreditCard className="w-7 h-7 text-purple-500 mb-1" /><div className="text-2xl font-bold">{teachersWithSalary.length}</div><div className="text-xs text-gray-500">Salaries Set</div></div>
        <div className="stat-card"><AlertCircle className="w-7 h-7 text-amber-500 mb-1" /><div className="text-2xl font-bold">{teachersWithoutSalary.length}</div><div className="text-xs text-gray-500">Need Salary</div></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("salaries")} className={`text-xs px-5 py-2.5 rounded-lg font-medium ${tab === "salaries" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          Salaries ({teachers.length})
        </button>
        <button onClick={() => setTab("payroll")} className={`text-xs px-5 py-2.5 rounded-lg font-medium ${tab === "payroll" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          Payroll — {MONTHS[currentMonth - 1]} {currentYear}
        </button>
      </div>

      {/* SALARIES TAB */}
      {tab === "salaries" && (
        <div className="space-y-3">
          {teachersWithoutSalary.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-semibold text-amber-800">{teachersWithoutSalary.length} teacher(s) still need a salary set up:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {teachersWithoutSalary.map((t: any) => (
                  <button key={t.id} onClick={() => initSalaryForm(t.id)}
                    className="text-xs bg-white text-amber-700 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 font-medium">
                    + {t.teacher.user.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {teachers.map((t: any) => (
            <div key={t.id} className="card">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  {t.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-800">{t.teacher.user.name}</h4>
                  <p className="text-xs text-gray-500">{t.teacher.user.email} • {t.teacher.user.countryCode}</p>
                  {t.salary ? (
                    <div className="flex items-center gap-4 mt-1 text-xs">
                      <span className="text-emerald-600 font-bold">{t.salary.currency} {fmt(t.salary.baseSalary)}/mo</span>
                      {(t.salary.housingAllowance + t.salary.transportAllowance + t.salary.otherAllowances) > 0 && (
                        <span className="text-blue-600">+ {fmt(t.salary.housingAllowance + t.salary.transportAllowance + t.salary.otherAllowances)} allowances</span>
                      )}
                      <span className="text-gray-400">{t.salary.payFrequency}</span>
                      {t.teacher.bankAccounts[0] && <span className="text-purple-500 flex items-center gap-0.5"><CreditCard className="w-3 h-3" /> Bank linked</span>}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1 font-medium">⚠ No salary set</p>
                  )}
                </div>
                <button onClick={() => expanded === t.id ? setExpanded(null) : initSalaryForm(t.id, t.salary)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 font-medium">
                  {t.salary ? "Edit" : "+ Set Salary"}
                </button>
              </div>

              {/* Salary form */}
              {expanded === t.id && salaryForm[t.id] && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  <h4 className="text-sm font-semibold">💰 Salary Configuration — {t.teacher.user.name}</h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase">Base Salary *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-gray-400">{salaryForm[t.id].currency}</span>
                        <input type="number" className="input-field pl-14" placeholder="e.g. 150000" value={salaryForm[t.id].baseSalary || ""}
                          onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], baseSalary: parseFloat(e.target.value) || 0 } }))} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase">Currency</label>
                      <select className="input-field" value={salaryForm[t.id].currency}
                        onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], currency: e.target.value } }))}>
                        <option value="NGN">NGN — Nigerian Naira</option><option value="KES">KES — Kenyan Shilling</option>
                        <option value="GHS">GHS — Ghanaian Cedi</option><option value="ZAR">ZAR — South African Rand</option>
                        <option value="USD">USD — US Dollar</option><option value="GBP">GBP — British Pound</option>
                        <option value="EUR">EUR — Euro</option><option value="XOF">XOF — West African CFA</option>
                        <option value="XAF">XAF — Central African CFA</option><option value="TZS">TZS — Tanzanian Shilling</option>
                        <option value="UGX">UGX — Ugandan Shilling</option><option value="RWF">RWF — Rwandan Franc</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-500 uppercase">Pay Frequency</label>
                      <select className="input-field" value={salaryForm[t.id].payFrequency}
                        onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], payFrequency: e.target.value } }))}>
                        <option value="MONTHLY">Monthly</option><option value="BI_WEEKLY">Bi-Weekly</option>
                        <option value="WEEKLY">Weekly</option><option value="PER_SESSION">Per Session</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="text-[10px] font-bold text-blue-800 uppercase mb-2">Allowances</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="text-[10px] text-gray-500">Housing</label>
                        <input type="number" className="input-field" value={salaryForm[t.id].housingAllowance || ""}
                          onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], housingAllowance: parseFloat(e.target.value) || 0 } }))} /></div>
                      <div><label className="text-[10px] text-gray-500">Transport</label>
                        <input type="number" className="input-field" value={salaryForm[t.id].transportAllowance || ""}
                          onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], transportAllowance: parseFloat(e.target.value) || 0 } }))} /></div>
                      <div><label className="text-[10px] text-gray-500">Other</label>
                        <input type="number" className="input-field" value={salaryForm[t.id].otherAllowances || ""}
                          onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], otherAllowances: parseFloat(e.target.value) || 0 } }))} /></div>
                    </div>
                  </div>

                  <div className="p-3 bg-red-50 rounded-lg">
                    <h5 className="text-[10px] font-bold text-red-800 uppercase mb-2">Deductions (%)</h5>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="text-[10px] text-gray-500">Tax Rate %</label>
                        <input type="number" className="input-field" step="0.1" value={salaryForm[t.id].taxRate || ""}
                          onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], taxRate: parseFloat(e.target.value) || 0 } }))} /></div>
                      <div><label className="text-[10px] text-gray-500">Pension %</label>
                        <input type="number" className="input-field" step="0.1" value={salaryForm[t.id].pensionRate || ""}
                          onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], pensionRate: parseFloat(e.target.value) || 0 } }))} /></div>
                      <div><label className="text-[10px] text-gray-500">Other (fixed)</label>
                        <input type="number" className="input-field" value={salaryForm[t.id].otherDeductions || ""}
                          onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], otherDeductions: parseFloat(e.target.value) || 0 } }))} /></div>
                    </div>
                  </div>

                  {/* Live preview */}
                  {salaryForm[t.id].baseSalary > 0 && (() => {
                    const f = salaryForm[t.id];
                    const gross = f.baseSalary + f.housingAllowance + f.transportAllowance + f.otherAllowances;
                    const tax = gross * (f.taxRate / 100);
                    const pension = gross * (f.pensionRate / 100);
                    const net = gross - tax - pension - f.otherDeductions;
                    return (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <h5 className="text-xs font-bold text-emerald-800 mb-2">Monthly Pay Summary</h5>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div><div className="text-sm font-bold text-gray-800">{f.currency} {fmt(gross)}</div><div className="text-[10px] text-gray-500">Gross</div></div>
                          <div><div className="text-sm font-bold text-red-600">- {fmt(tax)}</div><div className="text-[10px] text-gray-500">Tax</div></div>
                          <div><div className="text-sm font-bold text-red-600">- {fmt(pension)}</div><div className="text-[10px] text-gray-500">Pension</div></div>
                          <div><div className="text-lg font-bold text-emerald-700">{f.currency} {fmt(Math.max(0, net))}</div><div className="text-[10px] text-gray-500">Net Pay</div></div>
                        </div>
                      </div>
                    );
                  })()}

                  <textarea className="input-field" rows={2} placeholder="Notes (optional, e.g. reason for change)" value={salaryForm[t.id].notes}
                    onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], notes: e.target.value } }))} />

                  <div className="flex gap-2">
                    <button onClick={() => handleSaveSalary(t.id)} disabled={loading === t.id} className="btn-primary text-sm">
                      {loading === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Salary"}
                    </button>
                    <button onClick={() => setExpanded(null)} className="btn-ghost text-sm">Cancel</button>
                  </div>

                  {/* History */}
                  {t.salary?.history?.length > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Salary History</h5>
                      {t.salary.history.map((h: any) => (
                        <div key={h.id} className="flex items-center gap-3 text-xs text-gray-500 py-1">
                          {h.newAmount > h.previousAmount ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                          <span>{fmt(h.previousAmount)} → {fmt(h.newAmount)}</span>
                          <span className="text-gray-300">•</span>
                          <span>{h.reason}</span>
                          <span className="text-gray-300">•</span>
                          <span>{new Date(h.changedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PAYROLL TAB */}
      {tab === "payroll" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Payroll for {MONTHS[currentMonth - 1]} {currentYear}</p>
            <div className="flex gap-2">
              <button onClick={handleGeneratePayroll} disabled={loading === "generate"} className="btn-primary text-xs">
                {loading === "generate" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />} Generate Payroll
              </button>
              <button onClick={handleBatchPay} disabled={loading === "batch"} className="text-xs px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium">
                {loading === "batch" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Banknote className="w-3 h-3 mr-1" />} Pay All
              </button>
            </div>
          </div>

          {teachers.filter((t: any) => t.payrolls.length > 0).length === 0 ? (
            <div className="card text-center py-12">
              <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No payroll records yet. Set salaries first, then click "Generate Payroll".</p>
            </div>
          ) : (
            teachers.map((t: any) => {
              const currentPayroll = t.payrolls.find((p: any) => p.month === currentMonth && p.year === currentYear);
              if (!currentPayroll) return null;
              return (
                <div key={t.id} className="card">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      {t.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold">{t.teacher.user.name}</h4>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-0.5">
                        <span>Base: {currentPayroll.currency} {fmt(currentPayroll.baseSalary)}</span>
                        <span>Allowances: {fmt(currentPayroll.allowances)}</span>
                        <span className="font-bold text-gray-800">Gross: {fmt(currentPayroll.grossPay)}</span>
                        <span className="text-red-500">Tax: -{fmt(currentPayroll.taxDeduction)}</span>
                        <span className="font-bold text-emerald-600">Net: {currentPayroll.currency} {fmt(currentPayroll.netPay)}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[currentPayroll.status]}`}>{currentPayroll.status}</span>
                    <div className="flex gap-1">
                      {currentPayroll.status === "DRAFT" && (
                        <>
                          <button onClick={() => handlePay(currentPayroll.id)} disabled={loading === currentPayroll.id}
                            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium">
                            {loading === currentPayroll.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 inline mr-0.5" /> Pay</>}
                          </button>
                          <button onClick={() => setAdjustForm({ id: currentPayroll.id, amount: 0, notes: "" })}
                            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium">Adjust</button>
                          <button onClick={() => handleCancel(currentPayroll.id)}
                            className="text-[10px] px-2 py-1.5 text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                        </>
                      )}
                      {currentPayroll.status === "PAID" && currentPayroll.paidAt && (
                        <span className="text-[10px] text-gray-400">Paid {new Date(currentPayroll.paidAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  {currentPayroll.notes && <p className="text-xs text-gray-400 mt-2 italic">{currentPayroll.notes}</p>}
                </div>
              );
            })
          )}

          {/* Adjust modal */}
          {adjustForm && (
            <div className="card bg-blue-50 border-blue-200">
              <h4 className="text-sm font-semibold mb-3">Adjust Payroll</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500">Amount (+ bonus, - deduction)</label>
                  <input type="number" className="input-field" value={adjustForm.amount || ""} onChange={(e) => setAdjustForm({ ...adjustForm, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Reason</label>
                  <input className="input-field" placeholder="e.g. Holiday bonus" value={adjustForm.notes} onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleAdjust} disabled={loading === "adjust"} className="btn-primary text-xs">{loading === "adjust" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}</button>
                <button onClick={() => setAdjustForm(null)} className="btn-ghost text-xs">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
