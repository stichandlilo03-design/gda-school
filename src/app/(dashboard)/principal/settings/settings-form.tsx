"use client";

import { useState } from "react";
import { updateSchoolSettings } from "@/lib/actions/school";
import { Loader2, Save, Palette } from "lucide-react";

interface School {
  id: string;
  name: string;
  motto: string | null;
  primaryColor: string;
  secondaryColor: string;
  rulesText: string | null;
  anthemLyrics: string | null;
  countryCode: string;
  currency: string;
  slug: string;
}

export default function SchoolSettingsForm({ school }: { school: School }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: school.name,
    motto: school.motto || "",
    primaryColor: school.primaryColor,
    secondaryColor: school.secondaryColor,
    rulesText: school.rulesText || "",
    anthemLyrics: school.anthemLyrics || "",
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const result = await updateSchoolSettings(form);
    if (result.error) setMessage("Error: " + result.error);
    else setMessage("Settings saved successfully!");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.includes("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {message}
        </div>
      )}

      <div className="card">
        <h3 className="section-title mb-4">School Identity</h3>
        <div className="space-y-4">
          <div>
            <label className="label">School Name *</label>
            <input type="text" className="input-field" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div>
            <label className="label">School Motto</label>
            <input type="text" className="input-field" value={form.motto} onChange={(e) => update("motto", e.target.value)} placeholder="e.g. Knowledge is Power" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                <input type="text" className="input-field flex-1" value={form.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.secondaryColor} onChange={(e) => update("secondaryColor", e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                <input type="text" className="input-field flex-1" value={form.secondaryColor} onChange={(e) => update("secondaryColor", e.target.value)} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: form.primaryColor }}>
            <span className="font-bold" style={{ color: form.secondaryColor }}>{form.name}</span>
            {form.motto && <span className="ml-2 text-sm" style={{ color: form.secondaryColor + "cc" }}>— {form.motto}</span>}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title mb-4">School Rules</h3>
        <textarea className="input-field min-h-[150px]" value={form.rulesText} onChange={(e) => update("rulesText", e.target.value)} placeholder="Enter your school rules here. Each rule on a new line..." />
      </div>

      <div className="card">
        <h3 className="section-title mb-4">School Anthem</h3>
        <textarea className="input-field min-h-[120px]" value={form.anthemLyrics} onChange={(e) => update("anthemLyrics", e.target.value)} placeholder="Enter your school anthem lyrics..." />
      </div>

      <div className="card bg-gray-50 border-dashed">
        <p className="text-xs text-gray-500 mb-1">School Info (Read Only)</p>
        <p className="text-sm text-gray-700">Country: <strong>{school.countryCode}</strong> • Currency: <strong>{school.currency}</strong> • Slug: <strong>{school.slug}</strong></p>
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
      </button>
    </form>
  );
}
