"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { registerStudent } from "@/lib/actions/auth";
import { getEducationSystem, getAllCountries } from "@/lib/education-systems";

const COUNTRIES = getAllCountries();

const SESSIONS = [
  { value: "SESSION_A", label: "Morning Session (06:00–10:00 UTC)", desc: "Best for Africa, Europe, Middle East" },
  { value: "SESSION_B", label: "Afternoon Session (14:00–18:00 UTC)", desc: "Best for Asia, Oceania" },
  { value: "SESSION_C", label: "Evening Session (22:00–02:00 UTC)", desc: "Best for Americas" },
];

export default function StudentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    countryCode: "",
    gradeLevel: "",
    schoolId: "default-school",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    dateOfBirth: "",
    preferredSession: "SESSION_A" as const,
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const nextStep = () => {
    if (step === 1 && (!form.name || !form.email || !form.password || !form.confirmPassword)) {
      setError("Please fill in all required fields");
      return;
    }
    if (step === 1 && form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (step === 1 && form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.countryCode || !form.gradeLevel) {
      setError("Please select your country and grade level");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const result = await registerStudent(form);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/login?registered=true");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-brand-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-brand-600">GDA</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Student Registration</h1>
          <p className="text-gray-500 mt-1">Step {step} of 3</p>
          <div className="flex gap-2 mt-4 max-w-xs mx-auto">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-brand-500" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
                <div>
                  <label className="label">Full Name *</label>
                  <input type="text" className="input-field" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="John Doe" required />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input type="email" className="input-field" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" required />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input type="password" className="input-field" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min. 8 characters" required />
                </div>
                <div>
                  <label className="label">Confirm Password *</label>
                  <input type="password" className="input-field" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Re-enter password" required />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input type="tel" className="input-field" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234 801 234 5678" />
                </div>
                <button type="button" onClick={nextStep} className="btn-primary w-full mt-2">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}

            {/* Step 2: School Info */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">School Information</h3>
                <div>
                  <label className="label">Country *</label>
                  <select className="input-field" value={form.countryCode} onChange={(e) => { update("countryCode", e.target.value); update("gradeLevel", ""); }} required>
                    <option value="">Select your country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Grade Level *</label>
                  {form.countryCode ? (() => {
                    const sys = getEducationSystem(form.countryCode);
                    return (
                      <>
                        <p className="text-[10px] text-brand-600 mb-1">{sys.flag} {sys.systemName}</p>
                        <select className="input-field" value={form.gradeLevel} onChange={(e) => update("gradeLevel", e.target.value)} required>
                          <option value="">Select your level</option>
                          {sys.levels.map((level) => (
                            <optgroup key={level.section} label={level.section}>
                              {level.grades.map((g) => (
                                <option key={g.value} value={g.value}>{g.label} (Ages {g.ageRange})</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </>
                    );
                  })() : (
                    <select className="input-field" disabled>
                      <option>Select country first</option>
                    </select>
                  )}
                  </select>
                </div>
                <div>
                  <label className="label">Preferred Session *</label>
                  <div className="space-y-2">
                    {SESSIONS.map((s) => (
                      <label key={s.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.preferredSession === s.value ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <input type="radio" name="session" value={s.value} checked={form.preferredSession === s.value} onChange={(e) => update("preferredSession", e.target.value)} className="text-brand-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-800">{s.label}</div>
                          <div className="text-xs text-gray-500">{s.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Date of Birth</label>
                  <input type="date" className="input-field" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                  <button type="button" onClick={nextStep} className="btn-primary flex-1">
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Parent/Guardian */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Parent / Guardian (Optional)</h3>
                <p className="text-sm text-gray-500 mb-4">Required for students under 13 years old.</p>
                <div>
                  <label className="label">Parent/Guardian Name</label>
                  <input type="text" className="input-field" value={form.parentName} onChange={(e) => update("parentName", e.target.value)} placeholder="Parent's full name" />
                </div>
                <div>
                  <label className="label">Parent/Guardian Email</label>
                  <input type="email" className="input-field" value={form.parentEmail} onChange={(e) => update("parentEmail", e.target.value)} placeholder="parent@example.com" />
                </div>
                <div>
                  <label className="label">Parent/Guardian Phone</label>
                  <input type="tel" className="input-field" value={form.parentPhone} onChange={(e) => update("parentPhone", e.target.value)} placeholder="+234 801 234 5678" />
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(2)} className="btn-ghost flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
                    ) : (
                      "Complete Registration"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-500 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
