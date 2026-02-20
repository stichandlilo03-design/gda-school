"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateParentProfile } from "@/lib/actions/parent";
import { Save, Loader2, User, Users, Phone, Briefcase, MapPin, Heart } from "lucide-react";

const RELATIONSHIPS = ["Parent", "Guardian", "Mother", "Father", "Uncle", "Aunt", "Grandparent", "Sibling", "Other"];

export default function ParentProfileClient({ parent }: { parent: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    phone: parent.phone || parent.user.phone || "",
    occupation: parent.occupation || "",
    address: parent.address || "",
    relationship: parent.relationship || "Parent",
  });

  const handleSave = async () => {
    setLoading(true); setMessage("");
    const r = await updateParentProfile(form);
    if (r.error) setMessage("Error: " + r.error);
    else { setMessage("✅ Profile updated!"); router.refresh(); }
    setLoading(false);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Profile Info */}
      <div className="space-y-4">
        {message && (
          <div className={`p-3 rounded-xl text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {message}
          </div>
        )}

        <div className="card">
          <h3 className="text-sm font-bold mb-4">👤 Account Details</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500 flex items-center gap-1"><User className="w-3 h-3" /> Name</span>
              <span className="font-medium">{parent.user.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{parent.user.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Country</span>
              <span className="font-medium">{parent.user.countryCode}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-bold mb-4">✏️ Edit Details</h3>
          <div className="space-y-3">
            <div><label className="label"><Phone className="w-3 h-3 inline mr-1" />Phone</label><input className="input-field" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div><label className="label"><Heart className="w-3 h-3 inline mr-1" />Relationship</label>
              <select className="input-field" value={form.relationship} onChange={e => setForm(p => ({ ...p, relationship: e.target.value }))}>
                {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="label"><Briefcase className="w-3 h-3 inline mr-1" />Occupation</label><input className="input-field" value={form.occupation} onChange={e => setForm(p => ({ ...p, occupation: e.target.value }))} /></div>
            <div><label className="label"><MapPin className="w-3 h-3 inline mr-1" />Address</label><textarea className="input-field min-h-[60px]" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
            <button onClick={handleSave} disabled={loading} className="btn-primary text-xs w-full">
              {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />} Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Linked Children */}
      <div className="card">
        <h3 className="text-sm font-bold mb-4"><Users className="w-4 h-4 inline mr-1" /> Linked Children ({parent.children.length})</h3>
        {parent.children.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No children linked. Go to My Children to link them.</p>
        ) : (
          <div className="space-y-3">
            {parent.children.map((link: any) => (
              <div key={link.id} className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                  {link.student?.user?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-xs font-bold">{link.student?.user?.name}</p>
                  <p className="text-[10px] text-gray-500">{link.student?.school?.name} · {link.student?.gradeLevel} · {link.relation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
