"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FolderOpen, FileText, Video, LinkIcon, Image, Download, Search, Filter,
  BookOpen, File, Headphones
} from "lucide-react";

const TYPE_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  DOCUMENT: { icon: FileText, color: "text-blue-600 bg-blue-100", label: "Document" },
  VIDEO: { icon: Video, color: "text-red-600 bg-red-100", label: "Video" },
  LINK: { icon: LinkIcon, color: "text-purple-600 bg-purple-100", label: "Link" },
  IMAGE: { icon: Image, color: "text-emerald-600 bg-emerald-100", label: "Image" },
  AUDIO: { icon: Headphones, color: "text-orange-600 bg-orange-100", label: "Audio" },
  PRESENTATION: { icon: BookOpen, color: "text-pink-600 bg-pink-100", label: "Slides" },
  OTHER: { icon: File, color: "text-gray-600 bg-gray-100", label: "File" },
};

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(date: string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function MaterialsList({ materials, classNames }: { materials: any[]; classNames: string[] }) {
  const searchParams = useSearchParams();
  const initialClass = searchParams.get("classId") || "all";

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const types = [...new Set(materials.map((m) => m.type))];

  const filtered = materials.filter((m) => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !(m.description || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (classFilter !== "all" && m.className !== classFilter) return false;
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="all">All Classes</option>
          {classNames.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input-field w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {types.map((t) => <option key={t} value={t}>{TYPE_ICONS[t]?.label || t}</option>)}
        </select>
        <span className="text-xs text-gray-400">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <FolderOpen className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-2">No Materials Yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {materials.length === 0
              ? "Learning materials will appear here once your teachers upload them."
              : "No materials match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((m) => {
            const ti = TYPE_ICONS[m.type] || TYPE_ICONS.OTHER;
            const Icon = ti.icon;
            return (
              <div key={m.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ti.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">{m.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {m.className} • {m.teacherName} • {timeAgo(m.createdAt)}
                    </p>
                    {m.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{m.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${ti.color} font-medium`}>{ti.label}</span>
                      {m.fileSize && <span className="text-[10px] text-gray-400">{formatFileSize(m.fileSize)}</span>}
                    </div>
                  </div>
                  <a href={m.url} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-100">
                    {m.type === "LINK" ? <LinkIcon className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
