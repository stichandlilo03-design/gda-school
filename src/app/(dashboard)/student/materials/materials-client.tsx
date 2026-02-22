"use client";

import { useState } from "react";
import {
  FileText, Video, Image, FolderOpen, Search, X, ExternalLink, Download,
  Film, FileImage, Link as LinkIcon, Filter
} from "lucide-react";

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

export default function StudentMaterialsClient({
  materials, classes, initialClassFilter,
}: {
  materials: any[]; classes: { id: string; name: string; materialCount: number }[];
  initialClassFilter: string;
}) {
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState(initialClassFilter);
  const [filterType, setFilterType] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const filtered = materials.filter((m: any) => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || m.classId === filterClass;
    const matchType = !filterType || m.type === filterType;
    return matchSearch && matchClass && matchType;
  });

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3 flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input className="flex-1 py-2 text-xs outline-none" placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")}><X className="w-3 h-3 text-gray-400" /></button>}
        </div>
        <select className="input-field text-xs w-40" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.materialCount})</option>)}
        </select>
        <select className="input-field text-xs w-32" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="DOCUMENT">Documents</option>
          <option value="VIDEO">Videos</option>
          <option value="IMAGE">Images</option>
          <option value="SLIDE">Slides</option>
          <option value="LINK">Links</option>
        </select>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center z-10">
              <X className="w-4 h-4" />
            </button>
            {isVideo(preview) ? (
              <video src={preview} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl" />
            ) : (
              <img src={preview} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            )}
          </div>
        </div>
      )}

      {/* Materials Grid */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{materials.length === 0 ? "No materials available yet." : "No materials match your search."}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m: any) => {
            const TypeIcon = TYPE_ICONS[m.type] || FileText;
            const typeColor = TYPE_COLORS[m.type] || "bg-gray-100 text-gray-600";

            return (
              <div key={m.id} className="card hover:shadow-md transition-shadow group">
                {/* Preview */}
                <div className="aspect-video bg-gray-100 rounded-xl mb-3 overflow-hidden flex items-center justify-center cursor-pointer relative"
                  onClick={() => {
                    if (isImage(m.url) || isVideo(m.url)) setPreview(m.url);
                    else window.open(m.url, "_blank");
                  }}>
                  {isImage(m.url) ? (
                    <img src={m.url} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : isVideo(m.url) ? (
                    <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                      <video src={m.url} className="w-full h-full object-cover opacity-40" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Film className="w-7 h-7 text-red-500" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <TypeIcon className="w-12 h-12 text-gray-300 mx-auto" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <h4 className="text-sm font-semibold text-gray-800 truncate">{m.title}</h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${typeColor}`}>{m.type}</span>
                  <span className="text-[10px] text-gray-400">{m.className}</span>
                  {m.fileSize && <span className="text-[10px] text-gray-400">{formatSize(m.fileSize)}</span>}
                </div>
                {m.description && <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{m.description}</p>}
                <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-400">
                  <span>By {m.teacher.user.name}</span>
                  <span>•</span>
                  <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
                  <a href={m.url} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 flex items-center gap-1 font-medium">
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                  {m.url.startsWith("/uploads/") && (
                    <a href={m.url} download
                      className="text-[10px] px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1">
                      <Download className="w-3 h-3" /> Download
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
