"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateAcademicCalendar, addCustomEvent, deleteEvent, setActiveTerm } from "@/lib/actions/grading";
import { getCurrentAcademicPeriod } from "@/lib/academic-calendar";
import { Calendar, Loader2, Plus, Trash2, Play, Sun, BookOpen, GraduationCap, Coffee, Flag, Star } from "lucide-react";

const EVENT_COLORS: Record<string, string> = {
  TERM_START: "bg-emerald-100 text-emerald-700 border-emerald-300",
  TERM_END: "bg-red-100 text-red-700 border-red-300",
  MID_TERM_BREAK: "bg-amber-100 text-amber-700 border-amber-300",
  HOLIDAY: "bg-blue-100 text-blue-700 border-blue-300",
  EXAM_PERIOD: "bg-purple-100 text-purple-700 border-purple-300",
  SCHOOL_RESUMPTION: "bg-emerald-100 text-emerald-700 border-emerald-300",
  PUBLIC_HOLIDAY: "bg-pink-100 text-pink-700 border-pink-300",
  CUSTOM: "bg-gray-100 text-gray-700 border-gray-300",
};

const EVENT_ICONS: Record<string, any> = {
  TERM_START: Play, TERM_END: Flag, MID_TERM_BREAK: Coffee, HOLIDAY: Sun,
  EXAM_PERIOD: BookOpen, SCHOOL_RESUMPTION: Star, PUBLIC_HOLIDAY: Flag, CUSTOM: Calendar,
};

