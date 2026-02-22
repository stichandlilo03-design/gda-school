"use client";

import { useState } from "react";
import { approvePayment, rejectPayment, principalEditPayment } from "@/lib/actions/fee-payment";
import { useRouter } from "next/navigation";
import {
  CheckCircle, XCircle, Clock, Loader2, Search, CreditCard, FileText,
  Edit2, X, DollarSign, Eye, Save
} from "lucide-react";

export default function PaymentReviewer({
  pending, approved, rejected, totalCollected, totalPending, currency,
}: {
  pending: any[]; approved: any[]; rejected: any[];
  totalCollected: number; totalPending: number; currency: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [tab, setTab] = useState<string>(pending.length > 0 ? "pending" : "approved");
  const [search, setSearch] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", paymentMethod: "", transactionRef: "", proofNote: "" });
  const [viewProof, setViewProof] = useState<string | null>(null);

  const fmt = (n: number) => {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n); }
    catch (_e) { return `${currency} ${n.toLocaleString()}`; }
  };

  const current = tab === "pending" ? pending : tab === "approved" ? approved : rejected;
  const filtered = current.filter((p: any) =>
    !search || p.student.user.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.transactionRef || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this payment?")) return;
    setLoading("app-" + id);
    const res = await approvePayment(id);
    if (res.error) alert(res.error);
    router.refresh();
    setLoading("");
  };

  const handleReject = async (id: string) => {
    if (!rejectReason) { alert("Enter a reason"); return; }
    setLoading("rej-" + id);
    const res = await rejectPayment(id, rejectReason);
    if (res.error) alert(res.error);
    setRejectId(null); setRejectReason("");
    router.refresh();
    setLoading("");
  };

  const startEdit = (p: any) => {
    setEditId(p.id);
    setEditForm({
      amount: p.amount.toString(),
      paymentMethod: p.paymentMethod || "Bank Transfer",
      transactionRef: p.transactionRef || "",
      proofNote: p.proofNote || "",
    });
  };

  const handleSaveEdit = async (id: string) => {
    const amount = parseFloat(editForm.amount);
    if (!amount || amount <= 0) { alert("Enter a valid amount"); return; }
    setLoading("edit-" + id);
    const res = await principalEditPayment(id, {
      amount,
      paymentMethod: editForm.paymentMethod,
      transactionRef: editForm.transactionRef || undefined,
      proofNote: editForm.proofNote || undefined,
    });
    if (res.error) alert(res.error);
    setEditId(null);
    router.refresh();
    setLoading("");
  };

  const isBase64Image = (url: string) => url && url.startsWith("data:image/");

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <DollarSign className="w-5 h-5 text-emerald-200 mb-1" />
          <p className="text-2xl font-bold">{fmt(totalCollected)}</p>
          <p className="text-[10px] text-emerald-200">Total Collected</p>
        </div>
        <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <Clock className="w-5 h-5 text-amber-200 mb-1" />
          <p className="text-2xl font-bold">{fmt(totalPending)}</p>
          <p className="text-[10px] text-amber-200">Pending Review ({pending.length})</p>
        </div>
        <div className="card">
          <CreditCard className="w-5 h-5 text-gray-400 mb-1" />
          <p className="text-2xl font-bold text-gray-800">{pending.length + approved.length + rejected.length}</p>
          <p className="text-[10px] text-gray-500">Total Transactions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5">
          {[
            { key: "pending", label: `Pending (${pending.length})`, alert: pending.length > 0 },
            { key: "approved", label: `Approved (${approved.length})` },
            { key: "rejected", label: `Rejected (${rejected.length})` },
          ].map((t: any) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`text-xs px-3.5 py-2 rounded-lg font-medium ${tab === t.key
                ? "bg-brand-600 text-white"
                : t.alert ? "bg-amber-100 text-amber-700 animate-pulse" : "bg-gray-100 text-gray-600"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3 w-60">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input className="flex-1 py-2 text-xs outline-none" placeholder="Search student or ref..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Proof Viewer Modal */}
      {viewProof && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setViewProof(null)}>
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewProof(null)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center z-10">
              <X className="w-4 h-4" />
            </button>
            {isBase64Image(viewProof) ? (
              <img src={viewProof} alt="Payment proof" className="max-w-full max-h-[80vh] object-contain" />
            ) : viewProof.startsWith("data:application/pdf") ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-red-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">PDF proof uploaded</p>
                <p className="text-xs text-gray-400">PDF preview not available — the student uploaded a PDF receipt.</p>
              </div>
            ) : (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">Proof uploaded</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payments */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No payments in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p: any) => (
            <div key={p.id} className={`card ${p.status === "UNDER_REVIEW" ? "border-amber-200 bg-amber-50/30" : ""}`}>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {p.student.user.image ? (
                  <img src={p.student.user.image} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {p.student.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-gray-800">{p.student.user.name}</h4>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{p.student.gradeLevel}</span>
                    {p.student.user.countryCode && <span className="text-[10px] text-gray-400">{p.student.user.countryCode}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5 flex-wrap">
                    <span>{p.paymentMethod}</span>
                    {p.transactionRef && <span className="font-mono bg-gray-100 px-1 rounded">{p.transactionRef}</span>}
                    <span>{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</span>
                  </div>
                  {p.proofNote && <p className="text-[10px] text-gray-600 mt-1 italic">💬 {p.proofNote}</p>}
                  {p.rejectedReason && <p className="text-[10px] text-red-600 mt-1">❌ Rejected: {p.rejectedReason}</p>}
                </div>

                {/* Amount + Proof */}
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-gray-800">{p.currency} {p.amount.toLocaleString()}</p>
                  {p.proofUrl && (
                    <button onClick={() => setViewProof(p.proofUrl)} className="text-[10px] text-brand-600 hover:underline flex items-center gap-0.5 justify-end mt-0.5">
                      <Eye className="w-3 h-3" /> View Proof
                    </button>
                  )}
                  {!p.proofUrl && <p className="text-[10px] text-gray-400">No proof</p>}
                </div>

                {/* Actions for pending */}
                {p.status === "UNDER_REVIEW" && editId !== p.id && (
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => handleApprove(p.id)} disabled={loading === "app-" + p.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 flex items-center gap-1">
                      {loading === "app-" + p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Approve
                    </button>
                    <button onClick={() => startEdit(p)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 flex items-center gap-1">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => setRejectId(rejectId === p.id ? null : p.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-medium hover:bg-red-100 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Edit Form */}
              {editId === p.id && (
                <div className="mt-3 pt-3 border-t p-3 bg-blue-50 rounded-lg space-y-3">
                  <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1"><Edit2 className="w-3 h-3" /> Edit Payment Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500">Amount</label>
                      <input type="number" step="0.01" className="input-field text-xs" value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">Payment Method</label>
                      <select className="input-field text-xs" value={editForm.paymentMethod}
                        onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}>
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
                    <label className="text-[10px] text-gray-500">Transaction Ref</label>
                    <input className="input-field text-xs" value={editForm.transactionRef}
                      onChange={(e) => setEditForm({ ...editForm, transactionRef: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Note</label>
                    <input className="input-field text-xs" value={editForm.proofNote}
                      onChange={(e) => setEditForm({ ...editForm, proofNote: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(p.id)} disabled={loading === "edit-" + p.id}
                      className="text-xs px-4 py-1.5 rounded-lg bg-blue-600 text-white font-medium flex items-center gap-1">
                      {loading === "edit-" + p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save Changes
                    </button>
                    <button onClick={() => setEditId(null)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">Cancel</button>
                  </div>
                </div>
              )}

              {/* Reject Form */}
              {rejectId === p.id && (
                <div className="mt-3 pt-3 border-t p-3 bg-red-50 rounded-lg space-y-2">
                  <input className="input-field text-xs" placeholder="Reason for rejection *"
                    value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={() => handleReject(p.id)} disabled={loading === "rej-" + p.id || !rejectReason}
                      className="text-xs px-4 py-1.5 rounded-lg bg-red-600 text-white font-medium">
                      {loading === "rej-" + p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reject Payment"}
                    </button>
                    <button onClick={() => { setRejectId(null); setRejectReason(""); }} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
