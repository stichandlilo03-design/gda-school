"use client";

import { useState, useEffect } from "react";
import { registerTeacher } from "@/lib/actions/auth";
import Link from "next/link";
import { GraduationCap, Loader2, ArrowLeft, ArrowRight, Check, School, BookOpen, Plus, X } from "lucide-react";

const COUNTRIES = [
  { code: "NG", name: "Nigeria" }, { code: "GH", name: "Ghana" }, { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" }, { code: "US", name: "United States" }, { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" }, { code: "AU", name: "Australia" }, { code: "IN", name: "India" },
  { code: "EG", name: "Egypt" }, { code: "TZ", name: "Tanzania" }, { code: "UG", name: "Uganda" },
  { code: "ET", name: "Ethiopia" }, { code: "CM", name: "Cameroon" }, { code: "SN", name: "Senegal" },
  { code: "RW", name: "Rwanda" }, { code: "ZM", name: "Zambia" },
];

const SUBJECT_OPTIONS = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Further Mathematics",
  "Agricultural Science", "Economics", "Government", "History", "Geography", "Literature in English",
  "Computer Science", "ICT / Digital Literacy", "French", "Arabic", "Yoruba", "Igbo", "Hausa", "Swahili",
  "Civic Education", "Social Studies", "Basic Science", "Basic Technology", "Home Economics",
  "Physical Education", "Fine Arts / Visual Arts", "Music", "Business Studies", "Accounting",
  "Commerce", "Marketing", "Technical Drawing", "Health Science", "Religious Studies",
  "Spanish", "Portuguese", "German", "Mandarin", "Creative Writing", "Coding & Robotics",
];

const GRADE_OPTIONS = [
  { value: "K1", label: "Kindergarten 1" }, { value: "K2", label: "Kindergarten 2" }, { value: "K3", label: "Kindergarten 3" },
  { value: "G1", label: "Grade 1 (Primary 1)" }, { value: "G2", label: "Grade 2 (Primary 2)" }, { value: "G3", label: "Grade 3 (Primary 3)" },
  { value: "G4", label: "Grade 4 (Primary 4)" }, { value: "G5", label: "Grade 5 (Primary 5)" }, { value: "G6", label: "Grade 6 (Primary 6)" },
  { value: "G7", label: "Grade 7 (JSS 1)" }, { value: "G8", label: "Grade 8 (JSS 2)" }, { value: "G9", label: "Grade 9 (JSS 3)" },
  { value: "G10", label: "Grade 10 (SSS 1)" }, { value: "G11", label: "Grade 11 (SSS 2)" }, { value: "G12", label: "Grade 12 (SSS 3)" },
  { value: "UG", label: "Undergraduate" }, { value: "PG", label: "Postgraduate" },
];

