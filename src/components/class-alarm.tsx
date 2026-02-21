"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BellRing, Clock, X, Volume2, VolumeX } from "lucide-react";

interface Schedule {
  classId: string; className: string; subjectName: string; teacherName: string;
  dayOfWeek: string; startTime: string; endTime: string; isLive: boolean; isPrep?: boolean;
}

const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
function timeToMin(t: string): number {
  const parts = t.split(":").map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function beep(ctx: AudioContext, freq: number, dur: number, delay: number, vol: number) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime + delay;
    osc.start(t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.stop(t + dur + 0.05);
  } catch (_e) {}
}

export default function ClassAlarm({ schedules, isKG = false }: { schedules: Schedule[]; isKG?: boolean }) {
  const [alerts, setAlerts] = useState<{id:string;msg:string;type:string}[]>([]);
  const [muted, setMuted] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showPanel, setShowPanel] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const lastSoundRef = useRef<string>("");

  // Init AudioContext on user interaction
  const initAudio = useCallback(() => {
    if (ctxRef.current) { setAudioReady(true); return; }
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new AC();
      // Unlock with silent sound
      beep(ctxRef.current, 1, 0.01, 0, 0);
      setAudioReady(true);
    } catch (_e) {}
  }, []);

  useEffect(() => {
    const handler = () => initAudio();
    document.addEventListener("click", handler);
    document.addEventListener("touchstart", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [initAudio]);

  const playWarning = useCallback(() => {
    if (muted || !ctxRef.current || ctxRef.current.state === "closed") return;
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    beep(ctxRef.current, 880, 0.2, 0, 0.3);
    beep(ctxRef.current, 880, 0.2, 0.3, 0.3);
    beep(ctxRef.current, 880, 0.2, 0.6, 0.3);
  }, [muted]);

  const playBell = useCallback(() => {
    if (muted || !ctxRef.current || ctxRef.current.state === "closed") return;
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    for (let i = 0; i < 8; i++) {
      beep(ctxRef.current, i % 2 === 0 ? 800 : 1000, 0.15, i * 0.2, 0.4);
    }
  }, [muted]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Check alarms every 10s
  const check = useCallback(() => {
    const now = new Date();
    const today = DAYS[now.getDay()];
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const newAlerts: typeof alerts = [];
    const seenLive = new Set<string>();

    schedules.forEach((s) => {
      // Live/Prep class alert — fires regardless of schedule day
      if (s.isLive && !seenLive.has(s.classId)) {
        seenLive.add(s.classId);
        const key = s.classId + "-live";
        if (!dismissed.has(key)) {
          const isPrep = s.isPrep;
          newAlerts.push({
            id: key,
            msg: isKG
              ? (isPrep ? `📚 ${s.subjectName} review is open! 🎒` : `🔴 ${s.subjectName} is LIVE! 🎈`)
              : (isPrep ? `📚 ${s.subjectName} — Review session open. Join to prepare!` : `${s.subjectName} is LIVE — join now`),
            type: "start",
          });
        }
      }

      // Schedule-based alerts — only for today
      if (s.dayOfWeek !== today) return;
      const startMin = timeToMin(s.startTime);
      const diff = startMin - nowMin;

      // 5 min warning
      if (diff > 0 && diff <= 5) {
        const key = s.classId + "-warn-" + startMin;
        if (!dismissed.has(key)) {
          newAlerts.push({
            id: key,
            msg: isKG ? `🔔 ${s.subjectName} starts in ${diff}min! 🎒` : `${s.subjectName} starts in ${diff}min — ${s.teacherName}`,
            type: "warning",
          });
        }
      }
      // Starting now
      if (diff <= 0 && diff > -2) {
        const key = s.classId + "-start-" + startMin;
        if (!dismissed.has(key)) {
          newAlerts.push({
            id: key,
            msg: isKG ? `🎉 ${s.subjectName} starting NOW! 🌟` : `${s.subjectName} starting NOW!`,
            type: "start",
          });
        }
      }
    });

    setAlerts(newAlerts);

    // Play sound for new alerts (avoid repeating same sound)
    if (newAlerts.length > 0 && audioReady) {
      const hasStart = newAlerts.some(a => a.type === "start");
      const soundKey = newAlerts.map(a => a.id).join(",");
      if (soundKey !== lastSoundRef.current) {
        lastSoundRef.current = soundKey;
        if (hasStart) playBell(); else playWarning();
      }
    }

    // Browser notification for start alerts
    if ("Notification" in window && Notification.permission === "granted") {
      newAlerts.filter(a => a.type === "start").forEach(a => {
        const key = "notif-" + a.id;
        if (!dismissed.has(key)) {
          try { new Notification(isKG ? "🔔 Class Time!" : "Class Starting!", { body: a.msg }); } catch (_e) {}
          setDismissed(prev => new Set(prev).add(key));
        }
      });
    }
  }, [schedules, dismissed, isKG, audioReady, playBell, playWarning]);

  useEffect(() => {
    check();
    const i = setInterval(check, 10000);
    return () => clearInterval(i);
  }, [check]);

  const dismiss = (id: string) => setDismissed(p => new Set(p).add(id));
  const active = alerts.filter(a => !dismissed.has(a.id));

  if (active.length === 0 && !showPanel) return null;

  return (
    <>
      {/* Floating bell */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => { initAudio(); setShowPanel(!showPanel); }}
          className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
            active.some(a => a.type === "start") ? "bg-red-500 animate-bounce" : active.length > 0 ? "bg-amber-500 animate-pulse" : "bg-gray-400"
          }`}>
          <BellRing className="w-6 h-6 text-white" />
          {active.length > 0 && <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-red-600 text-xs font-bold flex items-center justify-center shadow">{active.length}</span>}
        </button>
      </div>

      {/* Panel */}
      {showPanel && (
        <div className={`fixed bottom-24 right-6 z-50 w-80 rounded-2xl shadow-2xl border overflow-hidden ${isKG ? "bg-yellow-50 border-yellow-300" : "bg-white border-gray-200"}`}>
          <div className={`px-4 py-3 flex items-center justify-between ${isKG ? "bg-yellow-400" : "bg-brand-600"}`}>
            <span className={`text-sm font-bold ${isKG ? "text-yellow-900" : "text-white"}`}>
              {isKG ? "🔔 Class Time!" : "Class Alerts"}
            </span>
            <div className="flex items-center gap-2">
              {!audioReady && (
                <button onClick={initAudio} className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded animate-pulse">
                  🔊 Enable Sound
                </button>
              )}
              <button onClick={() => setMuted(!muted)} className="text-white/70 hover:text-white">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setShowPanel(false)} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {active.length === 0 && <p className="text-center py-6 text-gray-400 text-xs">No alerts right now</p>}
            {active.map(a => (
              <div key={a.id} className={`px-4 py-3 border-b last:border-0 flex items-start gap-3 ${a.type === "start" ? "bg-red-50" : ""}`}>
                <div className={`mt-0.5 ${a.type === "start" ? "text-red-500" : "text-amber-500"}`}>
                  {a.type === "start" ? <BellRing className="w-4 h-4 animate-pulse" /> : <Clock className="w-4 h-4" />}
                </div>
                <p className={`flex-1 text-xs ${a.type === "start" ? "font-bold text-red-800" : "text-gray-700"}`}>{a.msg}</p>
                <button onClick={() => dismiss(a.id)} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t">
            <p className="text-[9px] text-gray-400">
              {audioReady ? "🔊 Sound enabled" : "🔇 Click 'Enable Sound' for audio alerts"} •
              {" Notification " + (typeof Notification !== "undefined" ? Notification.permission : "n/a")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
