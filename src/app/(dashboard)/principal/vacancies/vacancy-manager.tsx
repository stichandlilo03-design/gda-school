"use client";

import { useState } from "react";
import { createVacancy, closeVacancy, reopenVacancy, shortlistApplicant, acceptApplicant, rejectApplicant } from "@/lib/actions/vacancy";
import { scheduleVacancyInterview } from "@/lib/actions/interview";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Briefcase, Users, CheckCircle, XCircle, Clock, Calendar, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-700", SHORTLISTED: "bg-amber-100 text-amber-700",
  INTERVIEW_SCHEDULED: "bg-purple-100 text-purple-700", INTERVIEWED: "bg-cyan-100 text-cyan-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700", REJECTED: "bg-red-100 text-red-700", WITHDRAWN: "bg-gray-100 text-gray-500",
};

export default function VacancyManager({ vacancies, currency }: { vacancies: any[]; currency: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ scheduledAt: "", duration: 30, meetingLink: "" });
  const [form, setForm] = useState({
    title: "", description: "", requirements: [""], subjects: [""], gradeLevel: "", session: "",
    salaryMin: 0, salaryMax: 0, employmentType: "FULL_TIME", deadline: "", maxApplicants: 50, isPublic: true,
  });

  const handleCreate = async () => {
    if (!form.title || !form.description) { alert("Title and description required"); return; }
    setLoading("create");
    const result = await createVacancy({ ...form, requirements: form.requirements.filter(Boolean), subjects: form.subjects.filter(Boolean) });
    if (result.error) alert(result.error);
    else { router.refresh(); setShowCreate(false); setForm({ title: "", description: "", requirements: [""], subjects: [""], gradeLevel: "", session: "", salaryMin: 0, salaryMax: 0, employmentType: "FULL_TIME", deadline: "", maxApplicants: 50, isPublic: true }); }
    setLoading("");
  };

  const handleScheduleInterview = async (appId: string) => {
    if (!scheduleForm.scheduledAt) { alert("Set date/time"); return; }
    setLoading(appId);
    await scheduleVacancyInterview({ vacancyAppId: appId, ...scheduleForm });
    router.refresh();
    setScheduleFor(null);
    setLoading("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{vacancies.length} vacancy(ies)</p>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm"><Plus className="w-4 h-4 mr-1" /> Post Vacancy</button>
      </div>

      {showCreate && (
        <div className="card bg-brand-50 border-brand-200 space-y-4">
          <h4 className="text-sm font-semibold">Post New Vacancy</h4>
          <input className="input-field" placeholder="Position title (e.g. Mathematics Teacher - Grade 10)" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <textarea className="input-field min-h-[100px]" placeholder="Job description..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="grid grid-cols-3 gap-3">
            <select className="input-field" value={form.employmentType} onChange={(e) => setForm((p) => ({ ...p, employmentType: e.target.value }))}>
              <option value="FULL_TIME">Full Time</option><option value="PART_TIME">Part Time</option><option value="CONTRACT">Contract</option>
            </select>
            <input type="date" className="input-field" placeholder="Deadline" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} />
            <input type="number" className="input-field" placeholder="Max applicants" value={form.maxApplicants} onChange={(e) => setForm((p) => ({ ...p, maxApplicants: parseInt(e.target.value) || 50 }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" className="input-field" placeholder={`Min salary (${currency})`} value={form.salaryMin || ""} onChange={(e) => setForm((p) => ({ ...p, salaryMin: parseFloat(e.target.value) || 0 }))} />
            <input type="number" className="input-field" placeholder={`Max salary (${currency})`} value={form.salaryMax || ""} onChange={(e) => setForm((p) => ({ ...p, salaryMax: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className="label">Requirements</label>
            {form.requirements.map((r, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <input className="input-field flex-1" placeholder="e.g. B.Ed in Mathematics" value={r}
                  onChange={(e) => { const u = [...form.requirements]; u[i] = e.target.value; setForm((p) => ({ ...p, requirements: u })); }} />
                {i > 0 && <button onClick={() => setForm((p) => ({ ...p, requirements: p.requirements.filter((_, j) => j !== i) }))} className="text-red-400 text-xs px-2">×</button>}
              </div>
            ))}
            <button onClick={() => setForm((p) => ({ ...p, requirements: [...p.requirements, ""] }))} className="text-xs text-brand-600 hover:underline">+ Add</button>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublic} onChange={(e) => setForm((p) => ({ ...p, isPublic: e.target.checked }))} /> Show on public job board & landing page</label>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={loading === "create"} className="btn-primary text-sm">{loading === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Vacancy"}</button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Vacancy list */}
      {vacancies.map((v: any) => (
        <div key={v.id} className="card">
          <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setExpanded(expanded === v.id ? null : v.id)}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${v.status === "OPEN" ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-800">{v.title}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${v.status === "OPEN" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{v.status}</span>
                  {v.isPublic && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Public</span>}
                </div>
                <p className="text-xs text-gray-500">{v.employmentType} • {v._count.applications} applicants{v.deadline ? ` • Deadline: ${new Date(v.deadline).toLocaleDateString()}` : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {v.status === "OPEN" ? (
                <button onClick={(e) => { e.stopPropagation(); setLoading(v.id); closeVacancy(v.id).then(() => { router.refresh(); setLoading(""); }); }} className="text-xs text-red-500 hover:text-red-700 px-2">Close</button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); setLoading(v.id); reopenVacancy(v.id).then(() => { router.refresh(); setLoading(""); }); }} className="text-xs text-emerald-500 hover:text-emerald-700 px-2">Reopen</button>
              )}
              {expanded === v.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>

          {expanded === v.id && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-4">{v.description}</p>
              {v.applications.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No applications yet.</p>
              ) : (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-gray-600 uppercase">Applications ({v.applications.length})</h5>
                  {v.applications.map((app: any) => (
                    <div key={app.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {app.applicantName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{app.applicantName}</span>
                            {app.teacher && <span className="text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded">Registered Teacher</span>}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[app.status]}`}>{app.status.replace("_", " ")}</span>
                          </div>
                          <p className="text-xs text-gray-500">{app.applicantEmail} • {app.experience} yrs exp</p>
                          {app.coverLetter && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{app.coverLetter}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          {app.status === "APPLIED" && (
                            <>
                              <button onClick={() => { setLoading(app.id); shortlistApplicant(app.id).then(() => { router.refresh(); setLoading(""); }); }}
                                className="text-[10px] px-2 py-1 rounded bg-amber-50 text-amber-600 hover:bg-amber-100 font-medium">Shortlist</button>
                              <button onClick={() => { setLoading(app.id); rejectApplicant(app.id).then(() => { router.refresh(); setLoading(""); }); }}
                                className="text-[10px] px-2 py-1 rounded text-red-500 hover:bg-red-50">Reject</button>
                            </>
                          )}
                          {(app.status === "SHORTLISTED" || app.status === "APPLIED") && (
                            <button onClick={() => setScheduleFor(scheduleFor === app.id ? null : app.id)}
                              className="text-[10px] px-2 py-1 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 font-medium">
                              <Calendar className="w-3 h-3 mr-0.5 inline" /> Interview
                            </button>
                          )}
                          {app.status === "INTERVIEWED" && (
                            <>
                              <button onClick={() => { setLoading(app.id); acceptApplicant(app.id).then(() => { router.refresh(); setLoading(""); }); }}
                                className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium">
                                <CheckCircle className="w-3 h-3 mr-0.5 inline" /> Accept & Hire
                              </button>
                              <button onClick={() => { setLoading(app.id); rejectApplicant(app.id).then(() => { router.refresh(); setLoading(""); }); }}
                                className="text-[10px] px-2 py-1 rounded text-red-500 hover:bg-red-50">Reject</button>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Schedule interview form */}
                      {scheduleFor === app.id && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <input type="datetime-local" className="input-field text-xs" value={scheduleForm.scheduledAt} onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledAt: e.target.value }))} />
                            <input type="number" className="input-field text-xs" placeholder="Duration (min)" value={scheduleForm.duration} onChange={(e) => setScheduleForm((p) => ({ ...p, duration: parseInt(e.target.value) || 30 }))} />
                            <input className="input-field text-xs" placeholder="Meeting link (optional)" value={scheduleForm.meetingLink} onChange={(e) => setScheduleForm((p) => ({ ...p, meetingLink: e.target.value }))} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleScheduleInterview(app.id)} disabled={loading === app.id} className="btn-primary text-xs px-3 py-1">
                              {loading === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Schedule"}
                            </button>
                            <button onClick={() => setScheduleFor(null)} className="btn-ghost text-xs px-3 py-1">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
