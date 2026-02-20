"use client";

import { useState } from "react";
import { setTeacherSalary, generatePayroll, processPayroll, batchProcessPayroll, cancelPayroll, adjustPayroll, verifySession, bulkVerifySessions, rejectSession } from "@/lib/actions/payroll";
import { useRouter } from "next/navigation";
import { Loader2, DollarSign, Users, ChevronDown, ChevronUp, Plus, Check, X, TrendingUp, CreditCard, Clock, Banknote, AlertCircle, CheckCircle, Calendar, Eye, Upload, Building2, Zap, BarChart3 } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_COLORS: Record<string, string> = { DRAFT: "bg-amber-100 text-amber-700", PENDING: "bg-blue-100 text-blue-700", PAID: "bg-emerald-100 text-emerald-700", FAILED: "bg-red-100 text-red-700", CANCELLED: "bg-gray-100 text-gray-500" };
const FREQ_LABELS: Record<string, string> = { MONTHLY: "Monthly", BI_WEEKLY: "Bi-Weekly", WEEKLY: "Weekly" };

interface Props {
  teachers: any[]; creditsByTeacher: Record<string, any[]>; weeklyCreditsByTeacher: Record<string, any[]>;
  currency: string; currentMonth: number; currentYear: number; school: any;
}

export default function PayrollManager({ teachers, creditsByTeacher, weeklyCreditsByTeacher, currency, currentMonth, currentYear, school }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [tab, setTab] = useState<"overview" | "salaries" | "sessions" | "payroll">("overview");
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
  const [viewPeriod, setViewPeriod] = useState<"month" | "week">("month");

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtDec = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const teachersWithSalary = teachers.filter(t => t.salary);
  const teachersWithoutSalary = teachers.filter(t => !t.salary);

  // Calculate totals including session credits
  const getTeacherEarnings = (t: any) => {
    const manualEarned = t.sessions.reduce((s: number, se: any) => s + se.amountEarned, 0);
    const credits = creditsByTeacher[t.teacherId] || [];
    const liveEarned = credits.reduce((s: number, c: any) => s + c.creditAmount, 0);
    const weeklyCredits = weeklyCreditsByTeacher[t.teacherId] || [];
    const weeklyEarned = weeklyCredits.reduce((s: number, c: any) => s + c.creditAmount, 0);
    const full = t.salary ? t.salary.baseSalary + t.salary.housingAllowance + t.salary.transportAllowance + t.salary.otherAllowances : 0;
    return { manualEarned, liveEarned, total: manualEarned + liveEarned, weeklyEarned, full, sessions: credits.length, freq: t.salary?.payFrequency || "MONTHLY" };
  };

  const totalMonthEarned = teachers.reduce((s, t) => s + getTeacherEarnings(t).total, 0);
  const totalWeekEarned = teachers.reduce((s, t) => s + getTeacherEarnings(t).weeklyEarned, 0);
  const totalFullSalary = teachersWithSalary.reduce((s, t) => s + (t.salary.baseSalary + t.salary.housingAllowance + t.salary.transportAllowance + t.salary.otherAllowances), 0);
  const totalSessions = Object.values(creditsByTeacher).reduce((s, arr) => s + (arr as any[]).length, 0);
  const totalUnverified = teachers.reduce((s, t) => s + t.sessions.filter((se: any) => !se.verified).length, 0);

  const initSalaryForm = (stId: string, existing?: any) => {
    setSalaryForm({ ...salaryForm, [stId]: {
      baseSalary: existing?.baseSalary || 0, currency: existing?.currency || currency,
      payFrequency: existing?.payFrequency || "MONTHLY", workingDaysPerMonth: existing?.workingDaysPerMonth || 22,
      housingAllowance: existing?.housingAllowance || 0, transportAllowance: existing?.transportAllowance || 0,
      otherAllowances: existing?.otherAllowances || 0, taxRate: existing?.taxRate || 0,
      pensionRate: existing?.pensionRate || 0, otherDeductions: existing?.otherDeductions || 0, notes: "",
    }});
    setExpanded(stId);
  };

  const handleSaveSalary = async (stId: string) => {
    const form = salaryForm[stId]; if (!form || form.baseSalary <= 0) { setMessage("Enter valid salary"); return; }
    setLoading(stId); await setTeacherSalary({ schoolTeacherId: stId, ...form }); setMessage("✅ Salary saved!"); setExpanded(null); router.refresh(); setLoading("");
  };
  const handleGeneratePayroll = async () => { setLoading("gen"); const r = await generatePayroll(currentMonth, currentYear); setMessage(r.message || r.error || ""); router.refresh(); setLoading(""); };
  const handleBatchPay = async () => { if (!confirm("Mark ALL draft payrolls as paid?")) return; setLoading("batch"); const r = await batchProcessPayroll(currentMonth, currentYear); setMessage(r.message || ""); router.refresh(); setLoading(""); };
  const handlePay = async (id: string) => { setLoading(id); await processPayroll(id, payRef || undefined, payProof || undefined); setPayModal(null); setPayRef(""); setPayProof(""); router.refresh(); setLoading(""); };
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
          { key: "overview", label: "📊 Overview", count: "" },
          { key: "salaries", label: "💰 Salaries", count: `${teachers.length}` },
          { key: "sessions", label: "⚡ Live Sessions", count: `${totalSessions}` },
          { key: "payroll", label: `💳 Payroll`, count: MONTHS[currentMonth - 1] },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`text-xs px-5 py-2.5 rounded-xl font-medium transition ${tab === t.key ? "bg-brand-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label} {t.count && <span className="ml-1 opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* ===================== OVERVIEW ===================== */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Period toggle */}
          <div className="flex gap-2">
            <button onClick={() => setViewPeriod("month")} className={`text-xs px-4 py-2 rounded-lg font-medium ${viewPeriod === "month" ? "bg-brand-100 text-brand-700" : "bg-gray-50 text-gray-500"}`}>📅 This Month</button>
            <button onClick={() => setViewPeriod("week")} className={`text-xs px-4 py-2 rounded-lg font-medium ${viewPeriod === "week" ? "bg-brand-100 text-brand-700" : "bg-gray-50 text-gray-500"}`}>📆 This Week</button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="stat-card"><Users className="w-6 h-6 text-brand-500 mb-1" /><div className="text-xl font-bold">{teachers.length}</div><div className="text-[10px] text-gray-500">Teachers</div></div>
            <div className="stat-card"><Zap className="w-6 h-6 text-emerald-500 mb-1" /><div className="text-xl font-bold">{totalSessions}</div><div className="text-[10px] text-gray-500">Live Sessions (Month)</div></div>
            <div className="stat-card"><DollarSign className="w-6 h-6 text-emerald-500 mb-1" /><div className="text-xl font-bold">{currency} {fmt(viewPeriod === "week" ? totalWeekEarned : totalMonthEarned)}</div><div className="text-[10px] text-gray-500">Earned ({viewPeriod === "week" ? "This Week" : "This Month"})</div></div>
            <div className="stat-card"><Banknote className="w-6 h-6 text-purple-500 mb-1" /><div className="text-xl font-bold">{currency} {fmt(totalFullSalary)}</div><div className="text-[10px] text-gray-500">Full Monthly Budget</div></div>
            <div className="stat-card"><AlertCircle className="w-6 h-6 text-amber-500 mb-1" /><div className="text-xl font-bold">{teachersWithoutSalary.length}</div><div className="text-[10px] text-gray-500">Need Salary Setup</div></div>
          </div>

          {/* Per teacher earnings */}
          <div className="card">
            <h3 className="text-sm font-bold mb-4">
              {viewPeriod === "week" ? "📆 This Week" : `📅 ${MONTHS[currentMonth - 1]}`} — Earnings by Teacher
            </h3>
            <div className="space-y-3">
              {teachers.map((t: any) => {
                const e = getTeacherEarnings(t);
                const shown = viewPeriod === "week" ? e.weeklyEarned : e.total;
                const pct = e.full > 0 ? Math.round((e.total / e.full) * 100) : 0;
                const credits = viewPeriod === "week" ? (weeklyCreditsByTeacher[t.teacherId] || []) : (creditsByTeacher[t.teacherId] || []);
                return (
                  <div key={t.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 p-3 hover:bg-gray-50/50 cursor-pointer" onClick={() => setViewBank(viewBank === t.id ? null : t.id)}>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-emerald-100 text-brand-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {t.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <h4 className="text-sm font-semibold">{t.teacher.user.name}</h4>
                            <p className="text-[9px] text-gray-400">
                              {t.teacher.classes?.length || 0} subjects · Pay: {FREQ_LABELS[e.freq] || "Monthly"}
                              {e.freq === "WEEKLY" && <span className="text-blue-500 font-medium"> (Weekly)</span>}
                              {e.freq === "BI_WEEKLY" && <span className="text-purple-500 font-medium"> (Bi-Weekly)</span>}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-emerald-600">{t.salary?.currency || currency} {fmtDec(shown)}</span>
                            {e.liveEarned > 0 && viewPeriod === "month" && (
                              <p className="text-[9px] text-gray-400">Live: {fmtDec(e.liveEarned)} · Manual: {fmtDec(e.manualEarned)}</p>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className={`rounded-full h-2 transition-all ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : pct > 0 ? "bg-blue-400" : "bg-gray-200"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                          <span>{credits.length} sessions · {pct}% of monthly</span>
                          <span>{!t.salary ? "⚠️ No salary set" : `Full: ${fmt(e.full)}`}</span>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-300 transition ${viewBank === t.id ? "rotate-180" : ""}`} />
                    </div>

                    {/* Expanded: session details + bank */}
                    {viewBank === t.id && (
                      <div className="border-t border-gray-100 p-3 bg-gray-50/50 space-y-3">
                        {/* Session credits list */}
                        {credits.length > 0 && (
                          <div>
                            <p className="text-[10px] font-medium text-gray-500 mb-1.5">⚡ Live Session Credits:</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {credits.slice(0, 10).map((c: any) => (
                                <div key={c.id} className="flex items-center gap-2 text-[10px] py-1 px-2 bg-white rounded-lg">
                                  <span className="text-emerald-500">●</span>
                                  <span className="flex-1">{c.liveSession?.class?.name || "Class"} — {c.liveSession?.topic || "Session"}</span>
                                  <span className="text-gray-400">{c.durationMin}min</span>
                                  {c.liveSession?.lateMinutes > 0 && <span className="text-amber-500 text-[9px]">({c.liveSession.lateMinutes}m late)</span>}
                                  <span className="font-bold text-emerald-600">{c.currency} {fmtDec(c.creditAmount)}</span>
                                </div>
                              ))}
                              {credits.length > 10 && <p className="text-[9px] text-gray-400 text-center">+{credits.length - 10} more</p>}
                            </div>
                          </div>
                        )}

                        {/* Bank details */}
                        {t.teacher.bankAccounts[0] ? (() => {
                          const b = t.teacher.bankAccounts[0];
                          return (
                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs">
                              <p className="font-bold text-purple-800 mb-1.5">💳 Bank Details</p>
                              <div className="grid grid-cols-2 gap-1 text-gray-700">
                                {b.bankName && <p>Bank: <span className="font-medium">{b.bankName}</span></p>}
                                {b.accountName && <p>Name: <span className="font-medium">{b.accountName}</span></p>}
                                {b.accountNumber && <p>Account: <span className="font-bold text-purple-700">{b.accountNumber}</span></p>}
                                {b.routingNumber && <p>Routing: <span className="font-medium">{b.routingNumber}</span></p>}
                                {b.mobileNumber && <p>Mobile: <span className="font-medium">{b.mobileProvider} {b.mobileNumber}</span></p>}
                                {b.paypalEmail && <p>PayPal: <span className="font-medium">{b.paypalEmail}</span></p>}
                                {b.cryptoAddress && <p className="col-span-2">Crypto: <span className="font-medium">{b.cryptoNetwork}: {b.cryptoAddress}</span></p>}
                              </div>
                            </div>
                          );
                        })() : <p className="text-[10px] text-red-400">⚠️ No bank details submitted</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================== SALARIES ===================== */}
      {tab === "salaries" && (
        <div className="space-y-4">
          {teachersWithoutSalary.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-semibold text-amber-800">{teachersWithoutSalary.length} teacher(s) need salary setup:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {teachersWithoutSalary.map((t: any) => (
                  <button key={t.id} onClick={() => initSalaryForm(t.id)} className="text-xs bg-white text-amber-700 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 font-medium">+ {t.teacher.user.name}</button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[10px] text-blue-700">
            💡 <strong>Pay Frequency:</strong> Set each teacher to <strong>Monthly</strong>, <strong>Bi-Weekly</strong>, or <strong>Weekly</strong> pay. Weekly teachers earn per-session credits that accumulate. The payroll generator uses the frequency you set here.
          </div>

          {teachers.map((t: any) => {
            const e = getTeacherEarnings(t);
            return (
              <div key={t.id} className="card">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-100 to-emerald-100 text-brand-600 flex items-center justify-center font-bold text-sm shrink-0">{t.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">{t.teacher.user.name}</h4>
                    <p className="text-[10px] text-gray-500">{t.teacher.user.email} · {t.teacher.classes?.length || 0} subjects</p>
                    {t.salary ? (
                      <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                        <span className="text-emerald-600 font-bold">{t.salary.currency} {fmt(t.salary.baseSalary)}/{FREQ_LABELS[t.salary.payFrequency]?.toLowerCase() || "mo"}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${t.salary.payFrequency === "WEEKLY" ? "bg-blue-100 text-blue-700" : t.salary.payFrequency === "BI_WEEKLY" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>{FREQ_LABELS[t.salary.payFrequency] || "Monthly"}</span>
                        <span className="text-gray-400">Per session: ~{fmtDec(e.full / (t.salary.workingDaysPerMonth * (school?.sessionsPerDay || 4)))}</span>
                      </div>
                    ) : <p className="text-xs text-amber-600 mt-1 font-medium">⚠ No salary</p>}
                  </div>
                  <button onClick={() => expanded === t.id ? setExpanded(null) : initSalaryForm(t.id, t.salary)} className="text-xs px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 font-medium">{t.salary ? "Edit" : "+ Set"}</button>
                </div>

                {expanded === t.id && salaryForm[t.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div><label className="label">Base Salary *</label><input type="number" className="input-field" value={salaryForm[t.id].baseSalary || ""} onChange={e => setSalaryForm(p => ({ ...p, [t.id]: { ...p[t.id], baseSalary: parseFloat(e.target.value) || 0 } }))} /></div>
                      <div><label className="label">Currency</label>
                        <select className="input-field" value={salaryForm[t.id].currency} onChange={e => setSalaryForm(p => ({ ...p, [t.id]: { ...p[t.id], currency: e.target.value } }))}>
                          {["NGN","KES","GHS","ZAR","TZS","UGX","XOF","XAF","ETB","EGP","RWF","USD","GBP","EUR","INR","AUD","CAD","PKR"].map(c => <option key={c} value={c}>{c}</option>)}
                        </select></div>
                      <div><label className="label">Pay Frequency ★</label>
                        <select className="input-field font-medium" value={salaryForm[t.id].payFrequency} onChange={e => setSalaryForm(p => ({ ...p, [t.id]: { ...p[t.id], payFrequency: e.target.value } }))}>
                          <option value="MONTHLY">Monthly</option><option value="BI_WEEKLY">Bi-Weekly (Every 2 Weeks)</option><option value="WEEKLY">Weekly</option>
                        </select></div>
                      <div><label className="label">Working Days/Mo</label>
                        <input type="number" className="input-field" min={1} max={31} value={salaryForm[t.id].workingDaysPerMonth} onChange={e => setSalaryForm(p => ({ ...p, [t.id]: { ...p[t.id], workingDaysPerMonth: parseInt(e.target.value) || 22 } }))} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="label">Housing Allow.</label><input type="number" className="input-field" value={salaryForm[t.id].housingAllowance || ""} onChange={e => setSalaryForm(p => ({ ...p, [t.id]: { ...p[t.id], housingAllowance: parseFloat(e.target.value) || 0 } }))} /></div>
                      <div><label className="label">Transport Allow.</label><input type="number" className="input-field" value={salaryForm[t.id].transportAllowance || ""} onChange={e => setSalaryForm(p => ({ ...p, [t.id]: { ...p[t.id], transportAllowance: parseFloat(e.target.value) || 0 } }))} /></div>
                      <div><label className="label">Tax %</label><input type="number" className="input-field" step="0.1" value={salaryForm[t.id].taxRate || ""} onChange={e => setSalaryForm(p => ({ ...p, [t.id]: { ...p[t.id], taxRate: parseFloat(e.target.value) || 0 } }))} /></div>
                    </div>
                    {salaryForm[t.id].baseSalary > 0 && (() => {
                      const f = salaryForm[t.id]; const gross = f.baseSalary + f.housingAllowance + f.transportAllowance + f.otherAllowances; const daily = gross / f.workingDaysPerMonth; const perSession = daily / (school?.sessionsPerDay || 4);
                      const weeklyPay = daily * (f.workingDaysPerMonth / 4.33); const biWeeklyPay = daily * (f.workingDaysPerMonth / 2.17);
                      return (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 text-center">
                            <div><div className="text-sm font-bold">{f.currency} {fmt(gross)}</div><div className="text-[9px] text-gray-500">Full Monthly</div></div>
                            <div><div className="text-sm font-bold text-blue-600">{f.currency} {fmt(Math.round(weeklyPay))}</div><div className="text-[9px] text-gray-500">Weekly Rate</div></div>
                            <div><div className="text-sm font-bold text-purple-600">{f.currency} {fmt(Math.round(biWeeklyPay))}</div><div className="text-[9px] text-gray-500">Bi-Weekly Rate</div></div>
                            <div><div className="text-sm font-bold text-brand-600">{f.currency} {fmt(Math.round(daily))}</div><div className="text-[9px] text-gray-500">Daily Rate</div></div>
                            <div><div className="text-sm font-bold text-amber-600">{f.currency} {fmtDec(perSession)}</div><div className="text-[9px] text-gray-500">Per Session</div></div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveSalary(t.id)} disabled={loading === t.id} className="btn-primary text-sm">{loading === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Salary"}</button>
                      <button onClick={() => setExpanded(null)} className="btn-ghost text-sm">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== LIVE SESSIONS ===================== */}
      {tab === "sessions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">⚡ Live class session credits for {MONTHS[currentMonth - 1]} — auto-generated when teachers teach</p>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">{totalSessions} sessions · {currency} {fmtDec(totalMonthEarned)} earned</span>
          </div>

          {teachers.map((t: any) => {
            const credits = creditsByTeacher[t.teacherId] || [];
            if (credits.length === 0) return null;
            const total = credits.reduce((s: number, c: any) => s + c.creditAmount, 0);
            const lateSessions = credits.filter((c: any) => c.liveSession?.lateMinutes > 0).length;
            return (
              <div key={t.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">{t.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">{t.teacher.user.name}</h4>
                    <p className="text-[10px] text-gray-500">{credits.length} sessions · {lateSessions > 0 ? `${lateSessions} late` : "All on time"}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{t.salary?.currency || currency} {fmtDec(total)}</span>
                </div>
                <div className="space-y-1">
                  {credits.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-gray-50 text-[10px]">
                      <span className={`w-1.5 h-1.5 rounded-full ${c.liveSession?.lateMinutes > 0 ? "bg-amber-400" : "bg-emerald-400"}`} />
                      <span className="flex-1 font-medium">{c.liveSession?.class?.name || "Class"}</span>
                      <span className="text-gray-400">{c.liveSession?.topic || ""}</span>
                      <span className="text-gray-400">{c.durationMin}min</span>
                      {c.liveSession?.lateMinutes > 0 && <span className="text-amber-600">⏰ {c.liveSession.lateMinutes}m late</span>}
                      <span className="text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                      <span className="font-bold text-emerald-600">{c.currency} {fmtDec(c.creditAmount)}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${c.status === "CREDITED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Manual sessions (legacy) */}
          {totalUnverified > 0 && (
            <div className="card border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-amber-800">📝 Manual Sessions ({totalUnverified} unverified)</h4>
                <button onClick={() => handleBulkVerify(teachers.flatMap((t: any) => t.sessions.filter((s: any) => !s.verified).map((s: any) => s.id)))} disabled={loading === "bulkv"} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium">
                  {loading === "bulkv" ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 inline mr-1" /> Verify All</>}
                </button>
              </div>
              {teachers.map((t: any) => t.sessions.filter((s: any) => !s.verified).map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{t.teacher.user.name} — {s.topic || "Session"}</p>
                    <p className="text-[10px] text-gray-400">{new Date(s.date).toLocaleDateString()} · {s.hoursWorked}h</p>
                  </div>
                  <span className="text-xs font-bold">{s.currency} {fmt(s.amountEarned)}</span>
                  <button onClick={() => handleVerify(s.id)} disabled={loading === s.id} className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-600"><Check className="w-3 h-3" /></button>
                  <button onClick={() => setRejectForm({ id: s.id, reason: "" })} className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-500"><X className="w-3 h-3" /></button>
                </div>
              )))}
            </div>
          )}

          {rejectForm && (
            <div className="card bg-red-50 border-red-200">
              <h4 className="text-sm font-semibold text-red-800 mb-2">Reject Session</h4>
              <input className="input-field" placeholder="Reason" value={rejectForm.reason} onChange={e => setRejectForm({ ...rejectForm, reason: e.target.value })} />
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-medium">Payroll for {MONTHS[currentMonth - 1]} {currentYear}</p>
              <p className="text-[10px] text-gray-500">Includes manual sessions + live session credits. Pay frequency shown per teacher.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleGeneratePayroll} disabled={loading === "gen"} className="btn-primary text-xs">{loading === "gen" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />} Generate Payroll</button>
              <button onClick={handleBatchPay} disabled={loading === "batch"} className="text-xs px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium">{loading === "batch" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Banknote className="w-3 h-3 mr-1" />} Pay All</button>
            </div>
          </div>

          {teachers.map((t: any) => {
            const cp = t.payrolls.find((p: any) => p.month === currentMonth && p.year === currentYear);
            const e = getTeacherEarnings(t);
            if (!cp) return (
              <div key={t.id} className="p-3 rounded-xl border border-dashed border-gray-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold">{t.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600">{t.teacher.user.name}</p>
                  <p className="text-[10px] text-gray-400">{e.sessions} sessions · {currency} {fmtDec(e.total)} earned · {FREQ_LABELS[e.freq]}</p>
                </div>
                <span className="text-[10px] text-gray-400">Not generated yet</span>
              </div>
            );
            return (
              <div key={t.id} className="card">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-emerald-100 text-brand-600 flex items-center justify-center font-bold text-xs">{t.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{t.teacher.user.name}</h4>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${e.freq === "WEEKLY" ? "bg-blue-100 text-blue-700" : e.freq === "BI_WEEKLY" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>{FREQ_LABELS[e.freq]}</span>
                    </div>
                    {/* Breakdown */}
                    <div className="grid grid-cols-4 gap-2 mt-2 text-[10px]">
                      <div className="bg-gray-50 rounded-lg p-1.5 text-center">
                        <div className="font-bold">{cp.currency} {fmtDec(cp.grossPay)}</div>
                        <div className="text-gray-400">Gross</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-1.5 text-center">
                        <div className="font-bold text-red-600">-{fmtDec(cp.taxDeduction + cp.pensionDeduction + cp.otherDeductions)}</div>
                        <div className="text-gray-400">Deductions</div>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-1.5 text-center">
                        <div className="font-bold text-emerald-600">{cp.currency} {fmtDec(cp.netPay)}</div>
                        <div className="text-gray-400">Net Pay</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-1.5 text-center">
                        <div className="font-bold text-blue-600">{e.sessions}</div>
                        <div className="text-gray-400">Sessions</div>
                      </div>
                    </div>
                    {cp.notes && <p className="text-[9px] text-gray-400 mt-1">{cp.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[cp.status]}`}>{cp.status}</span>
                    {cp.status === "DRAFT" && (
                      <div className="flex gap-1">
                        <button onClick={() => setPayModal({ id: cp.id, teacher: t, payroll: cp })} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium hover:bg-emerald-100">💰 Pay</button>
                        <button onClick={() => setAdjustForm({ id: cp.id, amount: 0, notes: "" })} className="text-[10px] px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">±</button>
                        <button onClick={() => handleCancel(cp.id)} className="text-red-400 text-[10px] px-1.5 hover:text-red-600"><X className="w-3 h-3" /></button>
                      </div>
                    )}
                    {cp.status === "PAID" && (
                      <div className="text-right text-[9px] text-gray-400">
                        <p>Paid {cp.paidAt && new Date(cp.paidAt).toLocaleDateString()}</p>
                        {cp.transactionRef && <p>Ref: {cp.transactionRef}</p>}
                        {cp.paymentProof && <a href={cp.paymentProof} target="_blank" className="text-blue-500 underline">Proof</a>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {adjustForm && (
            <div className="card bg-blue-50 border-blue-200">
              <h4 className="text-sm font-semibold mb-3">± Adjust Payroll (bonus or deduction)</h4>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="input-field" placeholder="Amount (+ or -)" value={adjustForm.amount || ""} onChange={e => setAdjustForm({ ...adjustForm, amount: parseFloat(e.target.value) || 0 })} />
                <input className="input-field" placeholder="Reason" value={adjustForm.notes} onChange={e => setAdjustForm({ ...adjustForm, notes: e.target.value })} />
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
              <p className="text-xs text-emerald-600 mt-1">{payModal.teacher.teacher.user.name} — {FREQ_LABELS[payModal.teacher.salary?.payFrequency] || "Monthly"}</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl space-y-1">
                <div className="flex justify-between text-xs"><span className="text-gray-500">Gross Pay</span><span className="font-medium">{payModal.payroll.currency} {fmtDec(payModal.payroll.grossPay)}</span></div>
                {payModal.payroll.taxDeduction > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Tax</span><span className="text-red-500">-{fmtDec(payModal.payroll.taxDeduction)}</span></div>}
                {payModal.payroll.pensionDeduction > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Pension</span><span className="text-red-500">-{fmtDec(payModal.payroll.pensionDeduction)}</span></div>}
                {payModal.payroll.otherDeductions > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Other</span><span className="text-red-500">-{fmtDec(payModal.payroll.otherDeductions)}</span></div>}
                <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1"><span>Net Pay</span><span className="text-emerald-600">{payModal.payroll.currency} {fmtDec(payModal.payroll.netPay)}</span></div>
              </div>

              {payModal.teacher.teacher.bankAccounts?.[0] ? (() => {
                const b = payModal.teacher.teacher.bankAccounts[0];
                return (
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <p className="text-xs font-bold text-purple-800 mb-2">💳 Pay to: {b.label}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                      {b.bankName && <div>Bank: <span className="font-medium">{b.bankName}</span></div>}
                      {b.accountName && <div>Name: <span className="font-medium">{b.accountName}</span></div>}
                      {b.accountNumber && <div>Account: <span className="font-bold text-purple-700">{b.accountNumber}</span></div>}
                      {b.routingNumber && <div>Routing: <span className="font-medium">{b.routingNumber}</span></div>}
                      {b.mobileNumber && <div>Mobile: <span className="font-medium">{b.mobileProvider} {b.mobileNumber}</span></div>}
                      {b.paypalEmail && <div>PayPal: <span className="font-medium">{b.paypalEmail}</span></div>}
                      {b.cryptoAddress && <div className="col-span-2">Crypto: <span className="font-medium">{b.cryptoNetwork}: {b.cryptoAddress}</span></div>}
                    </div>
                  </div>
                );
              })() : <div className="p-3 bg-red-50 rounded-xl border border-red-200"><p className="text-xs text-red-700">⚠️ No bank details submitted</p></div>}

              <div><label className="label">Transaction Reference</label><input className="input-field" placeholder="e.g. TXN-12345" value={payRef} onChange={e => setPayRef(e.target.value)} /></div>
              <div>
                <label className="label">Payment Proof</label>
                <input className="input-field text-xs" type="file" accept="image/*,.pdf"
                  onChange={async e => {
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
