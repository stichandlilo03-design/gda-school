"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Hand, Mic, MicOff, Video, VideoOff, Pencil, MessageSquare, Users,
  Maximize2, Minimize2, Send, Eraser, Type, X, HelpCircle, Clock,
  CheckCircle, BookOpen, FileText, Calculator, Globe, Palette,
} from "lucide-react";

interface Props {
  sessionId: string; classId: string; subjectName: string; teacherName: string;
  students: { id: string; name: string; image?: string }[];
  isTeacher: boolean; isLive: boolean; topic?: string; isKG?: boolean;
  studentId?: string; studentName?: string;
}

export default function VisualClassroom(props: Props) {
  const { sessionId, classId, subjectName, teacherName, students,
    isTeacher, isLive, topic, isKG = false, studentId, studentName } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [boardLines, setBoardLines] = useState<any[]>([]);
  const [raisedHands, setRaisedHands] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [teachingMode, setTeachingMode] = useState("board");
  const [liveMinutes, setLiveMinutes] = useState(0);

  const [chatOpen, setChatOpen] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [boardText, setBoardText] = useState("");
  const [drawColor, setDrawColor] = useState("#FFFFFF");
  const [handRaised, setHandRaised] = useState(false);
  const [handAccepted, setHandAccepted] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [lastPoll, setLastPoll] = useState(0);

  // Video/Audio state
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Timer
  const [timerStr, setTimerStr] = useState("00:00");
  useEffect(() => {
    const i = setInterval(() => {
      const m = liveMinutes;
      const now = new Date();
      const elapsed = m * 60;
      const mm = Math.floor(elapsed / 60).toString().padStart(2, "0");
      const ss = (elapsed % 60).toString().padStart(2, "0");
      setTimerStr(`${mm}:${String(Math.floor((Date.now() / 1000) % 60)).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(i);
  }, [liveMinutes]);

  // ===== POLL every 2s =====
  const poll = useCallback(async () => {
    if (!sessionId) return;
    try {
      const r = await fetch(`/api/classroom/${sessionId}`);
      if (!r.ok) return;
      const d = await r.json();
      setBoardLines(Array.isArray(d.boardContent) ? d.boardContent : []);
      setRaisedHands(Array.isArray(d.raisedHands) ? d.raisedHands : []);
      setChatMessages(Array.isArray(d.chatMessages) ? d.chatMessages : []);
      setQuestions(Array.isArray(d.questions) ? d.questions : []);
      if (d.teachingMode) setTeachingMode(d.teachingMode);
      if (d.liveMinutes !== undefined) setLiveMinutes(d.liveMinutes);
      setLastPoll(Date.now());
      // Check if student's hand was acknowledged (no longer in list = accepted)
      if (!isTeacher && handRaised && !d.raisedHands?.find((h:any) => h.studentId === studentId)) {
        setHandRaised(false);
        setHandAccepted(true);
      }
    } catch {}
  }, [sessionId, handRaised, studentId, isTeacher]);

  useEffect(() => {
    poll();
    const i = setInterval(poll, 2000);
    return () => clearInterval(i);
  }, [poll]);

  // Render board
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = isKG ? "#2D5A27" : "#1a3a1a";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#8B7355"; ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, c.width-8, c.height-8);
    ctx.font = "bold 20px serif"; ctx.fillStyle = "#FFFFFFBB"; ctx.textAlign = "center";
    ctx.fillText(subjectName + (topic ? " — " + topic : ""), c.width/2, 38);
    ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(30,52); ctx.lineTo(c.width-30,52);
    ctx.strokeStyle = "#FFFFFF44"; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    boardLines.forEach((line: any, i: number) => {
      const y = 75 + i * 30;
      if (y > c.height - 15) return;
      ctx.font = isKG ? "bold 18px Comic Sans MS, cursive" : "16px Georgia, serif";
      ctx.fillStyle = line.color || "#FFF"; ctx.textAlign = "left";
      ctx.fillText(line.text || "", 25, y);
    });
  }, [boardLines, subjectName, topic, isKG]);

  // Camera toggle
  const toggleCamera = async () => {
    if (camOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCamOn(false);
      setMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCamOn(true);
        setMicOn(true);
      } catch { alert("Camera/mic not available"); }
    }
  };

  const toggleMic = () => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicOn(!micOn);
  };

  // Actions
  const post = async (action: string, data: any = {}) => {
    if (!sessionId) return;
    try {
      await fetch(`/api/classroom/${sessionId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      });
      setTimeout(poll, 200);
    } catch {}
  };

  const writeBoard = () => { if (boardText.trim() && isTeacher) { post("board_write", { text: boardText, color: drawColor }); setBoardText(""); } };
  const clearBoard = () => { if (isTeacher) post("board_write", { type: "clear" }); };
  const setMode = (m: string) => { post("set_mode", { mode: m }); setTeachingMode(m); };
  const toggleHand = () => { const n = !handRaised; setHandRaised(n); setHandAccepted(false); post("raise_hand", { studentId, studentName, raised: n }); };
  const ackHand = (sid: string) => post("ack_hand", { studentId: sid });
  const sendChat = () => { if (!chatMsg.trim()) return; post("chat", { from: isTeacher ? `Teacher` : studentName, message: chatMsg }); setChatMsg(""); };
  const askQuestion = () => { if (!questionText.trim()) return; post("ask_question", { studentId, studentName, question: questionText }); setQuestionText(""); setHandAccepted(false); };
  const answerQ = (qId: string) => { if (!answerText.trim()) return; post("answer_question", { questionId: qId, answer: answerText }); setAnswerText(""); };

  const CHALK = ["#FFFFFF","#FFFF00","#FF6B6B","#4ECDC4","#45B7D1","#FF9F43","#A55EEA"];
  const unanswered = questions.filter((q:any) => !q.answered).length;

  return (
    <div className={`rounded-2xl overflow-hidden shadow-xl border-2 ${isKG ? "border-yellow-400" : "border-gray-400"} ${fullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}>
      {/* HEADER */}
      <div className={`px-3 py-2.5 flex items-center justify-between ${isKG ? "bg-gradient-to-r from-yellow-400 to-orange-400" : "bg-gradient-to-r from-gray-700 to-gray-800"}`}>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-400" />
          <div>
            <h3 className={`text-sm font-bold ${isKG ? "text-yellow-900" : "text-white"}`}>{isKG ? "🏫 " : ""}{subjectName}</h3>
            <p className={`text-[10px] ${isKG ? "text-yellow-800" : "text-gray-300"}`}>
              {isTeacher ? `${students.length} students` : `Teacher: ${teacherName}`}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${liveMinutes >= 40 ? "bg-red-500/20 text-red-200" : liveMinutes >= 30 ? "bg-amber-500/20 text-amber-200" : "bg-white/10 text-white"}`}>
          <Clock className="w-3.5 h-3.5" />
          <span className="text-sm font-mono font-bold">{String(liveMinutes).padStart(2,"0")}:{String(Math.floor((Date.now()/1000)%60)).padStart(2,"0")}</span>
          <span className="text-[8px] opacity-70">/ 40:00</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mode Toggle (teacher) */}
          {isTeacher && (
            <div className="flex gap-0.5 bg-black/20 rounded-lg p-0.5">
              {[{m:"board",i:Pencil,l:"Board"},{m:"voice",i:Mic,l:"Voice"},{m:"video",i:Video,l:"Video"}].map(({m,i:Icon,l}) => (
                <button key={m} onClick={() => setMode(m)} className={`text-[9px] px-2 py-1 rounded-md ${teachingMode === m ? "bg-white text-gray-800 shadow" : "text-white/70"}`}>
                  <Icon className="w-3 h-3 inline mr-0.5" />{l}
                </button>
              ))}
            </div>
          )}
          {/* Camera/Mic */}
          <button onClick={toggleCamera} className={`p-1.5 rounded-lg ${camOn ? "bg-red-500 text-white" : "bg-gray-600 text-white/70"}`}>
            {camOn ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
          </button>
          <button onClick={toggleMic} disabled={!camOn} className={`p-1.5 rounded-lg ${micOn ? "bg-emerald-500 text-white" : "bg-gray-600 text-white/70"}`}>
            {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>
          {/* Q&A */}
          <button onClick={() => setQaOpen(!qaOpen)} className="relative p-1.5 rounded-lg bg-gray-600 text-white/70 hover:text-white">
            <HelpCircle className="w-3.5 h-3.5" />
            {unanswered > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-[8px] text-white rounded-full flex items-center justify-center font-bold">{unanswered}</span>}
          </button>
          {/* Chat */}
          <button onClick={() => setChatOpen(!chatOpen)} className="relative p-1.5 rounded-lg bg-gray-600 text-white/70 hover:text-white">
            <MessageSquare className="w-3.5 h-3.5" />
            {chatMessages.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[8px] text-white rounded-full flex items-center justify-center">{chatMessages.length}</span>}
          </button>
          <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 rounded-lg bg-gray-600 text-white/70 hover:text-white">
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className={`${isKG ? "bg-gradient-to-b from-sky-200 via-green-100 to-yellow-100" : "bg-gradient-to-b from-gray-200 to-gray-300"}`}>
        <div className="flex">
          <div className="flex-1 p-3">
            {/* Video feeds */}
            {(teachingMode === "video" || camOn) && (
              <div className="mb-3 grid grid-cols-4 gap-2">
                <div className="relative col-span-2 row-span-2">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl bg-black aspect-video object-cover" />
                  <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">
                    {isTeacher ? "You (Teacher)" : studentName}
                  </span>
                </div>
                {students.slice(0, 6).map((s) => (
                  <div key={s.id} className="rounded-lg bg-gray-800 aspect-video flex items-center justify-center relative">
                    {s.image ? <img src={s.image} alt="" className="w-8 h-8 rounded-full" /> :
                      <div className="w-8 h-8 rounded-full bg-brand-400 flex items-center justify-center text-white text-xs font-bold">{s.name[0]}</div>}
                    <span className="absolute bottom-1 left-1 text-[7px] text-white/70">{s.name.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            )}

            {/* BLACKBOARD */}
            <div className="relative mb-3">
              <div className="bg-amber-800 rounded-t-lg px-3 py-1 flex items-center justify-between">
                <span className="text-[10px] text-amber-200">📋 {isKG ? "Our Board" : "Blackboard"}</span>
                {isTeacher && (
                  <div className="flex items-center gap-1.5">
                    {CHALK.map((c) => (
                      <button key={c} onClick={() => setDrawColor(c)} className={`w-3.5 h-3.5 rounded-full border ${drawColor === c ? "border-white scale-125" : "border-transparent"}`} style={{ backgroundColor: c }} />
                    ))}
                    <button onClick={clearBoard} className="text-[8px] bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded"><Eraser className="w-2.5 h-2.5 inline" /> Clear</button>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} width={800} height={280} className="w-full rounded-b-lg shadow-inner" style={{ maxHeight: fullscreen ? "45vh" : "240px" }} />
              {isTeacher && teachingMode === "board" && (
                <div className="flex gap-2 mt-2">
                  <input className="flex-1 input-field text-sm" placeholder="Write on board..." value={boardText}
                    onChange={(e) => setBoardText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && writeBoard()} />
                  <button onClick={writeBoard} className="btn-primary text-xs px-3"><Type className="w-3 h-3 mr-1" /> Write</button>
                </div>
              )}
              {teachingMode === "voice" && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <Mic className={`w-6 h-6 mx-auto mb-1 ${isTeacher ? "text-emerald-500 animate-pulse" : "text-emerald-400"}`} />
                  <p className="text-xs text-emerald-700 font-medium">{isTeacher ? "Voice Mode — Use your microphone" : "Teacher is using voice"}</p>
                  {!camOn && <p className="text-[9px] text-emerald-600 mt-1">Turn on your camera/mic to participate</p>}
                </div>
              )}
            </div>

            {/* RAISED HANDS (teacher) */}
            {isTeacher && raisedHands.length > 0 && (
              <div className="mb-3 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl">
                <h4 className="text-xs font-bold text-amber-800 mb-2">✋ Raised Hands ({raisedHands.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {raisedHands.map((h: any) => (
                    <div key={h.studentId} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-amber-200 animate-pulse">
                      <span className="text-lg animate-bounce">✋</span>
                      <span className="text-xs font-medium">{h.studentName}</span>
                      <button onClick={() => ackHand(h.studentId)} className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full">Allow</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CLASSROOM TOOLS */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {[
                { icon: BookOpen, label: "Notes", color: "bg-blue-100 text-blue-700" },
                { icon: Calculator, label: "Calculator", color: "bg-green-100 text-green-700" },
                { icon: FileText, label: "Whiteboard", color: "bg-purple-100 text-purple-700" },
                { icon: Globe, label: "Dictionary", color: "bg-cyan-100 text-cyan-700" },
                { icon: Palette, label: "Drawing", color: "bg-pink-100 text-pink-700" },
              ].map(({ icon: Icon, label, color }) => (
                <button key={label} className={`flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg font-medium ${color} hover:opacity-80`}>
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>

            {/* STUDENTS */}
            <div className="mb-3">
              <h4 className="text-xs font-bold text-gray-600 flex items-center gap-1 mb-2">
                <Users className="w-3.5 h-3.5" /> {isKG ? "🪑 Friends" : "Students"} ({students.length})
              </h4>
              <div className={`grid ${isKG ? "grid-cols-4 md:grid-cols-6" : "grid-cols-6 md:grid-cols-8"} gap-1.5`}>
                {students.map((s) => {
                  const hasHand = raisedHands.some((h: any) => h.studentId === s.id);
                  return (
                    <div key={s.id} className={`relative text-center p-1.5 rounded-xl transition ${hasHand ? "bg-amber-100 ring-2 ring-amber-400 scale-105" : "bg-white/60"}`}>
                      <div className={`w-full h-1 rounded-full mb-0.5 ${isKG ? "bg-amber-300" : "bg-gray-300"}`} />
                      {s.image ? <img src={s.image} alt="" className="mx-auto rounded-full w-7 h-7 object-cover" /> :
                        <div className={`mx-auto rounded-full w-7 h-7 flex items-center justify-center text-white font-bold text-[9px] ${isKG ? "bg-gradient-to-br from-pink-400 to-purple-400" : "bg-brand-400"}`}>{s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>}
                      <p className="text-[7px] text-gray-600 mt-0.5 truncate">{s.name.split(" ")[0]}</p>
                      {hasHand && <div className="absolute -top-1.5 -right-0.5 text-sm animate-bounce">✋</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STUDENT CONTROLS */}
            {!isTeacher && isLive && (
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={toggleHand}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-md ${
                    handRaised ? "bg-amber-400 text-amber-900 scale-105 animate-bounce" :
                    "bg-white text-gray-700 hover:bg-amber-50 border"
                  } ${isKG ? "text-base" : "text-sm"}`}>
                  <Hand className="w-4 h-4" /> {handRaised ? "✋ Raised" : "Raise Hand"}
                </button>

                {/* Ask Question (after hand accepted) */}
                {handAccepted && (
                  <div className="flex-1 flex gap-2 items-center p-2 bg-emerald-50 border border-emerald-200 rounded-xl animate-in">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <input className="flex-1 input-field text-sm py-1.5" placeholder="Ask your question..."
                      value={questionText} onChange={(e) => setQuestionText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && askQuestion()} />
                    <button onClick={askQuestion} className="btn-primary text-xs px-3 py-1.5">Ask</button>
                  </div>
                )}
              </div>
            )}

            {/* Sync + timer bar */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${lastPoll > Date.now()-5000 ? "bg-emerald-400" : "bg-red-400"}`} />
                <span className="text-[9px] text-gray-400">{lastPoll > Date.now()-5000 ? "Synced" : "Reconnecting..."}</span>
              </div>
              {liveMinutes >= 35 && (
                <span className="text-[9px] text-red-500 font-bold animate-pulse">⏰ {40 - liveMinutes} min remaining</span>
              )}
            </div>
          </div>

          {/* Q&A SIDEBAR */}
          {qaOpen && (
            <div className="w-72 border-l bg-white flex flex-col">
              <div className="px-3 py-2 bg-amber-50 border-b flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">❓ Questions ({questions.length})</span>
                <button onClick={() => setQaOpen(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-96">
                {questions.length === 0 && <p className="text-[10px] text-gray-400 text-center py-8">No questions yet</p>}
                {questions.map((q: any) => (
                  <div key={q.id} className={`p-2.5 rounded-lg border ${q.answered ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-sm">{q.answered ? "✅" : "❓"}</span>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500 font-medium">{q.studentName}</p>
                        <p className="text-xs text-gray-800 font-medium mt-0.5">{q.question}</p>
                        {q.answered && <p className="text-xs text-emerald-700 mt-1 bg-emerald-100 p-1.5 rounded">💬 {q.answer}</p>}
                      </div>
                    </div>
                    {isTeacher && !q.answered && (
                      <div className="flex gap-1 mt-2">
                        <input className="flex-1 input-field text-[10px] py-1" placeholder="Answer..."
                          value={answerText} onChange={(e) => setAnswerText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && answerQ(q.id)} />
                        <button onClick={() => answerQ(q.id)} className="text-[9px] bg-emerald-500 text-white px-2 py-1 rounded">Reply</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHAT SIDEBAR */}
          {chatOpen && !qaOpen && (
            <div className="w-72 border-l bg-white flex flex-col">
              <div className="px-3 py-2 bg-gray-100 border-b flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">{isKG ? "💬 Chat" : "Class Chat"}</span>
                <button onClick={() => setChatOpen(false)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-96">
                {chatMessages.length === 0 && <p className="text-[10px] text-gray-400 text-center py-8">No messages</p>}
                {chatMessages.map((m: any, i: number) => (
                  <div key={m.id || i} className={`text-xs p-2 rounded-lg ${m.from?.includes("Teacher") ? "bg-brand-50 text-brand-800" : "bg-gray-100"}`}>
                    <span className="font-bold">{m.from}</span>
                    <span className="text-[9px] text-gray-400 ml-1">{new Date(m.time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>
                    <p className="mt-0.5">{m.message}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t flex gap-1">
                <input className="flex-1 input-field text-xs py-1.5" placeholder="Message..."
                  value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
                <button onClick={sendChat} className="p-1.5 bg-brand-600 text-white rounded-lg"><Send className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
