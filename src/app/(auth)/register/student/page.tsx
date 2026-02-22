"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Loader2, ChevronRight, ChevronLeft, School, MapPin, Search, Globe, CheckCircle } from "lucide-react";
import { registerStudent } from "@/lib/actions/auth";
import { getEducationSystem, getAllCountries } from "@/lib/education-systems";

const ALL_COUNTRIES = getAllCountries();

const SESSIONS = [
  { value: "SESSION_A", label: "Morning Session (06:00–10:00 UTC)", desc: "Best for Africa, Europe, Middle East" },
  { value: "SESSION_B", label: "Afternoon Session (14:00–18:00 UTC)", desc: "Best for Asia, Oceania" },
  { value: "SESSION_C", label: "Evening Session (22:00–02:00 UTC)", desc: "Best for Americas" },
];

interface SchoolInfo {
  id: string; name: string; logo: string | null; motto: string | null; gradeCount: number;
}

export default function StudentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    phone: "", countryCode: "", gradeLevel: "",
    schoolId: "", parentName: "", parentEmail: "",
    parentPhone: "", dateOfBirth: "",
    preferredSession: "SESSION_A" as const,
  });

  // School discovery
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schoolsByCountry, setSchoolsByCountry] = useState<Record<string, SchoolInfo[]>>({});
  const [availableCountries, setAvailableCountries] = useState<{ code: string; schoolCount: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch available schools on mount
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/schools/available");
        if (r.ok) {
          const d = await r.json();
          setSchoolsByCountry(d.schools || {});
          setAvailableCountries(d.countries || []);
        }
      } catch (_e) {}
      setSchoolsLoading(false);
    };
    load();
  }, []);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const nextStep = () => {
    if (step === 1 && (!form.name || !form.email || !form.password || !form.confirmPassword)) {
      setError("Please fill in all required fields"); return;
    }
    if (step === 1 && form.password !== form.confirmPassword) {
      setError("Passwords don't match"); return;
    }
    if (step === 1 && form.password.length < 8) {
      setError("Password must be at least 8 characters"); return;
    }
    if (step === 2 && !form.schoolId) {
      setError("Please select a school"); return;
    }
    if (step === 3 && (!form.countryCode || !form.gradeLevel)) {
      setError("Please select your grade level"); return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.schoolId || !form.countryCode || !form.gradeLevel) {
      setError("Please complete all required fields"); return;
    }
    setLoading(true); setError("");
    try {
      const result = await registerStudent(form);
      if (result.error) setError(result.error);
      else router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  // Derived data
  const countrySchools = form.countryCode ? (schoolsByCountry[form.countryCode] || []) : [];
  const hasSchools = countrySchools.length > 0;
  const selectedSchool = countrySchools.find(s => s.id === form.schoolId);
  const totalSchools = availableCountries.reduce((sum: number, c: any) => sum + c.schoolCount, 0);

  const countriesWithSchools = availableCountries
    .map(ac => {
      const info = ALL_COUNTRIES.find(c => c.code === ac.code);
      return { ...ac, name: info?.name || ac.code, flag: info?.flag || "🌍" };
    })
    .sort((a, b) => b.schoolCount - a.schoolCount);

  const filteredCountries = searchQuery
    ? ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : ALL_COUNTRIES;

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
          <p className="text-gray-500 mt-1">Step {step} of 4</p>
          <div className="flex gap-2 mt-4 max-w-xs mx-auto">
            {[1, 2, 3, 4].map((s: any) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-brand-500" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {/* =========== Step 1: Account Info =========== */}
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

            {/* =========== Step 2: Find Your School =========== */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Find Your School</h3>
                <p className="text-sm text-gray-500">
                  {totalSchools > 0
                    ? <>{totalSchools} school{totalSchools > 1 ? "s" : ""} available in {availableCountries.length} countr{availableCountries.length > 1 ? "ies" : "y"}. Select yours below.</>
                    : "Select your country to find available schools."
                  }
                </p>

                {schoolsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading available schools...</p>
                  </div>
                ) : totalSchools === 0 ? (
                  <div className="text-center py-8 bg-amber-50 border border-amber-200 rounded-xl">
                    <Globe className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                    <h4 className="font-bold text-amber-800 mb-1">No Schools Available Yet</h4>
                    <p className="text-sm text-amber-700">Schools are being set up. Please check back soon or contact support.</p>
                  </div>
                ) : (
                  <>
                    {/* Country selector with search */}
                    <div>
                      <label className="label flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Your Country *</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" className="input-field pl-9" placeholder="Search countries..."
                          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                      </div>
                      <div className="max-h-40 overflow-y-auto mt-2 border rounded-lg divide-y">
                        {filteredCountries.map((c: any) => {
                          const schoolCount = availableCountries.find(ac => ac.code === c.code)?.schoolCount || 0;
                          const hasS = schoolCount > 0;
                          return (
                            <button key={c.code} type="button"
                              onClick={() => { update("countryCode", c.code); update("schoolId", ""); update("gradeLevel", ""); setSearchQuery(""); }}
                              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition ${
                                form.countryCode === c.code ? "bg-brand-50 border-l-4 border-brand-500" : ""
                              }`}>
                              <span className="flex items-center gap-2">
                                <span>{c.flag}</span>
                                <span className={form.countryCode === c.code ? "font-bold text-brand-700" : "text-gray-700"}>{c.name}</span>
                              </span>
                              {hasS ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{schoolCount} school{schoolCount > 1 ? "s" : ""}</span>
                              ) : (
                                <span className="text-[10px] text-gray-400">No schools</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Schools list or no-schools message */}
                    {form.countryCode && (
                      <>
                        {hasSchools ? (
                          <div>
                            <label className="label flex items-center gap-1"><School className="w-3.5 h-3.5" /> Select School *</label>
                            <div className="space-y-2">
                              {countrySchools.map((s: any) => (
                                <button key={s.id} type="button"
                                  onClick={() => update("schoolId", s.id)}
                                  className={`w-full text-left p-3 rounded-xl border-2 transition ${
                                    form.schoolId === s.id
                                      ? "border-brand-500 bg-brand-50 ring-1 ring-brand-200"
                                      : "border-gray-200 hover:border-brand-200 hover:bg-gray-50"
                                  }`}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                                      {s.logo ? (
                                        <img src={s.logo} alt="" className="w-8 h-8 rounded object-cover" />
                                      ) : (
                                        <School className="w-5 h-5 text-brand-600" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                        {s.name}
                                        {form.schoolId === s.id && <CheckCircle className="w-4 h-4 text-brand-500" />}
                                      </p>
                                      {s.motto && <p className="text-[11px] text-gray-500 italic truncate">{s.motto}</p>}
                                      <p className="text-[10px] text-gray-400 mt-0.5">{s.gradeCount} grade level{s.gradeCount !== 1 ? "s" : ""} available</p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-bold text-amber-800 text-sm">
                                  No schools in {ALL_COUNTRIES.find(c => c.code === form.countryCode)?.flag} {ALL_COUNTRIES.find(c => c.code === form.countryCode)?.name} yet
                                </h4>
                                <p className="text-xs text-amber-700 mt-1 mb-3">Schools are currently available in these countries. You can register with any of them:</p>
                                <div className="space-y-1.5">
                                  {countriesWithSchools.map(c => (
                                    <button key={c.code} type="button"
                                      onClick={() => { update("countryCode", c.code); update("schoolId", ""); update("gradeLevel", ""); }}
                                      className="flex items-center gap-2 w-full text-left px-3 py-2 bg-white rounded-lg border border-amber-200 hover:border-brand-300 hover:bg-brand-50 transition">
                                      <span className="text-lg">{c.flag}</span>
                                      <span className="text-sm font-medium text-gray-800">{c.name}</span>
                                      <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                        {c.schoolCount} school{c.schoolCount > 1 ? "s" : ""}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Confirmation chip */}
                    {selectedSchool && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-emerald-800">Joining: {selectedSchool.name}</p>
                          <p className="text-[10px] text-emerald-600">You&apos;ll select your grade level next</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                  <button type="button" onClick={nextStep} disabled={!form.schoolId} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* =========== Step 3: Grade & Session =========== */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Grade Level & Session</h3>

                {selectedSchool && (
                  <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 mb-2 flex items-center gap-3">
                    <School className="w-5 h-5 text-brand-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-brand-800">{selectedSchool.name}</p>
                      <p className="text-[10px] text-brand-600">
                        {ALL_COUNTRIES.find(c => c.code === form.countryCode)?.flag}{" "}
                        {ALL_COUNTRIES.find(c => c.code === form.countryCode)?.name}
                      </p>
                    </div>
                    <button type="button" onClick={() => setStep(2)} className="ml-auto text-[10px] text-brand-600 hover:text-brand-800 font-medium">Change</button>
                  </div>
                )}

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
                              {level.grades.map((g: any) => (
                                <option key={g.value} value={g.value}>{g.label} (Ages {g.ageRange})</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </>
                    );
                  })() : (
                    <select className="input-field" disabled>
                      <option>Go back and select a school first</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="label">Preferred Session *</label>
                  <div className="space-y-2">
                    {SESSIONS.map((s: any) => (
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
                  <button type="button" onClick={() => setStep(2)} className="btn-ghost flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                  <button type="button" onClick={nextStep} className="btn-primary flex-1">
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* =========== Step 4: Parent/Guardian =========== */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Parent / Guardian (Optional)</h3>
                <p className="text-sm text-gray-500 mb-4">Required for students under 13 years old.</p>

                <div className="bg-gray-50 border rounded-xl p-3 space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Registration Summary</p>
                  <p className="text-sm text-gray-700"><span className="font-medium">School:</span> {selectedSchool?.name || "—"}</p>
                  <p className="text-sm text-gray-700"><span className="font-medium">Country:</span> {ALL_COUNTRIES.find(c => c.code === form.countryCode)?.flag} {ALL_COUNTRIES.find(c => c.code === form.countryCode)?.name}</p>
                  <p className="text-sm text-gray-700"><span className="font-medium">Grade:</span> {form.gradeLevel}</p>
                  <p className="text-sm text-gray-700"><span className="font-medium">Session:</span> {SESSIONS.find(s => s.value === form.preferredSession)?.label}</p>
                </div>

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
                  <button type="button" onClick={() => setStep(3)} className="btn-ghost flex-1">
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
