"use client";

import { useState, useRef } from "react";
import { submitPaymentProof, editStudentPayment } from "@/lib/actions/fee-payment";
import { useRouter } from "next/navigation";
import {
  CreditCard, Building2, Upload, Loader2, CheckCircle, Clock, XCircle,
  AlertTriangle, FileText, Image, Copy, Check, Edit2, X, Eye
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
  student, feeStructures, bankAccounts, totalFees, totalPaid, pendingReview, payments, currency,
  feeInstructions = "", feePaymentPolicy = "PERCENTAGE", feePaymentThreshold = 70,
}: {
  student: any; feeStructures: any[]; bankAccounts: any[]; totalFees: number;
  totalPaid: number; pendingReview: number; payments: any[]; currency: string;
  feeInstructions?: string; feePaymentPolicy?: string; feePaymentThreshold?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPayForm, setShowPayForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [proofName, setProofName] = useState("");
  const [copied, setCopied] = useState("");
  const [viewProof, setViewProof] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const balanceDue = Math.max(0, totalFees - totalPaid);
  const paidPercent = totalFees > 0 ? Math.min(100, Math.round((totalPaid / totalFees) * 100)) : 0;
  const fmt = (n: number) => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n); }
    catch (_e) { return `${currency} ${n.toLocaleString()}`; }
  };

  // Form state - auto-fills with balance due
  const [form, setForm] = useState({
    amount: balanceDue > 0 ? balanceDue.toString() : "",
    paymentMethod: "Bank Transfer",
    transactionRef: "",
    proofNote: "",
    description: "School Fee Payment",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("File too large (max 5MB)"); return; }
    setProofName(file.name);
    const reader = new FileReader();
    reader.onload = () => { setProofFile(reader.result as string); setError(""); };
    reader.onerror = () => setError("Failed to read file");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setError("");
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setError("Enter a valid amount"); return; }
    if (!proofFile && !editingPayment) { setError("Please upload proof of payment"); return; }

    setLoading(true);
    try {
      let result;
      if (editingPayment) {
        result = await editStudentPayment(editingPayment.id, {
          amount,
          paymentMethod: form.paymentMethod,
          transactionRef: form.transactionRef || undefined,
          proofBase64: proofFile || undefined,
          proofNote: form.proofNote || undefined,
        });
      } else {
        result = await submitPaymentProof({
          amount, currency,
          paymentMethod: form.paymentMethod,
          transactionRef: form.transactionRef || undefined,
          proofBase64: proofFile || undefined,
          proofNote: form.proofNote || undefined,
          description: form.description,
        });
      }

      if (result.error) {
        setError(result.error);
      } else {
        setShowPayForm(false);
        setEditingPayment(null);
        setForm({ amount: "", paymentMethod: "Bank Transfer", transactionRef: "", proofNote: "", description: "School Fee Payment" });
        setProofFile(null);
        setProofName("");
        router.refresh();
      }
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const startEdit = (payment: any) => {
    setEditingPayment(payment);
    setShowPayForm(true);
    setForm({
      amount: payment.amount.toString(),
      paymentMethod: payment.paymentMethod || "Bank Transfer",
      transactionRef: payment.transactionRef || "",
      proofNote: payment.proofNote || "",
      description: payment.description,
    });
    setProofFile(null);
    setProofName("");
    setError("");
  };

  const cancelForm = () => {
    setShowPayForm(false);
    setEditingPayment(null);
    setForm({ amount: balanceDue > 0 ? balanceDue.toString() : "", paymentMethod: "Bank Transfer", transactionRef: "", proofNote: "", description: "School Fee Payment" });
    setProofFile(null);
    setProofName("");
    setError("");
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const isBase64Image = (url: string) => url && url.startsWith("data:image/");

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <span className="text-xs text-red-700">{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

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

      {/* Fee Policy & Instructions */}
      {!student.feePaid && (feeInstructions || feePaymentPolicy) && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-blue-800">School Fee Information</h3>
          </div>
          <div className="text-[10px] text-blue-700 space-y-1">
            <p>
              {feePaymentPolicy === "FULL"
                ? "📋 This school requires full payment (100%) before you can access classes."
                : feePaymentPolicy === "FLEXIBLE"
                ? "📋 This school allows flexible payments. You can attend classes while paying."
                : `📋 You need to pay at least ${feePaymentThreshold}% of your fees to access classes.`}
            </p>
            {feeInstructions && (
              <div className="bg-white p-2 rounded-lg mt-1 whitespace-pre-wrap">{feeInstructions}</div>
            )}
          </div>
        </div>
      )}

      {/* Pending Review Banner */}
      {pendingReview > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
          <div>
            <p className="text-sm font-medium text-amber-800">{fmt(pendingReview)} payment under review</p>
            <p className="text-xs text-amber-600">The principal is verifying your payment. You can still edit it before approval.</p>
          </div>
        </div>
      )}

      {/* Summary Cards — Paid vs Due */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0">
          <p className="text-[10px] text-brand-200">Total Fees</p>
          <p className="text-xl font-bold mt-1">{fmt(totalFees)}</p>
          <p className="text-[10px] text-brand-300 mt-0.5">{student.gradeLevel}</p>
        </div>
        <div className="card border-emerald-200">
          <p className="text-[10px] text-emerald-600 font-medium">✓ Paid</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{fmt(totalPaid)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{paidPercent}% of total</p>
        </div>
        <div className="card border-amber-200">
          <p className="text-[10px] text-amber-600 font-medium">⏳ Pending</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{fmt(pendingReview)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Awaiting approval</p>
        </div>
        <div className={`card ${balanceDue > 0 ? "border-red-300 bg-red-50/50" : "border-emerald-300 bg-emerald-50/50"}`}>
          <p className={`text-[10px] font-medium ${balanceDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {balanceDue > 0 ? "⚠ Due Balance" : "✓ Cleared"}
          </p>
          <p className={`text-xl font-bold mt-1 ${balanceDue > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(balanceDue)}</p>
          {balanceDue <= 0 && <p className="text-[10px] text-emerald-500 mt-0.5">All fees paid</p>}
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
        <div className="flex justify-between mt-1 text-[10px]">
          <span className="text-emerald-600">Paid: {fmt(totalPaid)}</span>
          {balanceDue > 0 && <span className="text-red-600">Remaining: {fmt(balanceDue)}</span>}
        </div>
      </div>

      {/* Fee Breakdown */}
      {feeStructures.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Fee Breakdown</h3>
          <div className="space-y-2">
            {feeStructures.map((fs: any, idx: number) => (
              <div key={idx}>
                {feeStructures.length > 1 && (
                  <p className="text-[10px] font-bold text-gray-500 mb-1">{fs.term?.replace("_", " ")}</p>
                )}
                {[
                  { label: "Tuition Fee", amount: fs.tuitionFee },
                  { label: "Registration Fee", amount: fs.registrationFee },
                  { label: "Exam Fee", amount: fs.examFee },
                  { label: "Technology Fee", amount: fs.technologyFee },
                ].filter(f => f.amount > 0).map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-xs text-gray-600">{f.label}</span>
                    <span className="text-sm font-medium text-gray-800">{fmt(f.amount)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="flex items-center justify-between py-2 bg-brand-50 -mx-4 px-4 rounded-lg mt-2">
              <span className="text-sm font-bold text-brand-800">Total</span>
              <span className="text-lg font-bold text-brand-800">{fmt(totalFees)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bank Accounts */}
      {bankAccounts.length > 0 && balanceDue > 0 && (
        <div className="card border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-800">Payment Accounts</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">Send your payment to any of the accounts below, then upload proof.</p>
          <div className="space-y-3">
            {bankAccounts.map((acc: any) => (
              <div key={acc.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-blue-800">{acc.bankName}</h4>
                  <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-medium">{acc.currency} • {acc.country}</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: "Account Name", value: acc.accountName, key: `name-${acc.id}` },
                    { label: "Account Number", value: acc.accountNumber, key: `num-${acc.id}`, mono: true },
                    ...(acc.routingNumber ? [{ label: "Routing/Sort Code", value: acc.routingNumber, key: `rt-${acc.id}`, mono: true }] : []),
                    ...(acc.swiftCode ? [{ label: "SWIFT/BIC", value: acc.swiftCode, key: `sw-${acc.id}`, mono: true }] : []),
                  ].map((field: any) => (
                    <div key={field.key} className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">{field.label}</span>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs ${field.mono ? "font-mono font-bold" : "font-medium"} text-gray-800`}>{field.value}</span>
                        <button onClick={() => copyText(field.value, field.key)} className="text-blue-500 hover:text-blue-700">
                          {copied === field.key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {acc.instructions && (
                  <p className="text-[10px] text-blue-600 mt-2 italic bg-white p-2 rounded">📋 {acc.instructions}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay / Upload Button */}
      {balanceDue > 0 && !showPayForm && (
        <button onClick={() => { setShowPayForm(true); setEditingPayment(null); setForm({ ...form, amount: balanceDue.toString() }); }}
          className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2">
          <Upload className="w-5 h-5" /> I&apos;ve Paid — Upload Proof
        </button>
      )}

      {/* Payment Submission / Edit Form */}
      {showPayForm && (
        <div className="card border-2 border-brand-300 bg-brand-50/30">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-600" />
            {editingPayment ? "Edit Payment Details" : "Submit Payment Proof"}
          </h3>
          <div className="space-y-4">
            {/* Quick amount buttons */}
            {!editingPayment && balanceDue > 0 && (
              <div>
                <label className="text-[10px] font-medium text-gray-600 mb-1 block">Quick Amount</label>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setForm({ ...form, amount: balanceDue.toString() })}
                    className={`text-[10px] px-3 py-1.5 rounded-lg font-medium transition ${form.amount === balanceDue.toString() ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    Full Balance: {fmt(balanceDue)}
                  </button>
                  {balanceDue > 100 && (
                    <button onClick={() => setForm({ ...form, amount: Math.round(balanceDue / 2).toString() })}
                      className="text-[10px] px-3 py-1.5 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
                      Half: {fmt(Math.round(balanceDue / 2))}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-gray-600">Amount Paid *</label>
                <div className="flex items-center gap-0 mt-1">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-2.5 rounded-l-lg border border-r-0 border-gray-300">{currency}</span>
                  <input type="number" step="0.01" min="0"
                    className="input-field rounded-l-none flex-1" placeholder="0.00"
                    value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                {form.amount && parseFloat(form.amount) > 0 && (
                  <p className="text-[10px] mt-1 text-gray-500">
                    After this: {fmt(Math.max(0, balanceDue - parseFloat(form.amount)))} remaining
                  </p>
                )}
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
              <input className="input-field mt-1" placeholder="e.g. TRX-12345678"
                value={form.transactionRef} onChange={(e) => setForm({ ...form, transactionRef: e.target.value })} />
            </div>

            {/* File Upload */}
            <div>
              <label className="text-[10px] font-medium text-gray-600">
                Proof of Payment {editingPayment ? "(upload new to replace)" : "*"} — receipt, screenshot, or bank statement
              </label>
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
                    <p className="text-xs text-gray-500">Click to upload proof (image or PDF, max 5MB)</p>
                  </div>
                )}
              </button>
              {/* Preview */}
              {proofFile && isBase64Image(proofFile) && (
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 max-h-40">
                  <img src={proofFile} alt="Proof preview" className="w-full object-contain max-h-40" />
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-medium text-gray-600">Note (optional)</label>
              <textarea className="input-field mt-1" rows={2} placeholder="Any additional details..."
                value={form.proofNote} onChange={(e) => setForm({ ...form, proofNote: e.target.value })} />
            </div>

            <div className="flex gap-2">
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> {editingPayment ? "Update Payment" : "Submit for Review"}</>}
              </button>
              <button onClick={cancelForm} disabled={loading} className="btn-ghost px-4">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      {viewProof && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setViewProof(null)}>
          <div className="relative max-w-2xl max-h-[80vh] bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewProof(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center z-10">
              <X className="w-4 h-4" />
            </button>
            {isBase64Image(viewProof) ? (
              <img src={viewProof} alt="Payment proof" className="max-w-full max-h-[75vh] object-contain" />
            ) : (
              <div className="p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">PDF proof uploaded</p>
              </div>
            )}
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
                <div key={p.id} className={`p-3 rounded-xl ${p.status === "UNDER_REVIEW" ? "bg-amber-50 border border-amber-100" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${info.color}`}>
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
                        <p className="text-[10px] text-red-600 mt-1">❌ Rejected: {p.rejectedReason}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-800">{fmt(p.amount)}</p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        {p.proofUrl && (
                          <button onClick={() => setViewProof(p.proofUrl)} className="text-[10px] text-brand-600 hover:underline flex items-center gap-0.5">
                            <Eye className="w-3 h-3" /> Proof
                          </button>
                        )}
                        {p.status === "UNDER_REVIEW" && (
                          <button onClick={() => startEdit(p)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 ml-1">
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* No Fee Structure */}
      {feeStructures.length === 0 && (
        <div className="card text-center py-8 border-amber-200 bg-amber-50">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-amber-800">Fee Structure Not Set</h3>
          <p className="text-xs text-amber-600 mt-1">The school has not set fees for your grade level yet. Contact the school administration.</p>
        </div>
      )}
    </div>
  );
}
