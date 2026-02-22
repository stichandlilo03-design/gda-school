"use client";

import { useState } from "react";
import { updateSchoolSettings } from "@/lib/actions/school";
import { Loader2, Save, Clock, Coffee } from "lucide-react";

interface School {
  id: string; name: string; motto: string | null;
  primaryColor: string; secondaryColor: string;
  rulesText: string | null; anthemLyrics: string | null; nationalAnthem: string | null;
  countryCode: string; currency: string; slug: string;
  sessionDurationMin?: number; breakDurationMin?: number; sessionsPerDay?: number;
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
    nationalAnthem: school.nationalAnthem || "",
    sessionDurationMin: school.sessionDurationMin || 40,
    breakDurationMin: school.breakDurationMin || 10,
    sessionsPerDay: school.sessionsPerDay || 4,
  });

  const update = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const result = await updateSchoolSettings(form);
    if (result.error) setMessage("Error: " + result.error);
    else setMessage("Settings saved successfully!");
    setLoading(false);
  };

  // Compute daily timetable preview
  const totalClassMin = form.sessionsPerDay * form.sessionDurationMin;
  const totalBreakMin = (form.sessionsPerDay - 1) * form.breakDurationMin;
  const totalSchoolMin = totalClassMin + totalBreakMin;
  const schoolHours = Math.floor(totalSchoolMin / 60);
  const schoolRem = totalSchoolMin % 60;

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

      {/* SESSION TIMING */}
      <div className="card border-2 border-blue-200">
        <h3 className="section-title mb-1 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600" /> Session & Break Timing</h3>
        <p className="text-xs text-gray-500 mb-4">Controls how long each class runs, break times, and sessions per day. This affects auto-session timing, break alerts, and teacher pay calculation.</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Session Duration (min)</label>
            <input type="number" className="input-field" min={10} max={120} value={form.sessionDurationMin}
              onChange={(e) => update("sessionDurationMin", parseInt(e.target.value) || 40)} />
            <p className="text-[10px] text-gray-400 mt-1">How long each class lasts</p>
          </div>
          <div>
            <label className="label">Break Duration (min)</label>
            <input type="number" className="input-field" min={0} max={60} value={form.breakDurationMin}
              onChange={(e) => update("breakDurationMin", parseInt(e.target.value) || 10)} />
            <p className="text-[10px] text-gray-400 mt-1">Break between sessions</p>
          </div>
          <div>
            <label className="label">Sessions Per Day</label>
            <input type="number" className="input-field" min={1} max={10} value={form.sessionsPerDay}
              onChange={(e) => update("sessionsPerDay", parseInt(e.target.value) || 4)} />
            <p className="text-[10px] text-gray-400 mt-1">Classes per teacher/day</p>
          </div>
        </div>

        {/* Timetable preview */}
        <div className="mt-4 p-4 bg-blue-50 rounded-xl">
          <h4 className="text-xs font-bold text-blue-800 mb-2">📅 Daily Timetable Preview</h4>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from({ length: form.sessionsPerDay }).map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-lg font-bold">
                  Session {i + 1} ({form.sessionDurationMin}min)
                </span>
                {i < form.sessionsPerDay - 1 && (
                  <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-1 rounded-lg flex items-center gap-0.5">
                    <Coffee className="w-2.5 h-2.5" /> {form.breakDurationMin}min
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white p-2 rounded-lg">
              <p className="text-lg font-bold text-blue-700">{totalClassMin}min</p>
              <p className="text-[9px] text-blue-500">Teaching Time</p>
            </div>
            <div className="bg-white p-2 rounded-lg">
              <p className="text-lg font-bold text-amber-700">{totalBreakMin}min</p>
              <p className="text-[9px] text-amber-500">Break Time</p>
            </div>
            <div className="bg-white p-2 rounded-lg">
              <p className="text-lg font-bold text-gray-700">{schoolHours}h {schoolRem}m</p>
              <p className="text-[9px] text-gray-500">Total School Day</p>
            </div>
          </div>
          <p className="text-[9px] text-blue-600 mt-2">
            💰 Teacher pay per session = Monthly Salary ÷ ({form.sessionsPerDay} sessions × working days)
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title mb-4">School Rules</h3>
        <textarea className="input-field min-h-[150px]" value={form.rulesText} onChange={(e) => update("rulesText", e.target.value)} placeholder="Enter your school rules here..." />
      </div>

      <div className="card">
        <h3 className="section-title mb-4">School Anthem</h3>
        <textarea className="input-field min-h-[120px]" value={form.anthemLyrics} onChange={(e) => update("anthemLyrics", e.target.value)} placeholder="Enter school anthem lyrics..." />
      </div>

      <div className="card">
        <h3 className="section-title mb-4">🏳️ National Anthem</h3>
        <p className="text-xs text-gray-500 mb-2">Enter your country&apos;s national anthem. Teachers and students will see this and can have it read aloud.</p>
        <textarea className="input-field min-h-[120px]" value={form.nationalAnthem} onChange={(e) => update("nationalAnthem", e.target.value)} placeholder="Enter national anthem lyrics..." />
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
