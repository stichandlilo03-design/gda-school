"use client";

import { useState, useRef } from "react";
import { addMaterial, deleteMaterial, toggleMaterialPublished, editMaterial } from "@/lib/actions/materials";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Loader2, FileText, Video, Link as LinkIcon, Image, FolderOpen,
  Upload, Eye, EyeOff, Search, X, ExternalLink, Download, Film, FileImage, Pencil
} from "lucide-react";

const TYPES = [
  { value: "DOCUMENT", label: "Document", icon: FileText, accept: ".pdf,.doc,.docx,.pptx,.xlsx,.txt" },
  { value: "VIDEO", label: "Video", icon: Video, accept: "video/*" },
  { value: "IMAGE", label: "Image", icon: Image, accept: "image/*" },
  { value: "SLIDE", label: "Slide/Presentation", icon: FileText, accept: ".pptx,.ppt,.pdf" },
  { value: "LINK", label: "External Link", icon: LinkIcon, accept: "" },
];

const TYPE_COLORS: Record<string, string> = {
  DOCUMENT: "bg-blue-100 text-blue-700",
  VIDEO: "bg-red-100 text-red-700",
  IMAGE: "bg-emerald-100 text-emerald-700",
  SLIDE: "bg-purple-100 text-purple-700",
  LINK: "bg-amber-100 text-amber-700",
};

