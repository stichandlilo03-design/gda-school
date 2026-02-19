"use client";

import { useState, useEffect } from "react";
import { registerStudent } from "@/lib/actions/auth";
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

const GRADES = [
  { value: "K1", label: "Kindergarten 1" }, { value: "K2", label: "Kindergarten 2" }, { value: "K3", label: "Kindergarten 3" },
  { value: "G1", label: "Grade 1" }, { value: "G2", label: "Grade 2" }, { value: "G3", label: "Grade 3" },
  { value: "G4", label: "Grade 4" }, { value: "G5", label: "Grade 5" }, { value: "G6", label: "Grade 6" },
  { value: "G7", label: "Grade 7 (JSS1)" }, { value: "G8", label: "Grade 8 (JSS2)" }, { value: "G9", label: "Grade 9 (JSS3)" },
  { value: "G10", label: "Grade 10 (SS1)" }, { value: "G11", label: "Grade 11 (SS2)" }, { value: "G12", label: "Grade 12 (SS3)" },
];

const SESSIONS = [
  { value: "SESSION_A", label: "Morning (06:00–10:00 UTC)" },
  { value: "SESSION_B", label: "Afternoon (14:00–18:00 UTC)" },
  { value: "SESSION_C", label: "Evening (22:00–02:00 UTC)" },
];

export default function StudentRegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [schools, setSchools] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", countryCode: "NG",
    gradeLevel: "G1", preferredSession: "SESSION_A", dateOfBirth: "",
    parentName: "", parentEmail: "", parentPhone: "",
    schoolId: "",
  });

  useEffect(() => {
    fetch("/api/schools").then((r) => r.json()).then(setSchools).catch(() => {});
  }, []);

  const update = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!form.schoolId) { setError("Please select a school"); return; }
    setLoading(true);
    setError("");
    const result = await registerStudent(form);
    if (result.error) { setError(result.error); setLoading(false); return; }
    setSuccess(result.message || "Registration submitted!");
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <School className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-sm text-gray-600 mb-2">{success}</p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
            <p className="text-xs text-amber-700">You can log in now, but full access will be available once the principal approves your application. You will see a pending status on your dashboard.</p>
          </div>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Student Registration</h1>
        <p className="text-sm text-gray-500 mb-6">Step {step} of 3</p>

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
              <input type="text" className="input-field" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="student@example.com" />
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input-field" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className="label">Phone (Optional)</label>
              <input type="tel" className="input-field" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234..." />
            </div>
            <button onClick={() => { if (!form.name || !form.email || !form.password) { setError("Fill in all required fields"); return; } setError(""); setStep(2); }} className="btn-primary w-full">
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}

        {/* Step 2: School & Academic Info */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label">Select School *</label>
              <select className="input-field" value={form.schoolId} onChange={(e) => update("schoolId", e.target.value)}>
                <option value="">— Choose a school —</option>
                {schools.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.countryCode}) {s.motto ? `— ${s.motto}` : ""}
                  </option>
                ))}
              </select>
              {schools.length === 0 && <p className="text-xs text-amber-600 mt-1">No schools available yet. A principal must create one first.</p>}
            </div>
            <div>
              <label className="label">Country *</label>
              <select className="input-field" value={form.countryCode} onChange={(e) => update("countryCode", e.target.value)}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Grade Level *</label>
              <select className="input-field" value={form.gradeLevel} onChange={(e) => update("gradeLevel", e.target.value)}>
                {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Preferred Session *</label>
                <select className="input-field" value={form.preferredSession} onChange={(e) => update("preferredSession", e.target.value)}>
                  {SESSIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input type="date" className="input-field" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">Your application will be reviewed by the school principal. You can log in immediately but full access requires approval.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
              <button onClick={() => { if (!form.schoolId) { setError("Please select a school"); return; } setError(""); setStep(3); }} className="btn-primary flex-1">
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Parent/Guardian */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Parent/Guardian information (required for students under 13)</p>
            <div>
              <label className="label">Parent/Guardian Name</label>
              <input type="text" className="input-field" value={form.parentName} onChange={(e) => update("parentName", e.target.value)} placeholder="Parent's full name" />
            </div>
            <div>
              <label className="label">Parent Email</label>
              <input type="email" className="input-field" value={form.parentEmail} onChange={(e) => update("parentEmail", e.target.value)} placeholder="parent@example.com" />
            </div>
            <div>
              <label className="label">Parent Phone</label>
              <input type="tel" className="input-field" value={form.parentPhone} onChange={(e) => update("parentPhone", e.target.value)} placeholder="+234..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-ghost flex-1"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Application"}
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