export default function CalendarManager({ events, terms, countryCode }: {
  events: any[]; terms: any[]; countryCode: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ title: "", description: "", eventType: "CUSTOM", startDate: "", endDate: "" });

  const status = getCurrentAcademicPeriod(countryCode);
  const now = new Date();

  const handleGenerate = async () => {
    setLoading("gen");
    const result = await generateAcademicCalendar(year);
    if (result.error) setMessage("Error: " + result.error);
    else setMessage(`✅ Generated ${result.count} events for ${year}/${year + 1} academic year!`);
    router.refresh(); setLoading("");
  };

  const handleAddEvent = async () => {
    if (!form.title || !form.startDate || !form.endDate) { setMessage("Error: Fill all fields"); return; }
    setLoading("add");
    const result = await addCustomEvent(form);
    if (result.error) setMessage("Error: " + result.error);
    else { setMessage("✅ Event added!"); setShowAddEvent(false); setForm({ title: "", description: "", eventType: "CUSTOM", startDate: "", endDate: "" }); }
    router.refresh(); setLoading("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    setLoading(id); await deleteEvent(id); router.refresh(); setLoading("");
  };

  const handleSetTerm = async (termId: string) => {
    setLoading(termId); await setActiveTerm(termId);
    setMessage("✅ Active term updated!"); router.refresh(); setLoading("");
  };

  // Group events by month
  const grouped = events.reduce((acc: Record<string, any[]>, evt) => {
    const key = new Date(evt.startDate).toLocaleString("default", { month: "long", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(evt);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-xl text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message} <button onClick={() => setMessage("")} className="float-right">✕</button>
        </div>
      )}

      {/* Current Status */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <h2 className="text-sm font-bold mb-3">📅 Current Academic Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-[10px] text-white/70">Current Term</p>
            <p className="text-sm font-bold">{status.currentTerm?.replace("_", " ") || "Not Set"}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-[10px] text-white/70">Status</p>
            <p className="text-sm font-bold">{status.isOnBreak ? "🏖 On Break" : status.isExamPeriod ? "📝 Exam Period" : "📚 In Session"}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-[10px] text-white/70">{status.isMidTerm ? "Mid-Term" : "Next Event"}</p>
            <p className="text-[10px] font-bold">{status.nextEvent}</p>
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <p className="text-[10px] text-white/70">Promotion Term</p>
            <p className="text-sm font-bold">{status.promotionTerm?.replace("_", " ")}</p>
          </div>
        </div>
      </div>

      {/* Generate Calendar */}
      <div className="card border-2 border-dashed border-indigo-200 bg-indigo-50/30">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-indigo-800">Auto-Generate Academic Calendar</h3>
          <select className="input-field w-auto text-sm" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>{y}/{y + 1} Academic Year</option>
            ))}
          </select>
          <button onClick={handleGenerate} disabled={loading === "gen"} className="btn-primary text-sm flex items-center gap-1">
            {loading === "gen" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            Generate for {countryCode}
          </button>
          <button onClick={() => setShowAddEvent(!showAddEvent)} className="btn-ghost text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Custom Event
          </button>
        </div>
        <p className="text-[10px] text-indigo-600 mt-2">
          Auto-generates terms, midterm breaks, holidays, exam periods, and public holidays based on your country&apos;s academic calendar.
          Also creates Term records for grading.
        </p>
      </div>

      {/* Custom Event Form */}
      {showAddEvent && (
        <div className="card bg-gray-50">
          <h4 className="text-sm font-bold mb-3">Add Custom Event</h4>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <input className="input-field" placeholder="Event title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              <select className="input-field" value={form.eventType} onChange={e => setForm(p => ({ ...p, eventType: e.target.value }))}>
                {Object.keys(EVENT_COLORS).map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">Start Date</label><input type="date" className="input-field" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
              <div><label className="label">End Date</label><input type="date" className="input-field" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} /></div>
            </div>
            <input className="input-field" placeholder="Description (optional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <div className="flex gap-2">
              <button onClick={handleAddEvent} disabled={loading === "add"} className="btn-primary text-sm">{loading === "add" ? "Adding..." : "Add Event"}</button>
              <button onClick={() => setShowAddEvent(false)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Terms Manager */}
      {terms.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-bold text-gray-800 mb-3">📆 Terms</h3>
          <div className="space-y-2">
            {terms.map((t: any) => (
              <div key={t.id} className={`flex items-center justify-between p-3 rounded-xl border ${t.isActive ? "bg-emerald-50 border-emerald-300" : "bg-gray-50 border-gray-200"}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{t.name}</span>
                    {t.isActive && <span className="text-[8px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold">ACTIVE</span>}
                  </div>
                  <p className="text-[10px] text-gray-500">{new Date(t.startDate).toLocaleDateString()} — {new Date(t.endDate).toLocaleDateString()}</p>
                </div>
                {!t.isActive && (
                  <button onClick={() => handleSetTerm(t.id)} disabled={!!loading}
                    className="text-[10px] px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                    Set Active
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events Timeline */}
      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([month, monthEvents]) => (
            <div key={month}>
              <h3 className="text-sm font-bold text-gray-700 mb-2 sticky top-0 bg-gray-50/80 py-1">{month}</h3>
              <div className="space-y-1.5">
                {monthEvents.map((evt: any) => {
                  const color = EVENT_COLORS[evt.eventType] || EVENT_COLORS.CUSTOM;
                  const Icon = EVENT_ICONS[evt.eventType] || Calendar;
                  const isPast = new Date(evt.endDate) < now;
                  const isCurrent = new Date(evt.startDate) <= now && new Date(evt.endDate) >= now;
                  return (
                    <div key={evt.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${color} ${isPast ? "opacity-50" : ""} ${isCurrent ? "ring-2 ring-brand-400" : ""}`}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{evt.title}</span>
                          {isCurrent && <span className="text-[8px] px-1.5 py-0.5 rounded bg-brand-600 text-white animate-pulse">NOW</span>}
                          {evt.termNumber && <span className="text-[8px] px-1 py-0.5 rounded bg-white/50">{evt.termNumber.replace("_", " ")}</span>}
                        </div>
                        <p className="text-[10px] opacity-75">
                          {new Date(evt.startDate).toLocaleDateString()} {evt.startDate !== evt.endDate ? ` — ${new Date(evt.endDate).toLocaleDateString()}` : ""}
                          {evt.description && ` · ${evt.description}`}
                        </p>
                      </div>
                      {!evt.isAutoGenerated && (
                        <button onClick={() => handleDelete(evt.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No calendar events yet. Click Generate to create your academic calendar.</p>
        </div>
      )}
    </div>
  );
}
