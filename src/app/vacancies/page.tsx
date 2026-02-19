"use client";

import { useState, useEffect } from "react";
import { applyToVacancy } from "@/lib/actions/vacancy";
import Link from "next/link";
import { Briefcase, MapPin, Clock, Users, DollarSign, GraduationCap, ArrowLeft, Loader2, Check, Send } from "lucide-react";

export default function PublicVacanciesPage() {
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ applicantName: "", applicantEmail: "", applicantPhone: "", coverLetter: "", experience: 0, qualifications: [""] });

  useEffect(() => { fetch("/api/vacancies").then((r) => r.json()).then((d) => { setVacancies(d); setLoaded(true); }); }, []);

  const handleApply = async (vacancyId: string) => {
    if (!form.applicantName || !form.applicantEmail) { setError("Name and email required"); return; }
    setLoading(true); setError("");
    const result = await applyToVacancy({ vacancyId, ...form, qualifications: form.qualifications.filter(Boolean) });
    if (result.error) { setError(result.error); setLoading(false); return; }
    setSuccess(result.message || "Applied!"); setApplying(null); setLoading(false);
    setForm({ applicantName: "", applicantEmail: "", applicantPhone: "", coverLetter: "", experience: 0, qualifications: [""] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-brand-600">GDA</span>
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-bold text-gray-900">Job Board</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link href="/register/teacher" className="btn-primary text-sm">Register as Teacher</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-600" />
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Open Teaching Positions</h2>
          <p className="text-gray-500">Browse opportunities at schools in our global network. Apply directly — no account needed.</p>
        </div>

        {!loaded ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" /></div>
        ) : vacancies.length === 0 ? (
          <div className="card text-center py-16">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No open positions at the moment</p>
            <p className="text-sm text-gray-400">Check back later or register as a teacher to be notified.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vacancies.map((v: any) => (
              <div key={v.id} className="card hover:border-brand-200 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {v.school.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900">{v.title}</h3>
                    <p className="text-sm text-brand-600 font-medium">{v.school.name}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {v.school.countryCode}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {v.employmentType.replace("_", " ")}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {v._count.applications} applicants</span>
                      {v.salaryMin > 0 && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {v.currency} {v.salaryMin.toLocaleString()}{v.salaryMax > 0 ? ` – ${v.salaryMax.toLocaleString()}` : "+"}</span>}
                      {v.deadline && <span className="text-amber-600">Deadline: {new Date(v.deadline).toLocaleDateString()}</span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-3 line-clamp-3">{v.description}</p>
                    {v.requirements && (v.requirements as string[]).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {(v.requirements as string[]).map((r: string, i: number) => r && (
                          <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setApplying(applying === v.id ? null : v.id); setError(""); }}
                    className={`btn-primary text-sm flex-shrink-0 ${applying === v.id ? "bg-gray-600" : ""}`}>
                    {applying === v.id ? "Close" : <><Send className="w-3 h-3 mr-1" /> Apply</>}
                  </button>
                </div>

                {applying === v.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded-lg">{error}</div>}
                    <div className="grid grid-cols-2 gap-3">
                      <input className="input-field" placeholder="Your full name *" value={form.applicantName} onChange={(e) => setForm((p) => ({ ...p, applicantName: e.target.value }))} />
                      <input type="email" className="input-field" placeholder="Email *" value={form.applicantEmail} onChange={(e) => setForm((p) => ({ ...p, applicantEmail: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="tel" className="input-field" placeholder="Phone (optional)" value={form.applicantPhone} onChange={(e) => setForm((p) => ({ ...p, applicantPhone: e.target.value }))} />
                      <input type="number" className="input-field" placeholder="Years of experience" min={0} value={form.experience || ""} onChange={(e) => setForm((p) => ({ ...p, experience: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <textarea className="input-field min-h-[80px]" placeholder="Cover letter / why you're a great fit..." value={form.coverLetter} onChange={(e) => setForm((p) => ({ ...p, coverLetter: e.target.value }))} />
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Qualifications</label>
                      {form.qualifications.map((q, i) => (
                        <div key={i} className="flex gap-2 mb-1">
                          <input className="input-field flex-1 text-sm" placeholder="e.g. B.Ed Mathematics" value={q}
                            onChange={(e) => { const u = [...form.qualifications]; u[i] = e.target.value; setForm((p) => ({ ...p, qualifications: u })); }} />
                        </div>
                      ))}
                      <button onClick={() => setForm((p) => ({ ...p, qualifications: [...p.qualifications, ""] }))} className="text-xs text-brand-600 hover:underline">+ Add</button>
                    </div>
                    <button onClick={() => handleApply(v.id)} disabled={loading} className="btn-primary">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />} Submit Application
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
