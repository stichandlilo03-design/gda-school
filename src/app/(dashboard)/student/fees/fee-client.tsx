"use client";

import { useState, useRef } from "react";
import { submitPaymentProof } from "@/lib/actions/fee-payment";
import { useRouter } from "next/navigation";
import {
  CreditCard, Building2, Upload, Loader2, CheckCircle, Clock, XCircle,
  AlertTriangle, FileText, Image, ChevronDown, ChevronUp, Copy, Check
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "bg-gray-100 text-gray-600", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", color: "bg-amber-100 text-amber-700", icon: Clock },
  COMPLETED: { label: "Approved", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700", icon: XCircle },
  REFUNDED: { label: "Refunded", color: "bg-blue-100 text-blue-700", icon: CreditCard },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function StudentFeeClient({
  student, feeStructure, bankAccounts, totalFees, totalPaid, pendingReview, payments, currency,
}: {
  student: any; feeStructure: any; bankAccounts: any[]; totalFees: number;
  totalPaid: number; pendingReview: number; payments: any[]; currency: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [proofName, setProofName] = useState("");
  const [copied, setCopied] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    amount: "", paymentMethod: "Bank Transfer", transactionRef: "", proofNote: "", description: "School Fee Payment",
  });

  const balance = totalFees - totalPaid;
  const paidPercent = totalFees > 0 ? Math.min(100, Math.round((totalPaid / totalFees) * 100)) : 0;
  const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("File too large (max 10MB)"); return; }
    setProofName(file.name);
    const reader = new FileReader();
    reader.onload = () => setProofFile(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { alert("Enter a valid amount"); return; }
    if (!proofFile) { alert("Please upload proof of payment"); return; }
    setLoading(true);
    const result = await submitPaymentProof({
      amount, currency, paymentMethod: form.paymentMethod,
      transactionRef: form.transactionRef || undefined,
      proofBase64: proofFile || undefined,
      proofNote: form.proofNote || undefined,
      description: form.description,
    });
    if (result.error) alert(result.error);
    else { setShowPayForm(false); setForm({ amount: "", paymentMethod: "Bank Transfer", transactionRef: "", proofNote: "", description: "School Fee Payment" }); setProofFile(null); setProofName(""); router.refresh(); }
    setLoading(false);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Fee Paid Banner */}
      {student.feePaid && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Fees Fully Paid!</p>
            <p className="text-xs text-emerald-600">You have full access to all your classes and materials.</p>
          </div>
        </div>
      )}

      {/* Pending Review Banner */}
      {pendingReview > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
          <div>
            <p className="text-sm font-medium text-amber-800">{fmt(pendingReview)} payment under review</p>
            <p className="text-xs text-amber-600">The principal is verifying your payment. You&apos;ll be notified once approved.</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0">
          <p className="text-[10px] text-brand-200">Total Fees</p>
          <p className="text-xl font-bold mt-1">{fmt(totalFees)}</p>
          <p className="text-[10px] text-brand-300 mt-0.5">{student.gradeLevel} • {feeStructure?.term?.replace("_", " ") || "Current Term"}</p>
        </div>
        <div className="card">
          <p className="text-[10px] text-gray-500">Paid</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{fmt(totalPaid)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{paidPercent}% complete</p>
        </div>
        <div className="card">
          <p className="text-[10px] text-gray-500">Under Review</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{fmt(pendingReview)}</p>
        </div>
        <div className={`card ${balance > 0 ? "border-red-200" : "border-emerald-200"}`}>
          <p className="text-[10px] text-gray-500">Balance</p>
          <p className={`text-xl font-bold mt-1 ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(balance)}</p>
          {balance <= 0 && <p className="text-[10px] text-emerald-500 mt-0.5">✓ Fully paid</p>}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800">Payment Progress</h3>
          <span className="text-xs text-gray-500">{paidPercent}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all" style={{ width: `${paidPercent}%` }} />
        </div>
      </div>

      {/* Fee Breakdown */}
      {feeStructure && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Fee Breakdown</h3>
          <div className="space-y-2">
            {[
              { label: "Tuition Fee", amount: feeStructure.tuitionFee },
              { label: "Registration Fee", amount: feeStructure.registrationFee },
              { label: "Exam Fee", amount: feeStructure.examFee },
              { label: "Technology Fee", amount: feeStructure.technologyFee },
            ].filter(f => f.amount > 0).map((f, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-xs text-gray-600">{f.label}</span>
                <span className="text-sm font-medium text-gray-800">{fmt(f.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2 bg-brand-50 -mx-4 px-4 rounded-lg mt-2">
              <span className="text-sm font-bold text-brand-800">Total</span>
              <span className="text-lg font-bold text-brand-800">{fmt(totalFees)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bank Accounts — where to pay */}
      {bankAccounts.length > 0 && balance > 0 && (
        <div className="card border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">Payment Accounts</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Send your payment to any of the accounts below, then upload your proof of payment.</p>
          <div className="space-y-3">
            {bankAccounts.map((acc) => (
              <div key={acc.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-blue-800">{acc.bankName}</h4>
                  <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-medium">{acc.currency} • {acc.country}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">Account Name</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-gray-800">{acc.accountName}</span>
                      <button onClick={() => copyText(acc.accountName, `name-${acc.id}`)} className="text-blue-500 hover:text-blue-700">
                        {copied === `name-${acc.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">Account Number</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono font-bold text-gray-800">{acc.accountNumber}</span>
                      <button onClick={() => copyText(acc.accountNumber, `num-${acc.id}`)} className="text-blue-500 hover:text-blue-700">
                        {copied === `num-${acc.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  {acc.routingNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">Routing/Sort Code</span>
                      <span className="text-xs font-mono text-gray-800">{acc.routingNumber}</span>
                    </div>
                  )}
                  {acc.swiftCode && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">SWIFT/BIC</span>
                      <span className="text-xs font-mono text-gray-800">{acc.swiftCode}</span>
                    </div>
                  )}
                </div>
                {acc.instructions && (
                  <p className="text-[10px] text-blue-600 mt-2 italic bg-white p-2 rounded">📋 {acc.instructions}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay Button */}
      {balance > 0 && (
        <button onClick={() => setShowPayForm(!showPayForm)}
          className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2">
          <Upload className="w-5 h-5" /> {showPayForm ? "Cancel" : "I've Paid — Upload Proof"}
        </button>
      )}

      {/* Payment Submission Form */}
      {showPayForm && (
        <div className="card border-2 border-brand-300 bg-brand-50/30">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-600" /> Submit Payment Proof
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-gray-600">Amount Paid *</label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-2.5 rounded-l-lg border border-r-0 border-gray-300">{currency}</span>
                  <input type="number" step="0.01" className="input-field rounded-l-none flex-1" placeholder="0.00"
                    value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-600">Payment Method *</label>
                <select className="input-field mt-1" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  <option>Bank Transfer</option>
                  <option>Mobile Money</option>
                  <option>Card Payment</option>
                  <option>Cash Deposit</option>
                  <option>Online Payment</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-gray-600">Transaction Reference</label>
              <input className="input-field mt-1" placeholder="e.g. TRX-12345678" value={form.transactionRef} onChange={(e) => setForm({ ...form, transactionRef: e.target.value })} />
            </div>

            {/* File Upload */}
            <div>
              <label className="text-[10px] font-medium text-gray-600">Proof of Payment * (receipt, screenshot, or bank statement)</label>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
              <button onClick={() => fileRef.current?.click()}
                className={`mt-1 w-full p-4 border-2 border-dashed rounded-xl text-center transition-colors ${proofFile ? "border-emerald-300 bg-emerald-50" : "border-gray-300 hover:border-brand-300 hover:bg-brand-50"}`}>
                {proofFile ? (
                  <div className="flex items-center justify-center gap-2">
                    {proofName.endsWith(".pdf") ? <FileText className="w-5 h-5 text-red-500" /> : <Image className="w-5 h-5 text-emerald-500" />}
                    <span className="text-xs font-medium text-gray-700">{proofName}</span>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Click to upload proof (image or PDF, max 10MB)</p>
                  </div>
                )}
              </button>
            </div>

            <div>
              <label className="text-[10px] font-medium text-gray-600">Note (optional)</label>
              <textarea className="input-field mt-1" rows={2} placeholder="Any additional details..." value={form.proofNote} onChange={(e) => setForm({ ...form, proofNote: e.target.value })} />
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Submit for Review</>}
            </button>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No payments recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p: any) => {
              const info = STATUS_MAP[p.status] || STATUS_MAP.PENDING;
              const Icon = info.icon;
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${info.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-gray-800">{p.description}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${info.color}`}>{info.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-0.5">
                      <span>{p.paymentMethod}</span>
                      {p.transactionRef && <span className="font-mono">{p.transactionRef}</span>}
                      <span>{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</span>
                    </div>
                    {p.status === "REJECTED" && p.rejectedReason && (
                      <p className="text-[10px] text-red-600 mt-1">❌ {p.rejectedReason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{fmt(p.amount)}</p>
                    {p.proofUrl && (
                      <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-600 hover:underline">View proof</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* No Fee Structure */}
      {!feeStructure && (
        <div className="card text-center py-8 border-amber-200 bg-amber-50">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-amber-800">Fee Structure Not Set</h3>
          <p className="text-xs text-amber-600 mt-1">The school has not set fees for your grade level yet. Contact the school administration.</p>
        </div>
      )}
    </div>
  );
}
