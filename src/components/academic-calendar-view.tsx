"use client";

import { Calendar, Sun, BookOpen, Coffee, Play, Flag, Star } from "lucide-react";

const EVENT_COLORS: Record<string, string> = {
  TERM_START: "bg-emerald-50 text-emerald-700 border-emerald-200",
  TERM_END: "bg-red-50 text-red-700 border-red-200",
  MID_TERM_BREAK: "bg-amber-50 text-amber-700 border-amber-200",
  HOLIDAY: "bg-blue-50 text-blue-700 border-blue-200",
  EXAM_PERIOD: "bg-purple-50 text-purple-700 border-purple-200",
  SCHOOL_RESUMPTION: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PUBLIC_HOLIDAY: "bg-pink-50 text-pink-700 border-pink-200",
  CUSTOM: "bg-gray-50 text-gray-700 border-gray-200",
};

const ICONS: Record<string, any> = {
  TERM_START: Play, TERM_END: Flag, MID_TERM_BREAK: Coffee, HOLIDAY: Sun,
  EXAM_PERIOD: BookOpen, SCHOOL_RESUMPTION: Star, PUBLIC_HOLIDAY: Flag, CUSTOM: Calendar,
};

export default function AcademicCalendarView({ events, terms, currentTerm }: {
  events: any[]; terms: any[]; currentTerm?: any;
}) {
  const now = new Date();
  
  // Separate upcoming from past
  const upcoming = events.filter(e => new Date(e.endDate) >= now);
  const past = events.filter(e => new Date(e.endDate) < now);

  // Group by month
  const grouped = upcoming.reduce((acc: Record<string, any[]>, evt) => {
    const key = new Date(evt.startDate).toLocaleString("default", { month: "long", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(evt);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Current Term */}
      {currentTerm && (
        <div className="bg-gradient-to-r from-brand-500 to-brand-700 rounded-2xl p-5 text-white">
          <h2 className="text-sm font-bold mb-2">📅 Current Term</h2>
          <p className="text-lg font-bold">{currentTerm.name}</p>
          <p className="text-xs opacity-80">
            {new Date(currentTerm.startDate).toLocaleDateString()} — {new Date(currentTerm.endDate).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Terms overview */}
      {terms.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          {terms.map((t: any) => {
            const isActive = t.isActive;
            const isPast = new Date(t.endDate) < now;
            return (
              <div key={t.id} className={`card py-3 ${isActive ? "ring-2 ring-brand-400 bg-brand-50" : isPast ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold">{t.name}</h4>
                  {isActive && <span className="text-[8px] px-2 py-0.5 rounded bg-brand-200 text-brand-800 font-bold">ACTIVE</span>}
                  {isPast && <span className="text-[8px] px-2 py-0.5 rounded bg-gray-200 text-gray-600">ENDED</span>}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {new Date(t.startDate).toLocaleDateString()} — {new Date(t.endDate).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming events */}
      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-700">📌 Upcoming Events</h3>
          {Object.entries(grouped).map(([month, monthEvents]) => (
            <div key={month}>
              <h4 className="text-xs font-bold text-gray-500 mb-2">{month}</h4>
              <div className="space-y-1.5">
                {monthEvents.map((evt: any) => {
                  const color = EVENT_COLORS[evt.eventType] || EVENT_COLORS.CUSTOM;
                  const Icon = ICONS[evt.eventType] || Calendar;
                  const isCurrent = new Date(evt.startDate) <= now && new Date(evt.endDate) >= now;
                  const days = Math.ceil((new Date(evt.endDate).getTime() - new Date(evt.startDate).getTime()) / 86400000);
                  return (
                    <div key={evt.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${color} ${isCurrent ? "ring-2 ring-brand-400" : ""}`}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{evt.title}</span>
                          {isCurrent && <span className="text-[8px] px-1.5 py-0.5 rounded bg-brand-600 text-white animate-pulse">NOW</span>}
                          {days > 1 && <span className="text-[8px] text-gray-400">{days} days</span>}
                        </div>
                        <p className="text-[10px] opacity-70">
                          {new Date(evt.startDate).toLocaleDateString()}
                          {evt.startDate !== evt.endDate ? ` — ${new Date(evt.endDate).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-8">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No calendar events available yet. Your school will set these up.</p>
        </div>
      )}
    </div>
  );
}
