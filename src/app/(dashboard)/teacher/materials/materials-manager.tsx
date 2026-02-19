"use client";

import { useState } from "react";
import { addMaterial, deleteMaterial } from "@/lib/actions/teacher";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, FileText, Video, Link as LinkIcon, Image, FolderOpen } from "lucide-react";

const TYPES = [
  { value: "DOCUMENT", label: "Document", icon: FileText },
  { value: "VIDEO", label: "Video", icon: Video },
  { value: "LINK", label: "Link", icon: LinkIcon },
  { value: "SLIDE", label: "Slide", icon: FileText },
  { value: "IMAGE", label: "Image", icon: Image },
];

export default function MaterialsManager({ classes, materials }: { classes: any[]; materials: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ classId: "", title: "", description: "", type: "DOCUMENT", url: "" });

  const handleAdd = async () => {
    if (!form.classId || !form.title || !form.url) { alert("Fill in all required fields"); return; }
    setLoading("add");
    const result = await addMaterial(form);
    if (result.error) alert(result.error);
    else { router.refresh(); setShowForm(false); setForm({ classId: "", title: "", description: "", type: "DOCUMENT", url: "" }); }
    setLoading("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    setLoading(id);
    await deleteMaterial(id);
    router.refresh();
    setLoading("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{materials.length} material(s)</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm"><Plus className="w-4 h-4 mr-1" /> Add Material</button>
      </div>

      {showForm && (
        <div className="card bg-emerald-50 border-emerald-200 space-y-3">
          <h4 className="text-sm font-semibold mb-2">Add Material</h4>
          <div className="grid grid-cols-2 gap-3">
            <select className="input-field" value={form.classId} onChange={(e) => setForm((p) => ({ ...p, classId: e.target.value }))}>
              <option value="">Select Class</option>
              {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input-field" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <input className="input-field" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <input className="input-field" placeholder="URL (link to file, video, or resource)" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} />
          <textarea className="input-field" rows={2} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={loading === "add"} className="btn-primary text-sm">
              {loading === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Material"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {materials.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No materials uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((m: any) => {
            const typeInfo = TYPES.find((t) => t.value === m.type) || TYPES[0];
            const Icon = typeInfo.icon;
            return (
              <div key={m.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-800">{m.title}</h4>
                  <p className="text-xs text-gray-500">{m.class.name} • {m.type} • {new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <a href={m.url} target="_blank" rel="noopener" className="btn-ghost text-xs px-3 py-1">Open</a>
                <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
