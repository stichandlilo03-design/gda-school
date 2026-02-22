"use client";

import { useState } from "react";
import { addBankAccount, updateBankAccount, deleteBankAccount } from "@/lib/actions/bank-account";
import { useRouter } from "next/navigation";
import { Plus, Building2, Loader2, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight } from "lucide-react";

const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "KES", "GHS", "ZAR", "TZS", "UGX", "EGP", "MAD", "XOF", "XAF", "INR"];
const COUNTRIES = [
  "Nigeria", "Kenya", "Ghana", "South Africa", "Tanzania", "Uganda", "Egypt", "Morocco",
  "Senegal", "Cameroon", "India", "United States", "United Kingdom", "Germany", "France",
];

const EMPTY = { accountName: "", bankName: "", accountNumber: "", routingNumber: "", swiftCode: "", currency: "USD", country: "Nigeria", instructions: "" };

export default function BankAccountManager({ accounts }: { accounts: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  const handleAdd = async () => {
    if (!form.accountName || !form.bankName || !form.accountNumber) { alert("Fill required fields"); return; }
    setLoading("add");
    await addBankAccount(form);
    setShowAdd(false); setForm(EMPTY); router.refresh(); setLoading("");
  };

  const handleUpdate = async (id: string) => {
    setLoading("upd-" + id);
    const acc = accounts.find((a: any) => a.id === id);
    await updateBankAccount(id, { ...form, isActive: acc?.isActive ?? true });
    setEditId(null); setForm(EMPTY); router.refresh(); setLoading("");
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    setLoading("tog-" + id);
    const acc = accounts.find((a: any) => a.id === id)!;
    await updateBankAccount(id, { accountName: acc.accountName, bankName: acc.bankName, accountNumber: acc.accountNumber, routingNumber: acc.routingNumber || "", swiftCode: acc.swiftCode || "", currency: acc.currency, country: acc.country, instructions: acc.instructions || "", isActive: !isActive });
    router.refresh(); setLoading("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bank account?")) return;
    setLoading("del-" + id); await deleteBankAccount(id); router.refresh(); setLoading("");
  };

  const startEdit = (acc: any) => {
    setEditId(acc.id);
    setForm({ accountName: acc.accountName, bankName: acc.bankName, accountNumber: acc.accountNumber, routingNumber: acc.routingNumber || "", swiftCode: acc.swiftCode || "", currency: acc.currency, country: acc.country, instructions: acc.instructions || "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Students will see these accounts to make fee payments. Add accounts for each currency your students use.</p>
        <button onClick={() => { setShowAdd(!showAdd); setForm(EMPTY); }} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Add / Edit Form */}
      {(showAdd || editId) && (
        <div className="card border-2 border-brand-300">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" /> {editId ? "Edit" : "Add"} Bank Account
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div><label className="text-[10px] text-gray-500">Account Name *</label><input className="input-field text-xs" placeholder="School Account Name" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} /></div>
            <div><label className="text-[10px] text-gray-500">Bank Name *</label><input className="input-field text-xs" placeholder="e.g. First Bank" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} /></div>
            <div><label className="text-[10px] text-gray-500">Account Number *</label><input className="input-field text-xs" placeholder="0123456789" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} /></div>
            <div><label className="text-[10px] text-gray-500">Routing/Sort Code</label><input className="input-field text-xs" placeholder="Optional" value={form.routingNumber} onChange={(e) => setForm({ ...form, routingNumber: e.target.value })} /></div>
            <div><label className="text-[10px] text-gray-500">SWIFT/BIC Code</label><input className="input-field text-xs" placeholder="Optional" value={form.swiftCode} onChange={(e) => setForm({ ...form, swiftCode: e.target.value })} /></div>
            <div><label className="text-[10px] text-gray-500">Currency *</label>
              <select className="input-field text-xs" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {CURRENCIES.map((c: any) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="text-[10px] text-gray-500">Country *</label>
              <select className="input-field text-xs" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                {COUNTRIES.map((c: any) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="text-[10px] text-gray-500">Payment Instructions</label>
              <textarea className="input-field text-xs" rows={2} placeholder="e.g. Use student name as reference" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => editId ? handleUpdate(editId) : handleAdd()} disabled={loading === "add" || loading.startsWith("upd")}
              className="btn-primary text-xs px-5 py-2 flex items-center gap-1">
              {(loading === "add" || loading.startsWith("upd")) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              {editId ? "Save Changes" : "Add Account"}
            </button>
            <button onClick={() => { setShowAdd(false); setEditId(null); setForm(EMPTY); }} className="btn-ghost text-xs">Cancel</button>
          </div>
        </div>
      )}

      {/* Account List */}
      {accounts.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No bank accounts added yet.</p>
          <p className="text-xs text-gray-400 mt-1">Students need at least one account to make payments.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {accounts.map((acc: any) => (
            <div key={acc.id} className={`card ${!acc.isActive ? "opacity-50 border-dashed" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-gray-800">{acc.bankName}</h4>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{acc.currency}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{acc.country}</span>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Account Name</span><span className="font-medium">{acc.accountName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Account Number</span><span className="font-mono font-bold">{acc.accountNumber}</span></div>
                {acc.routingNumber && <div className="flex justify-between"><span className="text-gray-500">Routing Code</span><span className="font-mono">{acc.routingNumber}</span></div>}
                {acc.swiftCode && <div className="flex justify-between"><span className="text-gray-500">SWIFT</span><span className="font-mono">{acc.swiftCode}</span></div>}
              </div>
              {acc.instructions && <p className="text-[10px] text-gray-500 mt-2 italic">📋 {acc.instructions}</p>}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => handleToggle(acc.id, acc.isActive)} disabled={loading === "tog-" + acc.id}
                  className="text-[10px] px-2 py-1.5 rounded-lg hover:bg-gray-100 flex items-center gap-1 text-gray-500">
                  {acc.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                  {acc.isActive ? "Active" : "Disabled"}
                </button>
                <button onClick={() => startEdit(acc)} className="text-[10px] px-2 py-1.5 rounded-lg hover:bg-blue-50 text-blue-600 flex items-center gap-1">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleDelete(acc.id)} disabled={loading === "del-" + acc.id}
                  className="text-[10px] px-2 py-1.5 rounded-lg hover:bg-red-50 text-red-500 flex items-center gap-1 ml-auto">
                  {loading === "del-" + acc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
