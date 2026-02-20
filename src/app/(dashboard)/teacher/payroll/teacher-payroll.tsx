"use client";

import { useState, useMemo } from "react";
import { addBankAccount, removeBankAccount, setPrimaryAccount, logTeachingSession } from "@/lib/actions/payroll";
import { getCountryConfig, ALL_COUNTRIES } from "@/lib/country-payments";
import { useRouter } from "next/navigation";
import {
  Loader2, DollarSign, CreditCard, Building, Smartphone, Globe, Bitcoin, Banknote,
  Trash2, Star, TrendingUp, TrendingDown, Clock, CheckCircle, Calendar, BookOpen, Plus
} from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_COLORS: Record<string, string> = { DRAFT: "bg-amber-100 text-amber-700", PAID: "bg-emerald-100 text-emerald-700", CANCELLED: "bg-gray-100 text-gray-500" };
const METHOD_ICONS: Record<string, any> = { BANK_TRANSFER: Building, MOBILE_MONEY: Smartphone, PAYPAL: Globe, CRYPTO: Bitcoin, CASH: Banknote, CHECK: CreditCard };

export default function TeacherPayroll({ schools, bankAccounts, classes, countryCode, sessionCredits }: { schools: any[]; bankAccounts: any[]; classes: any[]; countryCode: string; sessionCredits: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [tab, setTab] = useState<"earnings" | "sessions" | "accounts" | "payslips" | "log">("earnings");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [message, setMessage] = useState("");

  const cc = getCountryConfig(countryCode);
  const [form, setForm] = useState({
    methodType: cc.popularMethods[0] || "BANK_TRANSFER", label: "Primary", bankName: "",
    accountName: "", accountNumber: "", routingNumber: "", swiftCode: "", branchCode: "",
    mobileProvider: "", mobileNumber: "", paypalEmail: "", cryptoAddress: "", cryptoNetwork: "USDT-TRC20",
    countryCode, currency: cc.currency, isPrimary: bankAccounts.length === 0,
  });
  const [sessionForm, setSessionForm] = useState({ classId: classes[0]?.id || "", date: new Date().toISOString().split("T")[0], hoursWorked: "1", topic: "", notes: "" });

  const activeSchool = schools[0];
  const salary = activeSchool?.salary;
  const sessions = activeSchool?.sessions || [];
  const payrolls = activeSchool?.payrolls || [];

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Current month earnings
  const now = new Date();
  const currentMonthSessions = useMemo(() => sessions.filter((s: any) => {
    const d = new Date(s.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }), [sessions]);

  const monthlyEarned = currentMonthSessions.reduce((s: number, sess: any) => s + sess.amountEarned, 0);
  const daysWorked = currentMonthSessions.length;
  const dailyRate = salary ? (salary.baseSalary + salary.housingAllowance + salary.transportAllowance + salary.otherAllowances) / salary.workingDaysPerMonth : 0;
  const grossMonthly = salary ? salary.baseSalary + salary.housingAllowance + salary.transportAllowance + salary.otherAllowances : 0;

  // Session credit totals (must be before earnPercent)
  const totalCreditsEarned = sessionCredits.reduce((s: number, c: any) => s + c.creditAmount, 0);
  const currentMonthCredits = sessionCredits.filter((c: any) => {
    const d = new Date(c.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const currentMonthCreditTotal = currentMonthCredits.reduce((s: number, c: any) => s + c.creditAmount, 0);
  const totalSessionsTeached = sessionCredits.length;

  const earnPercent = grossMonthly > 0 ? Math.round(((monthlyEarned + currentMonthCreditTotal) / grossMonthly) * 100) : 0;

  // Payment totals
  const totalPaid = payrolls.filter((p: any) => p.status === "PAID").reduce((s: number, p: any) => s + p.netPay, 0);
  const totalPending = payrolls.filter((p: any) => p.status === "DRAFT" || p.status === "PENDING").reduce((s: number, p: any) => s + p.netPay, 0);
  const currentMonthPayroll = payrolls.find((p: any) => p.month === now.getMonth() + 1 && p.year === now.getFullYear());
  const currentMonthPaid = currentMonthPayroll?.status === "PAID";

  const selectedCountry = getCountryConfig(form.countryCode);

  const handleAddAccount = async () => {
    setLoading("add");
    const result = await addBankAccount(form as any);
    if (result.error) setMessage("Error: " + result.error);
    else { setShowAddAccount(false); setMessage("Account added!"); router.refresh(); }
    setLoading("");
  };

  const handleRemove = async (id: string) => { if (!confirm("Remove?")) return; setLoading(id); await removeBankAccount(id); router.refresh(); setLoading(""); };
  const handleSetPrimary = async (id: string) => { setLoading(id); await setPrimaryAccount(id); router.refresh(); setLoading(""); };

  const handleLogSession = async () => {
    if (!sessionForm.classId) { setMessage("Select a class"); return; }
    setLoading("session");
    const result = await logTeachingSession({
      classId: sessionForm.classId, date: sessionForm.date,
      hoursWorked: parseFloat(sessionForm.hoursWorked) || 1,
      topic: sessionForm.topic, notes: sessionForm.notes,
    });
    if (result.error) setMessage("Error: " + result.error);
    else setMessage(`Earned ${salary?.currency || ""} ${fmt(result.earned || 0)} for today's session!`);
    router.refresh();
    setLoading("");
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-3 text-sm flex items-center justify-between ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          <span>{message}</span>
          <button onClick={() => setMessage("")} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "earnings", label: "💰 Earnings" },
          { key: "sessions", label: `📊 Sessions (${sessionCredits.length})` },
          { key: "accounts", label: `🏦 Accounts (${bankAccounts.length})` },
          { key: "payslips", label: `📄 Payslips (${payrolls.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`text-xs px-5 py-2.5 rounded-lg font-medium ${tab === t.key ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===================== EARNINGS TAB ===================== */}
      {tab === "earnings" && (
        <div className="space-y-4">
          {!salary ? (
            <div className="card text-center py-12">
              <Clock className="w-12 h-12 text-amber-300 mx-auto mb-3" />
              <p className="text-amber-700 font-medium">Salary Not Set Yet</p>
              <p className="text-sm text-gray-500 mt-1">Your principal hasn't configured your salary yet.</p>
            </div>
          ) : (
            <>
              {/* Balance Card */}
              <div className="p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-emerald-200 text-xs font-medium uppercase">Earned — {MONTHS[now.getMonth()]} {now.getFullYear()}</p>
                  <span className="text-emerald-200 text-xs bg-white/20 px-2 py-0.5 rounded-full">{currentMonthCredits.length} sessions · {daysWorked} days</span>
                </div>
                <div className="text-4xl font-bold mb-2">{salary.currency} {fmt(Math.round(monthlyEarned + currentMonthCreditTotal))}</div>
                {/* Breakdown */}
                <div className="flex gap-3 text-xs text-emerald-200 mb-2">
                  {monthlyEarned > 0 && <span>Manual: {salary.currency} {fmt(Math.round(monthlyEarned))}</span>}
                  {currentMonthCreditTotal > 0 && <span>Live sessions: {salary.currency} {fmt(Math.round(currentMonthCreditTotal))}</span>}
                </div>
                {/* Progress bar */}
                <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                  <div className="bg-white rounded-full h-3 transition-all duration-500" style={{ width: `${Math.min(100, earnPercent)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-emerald-200">
                  <span>{grossMonthly > 0 ? Math.round((monthlyEarned + currentMonthCreditTotal) / grossMonthly * 100) : 0}% of full salary earned</span>
                  <span>Full: {salary.currency} {fmt(grossMonthly)}</span>
                </div>
                {/* Payment status for current month */}
                {currentMonthPayroll && (
                  <div className={`mt-3 p-2.5 rounded-lg text-xs font-medium ${currentMonthPaid ? "bg-white/20 text-white" : "bg-amber-500/30 text-amber-100"}`}>
                    {currentMonthPaid ? (
                      <span>✅ This month&apos;s salary has been paid — {salary.currency} {fmt(currentMonthPayroll.netPay)}
                        {currentMonthPayroll.paidAt && <span className="opacity-70"> on {new Date(currentMonthPayroll.paidAt).toLocaleDateString()}</span>}
                      </span>
                    ) : (
                      <span>⏳ Payroll generated — {currentMonthPayroll.status === "DRAFT" ? "awaiting principal approval" : "processing"}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Total Payments Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="stat-card text-center border-emerald-200">
                  <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-emerald-600">{salary.currency} {fmt(Math.round(totalPaid))}</div>
                  <div className="text-[10px] text-gray-500">Total Received</div>
                </div>
                <div className="stat-card text-center border-amber-200">
                  <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-amber-600">{salary.currency} {fmt(Math.round(totalPending))}</div>
                  <div className="text-[10px] text-gray-500">Pending Payment</div>
                </div>
                <div className="stat-card text-center border-blue-200">
                  <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-blue-600">{totalSessionsTeached}</div>
                  <div className="text-[10px] text-gray-500">Sessions Taught</div>
                </div>
                <div className="stat-card text-center border-purple-200">
                  <Calendar className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-purple-600">{salary.currency} {fmt(Math.round(totalCreditsEarned))}</div>
                  <div className="text-[10px] text-gray-500">All-Time Credits</div>
                </div>
              </div>

              {/* Recent Payments Received */}
              {payrolls.filter((p: any) => p.status === "PAID").length > 0 && (
                <div className="card border-emerald-200">
                  <h3 className="section-title mb-3 text-emerald-800">💰 Recent Payments Received</h3>
                  <div className="space-y-2">
                    {payrolls.filter((p: any) => p.status === "PAID").slice(0, 6).map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 p-2.5 bg-emerald-50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-bold">{MONTHS[p.month - 1]}</div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">{MONTHS[p.month - 1]} {p.year}</p>
                          <p className="text-[10px] text-gray-500">
                            Paid {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : ""}
                            {p.transactionRef && <span> · Ref: {p.transactionRef}</span>}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-emerald-700">{p.currency} {fmt(p.netPay)}</span>
                          {p.paymentProof && (
                            <a href={p.paymentProof} target="_blank" rel="noopener noreferrer" className="block text-[9px] text-blue-600 underline mt-0.5">View Proof</a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="text-xs font-bold text-blue-800 mb-2">💡 How Earn-As-You-Teach Works</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>Your monthly salary of <strong>{salary.currency} {fmt(grossMonthly)}</strong> is divided into <strong>{salary.workingDaysPerMonth} working days</strong>.</p>
                  <p>Your daily rate is <strong>{salary.currency} {fmt(Math.round(dailyRate))}</strong> per full day.</p>
                  <p>Each time you teach a class (log a session or mark attendance), your daily rate is credited to your available balance.</p>
                  <p>At month end, your actual earned amount becomes your payroll — you only get paid for days you taught.</p>
                </div>
              </div>

              {/* Daily breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="stat-card text-center"><div className="text-lg font-bold text-brand-600">{salary.currency} {fmt(Math.round(dailyRate))}</div><div className="text-[10px] text-gray-500 mt-1">Daily Rate</div></div>
                <div className="stat-card text-center"><div className="text-lg font-bold text-emerald-600">{daysWorked}</div><div className="text-[10px] text-gray-500 mt-1">Days Taught</div></div>
                <div className="stat-card text-center"><div className="text-lg font-bold text-amber-600">{salary.workingDaysPerMonth - daysWorked}</div><div className="text-[10px] text-gray-500 mt-1">Days Remaining</div></div>
              </div>

              {/* Salary Breakdown */}
              <div className="card">
                <h3 className="section-title mb-3">Full Salary Structure</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-600">Base Salary</span><span className="font-bold">{salary.currency} {fmt(salary.baseSalary)}</span></div>
                  {salary.housingAllowance > 0 && <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-600">Housing</span><span className="text-emerald-600">+{fmt(salary.housingAllowance)}</span></div>}
                  {salary.transportAllowance > 0 && <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-600">Transport</span><span className="text-emerald-600">+{fmt(salary.transportAllowance)}</span></div>}
                  {salary.otherAllowances > 0 && <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-600">Other</span><span className="text-emerald-600">+{fmt(salary.otherAllowances)}</span></div>}
                  <div className="flex justify-between py-1.5 border-b border-gray-200 font-bold"><span>Gross</span><span>{fmt(grossMonthly)}</span></div>
                  {salary.taxRate > 0 && <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-600">Tax ({salary.taxRate}%)</span><span className="text-red-600">-{fmt(grossMonthly * salary.taxRate / 100)}</span></div>}
                  {salary.pensionRate > 0 && <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-600">Pension ({salary.pensionRate}%)</span><span className="text-red-600">-{fmt(grossMonthly * salary.pensionRate / 100)}</span></div>}
                </div>
              </div>

              {/* Recent sessions */}
              {sessions.length > 0 && (
                <div className="card">
                  <h3 className="section-title mb-3">Recent Teaching Sessions</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {sessions.slice(0, 20).map((s: any) => (
                      <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${s.verified ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                          {s.verified ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-800">{s.topic || "Teaching session"}</p>
                          <p className="text-[10px] text-gray-500">{new Date(s.date).toLocaleDateString()} • {s.hoursWorked}h</p>
                        </div>
                        <span className="text-sm font-bold text-emerald-600">+{s.currency} {fmt(s.amountEarned)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {salary.history?.length > 0 && (
                <div className="card">
                  <h3 className="section-title mb-3">Salary History</h3>
                  {salary.history.map((h: any) => (
                    <div key={h.id} className="flex items-center gap-3 py-2 text-xs text-gray-500 border-b border-gray-50">
                      {h.newAmount > h.previousAmount ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                      <span className="font-medium">{salary.currency} {fmt(h.previousAmount)} → {fmt(h.newAmount)}</span>
                      <span className="text-gray-300">•</span><span>{h.reason}</span><span className="text-gray-300">•</span>
                      <span>{new Date(h.changedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===================== LOG SESSION TAB ===================== */}
      {/* ===================== SESSION HISTORY TAB ===================== */}
      {tab === "sessions" && (
        <div className="space-y-4">
          {/* Session credit summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card text-center">
              <div className="text-lg font-bold text-emerald-600">{totalSessionsTeached}</div>
              <div className="text-[10px] text-gray-500">Total Sessions</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-lg font-bold text-blue-600">{salary?.currency || ""} {fmt(Math.round(totalCreditsEarned))}</div>
              <div className="text-[10px] text-gray-500">Total Credits</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-lg font-bold text-amber-600">{currentMonthCredits.length}</div>
              <div className="text-[10px] text-gray-500">This Month</div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
            💡 Credits are automatically added to your balance when you teach a live session. Each session earns a portion of your monthly salary based on duration.
          </div>

          {sessionCredits.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No session credits yet.</p>
              <p className="text-xs text-gray-400 mt-1">Credits are added automatically when you teach live sessions.</p>
            </div>
          ) : (
            <div className="card">
              <h3 className="section-title mb-3">Session Credit History</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {sessionCredits.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${c.status === "CREDITED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {c.status === "CREDITED" ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-800">
                        {c.liveSession?.class?.name || c.liveSession?.topic || "Live Session"}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString()} • {c.durationMin} min
                        {c.liveSession?.startedAt && (
                          <span> • {new Date(c.liveSession.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-700">+{c.currency} {fmt(c.creditAmount)}</span>
                      <p className="text-[9px] text-gray-400">{c.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual sessions too */}
          {sessions.length > 0 && (
            <div className="card">
              <h3 className="section-title mb-3">Manual Teaching Sessions</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {sessions.slice(0, 20).map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${s.verified ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                      {s.verified ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800">{s.topic || "Teaching session"}</p>
                      <p className="text-[10px] text-gray-500">{new Date(s.date).toLocaleDateString()} • {s.hoursWorked}h</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">+{s.currency} {fmt(s.amountEarned)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== ACCOUNTS TAB ===================== */}
      {tab === "accounts" && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-700">Add your payment accounts. Your <strong>primary</strong> account will receive salary payments. Payment methods are tailored to your country.</p>
          </div>

          {bankAccounts.map((acc: any) => {
            const Icon = METHOD_ICONS[acc.methodType] || CreditCard;
            return (
              <div key={acc.id} className={`card ${acc.isPrimary ? "border-emerald-300 bg-emerald-50/50" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${acc.isPrimary ? "bg-emerald-200 text-emerald-700" : "bg-gray-100 text-gray-500"}`}><Icon className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{acc.label}</h4>
                      {acc.isPrimary && <span className="text-[10px] bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-bold"><Star className="w-2.5 h-2.5 inline" /> PRIMARY</span>}
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{acc.methodType.replace("_", " ")}</span>
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full">{acc.countryCode} • {acc.currency}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {acc.bankName && <p>{acc.bankName} • {acc.accountName} • ****{acc.accountNumber?.slice(-4)}</p>}
                      {acc.mobileProvider && <p>{acc.mobileProvider} • {acc.mobileNumber}</p>}
                      {acc.paypalEmail && <p>{acc.paypalEmail}</p>}
                      {acc.cryptoAddress && <p>{acc.cryptoNetwork} • {acc.cryptoAddress.slice(0, 10)}...{acc.cryptoAddress.slice(-6)}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!acc.isPrimary && <button onClick={() => handleSetPrimary(acc.id)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium">Set Primary</button>}
                    <button onClick={() => handleRemove(acc.id)} className="text-red-400 hover:text-red-600 p-1.5"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}

          {!showAddAccount ? (
            <button onClick={() => setShowAddAccount(true)} className="btn-primary text-sm w-full py-3">+ Add Payment Account</button>
          ) : (
            <div className="card bg-brand-50 border-brand-200 space-y-4">
              <h4 className="text-sm font-semibold">Add Payment Account</h4>

              {/* Country selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Country</label>
                  <select className="input-field" value={form.countryCode} onChange={(e) => {
                    const nc = getCountryConfig(e.target.value);
                    setForm((p) => ({ ...p, countryCode: e.target.value, currency: nc.currency, methodType: nc.popularMethods[0] || "BANK_TRANSFER", bankName: "", mobileProvider: "" }));
                  }}>
                    {ALL_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Currency</label>
                  <input className="input-field bg-gray-100" value={selectedCountry.currencySymbol + " " + selectedCountry.currency} readOnly />
                </div>
              </div>

              {/* Method selector — only show methods available for country */}
              <div>
                <label className="label">Payment Method</label>
                <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
                  {[
                    { key: "BANK_TRANSFER", label: "Bank Transfer", icon: Building },
                    { key: "MOBILE_MONEY", label: "Mobile Money", icon: Smartphone },
                    { key: "PAYPAL", label: "PayPal", icon: Globe },
                    { key: "CRYPTO", label: "Crypto", icon: Bitcoin },
                    { key: "CASH", label: "Cash", icon: Banknote },
                  ].filter((m) => selectedCountry.methods.includes(m.key)).map((m) => (
                    <button key={m.key} onClick={() => setForm((p) => ({ ...p, methodType: m.key }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-colors ${form.methodType === m.key ? "bg-brand-600 text-white" : "bg-white border border-gray-200 hover:bg-gray-50"}`}>
                      <m.icon className="w-5 h-5" />{m.label}
                      {selectedCountry.popularMethods[0] === m.key && <span className="text-[8px] opacity-70">Popular</span>}
                    </button>
                  ))}
                </div>
              </div>

              <input className="input-field" placeholder="Account label (e.g. My GTBank, M-Pesa)" value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />

              {/* BANK TRANSFER — country-specific banks */}
              {form.methodType === "BANK_TRANSFER" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Bank Name</label>
                    <select className="input-field" value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}>
                      <option value="">Select your bank</option>
                      {selectedCountry.banks.map((b) => <option key={b} value={b}>{b}</option>)}
                      <option value="Other">Other Bank</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Account Holder Name</label>
                    <input className="input-field" placeholder="Full name on account" value={form.accountName} onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Account Number</label>
                    <input className="input-field" placeholder={selectedCountry.code === "NG" ? "10-digit NUBAN" : "Account number"} value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} />
                  </div>
                  {["ZA", "GB"].includes(selectedCountry.code) && (
                    <div>
                      <label className="label">Branch / Sort Code</label>
                      <input className="input-field" placeholder="Branch code" value={form.routingNumber} onChange={(e) => setForm((p) => ({ ...p, routingNumber: e.target.value }))} />
                    </div>
                  )}
                  {["US", "GB"].includes(selectedCountry.code) && (
                    <div>
                      <label className="label">Routing / SWIFT</label>
                      <input className="input-field" placeholder="For international transfers" value={form.swiftCode} onChange={(e) => setForm((p) => ({ ...p, swiftCode: e.target.value }))} />
                    </div>
                  )}
                </div>
              )}

              {/* MOBILE MONEY — country-specific providers */}
              {form.methodType === "MOBILE_MONEY" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Provider</label>
                    <select className="input-field" value={form.mobileProvider} onChange={(e) => setForm((p) => ({ ...p, mobileProvider: e.target.value }))}>
                      <option value="">Select provider</option>
                      {selectedCountry.mobileProviders.map((p: string) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Mobile Number</label>
                    <input className="input-field" placeholder="e.g. 08012345678" value={form.mobileNumber} onChange={(e) => setForm((p) => ({ ...p, mobileNumber: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Account Name</label>
                    <input className="input-field" placeholder="Name on account" value={form.accountName} onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))} />
                  </div>
                </div>
              )}

              {form.methodType === "PAYPAL" && <div><label className="label">PayPal Email</label><input className="input-field" type="email" placeholder="your@email.com" value={form.paypalEmail} onChange={(e) => setForm((p) => ({ ...p, paypalEmail: e.target.value }))} /></div>}

              {form.methodType === "CRYPTO" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Network</label>
                    <select className="input-field" value={form.cryptoNetwork} onChange={(e) => setForm((p) => ({ ...p, cryptoNetwork: e.target.value }))}>
                      <option value="USDT-TRC20">USDT (TRC-20)</option><option value="USDT-ERC20">USDT (ERC-20)</option>
                      <option value="USDC-ERC20">USDC (ERC-20)</option><option value="BTC">Bitcoin</option>
                      <option value="ETH">Ethereum</option><option value="BNB-BSC">BNB (BSC)</option>
                    </select></div>
                  <div><label className="label">Wallet Address</label>
                    <input className="input-field" placeholder="Your wallet address" value={form.cryptoAddress} onChange={(e) => setForm((p) => ({ ...p, cryptoAddress: e.target.value }))} /></div>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm((p) => ({ ...p, isPrimary: e.target.checked }))} /> Set as primary payment account</label>

              <div className="flex gap-2">
                <button onClick={handleAddAccount} disabled={loading === "add"} className="btn-primary text-sm">{loading === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Account"}</button>
                <button onClick={() => setShowAddAccount(false)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== PAYSLIPS TAB ===================== */}
      {tab === "payslips" && (
        <div className="space-y-3">
          {payrolls.length === 0 ? (
            <div className="card text-center py-12"><Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No payslips yet.</p></div>
          ) : payrolls.map((p: any) => (
            <div key={p.id} className={`card ${p.status === "PAID" ? "border-emerald-200" : ""}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${p.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{MONTHS[p.month - 1]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><h4 className="text-sm font-semibold">{MONTHS[p.month - 1]} {p.year}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span></div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-0.5">
                    <span>Gross: {p.currency} {fmt(p.grossPay)}</span>
                    {p.taxDeduction > 0 && <span className="text-red-500">Tax: -{fmt(p.taxDeduction)}</span>}
                    {p.pensionDeduction > 0 && <span className="text-red-500">Pension: -{fmt(p.pensionDeduction)}</span>}
                  </div>
                  {p.notes && <p className="text-[10px] text-gray-400 mt-0.5">{p.notes}</p>}
                  {p.transactionRef && <p className="text-[10px] text-gray-500 mt-0.5">Ref: <span className="font-medium">{p.transactionRef}</span></p>}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-700">{p.currency} {fmt(p.netPay)}</div>
                  <div className="text-[10px] text-gray-400">{p.paidAt ? `Paid ${new Date(p.paidAt).toLocaleDateString()}` : "Pending"}</div>
                  {p.paymentProof && (
                    <a href={p.paymentProof} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-blue-600 underline hover:text-blue-800">📎 View Payment Proof</a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
