"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, Clock, Users, MessageSquare, HelpCircle, CreditCard,
  Play, Square, ChevronDown, ChevronUp, Activity, Pencil, Mic, Video,
} from "lucide-react";

export default function MonitorClient({
  liveSessions, recentSessions, todayCreditsTotal, todayCreditsCount, schoolCurrency,
}: {
  liveSessions: any[]; recentSessions: any[]; todayCreditsTotal: number;
  todayCreditsCount: number; schoolCurrency: string;
}) {
  const router = useRouter();
  const [liveData, setLiveData] = useState<Record<string, any>>({});
  const [expanded, setExpanded] = useState<string | null>(liveSessions[0]?.id || null);

  // Auto-refresh page every 15s
  useEffect(() => {
    const i = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(i);
  }, [router]);

  // Poll each live session for real-time data
  const pollSessions = useCallback(async () => {
    for (const ls of liveSessions) {
      try {
        const r = await fetch(`/api/classroom/${ls.id}`);
        if (r.ok) {
          const d = await r.json();
          setLiveData((prev) => ({ ...prev, [ls.id]: d }));
        }
      } catch {}
    }
  }, [liveSessions]);

  useEffect(() => {
    pollSessions();
    const i = setInterval(pollSessions, 5000);
    return () => clearInterval(i);
  }, [pollSessions]);

  // Also trigger auto-session check
  useEffect(() => {
    fetch("/api/auto-session").catch(() => {});
    const i = setInterval(() => { fetch("/api/auto-session").catch(() => {}); }, 60000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><Activity className="w-5 h-5 text-red-600 animate-pulse" /></div>
            <div><p className="text-2xl font-bold text-red-700">{liveSessions.length}</p><p className="text-[10px] text-red-500">Live Now</p></div>
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Clock className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-blue-700">{recentSessions.length}</p><p className="text-[10px] text-blue-500">Completed Today</p></div>
          </div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><CreditCard className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold text-emerald-700">{schoolCurrency} {todayCreditsTotal.toFixed(2)}</p><p className="text-[10px] text-emerald-500">Credits Today</p></div>
          </div>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {liveSessions.reduce((s, ls) => s + (ls.class?.enrollments?.length || 0), 0)}
              </p>
              <p className="text-[10px] text-purple-500">Students in Class</p>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE CLASSROOMS */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Live Classrooms
        </h2>
        {liveSessions.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">No live sessions right now</div>
        ) : (
          <div className="space-y-3">
            {liveSessions.map((ls: any) => {
              const data = liveData[ls.id] || {};
              const chat = Array.isArray(data.chatMessages) ? data.chatMessages : [];
              const hands = Array.isArray(data.raisedHands) ? data.raisedHands : [];
              const qs = Array.isArray(data.questions) ? data.questions : [];
              const mins = data.liveMinutes || 0;
              const mode = data.teachingMode || "board";
              const isExp = expanded === ls.id;

              return (
                <div key={ls.id} className="card ring-2 ring-red-300 border-red-200">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : ls.id)}>
                    <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                      <Play className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold">{ls.class?.subject?.name || ls.class?.name}</h4>
                        <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded">{ls.class?.schoolGrade?.gradeLevel}</span>
                        <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>
                        {mode === "voice" && <Mic className="w-3 h-3 text-emerald-500" />}
                        {mode === "video" && <Video className="w-3 h-3 text-blue-500" />}
                        {mode === "board" && <Pencil className="w-3 h-3 text-amber-500" />}
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Teacher: {ls.teacher?.user?.name} • {ls.class?.enrollments?.length || 0} students • {ls.topic || "No topic"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-xs font-mono font-bold px-2 py-1 rounded ${mins >= 35 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                        {String(mins).padStart(2,"0")}:00
                      </div>
                      {hands.length > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">✋ {hands.length}</span>}
                      {qs.filter((q:any)=>!q.answered).length > 0 && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">❓ {qs.filter((q:any)=>!q.answered).length}</span>}
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">💬 {chat.length}</span>
                      {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {isExp && (
                    <div className="mt-4 pt-4 border-t grid md:grid-cols-3 gap-4">
                      {/* Board Content */}
                      <div className="p-3 bg-gray-900 rounded-xl">
                        <h5 className="text-[10px] text-gray-400 font-bold uppercase mb-2">📋 Board</h5>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {(Array.isArray(data.boardContent) ? data.boardContent : []).length === 0 && <p className="text-[10px] text-gray-500">Empty board</p>}
                          {(Array.isArray(data.boardContent) ? data.boardContent : []).map((line: any, i: number) => (
                            <p key={i} className="text-xs font-mono" style={{ color: line.color || "#fff" }}>{line.text}</p>
                          ))}
                        </div>
                      </div>

                      {/* Chat */}
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <h5 className="text-[10px] text-blue-800 font-bold uppercase mb-2">💬 Chat ({chat.length})</h5>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {chat.length === 0 && <p className="text-[10px] text-gray-400">No messages</p>}
                          {chat.slice(-10).map((m: any, i: number) => (
                            <div key={i} className="text-[10px]">
                              <span className="font-bold text-gray-700">{m.from}:</span> <span className="text-gray-600">{m.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Q&A + Hands */}
                      <div className="p-3 bg-amber-50 rounded-xl">
                        <h5 className="text-[10px] text-amber-800 font-bold uppercase mb-2">❓ Q&A ({qs.length}) • ✋ Hands ({hands.length})</h5>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {hands.map((h: any) => (
                            <div key={h.studentId} className="text-[10px] flex items-center gap-1">
                              <span className="animate-bounce">✋</span> <span className="font-medium">{h.studentName}</span> <span className="text-gray-400">waiting</span>
                            </div>
                          ))}
                          {qs.map((q: any) => (
                            <div key={q.id} className={`text-[10px] p-1 rounded ${q.answered ? "bg-emerald-100" : "bg-amber-100"}`}>
                              <span className="font-medium">{q.studentName}:</span> {q.question}
                              {q.answered && <span className="text-emerald-700 block">↳ {q.answer}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COMPLETED SESSIONS TODAY */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3">📊 Completed Sessions Today</h2>
        {recentSessions.length === 0 ? (
          <div className="card text-center py-6 text-gray-400">No completed sessions today</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-500">Subject</th>
                  <th className="text-left py-2 text-gray-500">Grade</th>
                  <th className="text-left py-2 text-gray-500">Teacher</th>
                  <th className="text-left py-2 text-gray-500">Duration</th>
                  <th className="text-left py-2 text-gray-500">Credit</th>
                  <th className="text-left py-2 text-gray-500">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s: any) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 font-medium">{s.class?.subject?.name || s.class?.name}</td>
                    <td className="py-2">{s.class?.schoolGrade?.gradeLevel}</td>
                    <td className="py-2">{s.class?.teacher?.user?.name}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full ${s.durationMin >= 35 ? "bg-emerald-100 text-emerald-700" : s.durationMin >= 20 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {s.durationMin || 0} min
                      </span>
                    </td>
                    <td className="py-2 text-emerald-700 font-medium">
                      {s.sessionCredits?.[0] ? `${schoolCurrency} ${s.sessionCredits[0].creditAmount.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-2 text-gray-400">
                      {s.endedAt ? new Date(s.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
