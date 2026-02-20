"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, Clock, Users, MessageSquare, HelpCircle, CreditCard,
  Play, ChevronDown, ChevronUp, Activity, Pencil, Mic, Video,
  BarChart3, History, X,
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
  const [reviewSession, setReviewSession] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<any>(null);
  const [tab, setTab] = useState<"live"|"history">("live");

  useEffect(() => { const i = setInterval(() => router.refresh(), 15000); return () => clearInterval(i); }, [router]);

  const pollSessions = useCallback(async () => {
    for (const ls of liveSessions) {
      try {
        const r = await fetch(`/api/classroom/${ls.id}`);
        if (r.ok) {
          const data = await r.json();
          setLiveData(prev => ({...prev, [ls.id]: data}));
        }
      } catch {}
    }
  }, [liveSessions]);

  useEffect(() => { pollSessions(); const i = setInterval(pollSessions, 5000); return () => clearInterval(i); }, [pollSessions]);
  useEffect(() => { fetch("/api/auto-session").catch(() => {}); const i = setInterval(() => fetch("/api/auto-session").catch(() => {}), 60000); return () => clearInterval(i); }, []);

  // Load review data for past session
  const loadReview = async (session: any) => {
    setReviewSession(session.id);
    setReviewData(session);
  };

  const totalMinsToday = recentSessions.reduce((s, r) => s + (r.durationMin || 0), 0);
  const totalStudentsLive = liveSessions.reduce((s, ls) => s + (ls.class?.enrollments?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center"><Activity className="w-4 h-4 text-red-600 animate-pulse" /></div>
            <div><p className="text-lg font-bold text-red-700">{liveSessions.length}</p><p className="text-[9px] text-red-500">Live Now</p></div>
          </div>
        </div>
        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center"><Users className="w-4 h-4 text-purple-600" /></div>
            <div><p className="text-lg font-bold text-purple-700">{totalStudentsLive}</p><p className="text-[9px] text-purple-500">Students in Class</p></div>
          </div>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center"><Clock className="w-4 h-4 text-blue-600" /></div>
            <div><p className="text-lg font-bold text-blue-700">{recentSessions.length}</p><p className="text-[9px] text-blue-500">Completed</p></div>
          </div>
        </div>
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center"><History className="w-4 h-4 text-amber-600" /></div>
            <div><p className="text-lg font-bold text-amber-700">{totalMinsToday}min</p><p className="text-[9px] text-amber-500">Total Minutes</p></div>
          </div>
        </div>
        <div className="card bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center"><CreditCard className="w-4 h-4 text-emerald-600" /></div>
            <div><p className="text-lg font-bold text-emerald-700">{schoolCurrency} {todayCreditsTotal.toFixed(2)}</p><p className="text-[9px] text-emerald-500">Credits Today</p></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        {[{k:"live" as const,l:"🔴 Live Classrooms"},{k:"history" as const,l:"📜 Session History"}].map(({k,l}) => (
          <button key={k} onClick={() => setTab(k)}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition ${tab===k?"bg-white text-gray-800 shadow":"text-gray-500"}`}>{l}</button>
        ))}
      </div>

      {/* LIVE TAB */}
      {tab === "live" && (
        <div>
          {liveSessions.length === 0 ? (
            <div className="card text-center py-12 text-gray-400"><Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />No live sessions right now</div>
          ) : (
            <div className="space-y-3">
              {liveSessions.map((ls: any) => {
                const d = liveData[ls.id] || {};
                const chat = Array.isArray(d.chatMessages) ? d.chatMessages : [];
                const whispers = Array.isArray(d.whispers) ? d.whispers : [];
                const hands = Array.isArray(d.raisedHands) ? d.raisedHands : [];
                const qs = Array.isArray(d.questions) ? d.questions : [];
                const reactions = Array.isArray(d.reactions) ? d.reactions : [];
                const polls = Array.isArray(d.polls) ? d.polls : [];
                const board = Array.isArray(d.boardContent) ? d.boardContent : [];
                const boardHist = Array.isArray(d.boardHistory) ? d.boardHistory : [];
                const mins = d.liveMinutes || 0;
                const mode = d.teachingMode || "board";
                const isExp = expanded === ls.id;

                return (
                  <div key={ls.id} className="card ring-2 ring-red-300 border-red-200">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp?null:ls.id)}>
                      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center"><Play className="w-5 h-5 animate-pulse" /></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold">{ls.class?.subject?.name || ls.class?.name}</h4>
                          <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded">{ls.class?.schoolGrade?.gradeLevel}</span>
                          <span className={`text-[10px] text-white px-2 py-0.5 rounded-full font-bold ${ls.isPrep ? "bg-amber-500" : "bg-red-500 animate-pulse"}`}>{ls.isPrep ? "PREP" : "LIVE"}</span>
                          {mode==="voice"&&<Mic className="w-3 h-3 text-emerald-500" />}
                          {mode==="video"&&<Video className="w-3 h-3 text-blue-500" />}
                          {mode==="board"&&<Pencil className="w-3 h-3 text-amber-500" />}
                        </div>
                        <p className="text-[10px] text-gray-500">Teacher: {ls.teacher?.user?.name} • {ls.class?.enrollments?.length||0} students</p>
                        {ls.autoStarted && !ls.teacherJoinedAt && <p className="text-[9px] text-amber-600 font-medium animate-pulse">⚠️ Auto-started — teacher hasn&apos;t joined yet</p>}
                        {ls.lateMinutes > 0 && <p className="text-[9px] text-red-500 font-medium">⏰ Teacher joined {ls.lateMinutes} min late</p>}
                        {ls.isPrep && <p className="text-[9px] text-amber-600 font-medium">📋 Prep session — no credits generated</p>}
                        {ls.autoStarted && ls.teacherJoinedAt && ls.lateMinutes === 0 && <p className="text-[9px] text-emerald-500">✅ Teacher joined on time</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${mins>=35?"bg-red-100 text-red-700":"bg-gray-100"}`}>{mins}min</span>
                        {hands.length>0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">✋{hands.length}</span>}
                        {qs.filter((q:any)=>!q.answered).length>0 && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">❓{qs.filter((q:any)=>!q.answered).length}</span>}
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">💬{chat.length}</span>
                        {whispers.length>0 && <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full">🤫{whispers.length}</span>}
                        {isExp?<ChevronUp className="w-4 h-4" />:<ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {isExp && (
                      <div className="mt-4 pt-4 border-t grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Board */}
                        <div className="p-3 bg-gray-900 rounded-xl">
                          <h5 className="text-[10px] text-gray-400 font-bold uppercase mb-1">📋 Board ({board.length} lines)</h5>
                          <div className="space-y-0.5 max-h-36 overflow-y-auto">
                            {board.length===0 && <p className="text-[10px] text-gray-500">Empty</p>}
                            {board.map((line:any,i:number) => <p key={i} className="text-[11px] font-mono" style={{color:line.color||"#fff"}}>{line.text}</p>)}
                          </div>
                          {boardHist.length > 0 && (
                            <div className="mt-2 pt-1 border-t border-gray-700">
                              <p className="text-[9px] text-gray-500">🗑️ Cleared {boardHist.length}x</p>
                              {boardHist.map((h:any,i:number) => (
                                <details key={i} className="text-[9px] text-gray-500">
                                  <summary className="cursor-pointer">Board #{i+1} ({h.content?.length} lines)</summary>
                                  {h.content?.map((l:any,j:number) => <p key={j} className="text-[9px] ml-2" style={{color:l.color}}>{l.text}</p>)}
                                </details>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Chat */}
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <h5 className="text-[10px] text-blue-800 font-bold uppercase mb-1">💬 Chat ({chat.length})</h5>
                          <div className="space-y-0.5 max-h-36 overflow-y-auto">
                            {chat.slice(-15).map((m:any,i:number) => (
                              <div key={i} className="text-[10px]"><span className="font-bold text-gray-700">{m.from}:</span> {m.message}</div>
                            ))}
                          </div>
                        </div>

                        {/* Q&A + Hands */}
                        <div className="p-3 bg-amber-50 rounded-xl">
                          <h5 className="text-[10px] text-amber-800 font-bold uppercase mb-1">❓ Q&A ({qs.length}) • ✋ ({hands.length})</h5>
                          <div className="space-y-0.5 max-h-36 overflow-y-auto">
                            {hands.map((h:any) => <div key={h.studentId} className="text-[10px]">✋ <span className="font-medium">{h.studentName}</span></div>)}
                            {qs.map((q:any) => (
                              <div key={q.id} className={`text-[10px] p-1 rounded ${q.answered?"bg-emerald-100":"bg-amber-100"}`}>
                                <span className="font-medium">{q.studentName}:</span> {q.question}
                                {q.answered && <span className="text-emerald-700 block">↳ {q.answer}</span>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Whispers + Reactions + Polls */}
                        <div className="p-3 bg-pink-50 rounded-xl">
                          <h5 className="text-[10px] text-pink-800 font-bold uppercase mb-1">🤫 Whispers ({whispers.length}) • Reactions</h5>
                          <div className="space-y-0.5 max-h-36 overflow-y-auto">
                            {whispers.slice(-10).map((w:any,i:number) => (
                              <div key={i} className="text-[10px] bg-pink-100 p-1 rounded">
                                <span className="font-bold">{w.fromName}</span> → <span className="font-bold">{w.toName}</span>: {w.message}
                              </div>
                            ))}
                            {reactions.length>0 && (
                              <div className="flex flex-wrap gap-0.5 mt-1">
                                {Object.entries(reactions.reduce((acc:any, r:any) => { acc[r.emoji] = (acc[r.emoji]||0) + 1; return acc; }, {})).map(([emoji, count]) => (
                                  <span key={emoji} className="text-xs bg-white px-1 rounded">{emoji}{count as number > 1 ? ` ×${count}` : ""}</span>
                                ))}
                              </div>
                            )}
                            {polls.map((p:any) => (
                              <div key={p.id} className="text-[10px] mt-1 p-1 bg-indigo-100 rounded">
                                📊 {p.question} {p.active?"(Active)":"(Closed)"}
                                {p.options?.map((o:any,j:number) => <p key={j} className="ml-2">{o.text}: {o.votes?.length||0}</p>)}
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
      )}

      {/* HISTORY TAB */}
      {tab === "history" && (
        <div>
          {/* Review modal */}
          {reviewSession && reviewData && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReviewSession(null)}>
              <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800">{reviewData.class?.subject?.name || reviewData.class?.name} — Session Review</h3>
                    <p className="text-xs text-gray-500">
                      Teacher: {reviewData.class?.teacher?.user?.name} • Duration: {reviewData.durationMin}min •
                      {reviewData.startedAt && ` ${new Date(reviewData.startedAt).toLocaleString()}`}
                    </p>
                  </div>
                  <button onClick={() => setReviewSession(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 grid md:grid-cols-2 gap-4">
                  {/* Board content */}
                  <div className="p-4 bg-gray-900 rounded-xl">
                    <h4 className="text-sm font-bold text-gray-300 mb-2">📋 Final Board</h4>
                    {(Array.isArray(reviewData.boardContent) ? reviewData.boardContent : []).map((l:any,i:number) => (
                      <p key={i} className="text-sm font-mono" style={{color:l.color||"#fff"}}>{l.text}</p>
                    ))}
                    {(Array.isArray(reviewData.boardContent) ? reviewData.boardContent : []).length===0 && <p className="text-gray-500 text-xs">Board was empty/cleared</p>}
                    {(Array.isArray(reviewData.boardHistory) ? reviewData.boardHistory : []).length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-700">
                        <p className="text-xs text-gray-400 mb-1">📜 Board History (cleared {(reviewData.boardHistory as any[]).length}x)</p>
                        {(reviewData.boardHistory as any[]).map((h:any,i:number) => (
                          <div key={i} className="mb-2">
                            <p className="text-[10px] text-gray-500">— Board #{i+1} —</p>
                            {h.content?.map((l:any,j:number) => <p key={j} className="text-[11px] ml-2" style={{color:l.color}}>{l.text}</p>)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Chat log */}
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <h4 className="text-sm font-bold text-blue-800 mb-2">💬 Full Chat ({(Array.isArray(reviewData.chatMessages)?reviewData.chatMessages:[]).length})</h4>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {(Array.isArray(reviewData.chatMessages)?reviewData.chatMessages:[]).map((m:any,i:number) => (
                        <div key={i} className="text-xs"><span className="font-bold">{m.from}</span> <span className="text-gray-400">{new Date(m.time).toLocaleTimeString()}</span>: {m.message}</div>
                      ))}
                    </div>
                  </div>
                  {/* Q&A */}
                  <div className="p-4 bg-amber-50 rounded-xl">
                    <h4 className="text-sm font-bold text-amber-800 mb-2">❓ Questions ({(Array.isArray(reviewData.questions)?reviewData.questions:[]).length})</h4>
                    <div className="space-y-2">
                      {(Array.isArray(reviewData.questions)?reviewData.questions:[]).map((q:any) => (
                        <div key={q.id} className={`p-2 rounded-lg text-xs ${q.answered?"bg-emerald-100":"bg-amber-100"}`}>
                          <p className="font-bold">{q.studentName}: {q.question}</p>
                          {q.answered && <p className="text-emerald-700 mt-1">→ {q.answer}</p>}
                          {!q.answered && <p className="text-red-500 italic">⚠ Not answered</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Whispers */}
                  <div className="p-4 bg-pink-50 rounded-xl">
                    <h4 className="text-sm font-bold text-pink-800 mb-2">🤫 Student Whispers ({(Array.isArray(reviewData.whispers)?reviewData.whispers:[]).length})</h4>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {(Array.isArray(reviewData.whispers)?reviewData.whispers:[]).map((w:any,i:number) => (
                        <div key={i} className="text-xs bg-pink-100 p-1.5 rounded"><span className="font-bold">{w.fromName}</span> → <span className="font-bold">{w.toName}</span>: {w.message}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Session table */}
          {recentSessions.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">No completed sessions today</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2.5 px-3">Subject</th>
                    <th className="text-left py-2.5 px-3">Grade</th>
                    <th className="text-left py-2.5 px-3">Teacher</th>
                    <th className="text-left py-2.5 px-3">Duration</th>
                    <th className="text-left py-2.5 px-3">Chat</th>
                    <th className="text-left py-2.5 px-3">Q&A</th>
                    <th className="text-left py-2.5 px-3">Credit</th>
                    <th className="text-left py-2.5 px-3">Time</th>
                    <th className="text-left py-2.5 px-3">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((s: any) => {
                    const chatCount = Array.isArray(s.chatMessages) ? s.chatMessages.length : 0;
                    const qaCount = Array.isArray(s.questions) ? s.questions.length : 0;
                    const whisperCount = Array.isArray(s.whispers) ? s.whispers.length : 0;
                    return (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">{s.class?.subject?.name || s.class?.name}</td>
                        <td className="py-2 px-3">{s.class?.schoolGrade?.gradeLevel}</td>
                        <td className="py-2 px-3">{s.class?.teacher?.user?.name}
                          {s.lateMinutes > 0 && <span className="ml-1 text-[9px] text-red-500">({s.lateMinutes}min late)</span>}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full ${s.durationMin>=35?"bg-emerald-100 text-emerald-700":s.durationMin>=20?"bg-amber-100 text-amber-700":"bg-red-100 text-red-700"}`}>
                            {s.durationMin||0}min
                          </span>
                          {s.isPrep && <span className="ml-1 text-[9px] bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full">PREP</span>}
                        </td>
                        <td className="py-2 px-3">{chatCount>0 && <span className="text-blue-600">💬{chatCount}</span>}</td>
                        <td className="py-2 px-3">{qaCount>0 && <span className="text-amber-600">❓{qaCount}</span>} {whisperCount>0 && <span className="text-pink-600">🤫{whisperCount}</span>}</td>
                        <td className="py-2 px-3 text-emerald-700 font-medium">
                          {s.sessionCredits?.[0] ? `${schoolCurrency} ${s.sessionCredits[0].creditAmount.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-gray-400">{s.endedAt ? new Date(s.endedAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—"}</td>
                        <td className="py-2 px-3">
                          <button onClick={() => loadReview(s)} className="text-[10px] bg-brand-50 text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-100 font-medium">
                            <Eye className="w-3 h-3 inline mr-0.5" /> Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
