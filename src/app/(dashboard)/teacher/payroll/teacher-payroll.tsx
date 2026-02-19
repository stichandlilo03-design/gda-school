"use client";

import { useState } from "react";
import { addBankAccount, removeBankAccount, setPrimaryAccount } from "@/lib/actions/payroll";
import { useRouter } from "next/navigation";
import { Loader2, DollarSign, CreditCard, Building, Smartphone, Globe, Bitcoin, Banknote, Check, Trash2, Star, TrendingUp, TrendingDown, Download, Clock } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-700", PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-gray-100 text-gray-500", PENDING: "bg-blue-100 text-blue-700",
};

const METHOD_ICONS: Record<string, any> = {
  BANK_TRANSFER: Building, MOBILE_MONEY: Smartphone, PAYPAL: Globe, CRYPTO: Bitcoin, CASH: Banknote, CHECK: CreditCard,
};

const MOBILE_PROVIDERS: Record<string, string[]> = {
  NG: ["OPay", "PalmPay", "Kuda", "Moniepoint"], KE: ["M-Pesa", "Airtel Money"],
  GH: ["MTN MoMo", "Vodafone Cash", "AirtelTigo Money"], TZ: ["M-Pesa", "Tigo Pesa", "Airtel Money"],
  UG: ["MTN MoMo", "Airtel Money"], RW: ["MTN MoMo", "Airtel Money"],
  ZA: ["FNB eWallet", "Capitec"], CM: ["MTN MoMo", "Orange Money"],
};

