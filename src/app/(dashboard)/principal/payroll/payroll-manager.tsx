"use client";

import { useState } from "react";
import { setTeacherSalary, generatePayroll, processPayroll, batchProcessPayroll, cancelPayroll, adjustPayroll, verifySession, bulkVerifySessions, rejectSession } from "@/lib/actions/payroll";
import { useRouter } from "next/navigation";
import { Loader2, DollarSign, Users, ChevronDown, ChevronUp, Plus, Check, X, TrendingUp, TrendingDown, CreditCard, Clock, Banknote, AlertCircle, CheckCircle, Calendar, Eye, Upload, Building2 } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_COLORS: Record<string, string> = { DRAFT: "bg-amber-100 text-amber-700", PENDING: "bg-blue-100 text-blue-700", PAID: "bg-emerald-100 text-emerald-700", FAILED: "bg-red-100 text-red-700", CANCELLED: "bg-gray-100 text-gray-500" };

export default function PayrollManager({ teachers, currency, currentMonth, currentYear }: { teachers: any[]; currency: string; currentMonth: number; currentYear: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [tab, setTab] = useState<"overview" | "salaries" | "payroll" | "sessions">("overview");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [salaryForm, setSalaryForm] = useState<Record<string, any>>({});
  const [adjustForm, setAdjustForm] = useState<{ id: string; amount: number; notes: string } | null>(null);
  const [rejectForm, setRejectForm] = useState<{ id: string; reason: string } | null>(null);
  const [message, setMessage] = useState("");
  const [payModal, setPayModal] = useState<{ id: string; teacher: any; payroll: any } | null>(null);
  const [payRef, setPayRef] = useState("");
  const [payProof, setPayProof] = useState("");
  const [uploading, setUploading] = useState(false);
  const [viewBank, setViewBank] = useState<string | null>(null);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const teachersWithSalary = teachers.filter((t) => t.salary);
  const teachersWithoutSalary = teachers.filter((t) => !t.salary);

  // Calculate totals
  const totalEarnedThisMonth = teachers.reduce((s, t) => s + t.sessions.reduce((ss: number, sess: any) => ss + sess.amountEarned, 0), 0);
  const totalFullSalary = teachersWithSalary.reduce((s, t) => {
    const sal = t.salary;
    return s + sal.baseSalary + sal.housingAllowance + sal.transportAllowance + sal.otherAllowances;
  }, 0);
  const totalUnverified = teachers.reduce((s, t) => s + t.sessions.filter((se: any) => !se.verified).length, 0);

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
  const handlePay = async (id: string) => {
    setLoading(id);
    await processPayroll(id, payRef || undefined, payProof || undefined);
    setPayModal(null); setPayRef(""); setPayProof("");
    router.refresh(); setLoading("");
  };
  const handleCancel = async (id: string) => { setLoading(id); await cancelPayroll(id); router.refresh(); setLoading(""); };
  const handleAdjust = async () => { if (!adjustForm) return; setLoading("adj"); await adjustPayroll(adjustForm.id, adjustForm.amount, adjustForm.notes); setAdjustForm(null); router.refresh(); setLoading(""); };
  const handleVerify = async (id: string) => { setLoading(id); await verifySession(id); router.refresh(); setLoading(""); };
  const handleBulkVerify = async (ids: string[]) => { setLoading("bulkv"); await bulkVerifySessions(ids); router.refresh(); setLoading(""); };
  const handleReject = async () => { if (!rejectForm) return; setLoading("rej"); await rejectSession(rejectForm.id, rejectForm.reason); setRejectForm(null); router.refresh(); setLoading(""); };

  return (
    <div className="space-y-6">
      {message && <div className={`rounded-lg p-3 text-sm flex items-center justify-between ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}><span>{message}</span><button onClick={() => setMessage("")} className="opacity-60">✕</button></div>}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "salaries", label: `💰 Salaries (${teachers.length})` },
          { key: "sessions", label: `📝 Sessions (${totalUnverified} unverified)` },
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
                    {t.teacher.bankAccounts[0] ? (
                      <button onClick={(e) => { e.stopPropagation(); setViewBank(viewBank === t.id ? null : t.id); }}
                        className="flex items-center gap-1 text-[10px] text-purple-600 hover:text-purple-800 px-2 py-1 rounded-lg hover:bg-purple-50">
                        <Building2 className="w-3 h-3" /> Bank
                      </button>
                    ) : (
                      <span className="text-[10px] text-red-400">No bank</span>
                    )}
                  </div>
                  {viewBank === t.id && t.teacher.bankAccounts[0] && (() => {
                    const b = t.teacher.bankAccounts[0];
                    return (
                      <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs space-y-1">
                        <p className="font-bold text-purple-800">💳 Bank Details ({b.label})</p>
                        {b.bankName && <p className="text-gray-700">Bank: <span className="font-medium">{b.bankName}</span></p>}
                        {b.accountName && <p className="text-gray-700">Name: <span className="font-medium">{b.accountName}</span></p>}
                        {b.accountNumber && <p className="text-gray-700">Account: <span className="font-medium">{b.accountNumber}</span></p>}
                        {b.routingNumber && <p className="text-gray-700">Routing: <span className="font-medium">{b.routingNumber}</span></p>}
                        {b.mobileNumber && <p className="text-gray-700">Mobile: <span className="font-medium">{b.mobileProvider} {b.mobileNumber}</span></p>}
                        {b.paypalEmail && <p className="text-gray-700">PayPal: <span className="font-medium">{b.paypalEmail}</span></p>}
                        {b.cryptoAddress && <p className="text-gray-700">Crypto: <span className="font-medium">{b.cryptoNetwork} - {b.cryptoAddress}</span></p>}
                        <p className="text-gray-500">Currency: {b.currency} • {b.isVerified ? "✅ Verified" : "⏳ Unverified"}</p>
                      </div>
                    );
                  })()}
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
        <div className="space-y-4">
          {totalUnverified > 0 && (
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
              <span className="text-xs text-amber-700 font-medium">{totalUnverified} unverified session(s)</span>
              <button onClick={() => {
                const ids = teachers.flatMap((t: any) => t.sessions.filter((s: any) => !s.verified).map((s: any) => s.id));
                handleBulkVerify(ids);
              }} disabled={loading === "bulkv"} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium">
                {loading === "bulkv" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 inline mr-1" /> Verify All</>}
              </button>
            </div>
          )}

          {teachers.map((t: any) => {
            if (t.sessions.length === 0) return null;
            return (
              <div key={t.id} className="card">
                <h4 className="text-sm font-semibold mb-3">{t.teacher.user.name} — {t.sessions.length} session(s)</h4>
                <div className="space-y-2">
                  {t.sessions.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${s.verified ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                        {s.verified ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{s.topic || "Teaching session"}</p>
                        <p className="text-[10px] text-gray-500">{new Date(s.date).toLocaleDateString()} • {s.hoursWorked}h {s.verified ? `• Verified by ${s.verifiedBy}` : ""}</p>
                        {s.notes?.startsWith("REJECTED") && <p className="text-[10px] text-red-500">{s.notes}</p>}
                      </div>
                      <span className="text-sm font-bold text-emerald-600">{s.currency} {fmt(s.amountEarned)}</span>
                      {!s.verified && (
                        <div className="flex gap-1">
                          <button onClick={() => handleVerify(s.id)} disabled={loading === s.id} className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"><Check className="w-3 h-3" /></button>
                          <button onClick={() => setRejectForm({ id: s.id, reason: "" })} className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100"><X className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {rejectForm && (
            <div className="card bg-red-50 border-red-200">
              <h4 className="text-sm font-semibold text-red-800 mb-2">Reject Session</h4>
              <input className="input-field" placeholder="Reason for rejection" value={rejectForm.reason} onChange={(e) => setRejectForm({ ...rejectForm, reason: e.target.value })} />
              <div className="flex gap-2 mt-2">
                <button onClick={handleReject} disabled={loading === "rej" || !rejectForm.reason} className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white">{loading === "rej" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reject"}</button>
                <button onClick={() => setRejectForm(null)} className="btn-ghost text-xs">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== PAYROLL ===================== */}
      {tab === "payroll" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Payroll for {MONTHS[currentMonth - 1]} {currentYear} — based on earned sessions</p>
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
                      <button onClick={() => setPayModal({ id: cp.id, teacher: t, payroll: cp })} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium">Pay</button>
                      <button onClick={() => setAdjustForm({ id: cp.id, amount: 0, notes: "" })} className="text-[10px] px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg">Adjust</button>
                      <button onClick={() => handleCancel(cp.id)} className="text-red-400 text-[10px] px-1.5"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                  {cp.status === "PAID" && (
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">Paid {cp.paidAt && new Date(cp.paidAt).toLocaleDateString()}</span>
                      {cp.transactionRef && <span className="text-[9px] text-gray-400 block">Ref: {cp.transactionRef}</span>}
                      {cp.paymentProof && <a href={cp.paymentProof} target="_blank" className="text-[9px] text-blue-500 underline">View Proof</a>}
                    </div>
                  )}
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
      {/* PAYMENT MODAL */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPayModal(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b bg-emerald-50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-800">💰 Process Payment</h3>
                <button onClick={() => setPayModal(null)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <p className="text-xs text-emerald-600 mt-1">{payModal.teacher.teacher.user.name}</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl space-y-1">
                <div className="flex justify-between text-xs"><span className="text-gray-500">Gross Pay</span><span className="font-medium">{payModal.payroll.currency} {fmt(payModal.payroll.grossPay)}</span></div>
                {payModal.payroll.taxDeduction > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Tax</span><span className="text-red-500">-{fmt(payModal.payroll.taxDeduction)}</span></div>}
                <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1"><span>Net Pay</span><span className="text-emerald-600">{payModal.payroll.currency} {fmt(payModal.payroll.netPay)}</span></div>
              </div>

              {payModal.teacher.teacher.bankAccounts?.[0] ? (() => {
                const b = payModal.teacher.teacher.bankAccounts[0];
                return (
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <p className="text-xs font-bold text-purple-800 mb-2">💳 Pay to ({b.label})</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {b.bankName && <div><span className="text-gray-500">Bank:</span> <span className="font-medium">{b.bankName}</span></div>}
                      {b.accountName && <div><span className="text-gray-500">Name:</span> <span className="font-medium">{b.accountName}</span></div>}
                      {b.accountNumber && <div><span className="text-gray-500">Account:</span> <span className="font-bold text-purple-700">{b.accountNumber}</span></div>}
                      {b.routingNumber && <div><span className="text-gray-500">Routing:</span> <span className="font-medium">{b.routingNumber}</span></div>}
                      {b.mobileNumber && <div><span className="text-gray-500">Mobile:</span> <span className="font-medium">{b.mobileProvider} {b.mobileNumber}</span></div>}
                      {b.paypalEmail && <div><span className="text-gray-500">PayPal:</span> <span className="font-medium">{b.paypalEmail}</span></div>}
                      {b.cryptoAddress && <div className="col-span-2"><span className="text-gray-500">Crypto:</span> <span className="font-medium">{b.cryptoNetwork}: {b.cryptoAddress}</span></div>}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{b.currency} • {b.isVerified ? "✅ Verified" : "⏳ Unverified"}</p>
                  </div>
                );
              })() : (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200"><p className="text-xs text-red-700">⚠️ Teacher has not submitted bank details yet</p></div>
              )}

              <div><label className="label">Transaction Reference</label><input className="input-field" placeholder="e.g. TXN-12345" value={payRef} onChange={e => setPayRef(e.target.value)} /></div>

              <div>
                <label className="label">Payment Proof (receipt/screenshot)</label>
                <input className="input-field text-xs" type="file" accept="image/*,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    if (file.size > 5*1024*1024) { alert("Max 5MB"); return; }
                    setUploading(true);
                    const reader = new FileReader();
                    reader.onloadend = () => { setPayProof(reader.result as string); setUploading(false); };
                    reader.readAsDataURL(file);
                  }} />
                {uploading && <Loader2 className="w-4 h-4 animate-spin text-gray-400 mt-1" />}
                {payProof && <p className="text-[10px] text-emerald-600 mt-1">✓ Proof attached</p>}
              </div>

              <div className="flex gap-2">
                <button onClick={() => handlePay(payModal.id)} disabled={!!loading} className="btn-primary flex-1 text-sm py-2.5">
                  {loading === payModal.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><CheckCircle className="w-4 h-4 mr-1" /> Mark as Paid</>}
                </button>
                <button onClick={() => setPayModal(null)} className="btn-ghost px-4">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
