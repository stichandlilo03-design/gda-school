"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveTimetableSlot, deleteTimetableSlot, autoGenerateTimetable, updateSchoolHours } from "@/lib/actions/timetable";
import {
  Calendar, Clock, Plus, Trash2, Loader2, Wand2, Settings, BookOpen, Save, X, ChevronDown, Sun, Sunset, Moon, Info, AlertCircle
} from "lucide-react";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_SHORT: Record<string, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat" };
const COLORS = ["bg-blue-100 text-blue-800 border-blue-300", "bg-emerald-100 text-emerald-800 border-emerald-300", "bg-purple-100 text-purple-800 border-purple-300", "bg-amber-100 text-amber-800 border-amber-300", "bg-rose-100 text-rose-800 border-rose-300", "bg-cyan-100 text-cyan-800 border-cyan-300", "bg-orange-100 text-orange-800 border-orange-300", "bg-indigo-100 text-indigo-800 border-indigo-300", "bg-pink-100 text-pink-800 border-pink-300", "bg-teal-100 text-teal-800 border-teal-300"];

const SESSION_SLOTS = [
  {
    key: "SESSION_A", label: "Session A — Morning", shortLabel: "A · Morning",
    icon: Sun, gradient: "from-amber-50 to-orange-50", border: "border-amber-300",
    badge: "bg-amber-100 text-amber-700", ring: "ring-amber-300",
    headerBg: "bg-amber-500", headerText: "text-white",
    desc: "Core academic subjects when students are most alert",
    recommended: "06:00 – 10:00 UTC",
    bestOpen: "07:00", bestClose: "10:30",
    tips: [
      "Best for: Mathematics, Science, Language Arts, Reading",
      "Students are freshest in the morning — place difficult subjects here",
      "Recommended: 3–4 periods of 40 min each",
      "Example: P1 07:00–07:40 · P2 07:50–08:30 · Break · P3 08:50–09:30 · P4 09:40–10:20",
    ],
  },
  {
    key: "SESSION_B", label: "Session B — Afternoon", shortLabel: "B · Afternoon",
    icon: Sunset, gradient: "from-blue-50 to-indigo-50", border: "border-blue-300",
    badge: "bg-blue-100 text-blue-700", ring: "ring-blue-300",
    headerBg: "bg-blue-500", headerText: "text-white",
    desc: "Practical, creative, and hands-on subjects",
    recommended: "14:00 – 18:00 UTC",
    bestOpen: "14:00", bestClose: "17:30",
    tips: [
      "Best for: Arts, Physical Education, Music, Technology, Projects",
      "After lunch energy dip — use engaging, practical activities",
      "Recommended: 3–4 periods of 40 min each",
      "Example: P1 14:00–14:40 · P2 14:50–15:30 · Break · P3 15:50–16:30 · P4 16:40–17:20",
    ],
  },
  {
    key: "SESSION_C", label: "Session C — Evening", shortLabel: "C · Evening",
    icon: Moon, gradient: "from-purple-50 to-violet-50", border: "border-purple-300",
    badge: "bg-purple-100 text-purple-700", ring: "ring-purple-300",
    headerBg: "bg-purple-500", headerText: "text-white",
    desc: "Revision, tutorials, homework help, adult education",
    recommended: "18:00 – 22:00 UTC",
    bestOpen: "18:30", bestClose: "21:30",
    tips: [
      "Best for: Revision, Homework Help, Extra Tuition, Adult Learners",
      "Keep sessions shorter — students may be tired",
      "Recommended: 2–3 periods of 35–40 min each",
      "Example: P1 18:30–19:10 · P2 19:20–20:00 · Break · P3 20:15–20:55",
    ],
  },
];

interface Props { school: any; grades: any[] }

