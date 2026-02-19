"use client";

import { useState, useEffect, useCallback } from "react";
import { startClassSession, endClassSession } from "@/lib/actions/session-tracking";
import { useRouter } from "next/navigation";
import {
  Clock, Play, Square, Bell, X, Loader2, Timer, AlertTriangle, CheckCircle
} from "lucide-react";

interface LiveSession { id: string; classId: string; startedAt: string; topic: string; }
interface UpcomingClass { classId: string; className: string; grade: string; startTime: string; endTime: string; period: number; teacherName?: string; }

export default function ClassTimerWidget({ role }: { role: "TEACHER" | "STUDENT" }) {
  const router = useRouter();
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingClass[]>([]);
  const [loading, setLoading] = useState("");
  const [showReminder, setShowReminder] = useState<UpcomingClass | null>(null);
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set());
  const [endNotes, setEndNotes] = useState("");
  const [endingClass, setEndingClass] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const r = await fetch("/api/sessions");
      const data = await r.json();
      setLiveSessions(data.liveSessions || []);
      setUpcoming(data.upcoming || []);
    } catch {}
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { const i = setInterval(fetchSessions, 15000); return () => clearInterval(i); }, [fetchSessions]);

  // Tick for live timer
  useEffect(() => { const i = setInterval(() => setTick((t) => t + 1), 1000); return () => clearInterval(i); }, []);

  // Check upcoming reminders (5min before class)
  useEffect(() => {
    if (upcoming.length === 0) return;
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    for (const cls of upcoming) {
      const key = `${cls.classId}-${cls.startTime}`;
      if (dismissedReminders.has(key)) continue;

      // Parse start time
      const [sh, sm] = cls.startTime.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const diff = startMin - nowMin;

      if (diff > 0 && diff <= 5) {
        setShowReminder(cls);
        break;
      }
    }
  }, [upcoming, tick, dismissedReminders]);

  const handleStart = async (classId: string, className: string) => {
    const topic = prompt(`Starting session for "${className}"\n\nEnter today's topic (optional):`);
    setLoading("start-" + classId);
    const r = await startClassSession(classId, topic || undefined);
    if (r.error) alert(r.error);
    else { fetchSessions(); router.refresh(); }
    setLoading("");
  };

  const handleEnd = async (classId: string) => {
    setLoading("end-" + classId);
    const r = await endClassSession(classId, endNotes || undefined);
    if (r.error) alert(r.error);
    else {
      alert(`Session ended!\n\nDuration: ${r.hoursWorked}h\nEarned: ${r.amountEarned}\n\nSubmitted for principal review.`);
      setEndingClass(null);
      setEndNotes("");
      fetchSessions();
      router.refresh();
    }
    setLoading("");
  };

  const dismissReminder = (cls: UpcomingClass) => {
    setDismissedReminders((prev) => new Set([...prev, `${cls.classId}-${cls.startTime}`]));
    setShowReminder(null);
  };

  const formatElapsed = (startedAt: string) => {
    const diff = Date.now() - new Date(startedAt).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  const getNowHHMM = () => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  };

  // Determine which classes are about to start, in progress, or done
  const now = getNowHHMM();

  return (
    <>
      {/* Popup reminder */}
      {showReminder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-bounce-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Class Starting Soon!</h3>
              </div>
              <button onClick={() => dismissReminder(showReminder)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mb-4">
              <p className="text-sm font-bold text-amber-900">{showReminder.className}</p>
              <p className="text-xs text-amber-700 mt-1">
                {showReminder.grade} • Starts at {showReminder.startTime}
                {showReminder.teacherName && ` • ${showReminder.teacherName}`}
              </p>
            </div>
            <div className="flex gap-2">
              {role === "TEACHER" && (
                <button
                  onClick={() => { dismissReminder(showReminder); handleStart(showReminder.classId, showReminder.className); }}
                  className="flex-1 btn-primary text-sm flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4" /> Start Session Now
                </button>
              )}
              <button onClick={() => dismissReminder(showReminder)} className="btn-ghost text-sm flex-1">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Live sessions */}
      {liveSessions.length > 0 && (
        <div className="space-y-2">
          {liveSessions.map((ls) => {
            const cls = upcoming.find((u) => u.classId === ls.classId);
            return (
              <div key={ls.id} className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl animate-pulse-slow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <h4 className="text-sm font-bold text-red-800">LIVE SESSION</h4>
                  </div>
                  <div className="flex items-center gap-1.5 bg-red-100 px-3 py-1.5 rounded-lg">
                    <Timer className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-mono font-bold text-red-700">{formatElapsed(ls.startedAt)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-800 font-medium">{cls?.className || "Class"} {cls?.grade ? `(${cls.grade})` : ""}</p>
                {ls.topic && <p className="text-xs text-gray-500 mt-0.5">Topic: {ls.topic}</p>}
                <p className="text-[10px] text-gray-400 mt-1">Started: {new Date(ls.startedAt).toLocaleTimeString()}</p>

                {role === "TEACHER" && (
                  <div className="mt-3">
                    {endingClass === ls.classId ? (
                      <div className="space-y-2">
                        <textarea
                          className="input-field text-xs min-h-[60px]"
                          placeholder="Session notes (what was covered, any issues...)"
                          value={endNotes}
                          onChange={(e) => setEndNotes(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEnd(ls.classId!)}
                            disabled={loading === "end-" + ls.classId}
                            className="flex-1 text-xs px-4 py-2.5 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center gap-1.5"
                          >
                            {loading === "end-" + ls.classId ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Square className="w-3 h-3" /> End Session & Submit</>}
                          </button>
                          <button onClick={() => setEndingClass(null)} className="btn-ghost text-xs">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setEndingClass(ls.classId)} className="text-xs px-4 py-2 rounded-lg bg-red-600 text-white font-bold flex items-center gap-1.5 hover:bg-red-700">
                        <Square className="w-3 h-3" /> End Session
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Today's schedule with start buttons */}
      {upcoming.length > 0 && (
        <div className="card">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Today&apos;s Classes
          </h3>
          <div className="space-y-2">
            {upcoming.map((cls, i) => {
              const isLive = liveSessions.some((ls) => ls.classId === cls.classId);
              const isPast = cls.endTime < now;
              const isCurrent = cls.startTime <= now && cls.endTime >= now;

              return (
                <div key={`${cls.classId}-${cls.period}`} className={`flex items-center gap-3 p-3 rounded-xl border ${isLive ? "bg-red-50 border-red-200" : isCurrent ? "bg-amber-50 border-amber-200" : isPast ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-gray-100"}`}>
                  <div className={`text-center min-w-[52px] px-2 py-1.5 rounded-lg ${isLive ? "bg-red-200 text-red-800" : isCurrent ? "bg-amber-200 text-amber-800" : "bg-gray-100 text-gray-600"}`}>
                    <p className="text-xs font-bold">{cls.startTime}</p>
                    <p className="text-[9px]">{cls.endTime}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{cls.className}</p>
                    <p className="text-[10px] text-gray-500">
                      {cls.grade} • Period {cls.period}
                      {cls.teacherName && ` • ${cls.teacherName}`}
                    </p>
                  </div>
                  {isLive ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-1 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> LIVE
                    </span>
                  ) : isPast ? (
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                  ) : role === "TEACHER" && !isLive ? (
                    <button
                      onClick={() => handleStart(cls.classId, cls.className)}
                      disabled={loading === "start-" + cls.classId || liveSessions.length > 0}
                      className="text-[10px] px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium flex items-center gap-1 hover:bg-emerald-700 disabled:opacity-40"
                    >
                      {loading === "start-" + cls.classId ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Play className="w-3 h-3" /> Start</>}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          {role === "TEACHER" && liveSessions.length > 0 && (
            <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> End your current session before starting another.</p>
          )}
        </div>
      )}
    </>
  );
}
