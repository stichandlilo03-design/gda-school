"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { parentSubmitPayment } from "@/lib/actions/fee-payment";
import {
  CreditCard, Building2, Upload, Loader2, CheckCircle, Clock, XCircle,
  ChevronDown, ChevronUp, Copy, Check, Eye, Image,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-gray-100 text-gray-600" },
  UNDER_REVIEW: { label: "Under Review", color: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  APPROVED: { label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" },
};

export default function ParentFeeClient({ parent, feeStructures, bankAccounts }: {
  parent: any; feeStructures: any[]; bankAccounts: any[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState<string | null>(parent.children[0]?.studentId || null);
  const [payingFor, setPayingFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");
  const [viewProof, setViewProof] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: "", method: "Bank Transfer", ref: "", note: "", proof: "" });

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text); setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMessage("Error: File too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => setForm(p => ({ ...p, proof: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handlePay = async (studentId: string, currency: string) => {
    if (!form.amount || Number(form.amount) <= 0) { setMessage("Error: Enter a valid amount"); return; }
    setLoading(true); setMessage("");
    const r = await parentSubmitPayment({
      studentId, amount: Number(form.amount), currency, paymentMethod: form.method,
      transactionRef: form.ref, proofBase64: form.proof, proofNote: form.note,
      description: `Fee payment`,
    });
    if (r.error) setMessage("Error: " + r.error);
    else { setMessage("✅ Payment submitted for review!"); setPayingFor(null); setForm({ amount: "", method: "Bank Transfer", ref: "", note: "", proof: "" }); router.refresh(); }
    setLoading(false);
  };

  const fmt = (n: number, c: string) => { try { return new Intl.NumberFormat("en", { style: "currency", currency: c }).format(n); } catch { return `${c} ${n.toLocaleString()}`; } };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-xl text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message} <button onClick={() => setMessage("")} className="float-right">✕</button>
        </div>
      )}

      {/* Proof viewer modal */}
      {viewProof && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setViewProof(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold">Payment Proof</h3>
              <button onClick={() => setViewProof(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <img src={viewProof} alt="Proof" className="w-full rounded-lg" />
          </div>
        </div>
      )}

      {parent.children.length === 0 && (
        <div className="card text-center py-12"><p className="text-sm text-gray-500">Link your children to see their fee status</p></div>
      )}

      {parent.children.map((link: any) => {
        const child = link.student;
        if (!child) return null;
        const isExp = expanded === link.studentId;
        const currency = child.school?.currency || "USD";
        const schoolId = child.school?.id;
        const payments = child.payments || [];

        // Calculate fees for this child's grade
        const childFees = feeStructures.filter((f: any) =>
          f.schoolId === schoolId && f.schoolGrade?.gradeLevel === child.gradeLevel
        );
        const totalFees = childFees.reduce((s: number, f: any) =>
          s + (f.tuitionFee || 0) + (f.registrationFee || 0) + (f.examFee || 0) + (f.technologyFee || 0), 0
        );
        const approvedPayments = payments.filter((p: any) => p.status === "COMPLETED" || p.status === "APPROVED");
        const totalPaid = approvedPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
        const pendingReview = payments.filter((p: any) => p.status === "UNDER_REVIEW").reduce((s: number, p: any) => s + (p.amount || 0), 0);
        const balanceDue = Math.max(0, totalFees - totalPaid);
        const paidPercent = totalFees > 0 ? Math.min(100, Math.round((totalPaid / totalFees) * 100)) : 0;
        const childBankAccounts = bankAccounts.filter((b: any) => b.schoolId === schoolId);

        return (
          <div key={link.id} className="card border-l-4 border-l-amber-400">
            {/* Header */}
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExp ? null : link.studentId)}>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg font-bold">
                {child.user?.name?.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold">{child.user?.name}</h3>
                <p className="text-[10px] text-gray-500">{child.school?.name} · {child.gradeLevel}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-3 py-1 rounded-xl ${balanceDue > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {balanceDue > 0 ? `${fmt(balanceDue, currency)} due` : "✅ Cleared"}
                </span>
              </div>
              {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>

            {isExp && (
              <div className="mt-4 pt-4 border-t space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 bg-brand-50 rounded-xl text-center">
                    <p className="text-[9px] text-brand-600 font-medium">Total Fees</p>
                    <p className="text-sm font-bold text-brand-700">{fmt(totalFees, currency)}</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-center">
                    <p className="text-[9px] text-emerald-600 font-medium">✓ Paid</p>
                    <p className="text-sm font-bold text-emerald-700">{fmt(totalPaid, currency)}</p>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-xl text-center">
                    <p className="text-[9px] text-amber-600 font-medium">⏳ Pending</p>
                    <p className="text-sm font-bold text-amber-700">{fmt(pendingReview, currency)}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl text-center ${balanceDue > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
                    <p className={`text-[9px] font-medium ${balanceDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {balanceDue > 0 ? "⚠ Outstanding" : "✓ Cleared"}
                    </p>
                    <p className={`text-sm font-bold ${balanceDue > 0 ? "text-red-700" : "text-emerald-700"}`}>{fmt(balanceDue, currency)}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="bg-gray-50 p-3 rounded-xl">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-gray-600">Payment Progress</span><span className="font-bold">{paidPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all" style={{ width: `${paidPercent}%` }} />
                  </div>
                </div>

                {/* Fee Breakdown */}
                {childFees.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-600 mb-2">📋 Fee Breakdown</p>
                    {childFees.map((fs: any, i: number) => (
                      <div key={i} className="mb-2">
                        <p className="text-[9px] text-gray-400 font-bold mb-1">{fs.term?.replace("_", " ")}</p>
                        {[{ l: "Tuition", a: fs.tuitionFee }, { l: "Registration", a: fs.registrationFee }, { l: "Exam", a: fs.examFee }, { l: "Technology", a: fs.technologyFee }]
                          .filter(f => f.a > 0).map((f, j) => (
                            <div key={j} className="flex justify-between py-0.5 text-[10px]">
                              <span className="text-gray-500">{f.l}</span><span className="font-medium">{fmt(f.a, currency)}</span>
                            </div>
                          ))}
                      </div>
                    ))}
                    <div className="flex justify-between py-1.5 border-t border-gray-200 text-xs font-bold">
                      <span>Total</span><span>{fmt(totalFees, currency)}</span>
                    </div>
                  </div>
                )}

                {/* School Bank Accounts */}
                {childBankAccounts.length > 0 && balanceDue > 0 && (
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <p className="text-[10px] font-bold text-blue-800">School Payment Accounts</p>
                    </div>
                    <p className="text-[9px] text-blue-600 mb-2">Send payment to any account below, then upload proof.</p>
                    {childBankAccounts.map((acc: any) => (
                      <div key={acc.id} className="p-3 bg-white rounded-lg border border-blue-100 mb-2 last:mb-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] font-bold text-blue-800">{acc.bankName}</span>
                          <span className="text-[8px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">{acc.currency} · {acc.country}</span>
                        </div>
                        {[
                          { l: "Account Name", v: acc.accountName, k: `an-${acc.id}` },
                          { l: "Account Number", v: acc.accountNumber, k: `num-${acc.id}`, mono: true },
                          ...(acc.routingNumber ? [{ l: "Routing/Sort", v: acc.routingNumber, k: `rt-${acc.id}`, mono: true }] : []),
                          ...(acc.swiftCode ? [{ l: "SWIFT", v: acc.swiftCode, k: `sw-${acc.id}`, mono: true }] : []),
                        ].map((f: any) => (
                          <div key={f.k} className="flex justify-between py-0.5 text-[10px]">
                            <span className="text-gray-400">{f.l}</span>
                            <div className="flex items-center gap-1">
                              <span className={`${f.mono ? "font-mono font-bold" : "font-medium"} text-gray-800`}>{f.v}</span>
                              <button onClick={() => copyText(f.v, f.k)} className="text-blue-500"><span className="text-[9px]">{copied === f.k ? "✓" : "📋"}</span></button>
                            </div>
                          </div>
                        ))}
                        {acc.instructions && <p className="text-[9px] text-blue-600 mt-1 italic">📋 {acc.instructions}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Fee Instructions */}
                {child.school?.feeInstructions && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-[10px] font-bold text-amber-700 mb-1">📢 School Fee Instructions</p>
                    <p className="text-[10px] text-amber-600">{child.school.feeInstructions}</p>
                  </div>
                )}

                {/* Pay Button */}
                {balanceDue > 0 && payingFor !== link.studentId && (
                  <button onClick={() => { setPayingFor(link.studentId); setForm(p => ({ ...p, amount: balanceDue.toString() })); }}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90">
                    <Upload className="w-4 h-4" /> Pay on Behalf of {child.user?.name?.split(" ")[0]}
                  </button>
                )}

                {/* Payment Form */}
                {payingFor === link.studentId && (
                  <div className="p-4 bg-rose-50 rounded-xl border-2 border-rose-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-rose-800">💳 Submit Payment</h4>
                      <button onClick={() => setPayingFor(null)} className="text-xs text-gray-400">Cancel</button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><label className="label">Amount *</label><input type="number" className="input-field bg-white" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
                      <div><label className="label">Payment Method</label>
                        <select className="input-field bg-white" value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}>
                          {["Bank Transfer", "Mobile Money", "Cash Deposit", "Online Transfer", "Card Payment"].map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><label className="label">Transaction Reference</label><input className="input-field bg-white" placeholder="e.g. TRF-123456" value={form.ref} onChange={e => setForm(p => ({ ...p, ref: e.target.value }))} /></div>
                    <div><label className="label">Note (optional)</label><input className="input-field bg-white" placeholder="Any details..." value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} /></div>
                    <div>
                      <label className="label">Upload Proof (receipt/screenshot)</label>
                      <input type="file" ref={fileRef} accept="image/*,.pdf" className="hidden" onChange={handleFile} />
                      <button onClick={() => fileRef.current?.click()} className="w-full p-3 border-2 border-dashed border-rose-300 rounded-xl text-xs text-rose-600 hover:bg-rose-100 flex items-center justify-center gap-2">
                        {form.proof ? <><CheckCircle className="w-4 h-4" /> Proof uploaded ✓ (click to change)</> : <><Image className="w-4 h-4" /> Click to upload proof</>}
                      </button>
                    </div>
                    <button onClick={() => handlePay(link.studentId, currency)} disabled={loading}
                      className="w-full py-3 bg-rose-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-rose-700 disabled:opacity-50">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {loading ? "Submitting..." : "Submit Payment for Review"}
                    </button>
                  </div>
                )}

                {/* Payment History */}
                <div>
                  <p className="text-[10px] font-bold text-gray-600 mb-2">📜 Payment History</p>
                  {payments.length === 0 ? (
                    <p className="text-[10px] text-gray-400 text-center py-3">No payments yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {payments.map((p: any) => {
                        const st = STATUS_MAP[p.status] || { label: p.status, color: "bg-gray-100 text-gray-600" };
                        return (
                          <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-[10px]">
                            <div>
                              <span className="font-medium">{p.description || "Payment"}</span>
                              <span className="text-gray-400 ml-2">{new Date(p.createdAt).toLocaleDateString()}</span>
                              {p.paymentMethod && <span className="text-gray-400 ml-1">· {p.paymentMethod}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {p.proofUrl && (
                                <button onClick={() => setViewProof(p.proofUrl)} className="text-blue-500 hover:text-blue-700"><Eye className="w-3 h-3" /></button>
                              )}
                              <span className="font-bold">{fmt(p.amount, currency)}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${st.color}`}>{st.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