export default function TimetableManager({ school, grades }: Props) {
  const router = useRouter();
  const [selectedGrade, setSelectedGrade] = useState(grades[0]?.id || "");
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showAdd, setShowAdd] = useState<{ day: string; period: number } | null>(null);
  const [activeSession, setActiveSession] = useState("SESSION_A");
  const [showTips, setShowTips] = useState(true);

  const [hours, setHours] = useState({
    schoolOpenTime: school.schoolOpenTime || "08:00",
    schoolCloseTime: school.schoolCloseTime || "15:00",
    sessionDurationMin: school.sessionDurationMin || 40,
    breakDurationMin: school.breakDurationMin || 10,
    sessionsPerDay: school.sessionsPerDay || 4,
  });

  const [slotForm, setSlotForm] = useState({ classId: "", startTime: "", endTime: "" });

  const grade = grades.find((g: any) => g.id === selectedGrade);
  const allClasses = grade?.classes || [];

  // Color map for all classes
  const subjectColorMap: Record<string, string> = {};
  allClasses.forEach((c: any, i: number) => { subjectColorMap[c.id] = COLORS[i % COLORS.length]; });

  // Group classes by session slot
  const classesBySession: Record<string, any[]> = { SESSION_A: [], SESSION_B: [], SESSION_C: [] };
  allClasses.forEach((c: any) => {
    const slot = c.session || "SESSION_A";
    if (!classesBySession[slot]) classesBySession[slot] = [];
    classesBySession[slot].push(c);
  });

  // Active session data
  const activeClasses = classesBySession[activeSession] || [];
  const slotInfo = SESSION_SLOTS.find(s => s.key === activeSession)!;
  const SlotIcon = slotInfo.icon;

  // Build schedule entries for active session only
  const activeSchedules = activeClasses.flatMap((c: any) =>
    (c.schedules || []).map((s: any) => ({
      ...s, className: c.name, subjectName: c.subject?.name || "",
      teacherName: c.teacher?.user?.name || "", classId: c.id,
      colorClass: subjectColorMap[c.id],
    }))
  );

  // Count all schedules per session (for the boxes)
  const countSchedules = (key: string) => {
    const cls = classesBySession[key] || [];
    return cls.reduce((sum: number, c: any) => sum + (c.schedules?.length || 0), 0);
  };

  // Time slots
  const calcTimeSlots = () => {
    const openMin = parseInt(hours.schoolOpenTime.split(":")[0]) * 60 + parseInt(hours.schoolOpenTime.split(":")[1] || "0");
    const slots: { period: number; start: string; end: string; isBreak?: boolean }[] = [];
    const breakAfter = Math.floor(hours.sessionsPerDay / 2);
    for (let p = 0; p < hours.sessionsPerDay; p++) {
      let offset = openMin + p * (hours.sessionDurationMin + hours.breakDurationMin);
      if (p >= breakAfter) offset += hours.breakDurationMin;
      if (p === breakAfter) {
        const bs = offset - hours.breakDurationMin;
        slots.push({ period: -1, isBreak: true, start: pad(bs), end: pad(offset) });
      }
      slots.push({ period: p + 1, start: pad(offset), end: pad(offset + hours.sessionDurationMin) });
    }
    return slots;
  };
  const pad = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  const timeSlots = calcTimeSlots();
  const maxPeriod = Math.max(hours.sessionsPerDay, ...activeSchedules.map((s: any) => s.periodNumber), 1);

  // Handlers
  const handleSaveHours = async () => {
    setLoading("hours"); const r = await updateSchoolHours(hours);
    r.error ? setMessage("Error: " + r.error) : (setMessage("✅ School hours updated!"), router.refresh());
    setLoading("");
  };
  const handleAutoGenerate = async () => {
    if (!selectedGrade || !confirm("This will replace ALL timetable slots for this grade. Continue?")) return;
    setLoading("auto"); const r = await autoGenerateTimetable(selectedGrade);
    r.error ? setMessage("Error: " + r.error) : (setMessage(r.message || "Generated!"), router.refresh());
    setLoading("");
  };
  const handleAddSlot = async (day: string, period: number) => {
    if (!slotForm.classId) { setMessage("Select a subject"); return; }
    const ts = timeSlots.find(t => t.period === period);
    setLoading("add");
    const r = await saveTimetableSlot({ classId: slotForm.classId, dayOfWeek: day, periodNumber: period, startTime: slotForm.startTime || ts?.start || "08:00", endTime: slotForm.endTime || ts?.end || "08:40" });
    r.error ? setMessage("Error: " + r.error) : (setShowAdd(null), setSlotForm({ classId: "", startTime: "", endTime: "" }), router.refresh());
    setLoading("");
  };
  const handleDeleteSlot = async (classId: string, day: string, period: number) => {
    setLoading(`del-${day}-${period}`); await deleteTimetableSlot(classId, day, period); router.refresh(); setLoading("");
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-3 text-sm flex items-center justify-between ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          <span>{message}</span><button onClick={() => setMessage("")} className="opacity-60 text-xs">✕</button>
        </div>
      )}

      {/* ════════════════════ 3 SESSION BOXES ════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-brand-600" />
          <h2 className="text-sm font-bold text-gray-800">Your School Has 3 Sessions — Choose One to Edit</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          A real school day is split into <strong>Morning (A)</strong>, <strong>Afternoon (B)</strong>, and <strong>Evening (C)</strong> sessions.
          Each session has its own classes, teachers, and timetable. Click a session below to build its timetable.
        </p>

        <div className="grid lg:grid-cols-3 gap-4">
          {SESSION_SLOTS.map(slot => {
            const Icon = slot.icon;
            const subjectCount = (classesBySession[slot.key] || []).length;
            const scheduleCount = countSchedules(slot.key);
            const isActive = activeSession === slot.key;
            return (
              <button key={slot.key} onClick={() => setActiveSession(slot.key)}
                className={`relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 ${
                  isActive
                    ? `bg-gradient-to-br ${slot.gradient} ${slot.border} ring-2 ring-offset-1 ${slot.ring} shadow-lg scale-[1.02]`
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}>
                {/* Header stripe */}
                <div className={`${slot.headerBg} px-4 py-2.5 flex items-center gap-2`}>
                  <Icon className={`w-5 h-5 ${slot.headerText}`} />
                  <span className={`text-sm font-bold ${slot.headerText}`}>{slot.shortLabel}</span>
                  {isActive && <span className="ml-auto text-[9px] bg-white/30 text-white px-2 py-0.5 rounded-full">EDITING ▼</span>}
                </div>

                <div className="p-4">
                  <p className="text-[11px] text-gray-600 mb-2">{slot.desc}</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] text-gray-500 font-medium">{slot.recommended}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-2 mt-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${slot.badge}`}>
                      {subjectCount} subject{subjectCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {scheduleCount} slot{scheduleCount !== 1 ? "s" : ""} set
                    </span>
                  </div>

                  {/* Progress indicator */}
                  {subjectCount > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isActive ? "bg-brand-500" : "bg-gray-300"}`}
                          style={{ width: `${Math.min(100, subjectCount > 0 ? (scheduleCount / (subjectCount * 5)) * 100 : 0)}%` }} />
                      </div>
                      <p className="text-[8px] text-gray-400 mt-0.5">{scheduleCount}/{subjectCount * 5} weekly slots filled</p>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════ SESSION TIPS ════════════════════ */}
      <div className={`p-4 rounded-2xl border-2 bg-gradient-to-br ${slotInfo.gradient} ${slotInfo.border}`}>
        <button onClick={() => setShowTips(!showTips)} className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <SlotIcon className="w-5 h-5" />
            <h3 className="text-sm font-bold text-gray-800">{slotInfo.label} — Setup Guide</h3>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition ${showTips ? "rotate-180" : ""}`} />
        </button>
        {showTips && (
          <div className="mt-3 space-y-2">
            {slotInfo.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-gray-700">
                <span className="mt-0.5 text-brand-500">•</span>
                <span>{tip}</span>
              </div>
            ))}
            <div className="mt-3 p-3 bg-white/70 rounded-xl border border-gray-200">
              <p className="text-[10px] text-gray-500 font-medium mb-1">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Recommended school hours for {slotInfo.shortLabel}:
              </p>
              <p className="text-xs font-bold text-gray-800">
                Open: <span className="text-brand-600">{slotInfo.bestOpen}</span> · Close: <span className="text-brand-600">{slotInfo.bestClose}</span>
              </p>
              <button onClick={() => {
                setHours(h => ({ ...h, schoolOpenTime: slotInfo.bestOpen, schoolCloseTime: slotInfo.bestClose }));
                setShowSettings(true);
              }} className="mt-1.5 text-[10px] text-brand-600 hover:text-brand-800 font-medium underline">
                Apply recommended times →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════ SCHOOL HOURS ════════════════════ */}
      <div className="card">
        <button onClick={() => setShowSettings(!showSettings)} className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-500" />
            <div>
              <h3 className="text-sm font-semibold">School Hours &amp; Period Settings</h3>
              <p className="text-[10px] text-gray-500">
                Opens {hours.schoolOpenTime} · Closes {hours.schoolCloseTime} · {hours.sessionsPerDay} periods · {hours.sessionDurationMin}min each · {hours.breakDurationMin}min breaks
              </p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition ${showSettings ? "rotate-180" : ""}`} />
        </button>
        {showSettings && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800">
              <strong>⚠️ Match your hours to the active session:</strong><br />
              Morning (A): 06:00–10:30 · Afternoon (B): 14:00–17:30 · Evening (C): 18:00–21:30<br />
              If running multiple sessions, set the widest window (e.g., 06:00–21:30) and sessions auto-stop at close time.
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div><label className="label">School Opens</label><input type="time" className="input-field" value={hours.schoolOpenTime} onChange={e => setHours(h => ({ ...h, schoolOpenTime: e.target.value }))} /></div>
              <div><label className="label">School Closes</label><input type="time" className="input-field" value={hours.schoolCloseTime} onChange={e => setHours(h => ({ ...h, schoolCloseTime: e.target.value }))} /></div>
              <div><label className="label">Periods/Day</label>
                <select className="input-field" value={hours.sessionsPerDay} onChange={e => setHours(h => ({ ...h, sessionsPerDay: parseInt(e.target.value) }))}>
                  {[3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div><label className="label">Period Length</label>
                <select className="input-field" value={hours.sessionDurationMin} onChange={e => setHours(h => ({ ...h, sessionDurationMin: parseInt(e.target.value) }))}>
                  {[30, 35, 40, 45, 50, 60].map(n => <option key={n} value={n}>{n} min</option>)}
                </select>
              </div>
              <div><label className="label">Break Length</label>
                <select className="input-field" value={hours.breakDurationMin} onChange={e => setHours(h => ({ ...h, breakDurationMin: parseInt(e.target.value) }))}>
                  {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n} min</option>)}
                </select>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-[10px] font-medium text-gray-500 mb-2">📋 Daily Period Preview:</p>
              <div className="flex flex-wrap gap-1.5">
                {timeSlots.map((s, i) => (
                  <span key={i} className={`text-[10px] px-2 py-1 rounded-lg ${s.isBreak ? "bg-amber-100 text-amber-700 font-medium" : "bg-white border border-gray-200 text-gray-600"}`}>
                    {s.isBreak ? `☕ Break ${s.start}–${s.end}` : `P${s.period}: ${s.start}–${s.end}`}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={handleSaveHours} disabled={loading === "hours"} className="btn-primary text-sm">
              {loading === "hours" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="ml-1.5">Save School Hours</span>
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════ GRADE SELECTOR ════════════════════ */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <SlotIcon className="w-5 h-5 text-brand-500" />
          <h2 className="text-sm font-bold">{slotInfo.shortLabel} Timetable — Grade:</h2>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {grades.map((g: any) => {
            const sessCount = (g.classes || []).filter((c: any) => (c.session || "SESSION_A") === activeSession).length;
            return (
              <button key={g.id} onClick={() => setSelectedGrade(g.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedGrade === g.id ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {g.gradeLevel} <span className="text-[9px] opacity-70">({sessCount})</span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto">
          <button onClick={handleAutoGenerate} disabled={!selectedGrade || loading === "auto"} className="btn-ghost text-xs flex items-center gap-1 disabled:opacity-50">
            {loading === "auto" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} Auto-Generate
          </button>
        </div>
      </div>

      {/* Subjects legend for active session */}
      {activeClasses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeClasses.map((c: any) => (
            <span key={c.id} className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${subjectColorMap[c.id]}`}>
              {c.subject?.name || c.name} — {c.teacher?.user?.name?.split(" ")[0] || "?"}
            </span>
          ))}
        </div>
      )}

      {/* Empty states */}
      {!grade && <div className="card text-center py-12 text-gray-400">Select a grade above to view/edit its timetable.</div>}
      {grade && activeClasses.length === 0 && (
        <div className="card text-center py-12">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No classes assigned to <strong>{slotInfo.label}</strong> for {grade.gradeLevel}.</p>
          <p className="text-xs text-gray-400 mt-1">Classes are assigned to sessions (A/B/C) when created in Curriculum. Try clicking another session box above.</p>
        </div>
      )}

      {/* ════════════════════ TIMETABLE GRID ════════════════════ */}
      {grade && activeClasses.length > 0 && (
        <div className={`overflow-x-auto rounded-2xl border-2 ${slotInfo.border}`}>
          {/* Session header bar */}
          <div className={`${slotInfo.headerBg} px-4 py-2 flex items-center gap-2`}>
            <SlotIcon className={`w-4 h-4 ${slotInfo.headerText}`} />
            <span className={`text-xs font-bold ${slotInfo.headerText}`}>{slotInfo.label} — {grade.gradeLevel}</span>
            <span className={`ml-auto text-[9px] ${slotInfo.headerText} opacity-80`}>{activeSchedules.length} slots · {activeClasses.length} subjects</span>
          </div>

          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-[10px] font-bold text-gray-500 text-left w-20 border border-gray-200">Time</th>
                {DAYS.slice(0, hours.sessionsPerDay >= 6 ? 6 : 5).map(day => (
                  <th key={day} className="p-2 text-[10px] font-bold text-gray-500 text-center border border-gray-200">{DAY_SHORT[day]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, idx) => (
                <tr key={idx} className={slot.isBreak ? "bg-amber-50/50" : ""}>
                  <td className="p-2 border border-gray-200 text-center">
                    {slot.isBreak ? (
                      <div className="text-[10px] text-amber-600 font-medium">☕ Break<br />{slot.start}–{slot.end}</div>
                    ) : (
                      <div><div className="text-[10px] font-bold text-gray-600">P{slot.period}</div><div className="text-[9px] text-gray-400">{slot.start}–{slot.end}</div></div>
                    )}
                  </td>
                  {!slot.isBreak && DAYS.slice(0, hours.sessionsPerDay >= 6 ? 6 : 5).map(day => {
                    const entry = activeSchedules.find((s: any) => s.dayOfWeek === day && s.periodNumber === slot.period);
                    return (
                      <td key={day} className="p-1 border border-gray-200 align-top min-w-[120px]">
                        {entry ? (
                          <div className={`p-2 rounded-lg border ${entry.colorClass} relative group`}>
                            <p className="text-[11px] font-bold leading-tight">{entry.subjectName}</p>
                            <p className="text-[9px] opacity-70 mt-0.5">{entry.teacherName}</p>
                            <p className="text-[8px] opacity-50">{entry.startTime}–{entry.endTime}</p>
                            <button onClick={() => handleDeleteSlot(entry.classId, day, slot.period)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white hidden group-hover:flex items-center justify-center">
                              {loading === `del-${day}-${slot.period}` ? <Loader2 className="w-2 h-2 animate-spin" /> : <X className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setShowAdd({ day, period: slot.period }); setSlotForm({ classId: "", startTime: slot.start, endTime: slot.end }); }}
                            className="w-full h-full min-h-[50px] rounded-lg border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 flex items-center justify-center transition">
                            <Plus className="w-3.5 h-3.5 text-gray-300" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                  {slot.isBreak && (
                    <td colSpan={hours.sessionsPerDay >= 6 ? 6 : 5} className="p-2 border border-gray-200 text-center">
                      <span className="text-[10px] text-amber-600 font-medium">☕ Break ({hours.breakDurationMin} min)</span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Slot Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-500" /> Add Period — {DAY_SHORT[showAdd.day]} P{showAdd.period}
              <span className={`text-[9px] px-2 py-0.5 rounded-full ${slotInfo.badge}`}>{slotInfo.shortLabel}</span>
            </h3>
            <div>
              <label className="label">Subject *</label>
              <select className="input-field" value={slotForm.classId} onChange={e => setSlotForm(f => ({ ...f, classId: e.target.value }))}>
                <option value="">Select subject...</option>
                {activeClasses.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.subject?.name || c.name} — {c.teacher?.user?.name || "?"}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Start Time</label><input type="time" className="input-field" value={slotForm.startTime} onChange={e => setSlotForm(f => ({ ...f, startTime: e.target.value }))} /></div>
              <div><label className="label">End Time</label><input type="time" className="input-field" value={slotForm.endTime} onChange={e => setSlotForm(f => ({ ...f, endTime: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAddSlot(showAdd.day, showAdd.period)} disabled={loading === "add"} className="btn-primary text-sm flex-1">
                {loading === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Timetable"}
              </button>
              <button onClick={() => setShowAdd(null)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* How it works summary */}
      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
        <h4 className="text-xs font-bold text-blue-800 mb-2">🏫 Quick Summary — How It All Works</h4>
        <div className="grid sm:grid-cols-2 gap-3 text-[10px] text-blue-700">
          <div className="space-y-1">
            <p>☀️ <strong>Session A (Morning):</strong> Core academic subjects. Set school open time to 07:00.</p>
            <p>🌤️ <strong>Session B (Afternoon):</strong> Practical/creative subjects. Open at 14:00.</p>
            <p>🌙 <strong>Session C (Evening):</strong> Revision, tutorials, adult ed. Open at 18:30.</p>
          </div>
          <div className="space-y-1">
            <p>⏰ <strong>Auto-Start:</strong> Sessions begin automatically at the scheduled time.</p>
            <p>🔔 <strong>Auto-End:</strong> Sessions stop at the period end time or school close — like a bell.</p>
            <p>📱 <strong>Teachers &amp; Students</strong> see their personalized timetables on their dashboards.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
