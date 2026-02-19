"use client";

import { useState, useEffect } from "react";
import { registerTeacher } from "@/lib/actions/auth";
import Link from "next/link";
import { GraduationCap, Loader2, ArrowLeft, ArrowRight, Check, School } from "lucide-react";

const COUNTRIES = [
  { code: "NG", name: "Nigeria" }, { code: "GH", name: "Ghana" }, { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" }, { code: "US", name: "United States" }, { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" }, { code: "AU", name: "Australia" }, { code: "IN", name: "India" },
  { code: "EG", name: "Egypt" }, { code: "TZ", name: "Tanzania" }, { code: "UG", name: "Uganda" },
  { code: "ET", name: "Ethiopia" }, { code: "CM", name: "Cameroon" }, { code: "SN", name: "Senegal" },
  { code: "RW", name: "Rwanda" }, { code: "ZM", name: "Zambia" },
];

export default function TeacherRegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [schools, setSchools] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "", email: "", password: "", countryCode: "NG",
    bio: "", yearsExperience: 1, teachingStyle: "", qualifications: [""],
    schoolId: "",
  });

  useEffect(() => {
    fetch("/api/schools").then((r) => r.json()).then(setSchools).catch(() => {});
  }, []);

  const update = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

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
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
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
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-brand-600">GDA</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Teacher Registration</h1>
        <p className="text-sm text-gray-500 mb-6">Step {step} of 3</p>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? "bg-brand-600" : "bg-gray-200"}`} />
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        {/* Step 1: Account */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input type="text" className="input-field" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="teacher@example.com" />
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input-field" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className="label">Country *</label>
              <select className="input-field" value={form.countryCode} onChange={(e) => update("countryCode", e.target.value)}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <button onClick={() => { if (!form.name || !form.email || !form.password) { setError("Fill in all required fields"); return; } setError(""); setStep(2); }} className="btn-primary w-full">
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}

        {/* Step 2: Professional */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label">Bio / About You *</label>
              <textarea className="input-field min-h-[80px]" value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Tell students about yourself (min 20 characters)" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Years Experience *</label>
                <input type="number" className="input-field" min={0} value={form.yearsExperience} onChange={(e) => update("yearsExperience", parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="label">Teaching Style</label>
                <select className="input-field" value={form.teachingStyle} onChange={(e) => update("teachingStyle", e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Interactive">Interactive</option>
                  <option value="Lecture-based">Lecture-based</option>
                  <option value="Project-based">Project-based</option>
                  <option value="Discussion">Discussion</option>
                  <option value="Hands-on">Hands-on</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Qualifications</label>
              {form.qualifications.map((q, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input className="input-field flex-1" placeholder={`e.g. B.Ed Mathematics`} value={q}
                    onChange={(e) => { const updated = [...form.qualifications]; updated[i] = e.target.value; update("qualifications", updated); }} />
                  {i > 0 && <button onClick={() => update("qualifications", form.qualifications.filter((_, j) => j !== i))} className="text-red-500 text-xs px-2">Remove</button>}
                </div>
              ))}
              <button onClick={() => update("qualifications", [...form.qualifications, ""])} className="text-xs text-brand-600 hover:underline">+ Add qualification</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
              <button onClick={() => { if (!form.bio || form.bio.length < 20) { setError("Bio must be at least 20 characters"); return; } setError(""); setStep(3); }} className="btn-primary flex-1">
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: School Selection */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="label">Select a School to Join (Optional)</label>
              <p className="text-xs text-gray-500 mb-3">You can request to join a school now, or do it later from your dashboard. The principal will approve your request.</p>
              <select className="input-field" value={form.schoolId} onChange={(e) => update("schoolId", e.target.value)}>
                <option value="">— No school (join later) —</option>
                {schools.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.countryCode}) — {s._count.students} students, {s._count.teachers} teachers
                  </option>
                ))}
              </select>
            </div>

            {form.schoolId && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <School className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">Pending Approval</span>
                </div>
                <p className="text-xs text-amber-700">Your request will be sent to the school principal for approval. You can log in immediately but won't be able to create classes until approved.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-ghost flex-1"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
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
