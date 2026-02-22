"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Loader2, ChevronRight, ChevronLeft, Plus, X } from "lucide-react";
import { registerTeacher } from "@/lib/actions/auth";
import { getAllCountries } from "@/lib/education-systems";

const COUNTRIES = getAllCountries();

export default function TeacherRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newQual, setNewQual] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "", phone: "",
    countryCode: "", bio: "", yearsExperience: 0, teachingStyle: "",
    qualifications: [] as string[],
  });

  const update = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const addQualification = () => {
    if (newQual.trim() && !form.qualifications.includes(newQual.trim())) {
      update("qualifications", [...form.qualifications, newQual.trim()]);
      setNewQual("");
    }
  };

  const removeQualification = (q: string) => {
    update("qualifications", form.qualifications.filter((x: any) => x !== q));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!form.name || !form.email || !form.password) { setError("Please fill in all required fields"); return; }
      if (form.password !== form.confirmPassword) { setError("Passwords don't match"); return; }
      if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    }
    setError(""); setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bio || form.bio.length < 20) { setError("Bio must be at least 20 characters"); return; }
    if (form.qualifications.length === 0) { setError("Add at least one qualification"); return; }
    setLoading(true); setError("");

    try {
      const result = await registerTeacher(form);
      if (result.error) { setError(result.error); }
      else { router.push("/login?registered=teacher"); }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-brand-600">GDA</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Application</h1>
          <p className="text-gray-500 mt-1">Step {step} of 2</p>
          <div className="flex gap-2 mt-4 max-w-xs mx-auto">
            {[1, 2].map((s: any) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-emerald-500" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>

        <div className="card">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6 text-sm">{error}</div>}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
                <div>
                  <label className="label">Full Name *</label>
                  <input type="text" className="input-field" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Dr. Jane Smith" required />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input type="email" className="input-field" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="jane@example.com" required />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input type="password" className="input-field" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min. 8 characters" required />
                </div>
                <div>
                  <label className="label">Confirm Password *</label>
                  <input type="password" className="input-field" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required />
                </div>
                <div>
                  <label className="label">Country *</label>
                  <select className="input-field" value={form.countryCode} onChange={(e) => update("countryCode", e.target.value)} required>
                    <option value="">Select country</option>
                    {COUNTRIES.map((c: any) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <button type="button" onClick={nextStep} className="btn-primary w-full mt-2" style={{ background: "#059669" }}>
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Professional Details</h3>
                <div>
                  <label className="label">Bio / About You *</label>
                  <textarea className="input-field min-h-[100px]" value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Tell students about your teaching experience and style..." required />
                </div>
                <div>
                  <label className="label">Years of Experience *</label>
                  <input type="number" className="input-field" value={form.yearsExperience} onChange={(e) => update("yearsExperience", parseInt(e.target.value) || 0)} min={0} max={50} />
                </div>
                <div>
                  <label className="label">Teaching Style</label>
                  <select className="input-field" value={form.teachingStyle} onChange={(e) => update("teachingStyle", e.target.value)}>
                    <option value="">Select style</option>
                    <option value="interactive">Interactive & Discussion-based</option>
                    <option value="lecture">Lecture & Presentation</option>
                    <option value="practical">Hands-on & Practical</option>
                    <option value="mixed">Mixed / Adaptive</option>
                  </select>
                </div>
                <div>
                  <label className="label">Qualifications *</label>
                  <div className="flex gap-2 mb-2">
                    <input type="text" className="input-field flex-1" value={newQual} onChange={(e) => setNewQual(e.target.value)} placeholder="e.g. B.Ed Mathematics"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addQualification())} />
                    <button type="button" onClick={addQualification} className="btn-ghost border border-gray-300 px-3">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.qualifications.map((q: any) => (
                      <span key={q} className="badge-info flex items-center gap-1 py-1 px-3">
                        {q}
                        <button type="button" onClick={() => removeQualification(q)}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1" style={{ background: "#059669" }}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Application"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link href="/login" className="text-brand-500 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
