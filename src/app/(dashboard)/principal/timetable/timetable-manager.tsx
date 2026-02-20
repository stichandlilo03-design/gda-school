"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveTimetableSlot, deleteTimetableSlot, autoGenerateTimetable, updateSchoolHours } from "@/lib/actions/timetable";
import {
  Calendar, Clock, Plus, Trash2, Loader2, Wand2, Settings, BookOpen, Save, X, ChevronDown
} from "lucide-react";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_SHORT: Record<string, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat" };
const COLORS = ["bg-blue-100 text-blue-800 border-blue-300", "bg-emerald-100 text-emerald-800 border-emerald-300", "bg-purple-100 text-purple-800 border-purple-300", "bg-amber-100 text-amber-800 border-amber-300", "bg-rose-100 text-rose-800 border-rose-300", "bg-cyan-100 text-cyan-800 border-cyan-300", "bg-orange-100 text-orange-800 border-orange-300", "bg-indigo-100 text-indigo-800 border-indigo-300", "bg-pink-100 text-pink-800 border-pink-300", "bg-teal-100 text-teal-800 border-teal-300"];

interface Props {
  school: any;
  grades: any[];
}

export default function TimetableManager({ school, grades }: Props) {
  const router = useRouter();
  const [selectedGrade, setSelectedGrade] = useState(grades[0]?.id || "");
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showAdd, setShowAdd] = useState<{ day: string; period: number } | null>(null);

  // School hours form
  const [hours, setHours] = useState({
    schoolOpenTime: school.schoolOpenTime || "08:00",
    schoolCloseTime: school.schoolCloseTime || "15:00",
    sessionDurationMin: school.sessionDurationMin || 40,
    breakDurationMin: school.breakDurationMin || 10,
    sessionsPerDay: school.sessionsPerDay || 4,
  });

  // Add slot form
  const [slotForm, setSlotForm] = useState({ classId: "", startTime: "", endTime: "" });

  const grade = grades.find(g => g.id === selectedGrade);
  const classes = grade?.classes || [];

  // Build color map for subjects
  const subjectColorMap: Record<string, string> = {};
  classes.forEach((c: any, i: number) => { subjectColorMap[c.id] = COLORS[i % COLORS.length]; });

  // Build timetable grid: day -> period -> schedule entry
  const allSchedules = classes.flatMap((c: any) =>
    (c.schedules || []).map((s: any) => ({
      ...s,
      className: c.name,
      subjectName: c.subject?.name || "",
      teacherName: c.teacher?.user?.name || "",
      classId: c.id,
      sessionSlot: c.session || "SESSION_A",
      colorClass: subjectColorMap[c.id],
    }))
  );

  // Get max periods
  const maxPeriod = Math.max(hours.sessionsPerDay, ...allSchedules.map((s: any) => s.periodNumber), 1);

  // Calculate time slots based on school hours
  const calcTimeSlots = () => {
    const openMin = parseInt(hours.schoolOpenTime.split(":")[0]) * 60 + parseInt(hours.schoolOpenTime.split(":")[1] || "0");
    const slots: { period: number; start: string; end: string; isBreak?: boolean }[] = [];
    const breakAfter = Math.floor(hours.sessionsPerDay / 2);

    for (let p = 0; p < hours.sessionsPerDay; p++) {
      let offset = openMin + p * (hours.sessionDurationMin + hours.breakDurationMin);
      if (p >= breakAfter) offset += hours.breakDurationMin;

      const startH = Math.floor(offset / 60);
      const startM = offset % 60;
      const endOffset = offset + hours.sessionDurationMin;
      const endH = Math.floor(endOffset / 60);
      const endM = endOffset % 60;

      // Add break before this period if it's the break point
      if (p === breakAfter) {
        const brkStart = offset - hours.breakDurationMin;
        const bsH = Math.floor(brkStart / 60), bsM = brkStart % 60;
        slots.push({
          period: -1, isBreak: true,
          start: `${String(bsH).padStart(2, "0")}:${String(bsM).padStart(2, "0")}`,
          end: `${String(Math.floor(offset / 60)).padStart(2, "0")}:${String(offset % 60).padStart(2, "0")}`,
        });
      }

      slots.push({
        period: p + 1,
        start: `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`,
        end: `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`,
      });
    }
    return slots;
  };
  const timeSlots = calcTimeSlots();

  const handleSaveHours = async () => {
    setLoading("hours");
    const r = await updateSchoolHours(hours);
    if (r.error) setMessage("Error: " + r.error);
    else { setMessage("School hours updated!"); router.refresh(); }
    setLoading("");
  };

  const handleAutoGenerate = async () => {
    if (!selectedGrade) return;
    if (!confirm("This will replace all existing timetable slots for this grade. Continue?")) return;
    setLoading("auto");
    const r = await autoGenerateTimetable(selectedGrade);
    if (r.error) setMessage("Error: " + r.error);
    else { setMessage(r.message || "Generated!"); router.refresh(); }
    setLoading("");
  };

  const handleAddSlot = async (day: string, period: number) => {
    if (!slotForm.classId) { setMessage("Select a subject"); return; }
    const timeSlot = timeSlots.find(t => t.period === period);
    setLoading("add");
    const r = await saveTimetableSlot({
      classId: slotForm.classId,
      dayOfWeek: day,
      periodNumber: period,
      startTime: slotForm.startTime || timeSlot?.start || "08:00",
      endTime: slotForm.endTime || timeSlot?.end || "08:40",
    });
    if (r.error) setMessage("Error: " + r.error);
    else { setShowAdd(null); setSlotForm({ classId: "", startTime: "", endTime: "" }); router.refresh(); }
    setLoading("");
  };

  const handleDeleteSlot = async (classId: string, day: string, period: number) => {
    setLoading(`del-${day}-${period}`);
    await deleteTimetableSlot(classId, day, period);
    router.refresh();
    setLoading("");
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-3 text-sm flex items-center justify-between ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          <span>{message}</span>
          <button onClick={() => setMessage("")} className="text-xs opacity-60">✕</button>
        </div>
      )}

      {/* School Hours Settings */}
      <div className="card">
        <button onClick={() => setShowSettings(!showSettings)} className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-500" />
            <div>
              <h3 className="text-sm font-semibold">School Hours & Session Settings</h3>
              <p className="text-[10px] text-gray-500">
                Opens {hours.schoolOpenTime} · Closes {hours.schoolCloseTime} · {hours.sessionsPerDay} periods/day · {hours.sessionDurationMin}min each · {hours.breakDurationMin}min breaks
              </p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition ${showSettings ? "rotate-180" : ""}`} />
        </button>

        {showSettings && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="label">School Opens</label>
                <input type="time" className="input-field" value={hours.schoolOpenTime} onChange={e => setHours(h => ({ ...h, schoolOpenTime: e.target.value }))} />
              </div>
              <div>
                <label className="label">School Closes</label>
                <input type="time" className="input-field" value={hours.schoolCloseTime} onChange={e => setHours(h => ({ ...h, schoolCloseTime: e.target.value }))} />
              </div>
              <div>
                <label className="label">Periods/Day</label>
                <select className="input-field" value={hours.sessionsPerDay} onChange={e => setHours(h => ({ ...h, sessionsPerDay: parseInt(e.target.value) }))}>
                  {[3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} periods</option>)}
                </select>
              </div>
              <div>
                <label className="label">Period Duration</label>
                <select className="input-field" value={hours.sessionDurationMin} onChange={e => setHours(h => ({ ...h, sessionDurationMin: parseInt(e.target.value) }))}>
                  {[30, 35, 40, 45, 50, 60].map(n => <option key={n} value={n}>{n} minutes</option>)}
                </select>
              </div>
              <div>
                <label className="label">Break Duration</label>
                <select className="input-field" value={hours.breakDurationMin} onChange={e => setHours(h => ({ ...h, breakDurationMin: parseInt(e.target.value) }))}>
                  {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n} minutes</option>)}
                </select>
              </div>
            </div>

            {/* Preview daily schedule */}
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-[10px] font-medium text-gray-500 mb-2">📋 Daily Schedule Preview:</p>
              <div className="flex flex-wrap gap-1.5">
                {timeSlots.map((slot, i) => (
                  <span key={i} className={`text-[10px] px-2 py-1 rounded-lg ${slot.isBreak ? "bg-amber-100 text-amber-700 font-medium" : "bg-white border border-gray-200 text-gray-600"}`}>
                    {slot.isBreak ? `☕ Break ${slot.start}-${slot.end}` : `P${slot.period}: ${slot.start}-${slot.end}`}
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

      {/* Grade Selector + Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-500" />
          <h2 className="text-sm font-bold">Timetable for:</h2>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {grades.map(g => (
            <button key={g.id} onClick={() => setSelectedGrade(g.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedGrade === g.id ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {g.gradeLevel} <span className="text-[9px] opacity-70">({g.classes?.length || 0})</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={handleAutoGenerate} disabled={!selectedGrade || loading === "auto"} className="btn-ghost text-xs flex items-center gap-1 disabled:opacity-50">
            {loading === "auto" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} Auto-Generate
          </button>
        </div>
      </div>

      {/* Classes Legend */}
      {classes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {classes.map((c: any) => (
            <span key={c.id} className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${subjectColorMap[c.id]}`}>
              {c.subject?.name || c.name} — {c.teacher?.user?.name?.split(" ")[0] || "?"}
              <span className="ml-1 opacity-60">({c.session === "SESSION_B" ? "Afternoon" : c.session === "SESSION_C" ? "Evening" : "Morning"})</span>
            </span>
          ))}
        </div>
      )}

      {/* No grade selected or no classes */}
      {!grade && <div className="card text-center py-12 text-gray-400">Select a grade to view/edit its timetable.</div>}
      {grade && classes.length === 0 && (
        <div className="card text-center py-12">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No classes (subjects) assigned to this grade yet.</p>
          <p className="text-xs text-gray-400 mt-1">Add classes in the Curriculum section first.</p>
        </div>
      )}

      {/* Timetable Grid */}
      {grade && classes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-[10px] font-bold text-gray-500 text-left w-20 border border-gray-200">Time</th>
                {DAYS.slice(0, school.sessionsPerDay >= 6 ? 6 : 5).map(day => (
                  <th key={day} className="p-2 text-[10px] font-bold text-gray-500 text-center border border-gray-200">{DAY_SHORT[day]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, idx) => (
                <tr key={idx} className={slot.isBreak ? "bg-amber-50/50" : ""}>
                  <td className="p-2 border border-gray-200 text-center">
                    {slot.isBreak ? (
                      <div className="text-[10px] text-amber-600 font-medium">☕ Break<br />{slot.start}-{slot.end}</div>
                    ) : (
                      <div>
                        <div className="text-[10px] font-bold text-gray-600">Period {slot.period}</div>
                        <div className="text-[9px] text-gray-400">{slot.start}-{slot.end}</div>
                      </div>
                    )}
                  </td>
                  {!slot.isBreak && DAYS.slice(0, school.sessionsPerDay >= 6 ? 6 : 5).map(day => {
                    const entry = allSchedules.find((s: any) => s.dayOfWeek === day && s.periodNumber === slot.period);
                    return (
                      <td key={day} className="p-1 border border-gray-200 align-top min-w-[120px]">
                        {entry ? (
                          <div className={`p-2 rounded-lg border ${entry.colorClass} relative group`}>
                            <p className="text-[11px] font-bold leading-tight">{entry.subjectName}</p>
                            <p className="text-[9px] opacity-70 mt-0.5">{entry.teacherName}</p>
                            <p className="text-[8px] opacity-50">{entry.startTime}-{entry.endTime} · {entry.sessionSlot === "SESSION_B" ? "PM" : entry.sessionSlot === "SESSION_C" ? "Eve" : "AM"}</p>
                            <button onClick={() => handleDeleteSlot(entry.classId, day, slot.period)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white hidden group-hover:flex items-center justify-center">
                              {loading === `del-${day}-${slot.period}` ? <Loader2 className="w-2 h-2 animate-spin" /> : <X className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setShowAdd({ day, period: slot.period }); setSlotForm({ classId: "", startTime: slot.start, endTime: slot.end }); }}
                            className="w-full h-full min-h-[50px] rounded-lg border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 flex items-center justify-center transition">
                            <Plus className="w-3.5 h-3.5 text-gray-300" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                  {slot.isBreak && (
                    <td colSpan={school.sessionsPerDay >= 6 ? 6 : 5} className="p-2 border border-gray-200 text-center">
                      <span className="text-[10px] text-amber-600 font-medium">☕ Break Time ({hours.breakDurationMin} min)</span>
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
              <Plus className="w-4 h-4 text-brand-500" /> Add Period — {DAY_SHORT[showAdd.day]} Period {showAdd.period}
            </h3>

            <div>
              <label className="label">Subject / Class *</label>
              <select className="input-field" value={slotForm.classId} onChange={e => setSlotForm(f => ({ ...f, classId: e.target.value }))}>
                <option value="">Select subject...</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.subject?.name || c.name} — {c.teacher?.user?.name || "?"}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start Time</label>
                <input type="time" className="input-field" value={slotForm.startTime} onChange={e => setSlotForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <label className="label">End Time</label>
                <input type="time" className="input-field" value={slotForm.endTime} onChange={e => setSlotForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
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

      {/* How it works */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h4 className="text-xs font-bold text-blue-800 mb-2">🏫 How the Timetable System Works</h4>
        <div className="text-xs text-blue-700 space-y-1.5">
          <p><strong>1. Set School Hours:</strong> Configure when school opens/closes, period duration, break length, and number of periods per day.</p>
          <p><strong>2. Build Timetable:</strong> For each grade, assign subjects to time slots. Click + on any empty cell to add a period, or use Auto-Generate.</p>
          <p><strong>3. Auto-Generate:</strong> Automatically creates a balanced timetable that rotates subjects across days — you can then fine-tune it.</p>
          <p><strong>4. Smart Sessions:</strong> Live classroom sessions will <strong>automatically start</strong> when a period begins and <strong>automatically end</strong> when it finishes — just like a real school bell! All sessions stop when school closes.</p>
          <p><strong>5. 3 Session Slots:</strong> Classes are grouped into <strong>Morning (A)</strong>, <strong>Afternoon (B)</strong>, and <strong>Evening (C)</strong> sessions. The timetable respects these slots.</p>
          <p><strong>6. Teachers &amp; Students</strong> can view their personalized timetables from their dashboards. Students see &quot;happening now&quot; and &quot;up next&quot; indicators.</p>
        </div>
      </div>
    </div>
  );
}
