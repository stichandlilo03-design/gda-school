"use client";

import { useState } from "react";
import { applyToVacancy } from "@/lib/actions/vacancy";
import { useRouter } from "next/navigation";
import { Briefcase, MapPin, Clock, Users, DollarSign, Send, Loader2, CheckCircle } from "lucide-react";

export default function TeacherVacancyList({ vacancies, teacherName, teacherEmail }: { vacancies: any[]; teacherName: string; teacherEmail: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [applying, setApplying] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ coverLetter: "", experience: 0 });

  const handleApply = async (vacancyId: string) => {
    setLoading(vacancyId);
    const result = await applyToVacancy({
      vacancyId,
      applicantName: teacherName,
      applicantEmail: teacherEmail,
      coverLetter: form.coverLetter,
      experience: form.experience,
      qualifications: [],
    });
    if (result.error) setMessage("Error: " + result.error);
    else { setMessage(result.message || "Applied!"); setApplying(null); router.refresh(); }
    setLoading("");
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</div>
      )}

      {vacancies.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No open positions available right now.</p>
        </div>
      ) : (
        vacancies.map((v: any) => {
          const alreadyApplied = v.applications && v.applications.length > 0;
          return (
            <div key={v.id} className="card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                  {v.school.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">{v.title}</h3>
                  <p className="text-xs text-brand-600 font-medium">{v.school.name} • {v.school.countryCode}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    <span>{v.employmentType.replace("_", " ")}</span>
                    <span>{v._count.applications} applicants</span>
                    {v.salaryMin > 0 && <span>{v.currency} {v.salaryMin.toLocaleString()}{v.salaryMax > 0 ? ` – ${v.salaryMax.toLocaleString()}` : ""}</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{v.description}</p>
                </div>
                {alreadyApplied ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium">
                    <CheckCircle className="w-3 h-3" /> Applied
                  </span>
                ) : (
                  <button onClick={() => setApplying(applying === v.id ? null : v.id)} className="btn-primary text-xs">
                    <Send className="w-3 h-3 mr-1" /> Apply
                  </button>
                )}
              </div>

              {applying === v.id && !alreadyApplied && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                  <input type="number" className="input-field" placeholder="Years of experience" value={form.experience || ""} onChange={(e) => setForm((p) => ({ ...p, experience: parseInt(e.target.value) || 0 }))} />
                  <textarea className="input-field" rows={3} placeholder="Cover letter - why are you a great fit?" value={form.coverLetter} onChange={(e) => setForm((p) => ({ ...p, coverLetter: e.target.value }))} />
                  <div className="flex gap-2">
                    <button onClick={() => handleApply(v.id)} disabled={loading === v.id} className="btn-primary text-sm">
                      {loading === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Application"}
                    </button>
                    <button onClick={() => setApplying(null)} className="btn-ghost text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