const TYPE_ICONS: Record<string, any> = {
  DOCUMENT: FileText, VIDEO: Film, IMAGE: FileImage, SLIDE: FileText, LINK: LinkIcon,
};

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function MaterialsManager({ classes, materials }: { classes: any[]; materials: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterType, setFilterType] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", type: "", url: "", classId: "" });

  const [form, setForm] = useState({ classId: "", title: "", description: "", type: "DOCUMENT", url: "" });
  const [fileData, setFileData] = useState<{ base64: string; name: string; size: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = materials.filter((m: any) => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || m.classId === filterClass;
    const matchType = !filterType || m.type === filterType;
    return matchSearch && matchClass && matchType;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert("File too large (max 50MB)"); return; }

    // Auto-detect type
    let detectedType = form.type;
    if (file.type.startsWith("image/")) detectedType = "IMAGE";
    else if (file.type.startsWith("video/")) detectedType = "VIDEO";
    else if (file.type.includes("presentation") || file.name.endsWith(".pptx")) detectedType = "SLIDE";
    else detectedType = "DOCUMENT";

    const reader = new FileReader();
    reader.onload = () => {
      setFileData({ base64: reader.result as string, name: file.name, size: file.size });
      setForm((p) => ({
        ...p,
        type: detectedType,
        title: p.title || file.name.replace(/\.[^.]+$/, ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.classId) { alert("Select a class"); return; }
    if (!form.title) { alert("Enter a title"); return; }
    if (!fileData && !form.url) { alert("Upload a file or enter a URL"); return; }

    setLoading("add");
    const result = await addMaterial({
      classId: form.classId,
      title: form.title,
      description: form.description || undefined,
      type: form.type,
      url: form.type === "LINK" ? form.url : undefined,
      fileBase64: fileData?.base64 || undefined,
      fileName: fileData?.name || undefined,
    });
    if (result.error) alert(result.error);
    else {
      setShowForm(false);
      setForm({ classId: "", title: "", description: "", type: "DOCUMENT", url: "" });
      setFileData(null);
      router.refresh();
    }
    setLoading("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this material? This cannot be undone.")) return;
    setLoading("del-" + id);
    await deleteMaterial(id);
    router.refresh();
    setLoading("");
  };

  const handleToggle = async (id: string) => {
    setLoading("tog-" + id);
    await toggleMaterialPublished(id);
    router.refresh();
    setLoading("");
  };

  const handleEdit = async () => {
    if (!editItem) return;
    setLoading("edit");
    const result = await editMaterial(editItem.id, {
      title: editForm.title, description: editForm.description,
      type: editForm.type, url: editForm.url, classId: editForm.classId,
    });
    if (result.error) alert(result.error);
    else { setEditItem(null); router.refresh(); }
    setLoading("");
  };

  const openEdit = (m: any) => {
    setEditItem(m);
    setEditForm({ title: m.title, description: m.description || "", type: m.type, url: m.url, classId: m.classId });
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith("/uploads/materials/") && /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3 w-60">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input className="flex-1 py-2 text-xs outline-none" placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch("")}><X className="w-3 h-3 text-gray-400" /></button>}
          </div>
          <select className="input-field text-xs w-36" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input-field text-xs w-32" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Upload Material
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="card border-2 border-brand-300 bg-brand-50/30 space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Upload className="w-4 h-4 text-brand-600" /> Upload Teaching Material
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-gray-600">Class *</label>
              <select className="input-field mt-1" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                <option value="">Select class</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.schoolGrade.gradeLevel})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-600">Type</label>
              <select className="input-field mt-1" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-gray-600">Title *</label>
            <input className="input-field mt-1" placeholder="e.g. Chapter 5 Notes" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div>
            <label className="text-[10px] font-medium text-gray-600">Description</label>
            <textarea className="input-field mt-1" rows={2} placeholder="Brief description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* File Upload or URL */}
          {form.type === "LINK" ? (
            <div>
              <label className="text-[10px] font-medium text-gray-600">URL *</label>
              <input className="input-field mt-1" placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-medium text-gray-600">Upload File * (images, videos, PDFs, docs — max 50MB)</label>
              <input ref={fileRef} type="file"
                accept={TYPES.find((t) => t.value === form.type)?.accept || "*"}
                onChange={handleFileChange} className="hidden" />
              <button onClick={() => fileRef.current?.click()}
                className={`mt-1 w-full p-5 border-2 border-dashed rounded-xl text-center transition-colors ${
                  fileData ? "border-emerald-300 bg-emerald-50" : "border-gray-300 hover:border-brand-300 hover:bg-brand-50/50"
                }`}>
                {fileData ? (
                  <div className="flex items-center justify-center gap-3">
                    {fileData.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img src={fileData.base64} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    ) : fileData.name.match(/\.(mp4|webm|mov)$/i) ? (
                      <Film className="w-10 h-10 text-red-400" />
                    ) : (
                      <FileText className="w-10 h-10 text-blue-400" />
                    )}
                    <div className="text-left">
                      <p className="text-xs font-medium text-gray-700">{fileData.name}</p>
                      <p className="text-[10px] text-gray-500">{formatSize(fileData.size)}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setFileData(null); }} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Click to upload</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {form.type === "IMAGE" ? "JPG, PNG, GIF, WebP" :
                       form.type === "VIDEO" ? "MP4, WebM, MOV" :
                       "PDF, DOC, DOCX, PPTX, XLSX"}
                    </p>
                  </div>
                )}
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={loading === "add"} className="btn-primary text-sm px-5 py-2 flex items-center gap-1.5">
              {loading === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload Material
            </button>
            <button onClick={() => { setShowForm(false); setFileData(null); }} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
            {isVideo(preview) ? (
              <video src={preview} controls className="max-w-full max-h-[85vh] rounded-xl" />
            ) : (
              <img src={preview} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            )}
          </div>
        </div>
      )}

      {/* ============ QUICK-USE TEMPLATES ============ */}
      <div className="card bg-gradient-to-br from-brand-50 to-purple-50 border-brand-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">⚡ Quick-Use Teaching Tools</h3>
          <span className="text-[10px] text-gray-400">Click to add to any class</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { icon: "📝", title: "Lesson Plan Template", desc: "Structured lesson outline", type: "LINK", url: "https://docs.google.com/document/d/1u_z3MQvP5PY0_lesson_plan_template" },
            { icon: "📊", title: "Grade Tracker Sheet", desc: "Student performance tracker", type: "LINK", url: "https://docs.google.com/spreadsheets/d/1_grade_tracker" },
            { icon: "🎯", title: "Quiz Template", desc: "Ready-made quiz format", type: "LINK", url: "https://docs.google.com/forms/d/quiz_template" },
            { icon: "📅", title: "Weekly Planner", desc: "Plan your week's lessons", type: "LINK", url: "https://docs.google.com/document/d/1_weekly_planner" },
            { icon: "📋", title: "Attendance Sheet", desc: "Printable attendance tracker", type: "LINK", url: "https://docs.google.com/spreadsheets/d/attendance_sheet" },
            { icon: "🏆", title: "Certificate Template", desc: "Student achievement cert", type: "LINK", url: "https://docs.google.com/presentation/d/certificate" },
            { icon: "📖", title: "Reading Log", desc: "Track student reading", type: "LINK", url: "https://docs.google.com/document/d/reading_log" },
            { icon: "🔬", title: "Lab Report Template", desc: "Science experiment format", type: "LINK", url: "https://docs.google.com/document/d/lab_report" },
            { icon: "✍️", title: "Essay Rubric", desc: "Writing evaluation guide", type: "LINK", url: "https://docs.google.com/document/d/essay_rubric" },
            { icon: "🎨", title: "Project Guidelines", desc: "Group project template", type: "LINK", url: "https://docs.google.com/document/d/project_guide" },
          ].map((tpl, i) => (
            <button key={i} onClick={async () => {
              const classId = classes[0]?.id;
              if (!classId) { alert("Create a class first"); return; }
              if (classes.length > 1) {
                const cls = prompt("Enter class name to add to:\n" + classes.map((c: any) => c.name).join("\n"));
                const found = classes.find((c: any) => c.name.toLowerCase().includes((cls || "").toLowerCase()));
                if (found) {
                  setLoading("tpl-" + i);
                  await addMaterial({ classId: found.id, title: tpl.title, description: tpl.desc, type: tpl.type, url: tpl.url });
                  router.refresh(); setLoading("");
                }
              } else {
                setLoading("tpl-" + i);
                await addMaterial({ classId, title: tpl.title, description: tpl.desc, type: tpl.type, url: tpl.url });
                router.refresh(); setLoading("");
              }
            }}
              disabled={loading === "tpl-" + i}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-200 hover:border-brand-300 hover:shadow-sm transition text-left group">
              <span className="text-xl">{tpl.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-700 truncate group-hover:text-brand-600">{tpl.title}</p>
                <p className="text-[8px] text-gray-400 truncate">{tpl.desc}</p>
              </div>
              {loading === "tpl-" + i ? <Loader2 className="w-3 h-3 animate-spin text-brand-500" /> : <Plus className="w-3 h-3 text-gray-300 group-hover:text-brand-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Grid */}
      <p className="text-xs text-gray-400">{filtered.length} material(s)</p>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{materials.length === 0 ? "No materials uploaded yet." : "No materials match your filters."}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m: any) => {
            const TypeIcon = TYPE_ICONS[m.type] || FileText;
            const typeColor = TYPE_COLORS[m.type] || "bg-gray-100 text-gray-600";

            return (
              <div key={m.id} className={`card hover:shadow-md transition-shadow ${!m.isPublished ? "opacity-60 border-dashed" : ""}`}>
                {/* Preview area */}
                <div className="aspect-video bg-gray-100 rounded-xl mb-3 overflow-hidden flex items-center justify-center cursor-pointer relative group"
                  onClick={() => { if (isImage(m.url) || isVideo(m.url)) setPreview(m.url); else window.open(m.url, "_blank"); }}>
                  {isImage(m.url) ? (
                    <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
                  ) : isVideo(m.url) ? (
                    <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                      <video src={m.url} className="w-full h-full object-cover opacity-50" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Film className="w-6 h-6 text-red-500" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <TypeIcon className="w-12 h-12 text-gray-300 mx-auto" />
                      <p className="text-[10px] text-gray-400 mt-1">{m.type}</p>
                    </div>
                  )}
                  {!m.isPublished && (
                    <div className="absolute top-2 right-2 bg-gray-800/70 text-white text-[9px] px-2 py-0.5 rounded-full">
                      <EyeOff className="w-2.5 h-2.5 inline mr-0.5" /> Hidden
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">{m.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${typeColor}`}>{m.type}</span>
                      <span className="text-[10px] text-gray-400">{m.class.name}</span>
                      {m.fileSize && <span className="text-[10px] text-gray-400">{formatSize(m.fileSize)}</span>}
                    </div>
                    {m.description && <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{m.description}</p>}
                    <p className="text-[9px] text-gray-400 mt-1">{new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-100">
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                  {m.url.startsWith("/uploads/") && (
                    <a href={m.url} download className="text-[10px] px-2 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1">
                      <Download className="w-3 h-3" />
                    </a>
                  )}
                  <button onClick={() => openEdit(m)}
                    className="text-[10px] px-2 py-1.5 rounded-lg hover:bg-blue-50 text-blue-500 flex items-center gap-1">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => handleToggle(m.id)} disabled={loading === "tog-" + m.id}
                    className="text-[10px] px-2 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center gap-1">
                    {m.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {m.isPublished ? "Hide" : "Show"}
                  </button>
                  <button onClick={() => handleDelete(m.id)} disabled={loading === "del-" + m.id}
                    className="text-[10px] px-2 py-1.5 rounded-lg hover:bg-red-50 text-red-500 flex items-center gap-1 ml-auto">
                    {loading === "del-" + m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Material Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditItem(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-brand-500" /> Edit Material
            </h3>
            <div>
              <label className="label">Title</label>
              <input className="input-field" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input-field" rows={2} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Type</label>
                <select className="input-field" value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Class</label>
                <select className="input-field" value={editForm.classId} onChange={e => setEditForm(f => ({ ...f, classId: e.target.value }))}>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            {editForm.type === "LINK" && (
              <div>
                <label className="label">URL</label>
                <input className="input-field" value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handleEdit} disabled={loading === "edit"} className="btn-primary text-sm flex-1">
                {loading === "edit" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </button>
              <button onClick={() => setEditItem(null)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
