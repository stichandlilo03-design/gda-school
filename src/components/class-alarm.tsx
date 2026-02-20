"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellRing, Clock, X, Volume2, VolumeX, Play } from "lucide-react";

interface ScheduleItem {
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

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function playAlarmSound(type: "warning" | "start" | "important") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "warning") {
      // 5-min warning: gentle chime
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => { osc.frequency.value = 1100; }, 200);
      setTimeout(() => { osc.frequency.value = 880; }, 400);
      setTimeout(() => { gain.gain.value = 0; osc.stop(); ctx.close(); }, 600);
    } else if (type === "start") {
      // Class starting: school bell ring
      osc.type = "triangle";
      osc.frequency.value = 800;
      gain.gain.value = 0.4;
      osc.start();
      let t = 0;
      const ring = setInterval(() => {
        t++;
        osc.frequency.value = t % 2 === 0 ? 800 : 1000;
        if (t > 8) { clearInterval(ring); gain.gain.value = 0; osc.stop(); ctx.close(); }
      }, 150);
    } else {
      // Important: triple beep
      osc.frequency.value = 660;
      gain.gain.value = 0.25;
      osc.start();
      setTimeout(() => { gain.gain.value = 0; }, 150);
      setTimeout(() => { gain.gain.value = 0.25; }, 300);
      setTimeout(() => { gain.gain.value = 0; }, 450);
      setTimeout(() => { gain.gain.value = 0.25; }, 600);
      setTimeout(() => { gain.gain.value = 0; osc.stop(); ctx.close(); }, 750);
    }
  } catch {}
}

export default function ClassAlarm({
  schedules, isKG = false,
}: {
  schedules: ScheduleItem[]; isKG?: boolean;
}) {
  const [alerts, setAlerts] = useState<{id: string; msg: string; type: string; classId: string; time: number}[]>([]);
  const [muted, setMuted] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showPanel, setShowPanel] = useState(false);

  const checkAlarms = useCallback(() => {
    const now = new Date();
    const today = DAYS[now.getDay()];
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const newAlerts: typeof alerts = [];

    schedules.forEach((s) => {
      if (s.dayOfWeek !== today) return;
      const startMin = timeToMinutes(s.startTime);
      const diff = startMin - nowMin;
      const key5 = s.classId + "-5min";
      const key1 = s.classId + "-1min";
      const keyStart = s.classId + "-start";

      // 5 minutes before
      if (diff <= 5 && diff > 1 && !dismissed.has(key5)) {
        newAlerts.push({
          id: key5,
          msg: isKG
            ? `🔔 ${s.subjectName} starts in ${diff} minutes! Get ready! 🎒`
            : `${s.subjectName} with ${s.teacherName} starts in ${diff} minutes`,
          type: "warning", classId: s.classId, time: diff,
        });
      }
      // 1 minute before
      if (diff <= 1 && diff > 0 && !dismissed.has(key1)) {
        newAlerts.push({
          id: key1,
          msg: isKG
            ? `⏰ ${s.subjectName} is about to start! Hurry! 🏃`
            : `${s.subjectName} starts in 1 minute!`,
          type: "start", classId: s.classId, time: diff,
        });
      }
      // Class starting now
      if (diff <= 0 && diff > -2 && !dismissed.has(keyStart)) {
        newAlerts.push({
          id: keyStart,
          msg: isKG
            ? `🎉 ${s.subjectName} is starting NOW! Join your class! 🌟`
            : `${s.subjectName} is starting NOW! Join the classroom`,
          type: "start", classId: s.classId, time: 0,
        });
      }
    });

    // Live class alerts
    schedules.filter((s) => s.isLive).forEach((s) => {
      const keyLive = s.classId + "-live";
      if (!dismissed.has(keyLive)) {
        newAlerts.push({
          id: keyLive,
          msg: isKG
            ? `🔴 ${s.subjectName} is LIVE right now! Come join! 🎈`
            : `${s.subjectName} is LIVE — ${s.teacherName} is teaching now`,
          type: "start", classId: s.classId, time: -1,
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(newAlerts);
      if (!muted && newAlerts.some((a) => !dismissed.has(a.id))) {
        const urgent = newAlerts.find((a) => a.type === "start");
        playAlarmSound(urgent ? "start" : "warning");
      }
    } else {
      setAlerts([]);
    }
  }, [schedules, dismissed, muted, isKG]);

  useEffect(() => {
    checkAlarms();
    const interval = setInterval(checkAlarms, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [checkAlarms]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Push browser notification for urgent alerts
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      alerts.filter((a) => a.type === "start" && !dismissed.has(a.id)).forEach((a) => {
        new Notification(isKG ? "🔔 Class Time!" : "Class Starting!", { body: a.msg, icon: "/favicon.ico" });
      });
    }
  }, [alerts, dismissed, isKG]);

  const dismiss = (id: string) => setDismissed((prev) => new Set(prev).add(id));
  const activeAlerts = alerts.filter((a) => !dismissed.has(a.id));

  if (activeAlerts.length === 0 && !showPanel) return null;

  return (
    <>
      {/* Floating alarm bell */}
      {activeAlerts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button onClick={() => setShowPanel(!showPanel)}
            className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
              activeAlerts.some((a) => a.type === "start")
                ? "bg-red-500 animate-bounce"
                : "bg-amber-500 animate-pulse"
            }`}>
            <BellRing className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-red-600 text-xs font-bold flex items-center justify-center shadow">
              {activeAlerts.length}
            </span>
          </button>
        </div>
      )}

      {/* Alert panel */}
      {(showPanel || activeAlerts.some((a) => a.type === "start")) && activeAlerts.length > 0 && (
        <div className={`fixed bottom-24 right-6 z-50 w-80 rounded-2xl shadow-2xl border overflow-hidden ${isKG ? "bg-yellow-50 border-yellow-300" : "bg-white border-gray-200"}`}>
          <div className={`px-4 py-3 flex items-center justify-between ${isKG ? "bg-yellow-400" : "bg-brand-600"}`}>
            <div className="flex items-center gap-2">
              <BellRing className={`w-4 h-4 ${isKG ? "text-yellow-800" : "text-white"}`} />
              <span className={`text-sm font-bold ${isKG ? "text-yellow-900" : "text-white"}`}>
                {isKG ? "🔔 Class Time!" : "Class Alerts"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMuted(!muted)} className={`p-1 rounded ${isKG ? "text-yellow-800" : "text-white/70 hover:text-white"}`}>
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setShowPanel(false)} className={`p-1 rounded ${isKG ? "text-yellow-800" : "text-white/70 hover:text-white"}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {activeAlerts.map((a) => (
              <div key={a.id} className={`px-4 py-3 border-b last:border-0 flex items-start gap-3 ${
                a.type === "start" ? (isKG ? "bg-red-50" : "bg-red-50") : ""
              }`}>
                <div className={`mt-0.5 ${a.type === "start" ? "text-red-500 animate-pulse" : "text-amber-500"}`}>
                  {a.type === "start" ? <BellRing className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${isKG ? "text-base" : ""} ${a.type === "start" ? "font-bold text-red-800" : "text-gray-700"}`}>{a.msg}</p>
                </div>
                <button onClick={() => dismiss(a.id)} className="text-gray-400 hover:text-gray-600 p-0.5"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
