"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, BellRing, Clock, X, Volume2, VolumeX, Play } from "lucide-react";

interface Schedule {
  classId: string;
  className: string;
  subjectName: string;
  teacherName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isLive: boolean;
}

const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function ClassAlarm({ schedules, isKG = false }: { schedules: Schedule[]; isKG?: boolean }) {
  const [alerts, setAlerts] = useState<{id:string; msg:string; type:string; classId:string}[]>([]);
  const [muted, setMuted] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showPanel, setShowPanel] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // User must click once to enable audio (browser policy)
  const enableAudio = useCallback(() => {
    if (audioEnabled) return;
    try {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Play silent sound to unlock
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.1);
      setAudioEnabled(true);
    } catch {}
  }, [audioEnabled]);

  // Enable on any click
  useEffect(() => {
    const handler = () => enableAudio();
    document.addEventListener("click", handler, { once: true });
    document.addEventListener("touchstart", handler, { once: true });
    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [enableAudio]);

  const playSound = useCallback((type: "warning" | "start") => {
    if (muted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      if (type === "warning") {
        // 3 gentle beeps
        [0, 300, 600].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = 880;
          gain.gain.value = 0.3;
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay / 1000);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.2);
          osc.stop(ctx.currentTime + delay / 1000 + 0.25);
        });
      } else {
        // School bell — loud alternating tones
        [0, 200, 400, 600, 800, 1000, 1200, 1400].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = i % 2 === 0 ? 800 : 1000;
          gain.gain.value = 0.4;
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay / 1000);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.15);
          osc.stop(ctx.currentTime + delay / 1000 + 0.18);
        });
      }
    } catch {}
  }, [muted]);

  // Check alarms every 10 seconds
  const check = useCallback(() => {
    const now = new Date();
    const today = DAYS[now.getDay()];
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const newAlerts: typeof alerts = [];

    schedules.forEach((s) => {
      if (s.dayOfWeek !== today) return;
      const startMin = timeToMin(s.startTime);
      const diff = startMin - nowMin;

      // 5 min warning
      if (diff > 0 && diff <= 5) {
        const key = s.classId + "-5m";
        if (!dismissed.has(key)) {
          newAlerts.push({
            id: key,
            msg: isKG ? `🔔 ${s.subjectName} starts in ${diff} min! Get ready! 🎒` : `${s.subjectName} starts in ${diff} min — ${s.teacherName}`,
            type: "warning", classId: s.classId,
          });
        }
      }
      // Starting now (within 2 min window)
      if (diff <= 0 && diff > -2) {
        const key = s.classId + "-now";
        if (!dismissed.has(key)) {
          newAlerts.push({
            id: key,
            msg: isKG ? `🎉 ${s.subjectName} is starting NOW! Join! 🌟` : `${s.subjectName} is starting NOW! Join the classroom`,
            type: "start", classId: s.classId,
          });
        }
      }
      // Live class alert
      if (s.isLive) {
        const key = s.classId + "-live";
        if (!dismissed.has(key)) {
          newAlerts.push({
            id: key,
            msg: isKG ? `🔴 ${s.subjectName} is LIVE! Come join! 🎈` : `${s.subjectName} is LIVE — ${s.teacherName} is teaching`,
            type: "start", classId: s.classId,
          });
        }
      }
    });

    setAlerts(newAlerts);
    // Play sound for new undismissed alerts
    if (newAlerts.length > 0 && audioEnabled) {
      const hasStart = newAlerts.some((a) => a.type === "start");
      playSound(hasStart ? "start" : "warning");
    }
    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      newAlerts.filter((a) => a.type === "start").forEach((a) => {
        try { new Notification(isKG ? "🔔 Class Time!" : "Class Starting!", { body: a.msg, icon: "/favicon.ico" }); } catch {}
      });
    }
  }, [schedules, dismissed, isKG, audioEnabled, playSound]);

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [check]);

  const dismiss = (id: string) => setDismissed((p) => new Set(p).add(id));
  const active = alerts.filter((a) => !dismissed.has(a.id));

  if (active.length === 0) return null;

  return (
    <>
      {/* Floating bell */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => { enableAudio(); setShowPanel(!showPanel); }}
          className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center ${
            active.some((a) => a.type === "start") ? "bg-red-500 animate-bounce" : "bg-amber-500 animate-pulse"
          }`}>
          <BellRing className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-red-600 text-xs font-bold flex items-center justify-center shadow">{active.length}</span>
        </button>
      </div>

      {/* Panel */}
      {showPanel && (
        <div className={`fixed bottom-24 right-6 z-50 w-80 rounded-2xl shadow-2xl border overflow-hidden ${isKG ? "bg-yellow-50 border-yellow-300" : "bg-white border-gray-200"}`}>
          <div className={`px-4 py-3 flex items-center justify-between ${isKG ? "bg-yellow-400" : "bg-brand-600"}`}>
            <span className={`text-sm font-bold ${isKG ? "text-yellow-900" : "text-white"}`}>
              {isKG ? "🔔 Class Time!" : "Class Alerts"}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setMuted(!muted)} className="p-1 text-white/70 hover:text-white">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              {!audioEnabled && (
                <button onClick={enableAudio} className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded">
                  Enable Sound
                </button>
              )}
              <button onClick={() => setShowPanel(false)} className="p-1 text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {active.map((a) => (
              <div key={a.id} className={`px-4 py-3 border-b last:border-0 flex items-start gap-3 ${a.type === "start" ? "bg-red-50" : ""}`}>
                <div className={`mt-0.5 ${a.type === "start" ? "text-red-500 animate-pulse" : "text-amber-500"}`}>
                  {a.type === "start" ? <BellRing className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <p className={`flex-1 text-xs ${a.type === "start" ? "font-bold text-red-800" : "text-gray-700"}`}>{a.msg}</p>
                <button onClick={() => dismiss(a.id)} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