export default function TeacherPayroll({ schools, bankAccounts, countryCode }: { schools: any[]; bankAccounts: any[]; countryCode: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [tab, setTab] = useState<"salary" | "accounts" | "payslips">("salary");
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [form, setForm] = useState({
    methodType: "BANK_TRANSFER", label: "Primary", bankName: "", accountName: "", accountNumber: "",
    routingNumber: "", swiftCode: "", mobileProvider: "", mobileNumber: "", paypalEmail: "",
    cryptoAddress: "", cryptoNetwork: "USDT-TRC20", countryCode, currency: "NGN", isPrimary: bankAccounts.length === 0,
  });

  const activeSchool = schools[0];
  const salary = activeSchool?.salary;
  const payrolls = activeSchool?.payrolls || [];

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const handleAddAccount = async () => {
    setLoading("add");
    const result = await addBankAccount(form);
    if (result.error) alert(result.error);
    else { setShowAddAccount(false); router.refresh(); }
    setLoading("");
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this payment account?")) return;
    setLoading(id); await removeBankAccount(id); router.refresh(); setLoading("");
  };

  const handleSetPrimary = async (id: string) => {
    setLoading(id); await setPrimaryAccount(id); router.refresh(); setLoading("");
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "salary", label: "💰 My Salary" },
          { key: "accounts", label: `🏦 Payment Accounts (${bankAccounts.length})` },
          { key: "payslips", label: `📄 Payslips (${payrolls.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`text-xs px-5 py-2.5 rounded-lg font-medium ${tab === t.key ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* SALARY TAB */}
      {tab === "salary" && (
        <div className="space-y-4">
          {!activeSchool ? (
            <div className="card text-center py-12"><DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No active school. Salary will appear once you're approved.</p></div>
          ) : !salary ? (
            <div className="card text-center py-12">
              <Clock className="w-12 h-12 text-amber-300 mx-auto mb-3" />
              <p className="text-amber-700 font-medium">Salary Not Set Yet</p>
              <p className="text-sm text-gray-500 mt-1">Your principal at {activeSchool.school.name} hasn't configured your salary yet.</p>
            </div>
          ) : (
            <>
              {/* Current Salary Card */}
              <div className="p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl">
                <p className="text-emerald-200 text-xs font-medium uppercase mb-1">Monthly Net Pay</p>
                <div className="text-4xl font-bold mb-3">
                  {salary.currency} {fmt(
                    salary.baseSalary + salary.housingAllowance + salary.transportAllowance + salary.otherAllowances
                    - (salary.baseSalary + salary.housingAllowance + salary.transportAllowance + salary.otherAllowances) * salary.taxRate / 100
                    - (salary.baseSalary + salary.housingAllowance + salary.transportAllowance + salary.otherAllowances) * salary.pensionRate / 100
                    - salary.otherDeductions
                  )}
                </div>
                <div className="flex gap-6 text-xs text-emerald-200">
                  <span>{activeSchool.school.name}</span>
                  <span>{salary.payFrequency}</span>
                  <span>Since {new Date(salary.effectiveFrom).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="card">
                <h3 className="section-title mb-4">Salary Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-600">Base Salary</span><span className="text-sm font-bold">{salary.currency} {fmt(salary.baseSalary)}</span></div>
                  {salary.housingAllowance > 0 && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-600">Housing Allowance</span><span className="text-sm text-emerald-600">+ {fmt(salary.housingAllowance)}</span></div>}
                  {salary.transportAllowance > 0 && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-600">Transport Allowance</span><span className="text-sm text-emerald-600">+ {fmt(salary.transportAllowance)}</span></div>}
                  {salary.otherAllowances > 0 && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-600">Other Allowances</span><span className="text-sm text-emerald-600">+ {fmt(salary.otherAllowances)}</span></div>}
                  <div className="flex justify-between py-2 border-b border-gray-200"><span className="text-sm font-bold text-gray-800">Gross Pay</span><span className="text-sm font-bold">{fmt(salary.baseSalary + salary.housingAllowance + salary.transportAllowance + salary.otherAllowances)}</span></div>
                  {salary.taxRate > 0 && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-600">Tax ({salary.taxRate}%)</span><span className="text-sm text-red-600">- {fmt((salary.baseSalary + salary.housingAllowance + salary.transportAllowance + salary.otherAllowances) * salary.taxRate / 100)}</span></div>}
                  {salary.pensionRate > 0 && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-600">Pension ({salary.pensionRate}%)</span><span className="text-sm text-red-600">- {fmt((salary.baseSalary + salary.housingAllowance + salary.transportAllowance + salary.otherAllowances) * salary.pensionRate / 100)}</span></div>}
                  {salary.otherDeductions > 0 && <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-600">Other Deductions</span><span className="text-sm text-red-600">- {fmt(salary.otherDeductions)}</span></div>}
                </div>
                {salary.notes && <p className="text-xs text-gray-400 mt-3 italic">{salary.notes}</p>}
              </div>

              {/* History */}
              {salary.history?.length > 0 && (
                <div className="card">
                  <h3 className="section-title mb-3">Salary History</h3>
                  {salary.history.map((h: any) => (
                    <div key={h.id} className="flex items-center gap-3 py-2 text-xs text-gray-500 border-b border-gray-50">
                      {h.newAmount > h.previousAmount ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                      <span className="font-medium">{salary.currency} {fmt(h.previousAmount)} → {fmt(h.newAmount)}</span>
                      <span className="text-gray-300">•</span>
                      <span>{h.reason}</span>
                      <span className="text-gray-300">•</span>
                      <span>{new Date(h.changedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ACCOUNTS TAB */}
      {tab === "accounts" && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-700">Add your preferred payment accounts below. Your school will use your <strong>primary</strong> account for salary payments. You can add multiple accounts and switch your primary at any time.</p>
          </div>

          {bankAccounts.map((acc: any) => {
            const Icon = METHOD_ICONS[acc.methodType] || CreditCard;
            return (
              <div key={acc.id} className={`card ${acc.isPrimary ? "border-emerald-300 bg-emerald-50/50" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${acc.isPrimary ? "bg-emerald-200 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{acc.label}</h4>
                      {acc.isPrimary && <span className="text-[10px] bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5"><Star className="w-2.5 h-2.5" /> PRIMARY</span>}
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{acc.methodType.replace("_", " ")}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                      {acc.bankName && <p>{acc.bankName} • {acc.accountName} • ****{acc.accountNumber?.slice(-4)}</p>}
                      {acc.mobileProvider && <p>{acc.mobileProvider} • {acc.mobileNumber}</p>}
                      {acc.paypalEmail && <p>{acc.paypalEmail}</p>}
                      {acc.cryptoAddress && <p>{acc.cryptoNetwork} • {acc.cryptoAddress.slice(0, 10)}...{acc.cryptoAddress.slice(-6)}</p>}
                      <p>{acc.countryCode} • {acc.currency}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!acc.isPrimary && (
                      <button onClick={() => handleSetPrimary(acc.id)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium">Set Primary</button>
                    )}
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

              {/* Method selector */}
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { key: "BANK_TRANSFER", label: "Bank", icon: Building },
                  { key: "MOBILE_MONEY", label: "Mobile Money", icon: Smartphone },
                  { key: "PAYPAL", label: "PayPal", icon: Globe },
                  { key: "CRYPTO", label: "Crypto", icon: Bitcoin },
                  { key: "CASH", label: "Cash", icon: Banknote },
                  { key: "CHECK", label: "Check", icon: CreditCard },
                ].map((m) => (
                  <button key={m.key} onClick={() => setForm((p) => ({ ...p, methodType: m.key }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-colors ${form.methodType === m.key ? "bg-brand-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    <m.icon className="w-5 h-5" />{m.label}
                  </button>
                ))}
              </div>

              <input className="input-field" placeholder="Account label (e.g. Primary, Savings)" value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />

              {/* Bank Transfer fields */}
              {form.methodType === "BANK_TRANSFER" && (
                <div className="grid grid-cols-2 gap-3">
                  <input className="input-field" placeholder="Bank Name" value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} />
                  <input className="input-field" placeholder="Account Holder Name" value={form.accountName} onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))} />
                  <input className="input-field" placeholder="Account Number" value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} />
                  <input className="input-field" placeholder="Routing/Sort Code (optional)" value={form.routingNumber} onChange={(e) => setForm((p) => ({ ...p, routingNumber: e.target.value }))} />
                  <input className="input-field" placeholder="SWIFT/BIC (for intl transfers)" value={form.swiftCode} onChange={(e) => setForm((p) => ({ ...p, swiftCode: e.target.value }))} />
                </div>
              )}

              {/* Mobile Money fields */}
              {form.methodType === "MOBILE_MONEY" && (
                <div className="grid grid-cols-2 gap-3">
                  <select className="input-field" value={form.mobileProvider} onChange={(e) => setForm((p) => ({ ...p, mobileProvider: e.target.value }))}>
                    <option value="">Select Provider</option>
                    {(MOBILE_PROVIDERS[countryCode] || MOBILE_PROVIDERS["NG"]).map((p: string) => <option key={p} value={p}>{p}</option>)}
                    <option value="Other">Other</option>
                  </select>
                  <input className="input-field" placeholder="Mobile Number" value={form.mobileNumber} onChange={(e) => setForm((p) => ({ ...p, mobileNumber: e.target.value }))} />
                  <input className="input-field" placeholder="Account Name" value={form.accountName} onChange={(e) => setForm((p) => ({ ...p, accountName: e.target.value }))} />
                </div>
              )}

              {/* PayPal */}
              {form.methodType === "PAYPAL" && (
                <input className="input-field" type="email" placeholder="PayPal Email" value={form.paypalEmail} onChange={(e) => setForm((p) => ({ ...p, paypalEmail: e.target.value }))} />
              )}

              {/* Crypto */}
              {form.methodType === "CRYPTO" && (
                <div className="grid grid-cols-2 gap-3">
                  <select className="input-field" value={form.cryptoNetwork} onChange={(e) => setForm((p) => ({ ...p, cryptoNetwork: e.target.value }))}>
                    <option value="USDT-TRC20">USDT (TRC-20)</option><option value="USDT-ERC20">USDT (ERC-20)</option>
                    <option value="USDC-ERC20">USDC (ERC-20)</option><option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH)</option><option value="BNB-BSC">BNB (BSC)</option>
                  </select>
                  <input className="input-field" placeholder="Wallet Address" value={form.cryptoAddress} onChange={(e) => setForm((p) => ({ ...p, cryptoAddress: e.target.value }))} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <select className="input-field" value={form.countryCode} onChange={(e) => setForm((p) => ({ ...p, countryCode: e.target.value }))}>
                  <option value="NG">Nigeria</option><option value="KE">Kenya</option><option value="GH">Ghana</option>
                  <option value="ZA">South Africa</option><option value="TZ">Tanzania</option><option value="UG">Uganda</option>
                  <option value="RW">Rwanda</option><option value="CM">Cameroon</option><option value="SN">Senegal</option>
                  <option value="US">United States</option><option value="GB">United Kingdom</option>
                </select>
                <select className="input-field" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}>
                  <option value="NGN">NGN</option><option value="KES">KES</option><option value="GHS">GHS</option>
                  <option value="ZAR">ZAR</option><option value="TZS">TZS</option><option value="UGX">UGX</option>
                  <option value="XOF">XOF</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm((p) => ({ ...p, isPrimary: e.target.checked }))} />
                Set as primary payment account
              </label>

              <div className="flex gap-2">
                <button onClick={handleAddAccount} disabled={loading === "add"} className="btn-primary text-sm">
                  {loading === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Account"}
                </button>
                <button onClick={() => setShowAddAccount(false)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PAYSLIPS TAB */}
      {tab === "payslips" && (
        <div className="space-y-3">
          {payrolls.length === 0 ? (
            <div className="card text-center py-12"><Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No payslips yet. Payments will appear here once processed.</p></div>
          ) : (
            payrolls.map((p: any) => (
              <div key={p.id} className={`card ${p.status === "PAID" ? "border-emerald-200" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${p.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {MONTHS[p.month - 1]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{MONTHS[p.month - 1]} {p.year}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-0.5">
                      <span>Gross: {p.currency} {fmt(p.grossPay)}</span>
                      <span className="text-red-500">Tax: -{fmt(p.taxDeduction)}</span>
                      <span className="text-red-500">Pension: -{fmt(p.pensionDeduction)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-700">{p.currency} {fmt(p.netPay)}</div>
                    <div className="text-[10px] text-gray-400">{p.paidAt ? `Paid ${new Date(p.paidAt).toLocaleDateString()}` : "Pending"}</div>
                  </div>
                </div>
                {p.notes && <p className="text-xs text-gray-400 mt-2 italic">{p.notes}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
