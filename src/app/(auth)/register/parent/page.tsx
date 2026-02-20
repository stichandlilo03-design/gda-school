"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Loader2, ChevronRight, ChevronLeft, Plus, Trash2, Search, CheckCircle } from "lucide-react";
import { registerParent } from "@/lib/actions/auth";
import { getAllCountries } from "@/lib/education-systems";

const COUNTRIES = getAllCountries();
const RELATIONSHIPS = ["Parent", "Guardian", "Mother", "Father", "Uncle", "Aunt", "Grandparent", "Sibling", "Other"];

export default function ParentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    phone: "", countryCode: "", occupation: "", address: "", relationship: "Parent",
  });
  const [children, setChildren] = useState([{ childName: "", childEmail: "", schoolName: "" }]);

  const update = (field: string, value: string) => { setForm(p => ({ ...p, [field]: value })); setError(""); };
  const updateChild = (i: number, field: string, value: string) => {
    setChildren(p => p.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };
  const addChild = () => setChildren(p => [...p, { childName: "", childEmail: "", schoolName: "" }]);
  const removeChild = (i: number) => { if (children.length > 1) setChildren(p => p.filter((_, idx) => idx !== i)); };

  const nextStep = () => {
    if (step === 1 && (!form.name || !form.email || !form.password || !form.confirmPassword)) { setError("Fill all required fields"); return; }
    if (step === 1 && form.password !== form.confirmPassword) { setError("Passwords don't match"); return; }
    if (step === 1 && form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (step === 2 && !form.countryCode) { setError("Select your country"); return; }
    setError(""); setStep(step + 1);
  };

  const handleSubmit = async () => {
    const validChildren = children.filter(c => c.childName.trim().length >= 2);
    if (validChildren.length === 0) { setError("Add at least one child's name"); return; }
    setLoading(true); setError("");
    try {
      const r = await registerParent({ ...form, childrenInfo: validChildren });
      if (r.error) { setError(r.error); setLoading(false); return; }
      setResult(r);
    } catch (e: any) { setError(e.message || "Registration failed"); }
    setLoading(false);
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Welcome, {form.name}!</h2>
          <p className="text-sm text-gray-500 mt-2">{result.message}</p>
          {result.linkedChildren?.length > 0 && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl">
              <p className="text-xs font-medium text-emerald-700">✅ Children linked:</p>
              {result.linkedChildren.map((n: string, i: number) => (
                <p key={i} className="text-sm font-bold text-emerald-800 mt-1">{n}</p>
              ))}
            </div>
          )}
          {result.linkedChildren?.length === 0 && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl">
              <p className="text-xs text-amber-700">No children found yet. You can link them from your dashboard using their student email or school details.</p>
            </div>
          )}
          <button onClick={() => router.push("/login")} className="btn-primary w-full mt-6">Sign In to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center mx-auto mb-3">
            <Heart className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Parent / Guardian Registration</h1>
          <p className="text-xs text-gray-500 mt-1">Create your account to track your children&apos;s education</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? "bg-rose-500" : "bg-gray-200"}`} />
          ))}
        </div>
        <p className="text-[10px] text-gray-400 text-center mb-4">
          Step {step}/3: {step === 1 ? "Your Account" : step === 2 ? "Personal Details" : "Your Children"}
        </p>

        {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs mb-4">{error}</div>}

        {/* STEP 1: Account */}
        {step === 1 && (
          <div className="space-y-3">
            <div><label className="label">Full Name *</label><input className="input-field" placeholder="Enter your full name" value={form.name} onChange={e => update("name", e.target.value)} /></div>
            <div><label className="label">Email *</label><input type="email" className="input-field" placeholder="your@email.com" value={form.email} onChange={e => update("email", e.target.value)} /></div>
            <div><label className="label">Phone</label><input className="input-field" placeholder="+234..." value={form.phone} onChange={e => update("phone", e.target.value)} /></div>
            <div><label className="label">Password *</label><input type="password" className="input-field" placeholder="Min 8 characters" value={form.password} onChange={e => update("password", e.target.value)} /></div>
            <div><label className="label">Confirm Password *</label><input type="password" className="input-field" placeholder="Re-enter password" value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)} /></div>
          </div>
        )}

        {/* STEP 2: Personal */}
        {step === 2 && (
          <div className="space-y-3">
            <div><label className="label">Country *</label>
              <select className="input-field" value={form.countryCode} onChange={e => update("countryCode", e.target.value)}>
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </div>
            <div><label className="label">Relationship to Child(ren)</label>
              <select className="input-field" value={form.relationship} onChange={e => update("relationship", e.target.value)}>
                {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="label">Occupation</label><input className="input-field" placeholder="e.g. Engineer, Doctor" value={form.occupation} onChange={e => update("occupation", e.target.value)} /></div>
            <div><label className="label">Home Address</label><textarea className="input-field min-h-[60px]" placeholder="Your address" value={form.address} onChange={e => update("address", e.target.value)} /></div>
          </div>
        )}

        {/* STEP 3: Children */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <p className="text-xs text-rose-700"><Search className="w-3 h-3 inline mr-1" /><strong>How linking works:</strong> Enter your child&apos;s <strong>name</strong> and/or <strong>email</strong> (the one they used to register). We&apos;ll automatically match and link them to your dashboard.</p>
            </div>

            {children.map((child, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600">Child {i + 1}</span>
                  {children.length > 1 && (
                    <button onClick={() => removeChild(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
                <div><label className="label">Child&apos;s Full Name *</label><input className="input-field bg-white" placeholder="As registered in school" value={child.childName} onChange={e => updateChild(i, "childName", e.target.value)} /></div>
                <div><label className="label">Child&apos;s Email (if they have a student account)</label><input type="email" className="input-field bg-white" placeholder="child@email.com" value={child.childEmail} onChange={e => updateChild(i, "childEmail", e.target.value)} /></div>
                <div><label className="label">School Name (optional)</label><input className="input-field bg-white" placeholder="Helps narrow the search" value={child.schoolName} onChange={e => updateChild(i, "schoolName", e.target.value)} /></div>
              </div>
            ))}

            <button onClick={addChild} className="w-full p-2.5 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-rose-300 hover:text-rose-500 flex items-center justify-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Another Child
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={nextStep} className="flex-1 btn-primary py-3 flex items-center justify-center gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="flex-1 btn-primary py-3 flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
              {loading ? "Creating Account..." : "Create Parent Account"}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account? <Link href="/login" className="text-rose-500 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
