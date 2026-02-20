"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Loader2, Building2 } from "lucide-react";
import { registerPrincipal } from "@/lib/actions/auth";
import { getAllCountries } from "@/lib/education-systems";

const COUNTRIES = getAllCountries();

export default function PrincipalRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "", phone: "",
    countryCode: "", schoolName: "", schoolMotto: "", currency: "USD",
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "countryCode") {
      const country = COUNTRIES.find((c) => c.code === value);
      if (country) setForm((prev) => ({ ...prev, countryCode: value, currency: country.currency }));
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError("Passwords don't match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");

    try {
      const result = await registerPrincipal(form);
      if (result.error) { setError(result.error); }
      else { router.push("/login?registered=principal"); }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-brand-600">GDA</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Your School</h1>
          <p className="text-gray-500 mt-1">Set up your digital school and start enrolling students</p>
        </div>

        <div className="card">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3 mb-4">
              <Building2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">As a principal, you&apos;ll create and manage your own school — set fees, hire teachers, manage students, and control your curriculum.</p>
            </div>

            <h3 className="text-lg font-semibold text-gray-800">Your Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full Name *</label>
                <input type="text" className="input-field" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>
              <div className="col-span-2">
                <label className="label">Email *</label>
                <input type="email" className="input-field" value={form.email} onChange={(e) => update("email", e.target.value)} required />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" className="input-field" value={form.password} onChange={(e) => update("password", e.target.value)} required />
              </div>
              <div>
                <label className="label">Confirm Password *</label>
                <input type="password" className="input-field" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required />
              </div>
            </div>

            <div className="border-t border-gray-100 my-6" />

            <h3 className="text-lg font-semibold text-gray-800">School Details</h3>
            <div>
              <label className="label">School Name *</label>
              <input type="text" className="input-field" value={form.schoolName} onChange={(e) => update("schoolName", e.target.value)} placeholder="e.g. Bright Future Academy" required />
            </div>
            <div>
              <label className="label">School Motto</label>
              <input type="text" className="input-field" value={form.schoolMotto} onChange={(e) => update("schoolMotto", e.target.value)} placeholder="e.g. Knowledge is Power" />
            </div>
            <div>
              <label className="label">Country *</label>
              <select className="input-field" value={form.countryCode} onChange={(e) => update("countryCode", e.target.value)} required>
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.currency})</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-accent w-full py-3.5 mt-4">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating School...</> : "Create School & Register"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link href="/login" className="text-brand-500 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
