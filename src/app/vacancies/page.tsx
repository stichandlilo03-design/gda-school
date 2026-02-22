"use client";

import { useState, useEffect } from "react";
import { applyToVacancy } from "@/lib/actions/vacancy";
import Link from "next/link";
import { Briefcase, MapPin, Clock, Users, GraduationCap, ArrowLeft, Loader2, Check, Send, Star, ChevronDown, ChevronUp, Search } from "lucide-react";

export default function PublicVacanciesPage() {
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ applicantName: "", applicantEmail: "", applicantPhone: "", coverLetter: "", experience: 0, qualifications: [""] });

  useEffect(() => { fetch("/api/vacancies").then((r) => r.json()).then((d) => { setVacancies(d); setLoaded(true); }).catch(() => setLoaded(true)); }, []);

  const handleApply = async (vacancyId: string) => {
    if (!form.applicantName || !form.applicantEmail) { setError("Name and email required"); return; }
    setLoading(true); setError("");
    const result = await applyToVacancy({ vacancyId, ...form, qualifications: form.qualifications.filter(Boolean) });
    if (result.error) setError(result.error);
    else { setSuccess(result.message || "Applied!"); setApplying(null); setForm({ applicantName: "", applicantEmail: "", applicantPhone: "", coverLetter: "", experience: 0, qualifications: [""] }); }
    setLoading(false);
  };

  const filtered = vacancies.filter((v: any) =>
    !search || v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.school?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (Array.isArray(v.subjects) && v.subjects.some((s: string) => s.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Link href="/" className="inline-flex items-center gap-1 text-brand-200 hover:text-white text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to GDA
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Teaching Jobs</h1>
              <p className="text-brand-200">{vacancies.length} open position{vacancies.length !== 1 ? "s" : ""} across GDA schools</p>
            </div>
          </div>
          <div className="relative max-w-lg mt-6">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-300" />
            <input className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-brand-300 text-sm outline-none focus:bg-white/20"
              placeholder="Search by title, school, or subject..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {success && (
        <div className="mx-auto max-w-5xl px-6 mt-6">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-2">
            <Check className="w-5 h-5" /> {success}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-6 py-8">
        {!loaded ? (
          <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">{search ? "No matching jobs" : "No open positions right now"}</h3>
            <p className="text-sm text-gray-400">Register as a teacher to get notified when new positions open.</p>
            <Link href="/register/teacher" className="btn-primary mt-6 inline-block">Register as Teacher</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((v: any) => {
              const subjects = Array.isArray(v.subjects) ? v.subjects as string[] : [];
              const isExp = expanded === v.id;
              return (
                <div key={v.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                  <div className="p-6 cursor-pointer" onClick={() => setExpanded(isExp ? null : v.id)}>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-7 h-7 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base font-bold text-gray-900">{v.title}</h3>
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Open</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{v.school?.name}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {v.gradeLevel && <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {v.gradeLevel}</span>}
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {v.school?.countryCode}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {v.employmentType?.replace("_", " ")}</span>
                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {v._count?.applications || 0} applied</span>
                          {(v.salaryMin || v.salaryMax) && (
                            <span className="font-medium text-emerald-600">{v.school?.currency || "USD"} {v.salaryMin?.toLocaleString()}{v.salaryMax ? ` - ${v.salaryMax.toLocaleString()}` : ""}</span>
                          )}
                        </div>
                        {subjects.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {subjects.filter(Boolean).map((s: string, i: number) => (
                              <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setApplying(applying === v.id ? null : v.id); }} className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg font-medium hover:bg-brand-700">
                          Apply Now
                        </button>
                        {isExp ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {isExp && (
                    <div className="px-6 pb-6 pt-0 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mt-4 whitespace-pre-wrap">{v.description}</p>
                      {Array.isArray(v.requirements) && v.requirements.filter(Boolean).length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Requirements</h4>
                          <ul className="space-y-1">
                            {(v.requirements as string[]).filter(Boolean).map((r: string, i: number) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" /> {r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {v.deadline && <p className="text-xs text-gray-400 mt-3">Deadline: {new Date(v.deadline).toLocaleDateString()}</p>}
                    </div>
                  )}

                  {applying === v.id && (
                    <div className="px-6 pb-6 border-t border-brand-100 bg-brand-50/30">
                      <h4 className="text-sm font-bold text-gray-800 mt-4 mb-3">Apply for {v.title}</h4>
                      {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-3">{error}</div>}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input className="input-field text-sm" placeholder="Your full name *" value={form.applicantName} onChange={(e) => setForm((p) => ({ ...p, applicantName: e.target.value }))} />
                        <input className="input-field text-sm" placeholder="Your email *" type="email" value={form.applicantEmail} onChange={(e) => setForm((p) => ({ ...p, applicantEmail: e.target.value }))} />
                        <input className="input-field text-sm" placeholder="Phone (optional)" value={form.applicantPhone} onChange={(e) => setForm((p) => ({ ...p, applicantPhone: e.target.value }))} />
                        <input className="input-field text-sm" placeholder="Years of experience" type="number" value={form.experience || ""} onChange={(e) => setForm((p) => ({ ...p, experience: parseInt(e.target.value) || 0 }))} />
                      </div>
                      <textarea className="input-field text-sm mb-3 min-h-[80px]" placeholder="Cover letter (tell the school why you're a great fit)..." value={form.coverLetter} onChange={(e) => setForm((p) => ({ ...p, coverLetter: e.target.value }))} />
                      <div className="mb-3">
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Qualifications</label>
                        {form.qualifications.map((q, i) => (
                          <div key={i} className="flex gap-2 mb-1">
                            <input className="input-field text-sm flex-1" placeholder="e.g. B.Ed Mathematics" value={q}
                              onChange={(e) => { const u = [...form.qualifications]; u[i] = e.target.value; setForm((p) => ({ ...p, qualifications: u })); }} />
                            {i > 0 && <button onClick={() => setForm((p) => ({ ...p, qualifications: p.qualifications.filter((_, j) => j !== i) }))} className="text-red-400 px-2">&times;</button>}
                          </div>
                        ))}
                        <button onClick={() => setForm((p) => ({ ...p, qualifications: [...p.qualifications, ""] }))} className="text-xs text-brand-600 hover:underline">+ Add</button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApply(v.id)} disabled={loading} className="btn-primary text-sm flex items-center gap-1.5">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Application
                        </button>
                        <button onClick={() => { setApplying(null); setError(""); }} className="btn-ghost text-sm">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
