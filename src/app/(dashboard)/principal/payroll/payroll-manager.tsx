"use client";

import { useState } from "react";
import { setTeacherSalary, generatePayroll, processPayroll, batchProcessPayroll, cancelPayroll, adjustPayroll } from "@/lib/actions/payroll";
import { useRouter } from "next/navigation";
import { Loader2, DollarSign, Users, ChevronDown, ChevronUp, Plus, Check, X, TrendingUp, TrendingDown, CreditCard, Clock, Banknote, AlertCircle, CheckCircle, Calendar, Eye } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_COLORS: Record<string, string> = { DRAFT: "bg-amber-100 text-amber-700", PENDING: "bg-blue-100 text-blue-700", PAID: "bg-emerald-100 text-emerald-700", FAILED: "bg-red-100 text-red-700", CANCELLED: "bg-gray-100 text-gray-500" };

export default function PayrollManager({ teachers, currency, currentMonth, currentYear, sessionReview }: { teachers: any[]; currency: string; currentMonth: number; currentYear: number; sessionReview?: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [tab, setTab] = useState<"overview" | "salaries" | "payroll" | "sessions">("overview");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [salaryForm, setSalaryForm] = useState<Record<string, any>>({});
  const [adjustForm, setAdjustForm] = useState<{ id: string; amount: number; notes: string } | null>(null);
  const [message, setMessage] = useState("");

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const teachersWithSalary = teachers.filter((t) => t.salary);
  const teachersWithoutSalary = teachers.filter((t) => !t.salary);

  // Calculate totals
  const totalEarnedThisMonth = teachers.reduce((s, t) => s + t.sessions.filter((sess: any) => sess.status === "APPROVED").reduce((ss: number, sess: any) => ss + sess.amountEarned, 0), 0);
  const totalFullSalary = teachersWithSalary.reduce((s, t) => {
    const sal = t.salary;
    return s + sal.baseSalary + sal.housingAllowance + sal.transportAllowance + sal.otherAllowances;
  }, 0);
  const totalUnverified = teachers.reduce((s, t) => s + t.sessions.filter((se: any) => se.status === "PENDING_REVIEW").length, 0);

  const initSalaryForm = (stId: string, existing?: any) => {
    setSalaryForm({
      ...salaryForm,
      [stId]: {
        baseSalary: existing?.baseSalary || 0, currency: existing?.currency || currency,
        payFrequency: existing?.payFrequency || "MONTHLY", workingDaysPerMonth: existing?.workingDaysPerMonth || 22,
        housingAllowance: existing?.housingAllowance || 0, transportAllowance: existing?.transportAllowance || 0,
        otherAllowances: existing?.otherAllowances || 0, taxRate: existing?.taxRate || 0,
        pensionRate: existing?.pensionRate || 0, otherDeductions: existing?.otherDeductions || 0, notes: "",
      },
    });
    setExpanded(stId);
  };

  const handleSaveSalary = async (stId: string) => {
    const form = salaryForm[stId]; if (!form || form.baseSalary <= 0) { setMessage("Enter valid salary"); return; }
    setLoading(stId); await setTeacherSalary({ schoolTeacherId: stId, ...form }); setMessage("Saved!"); setExpanded(null); router.refresh(); setLoading("");
  };

  const handleGeneratePayroll = async () => { setLoading("gen"); const r = await generatePayroll(currentMonth, currentYear); setMessage(r.message || r.error || ""); router.refresh(); setLoading(""); };
  const handleBatchPay = async () => { if (!confirm("Pay all?")) return; setLoading("batch"); const r = await batchProcessPayroll(currentMonth, currentYear); setMessage(r.message || ""); router.refresh(); setLoading(""); };
  const handlePay = async (id: string) => { setLoading(id); await processPayroll(id); router.refresh(); setLoading(""); };
  const handleCancel = async (id: string) => { setLoading(id); await cancelPayroll(id); router.refresh(); setLoading(""); };
  const handleAdjust = async () => { if (!adjustForm) return; setLoading("adj"); await adjustPayroll(adjustForm.id, adjustForm.amount, adjustForm.notes); setAdjustForm(null); router.refresh(); setLoading(""); };

  return (
    <div className="space-y-6">
      {message && <div className={`rounded-lg p-3 text-sm flex items-center justify-between ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}><span>{message}</span><button onClick={() => setMessage("")} className="opacity-60">✕</button></div>}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "salaries", label: `💰 Salaries (${teachers.length})` },
          { key: "sessions", label: `📝 Sessions (${totalUnverified} pending)` },
          { key: "payroll", label: `💳 Payroll — ${MONTHS[currentMonth - 1]}` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`text-xs px-5 py-2.5 rounded-lg font-medium ${tab === t.key ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}>{t.label}</button>
        ))}
      </div>

      {/* ===================== OVERVIEW ===================== */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card"><Users className="w-7 h-7 text-brand-500 mb-1" /><div className="text-2xl font-bold">{teachers.length}</div><div className="text-xs text-gray-500">Teachers</div></div>
            <div className="stat-card"><DollarSign className="w-7 h-7 text-emerald-500 mb-1" /><div className="text-2xl font-bold">{currency} {fmt(Math.round(totalEarnedThisMonth))}</div><div className="text-xs text-gray-500">Earned This Month</div></div>
            <div className="stat-card"><Banknote className="w-7 h-7 text-purple-500 mb-1" /><div className="text-2xl font-bold">{currency} {fmt(totalFullSalary)}</div><div className="text-xs text-gray-500">Full Monthly Cost</div></div>
            <div className="stat-card"><AlertCircle className="w-7 h-7 text-amber-500 mb-1" /><div className="text-2xl font-bold">{totalUnverified}</div><div className="text-xs text-gray-500">Unverified Sessions</div></div>
          </div>

          {/* Per teacher earnings */}
          <div className="card">
            <h3 className="section-title mb-3">{MONTHS[currentMonth - 1]} Earnings by Teacher</h3>
            <div className="space-y-3">
              {teachers.map((t: any) => {
                const earned = t.sessions.reduce((s: number, se: any) => s + se.amountEarned, 0);
                const days = t.sessions.length;
                const full = t.salary ? t.salary.baseSalary + t.salary.housingAllowance + t.salary.transportAllowance + t.salary.otherAllowances : 0;
                const pct = full > 0 ? Math.round((earned / full) * 100) : 0;
                return (
                  <div key={t.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">{t.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium">{t.teacher.user.name}</h4>
                        <span className="text-xs font-bold text-emerald-600">{t.salary?.currency || currency} {fmt(Math.round(earned))}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`rounded-full h-2 transition-all ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                        <span>{days} days • {pct}% earned</span>
                        <span>Full: {fmt(full)}</span>
                      </div>
                    </div>
                    {!t.salary && <span className="text-[10px] text-amber-600 font-medium">No salary set</span>}
                    {t.teacher.bankAccounts[0] && <CreditCard className="w-4 h-4 text-purple-400" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== SALARIES ===================== */}
      {tab === "salaries" && (
        <div className="space-y-3">
          {teachersWithoutSalary.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-semibold text-amber-800">{teachersWithoutSalary.length} teacher(s) need salary:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {teachersWithoutSalary.map((t: any) => (
                  <button key={t.id} onClick={() => initSalaryForm(t.id)} className="text-xs bg-white text-amber-700 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 font-medium">+ {t.teacher.user.name}</button>
                ))}
              </div>
            </div>
          )}

          {teachers.map((t: any) => (
            <div key={t.id} className="card">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">{t.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold">{t.teacher.user.name}</h4>
                  <p className="text-xs text-gray-500">{t.teacher.user.email} • {t.teacher.user.countryCode}</p>
                  {t.salary ? (
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-emerald-600 font-bold">{t.salary.currency} {fmt(t.salary.baseSalary)}/mo</span>
                      <span className="text-gray-400">Daily: {fmt(Math.round((t.salary.baseSalary + t.salary.housingAllowance + t.salary.transportAllowance + t.salary.otherAllowances) / t.salary.workingDaysPerMonth))}</span>
                      <span className="text-gray-400">{t.salary.workingDaysPerMonth} days/mo</span>
                    </div>
                  ) : <p className="text-xs text-amber-600 mt-1 font-medium">⚠ No salary</p>}
                </div>
                <button onClick={() => expanded === t.id ? setExpanded(null) : initSalaryForm(t.id, t.salary)} className="text-xs px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 font-medium">{t.salary ? "Edit" : "+ Set"}</button>
              </div>

              {expanded === t.id && salaryForm[t.id] && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div><label className="text-[10px] font-medium text-gray-500 uppercase">Base Salary *</label><input type="number" className="input-field" value={salaryForm[t.id].baseSalary || ""} onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], baseSalary: parseFloat(e.target.value) || 0 } }))} /></div>
                    <div><label className="text-[10px] font-medium text-gray-500 uppercase">Currency</label>
                      <select className="input-field" value={salaryForm[t.id].currency} onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], currency: e.target.value } }))}>
                        {["NGN", "KES", "GHS", "ZAR", "TZS", "UGX", "XOF", "XAF", "ETB", "EGP", "RWF", "USD", "GBP", "EUR", "INR"].map((c) => <option key={c} value={c}>{c}</option>)}
                      </select></div>
                    <div><label className="text-[10px] font-medium text-gray-500 uppercase">Frequency</label>
                      <select className="input-field" value={salaryForm[t.id].payFrequency} onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], payFrequency: e.target.value } }))}>
                        <option value="MONTHLY">Monthly</option><option value="BI_WEEKLY">Bi-Weekly</option><option value="WEEKLY">Weekly</option>
                      </select></div>
                    <div><label className="text-[10px] font-medium text-gray-500 uppercase">Working Days/Mo</label>
                      <input type="number" className="input-field" min={1} max={31} value={salaryForm[t.id].workingDaysPerMonth} onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], workingDaysPerMonth: parseInt(e.target.value) || 22 } }))} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-[10px] text-gray-500">Housing Allow.</label><input type="number" className="input-field" value={salaryForm[t.id].housingAllowance || ""} onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], housingAllowance: parseFloat(e.target.value) || 0 } }))} /></div>
                    <div><label className="text-[10px] text-gray-500">Transport Allow.</label><input type="number" className="input-field" value={salaryForm[t.id].transportAllowance || ""} onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], transportAllowance: parseFloat(e.target.value) || 0 } }))} /></div>
                    <div><label className="text-[10px] text-gray-500">Tax %</label><input type="number" className="input-field" step="0.1" value={salaryForm[t.id].taxRate || ""} onChange={(e) => setSalaryForm((p: any) => ({ ...p, [t.id]: { ...p[t.id], taxRate: parseFloat(e.target.value) || 0 } }))} /></div>
                  </div>
                  {salaryForm[t.id].baseSalary > 0 && (() => {
                    const f = salaryForm[t.id]; const gross = f.baseSalary + f.housingAllowance + f.transportAllowance + f.otherAllowances; const daily = gross / f.workingDaysPerMonth;
                    return <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg grid grid-cols-3 text-center gap-2">
                      <div><div className="text-sm font-bold">{f.currency} {fmt(gross)}</div><div className="text-[10px] text-gray-500">Full Monthly</div></div>
                      <div><div className="text-sm font-bold text-brand-600">{f.currency} {fmt(Math.round(daily))}</div><div className="text-[10px] text-gray-500">Daily Rate</div></div>
                      <div><div className="text-sm font-bold">{f.workingDaysPerMonth} days</div><div className="text-[10px] text-gray-500">Working Days</div></div>
                    </div>;
                  })()}
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveSalary(t.id)} disabled={loading === t.id} className="btn-primary text-sm">{loading === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}</button>
                    <button onClick={() => setExpanded(null)} className="btn-ghost text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===================== SESSIONS ===================== */}
      {tab === "sessions" && (
        <div>
          {sessionReview || <p className="text-sm text-gray-500 p-8 text-center">No session tracking available.</p>}
        </div>
      )}

      {/* ===================== PAYROLL ===================== */}
      {tab === "payroll" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Payroll for {MONTHS[currentMonth - 1]} {currentYear} — based on approved sessions</p>
            <div className="flex gap-2">
              <button onClick={handleGeneratePayroll} disabled={loading === "gen"} className="btn-primary text-xs">{loading === "gen" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />} Generate</button>
              <button onClick={handleBatchPay} disabled={loading === "batch"} className="text-xs px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium">{loading === "batch" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Banknote className="w-3 h-3 mr-1" />} Pay All</button>
            </div>
          </div>

          {teachers.map((t: any) => {
            const cp = t.payrolls.find((p: any) => p.month === currentMonth && p.year === currentYear);
            if (!cp) return null;
            return (
              <div key={t.id} className="card">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">{t.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">{t.teacher.user.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Earned: {cp.currency} {fmt(cp.grossPay)}</span>
                      <span className="text-red-500">Tax: -{fmt(cp.taxDeduction)}</span>
                      <span className="font-bold text-emerald-600">Net: {cp.currency} {fmt(cp.netPay)}</span>
                    </div>
                    {cp.notes && <p className="text-[10px] text-gray-400">{cp.notes}</p>}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[cp.status]}`}>{cp.status}</span>
                  {cp.status === "DRAFT" && (
                    <div className="flex gap-1">
                      <button onClick={() => handlePay(cp.id)} disabled={loading === cp.id} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium">{loading === cp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Pay"}</button>
                      <button onClick={() => setAdjustForm({ id: cp.id, amount: 0, notes: "" })} className="text-[10px] px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg">Adjust</button>
                      <button onClick={() => handleCancel(cp.id)} className="text-red-400 text-[10px] px-1.5"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                  {cp.status === "PAID" && <span className="text-[10px] text-gray-400">Paid {cp.paidAt && new Date(cp.paidAt).toLocaleDateString()}</span>}
                </div>
              </div>
            );
          })}

          {adjustForm && (
            <div className="card bg-blue-50 border-blue-200">
              <h4 className="text-sm font-semibold mb-3">Adjust (+ bonus / - deduction)</h4>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="input-field" placeholder="Amount" value={adjustForm.amount || ""} onChange={(e) => setAdjustForm({ ...adjustForm, amount: parseFloat(e.target.value) || 0 })} />
                <input className="input-field" placeholder="Reason" value={adjustForm.notes} onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={handleAdjust} disabled={loading === "adj"} className="btn-primary text-xs">{loading === "adj" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}</button>
                <button onClick={() => setAdjustForm(null)} className="btn-ghost text-xs">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