export default function TeacherRegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [schools, setSchools] = useState<any[]>([]);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", countryCode: "NG",
    bio: "", yearsExperience: 1, teachingStyle: "", qualifications: [""],
    subjects: [] as string[], preferredGrades: [] as string[],
    schoolId: "",
  });

  useEffect(() => {
    fetch("/api/schools").then((r) => r.json()).then(setSchools).catch(() => {});
  }, []);

  const update = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const toggleSubject = (s: string) => {
    setForm((p) => ({
      ...p,
      subjects: p.subjects.includes(s) ? p.subjects.filter((x) => x !== s) : [...p.subjects, s],
    }));
  };

  const toggleGrade = (g: string) => {
    setForm((p) => ({
      ...p,
      preferredGrades: p.preferredGrades.includes(g) ? p.preferredGrades.filter((x) => x !== g) : [...p.preferredGrades, g],
    }));
  };

  const filteredSubjects = SUBJECT_OPTIONS.filter((s) =>
    s.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const result = await registerTeacher({
      ...form,
      qualifications: form.qualifications.filter((q) => q.trim()),
      schoolId: form.schoolId || undefined,
    });
    if (result.error) { setError(result.error); setLoading(false); return; }
    setSuccess(result.message || "Registration complete!");
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-emerald-600" /></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-sm text-gray-600 mb-6">{success}</p>
          <Link href="/login" className="btn-primary w-full inline-block text-center">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
          <span className="font-bold text-brand-600">GDA</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Teacher Registration</h1>
        <p className="text-sm text-gray-500 mb-6">Step {step} of 4</p>

        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? "bg-brand-600" : "bg-gray-200"}`} />
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        {/* Step 1: Account */}
        {step === 1 && (
          <div className="space-y-4">
            <div><label className="label">Full Name *</label><input type="text" className="input-field" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="John Doe" /></div>
            <div><label className="label">Email *</label><input type="email" className="input-field" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="teacher@example.com" /></div>
            <div><label className="label">Password *</label><input type="password" className="input-field" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min. 8 characters" /></div>
            <div><label className="label">Country *</label>
              <select className="input-field" value={form.countryCode} onChange={(e) => update("countryCode", e.target.value)}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select></div>
            <button onClick={() => { if (!form.name || !form.email || !form.password) { setError("Fill in all fields"); return; } setError(""); setStep(2); }} className="btn-primary w-full">Continue <ArrowRight className="w-4 h-4 ml-1" /></button>
          </div>
        )}

        {/* Step 2: Professional */}
        {step === 2 && (
          <div className="space-y-4">
            <div><label className="label">Bio / About You *</label><textarea className="input-field min-h-[80px]" value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Tell us about your teaching experience (min 20 characters)" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Years Experience *</label><input type="number" className="input-field" min={0} value={form.yearsExperience} onChange={(e) => update("yearsExperience", parseInt(e.target.value) || 0)} /></div>
              <div><label className="label">Teaching Style</label>
                <select className="input-field" value={form.teachingStyle} onChange={(e) => update("teachingStyle", e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Interactive">Interactive</option><option value="Lecture-based">Lecture-based</option>
                  <option value="Project-based">Project-based</option><option value="Discussion">Discussion</option><option value="Hands-on">Hands-on</option>
                </select></div>
            </div>
            <div>
              <label className="label">Qualifications</label>
              {form.qualifications.map((q, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input className="input-field flex-1" placeholder="e.g. B.Ed Mathematics" value={q}
                    onChange={(e) => { const up = [...form.qualifications]; up[i] = e.target.value; update("qualifications", up); }} />
                  {i > 0 && <button onClick={() => update("qualifications", form.qualifications.filter((_, j) => j !== i))} className="text-red-500 text-xs px-2">Remove</button>}
                </div>
              ))}
              <button onClick={() => update("qualifications", [...form.qualifications, ""])} className="text-xs text-brand-600 hover:underline">+ Add qualification</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
              <button onClick={() => { if (!form.bio || form.bio.length < 20) { setError("Bio must be at least 20 characters"); return; } setError(""); setStep(3); }} className="btn-primary flex-1">Continue <ArrowRight className="w-4 h-4 ml-1" /></button>
            </div>
          </div>
        )}

        {/* Step 3: Subjects & Grade Levels */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="label flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Subjects You Teach *</label>
              <p className="text-xs text-gray-500 mb-2">Select all subjects you can teach. This helps principals know your specialization.</p>

              <input className="input-field mb-2" placeholder="Search subjects..." value={subjectSearch} onChange={(e) => setSubjectSearch(e.target.value)} />

              {form.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {form.subjects.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 bg-brand-100 text-brand-700 text-xs px-2.5 py-1 rounded-full font-medium">
                      {s} <button onClick={() => toggleSubject(s)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}

              <div className="max-h-[200px] overflow-y-auto border border-gray-200 rounded-lg p-2 grid grid-cols-2 gap-1">
                {filteredSubjects.map((s) => (
                  <button key={s} onClick={() => toggleSubject(s)}
                    className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${form.subjects.includes(s) ? "bg-brand-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Grade Levels You Can Teach *</label>
              <p className="text-xs text-gray-500 mb-2">Select all grade levels you're comfortable teaching.</p>
              <div className="grid grid-cols-3 gap-1.5">
                {GRADE_OPTIONS.map((g) => (
                  <button key={g.value} onClick={() => toggleGrade(g.value)}
                    className={`text-xs px-2.5 py-2 rounded-lg transition-colors text-left ${form.preferredGrades.includes(g.value) ? "bg-emerald-600 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-ghost flex-1"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
              <button onClick={() => {
                if (form.subjects.length === 0) { setError("Select at least one subject"); return; }
                if (form.preferredGrades.length === 0) { setError("Select at least one grade level"); return; }
                setError(""); setStep(4);
              }} className="btn-primary flex-1">Continue <ArrowRight className="w-4 h-4 ml-1" /></button>
            </div>
          </div>
        )}

        {/* Step 4: School Selection */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="label">Select a School to Join (Optional)</label>
              <p className="text-xs text-gray-500 mb-3">The principal will see your subjects and grades when reviewing your application.</p>
              <select className="input-field" value={form.schoolId} onChange={(e) => update("schoolId", e.target.value)}>
                <option value="">— No school (join later) —</option>
                {schools.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.countryCode}) — {s._count.students} students, {s._count.teachers} teachers</option>
                ))}
              </select>
            </div>

            {form.schoolId && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1"><School className="w-4 h-4 text-amber-600" /><span className="text-sm font-semibold text-amber-800">Pending Approval</span></div>
                <p className="text-xs text-amber-700">Your application with your subjects ({form.subjects.join(", ")}) will be sent to the principal for review and interview.</p>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Your Profile Summary</h4>
              <div className="space-y-1.5 text-xs text-gray-700">
                <p><strong>Name:</strong> {form.name}</p>
                <p><strong>Experience:</strong> {form.yearsExperience} years • {form.teachingStyle || "Not specified"}</p>
                <p><strong>Subjects:</strong> {form.subjects.join(", ") || "None"}</p>
                <p><strong>Grades:</strong> {form.preferredGrades.map((g) => GRADE_OPTIONS.find((o) => o.value === g)?.label || g).join(", ") || "None"}</p>
                <p><strong>Qualifications:</strong> {form.qualifications.filter((q) => q).join(", ") || "None"}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="btn-ghost flex-1"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...</> : "Complete Registration"}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link href="/login" className="text-brand-600 font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
