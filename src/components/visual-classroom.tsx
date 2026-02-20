"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Hand, Mic, MicOff, Pencil, MessageSquare, Users,
  Maximize2, Minimize2, Send, Eraser, Type, X, Volume2, VolumeX,
} from "lucide-react";

interface Props {
  sessionId: string;
  classId: string;
  subjectName: string;
  teacherName: string;
  students: { id: string; name: string; image?: string }[];
  isTeacher: boolean;
  isLive: boolean;
  topic?: string;
  isKG?: boolean;
  studentId?: string;
  studentName?: string;
}

export default function VisualClassroom({
  sessionId, classId, subjectName, teacherName, students,
  isTeacher, isLive, topic, isKG = false, studentId, studentName,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [boardLines, setBoardLines] = useState<any[]>([]);
  const [raisedHands, setRaisedHands] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [teachingMode, setTeachingMode] = useState("board");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [boardText, setBoardText] = useState("");
  const [drawColor, setDrawColor] = useState("#FFFFFF");
  const [handRaised, setHandRaised] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [lastPoll, setLastPoll] = useState(0);

  // ===== POLLING: Fetch state every 2 seconds =====
  const pollState = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/classroom/${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.boardContent) setBoardLines(Array.isArray(data.boardContent) ? data.boardContent : []);
      if (data.raisedHands) setRaisedHands(Array.isArray(data.raisedHands) ? data.raisedHands : []);
      if (data.chatMessages) setChatMessages(Array.isArray(data.chatMessages) ? data.chatMessages : []);
      if (data.teachingMode) setTeachingMode(data.teachingMode);
      setLastPoll(Date.now());
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    pollState();
    const interval = setInterval(pollState, 2000);
    return () => clearInterval(interval);
  }, [pollState, sessionId]);

  // ===== RENDER BOARD when lines change =====
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    // Clear & draw board background
    ctx.fillStyle = isKG ? "#2D5A27" : "#1a3a1a";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#8B7355";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, c.width - 8, c.height - 8);
    ctx.strokeStyle = "#6B5B3F";
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, c.width - 24, c.height - 24);
    // Title
    ctx.font = "bold 22px serif";
    ctx.fillStyle = "#FFFFFFBB";
    ctx.textAlign = "center";
    ctx.fillText(subjectName + (topic ? " — " + topic : ""), c.width / 2, 40);
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(30, 55); ctx.lineTo(c.width - 30, 55);
    ctx.strokeStyle = "#FFFFFF44"; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    // Render all board lines from DB
    boardLines.forEach((line: any, i: number) => {
      const y = 80 + i * 32;
      if (y > c.height - 20) return;
      ctx.font = isKG ? "bold 20px Comic Sans MS, cursive" : "18px Georgia, serif";
      ctx.fillStyle = line.color || "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(line.text || "", 30, y);
    });
  }, [boardLines, subjectName, topic, isKG]);

  // ===== API ACTIONS =====
  const postAction = async (action: string, data: any = {}) => {
    if (!sessionId) return;
    try {
      await fetch(`/api/classroom/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      });
      // Immediately re-poll to show update
      setTimeout(pollState, 200);
    } catch {}
  };

  const writeOnBoard = () => {
    if (!boardText.trim() || !isTeacher) return;
    postAction("board_write", { text: boardText, color: drawColor, type: "text" });
    setBoardText("");
  };

  const clearBoard = () => {
    if (!isTeacher) return;
    postAction("board_write", { type: "clear" });
  };

  const toggleMode = (mode: string) => {
    if (!isTeacher) return;
    postAction("set_mode", { mode });
    setTeachingMode(mode);
  };

  const toggleHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    postAction("raise_hand", { studentId, studentName, raised: newState });
  };

  const ackHand = (sid: string) => {
    postAction("ack_hand", { studentId: sid });
  };

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    const from = isTeacher ? `Teacher ${teacherName}` : (studentName || "Student");
    postAction("chat", { from, message: chatMsg });
    setChatMsg("");
  };

  const CHALK = ["#FFFFFF", "#FFFF00", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FF9F43", "#A55EEA"];

  return (
    <div className={`rounded-2xl overflow-hidden shadow-xl border-2 ${isKG ? "border-yellow-400" : "border-gray-400"} ${fullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${isKG ? "bg-gradient-to-r from-yellow-400 to-orange-400" : "bg-gradient-to-r from-gray-700 to-gray-800"}`}>
        <div className="flex items-center gap-3">
          {isLive && <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-400" />}
          <div>
            <h3 className={`text-sm font-bold ${isKG ? "text-yellow-900" : "text-white"}`}>
              {isKG ? "🏫 " : ""}{subjectName} {topic ? `— ${topic}` : ""}
            </h3>
            <p className={`text-[10px] ${isKG ? "text-yellow-800" : "text-gray-300"}`}>
              {isTeacher ? `${students.length} students` : `Teacher: ${teacherName}`}
              {teachingMode === "voice" ? " • 🎤 Voice Mode" : " • ✏️ Board Mode"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isTeacher && (
            <div className="flex gap-0.5 bg-black/20 rounded-lg p-0.5">
              <button onClick={() => toggleMode("board")} className={`text-[10px] px-2.5 py-1 rounded-md ${teachingMode === "board" ? "bg-white text-gray-800 shadow" : "text-white/70"}`}>
                <Pencil className="w-3 h-3 inline mr-0.5" />Board
              </button>
              <button onClick={() => toggleMode("voice")} className={`text-[10px] px-2.5 py-1 rounded-md ${teachingMode === "voice" ? "bg-white text-gray-800 shadow" : "text-white/70"}`}>
                <Mic className="w-3 h-3 inline mr-0.5" />Voice
              </button>
            </div>
          )}
          <button onClick={() => setChatOpen(!chatOpen)} className={`relative p-1.5 rounded-lg ${isKG ? "bg-yellow-500 text-yellow-900" : "bg-gray-600 text-white"}`}>
            <MessageSquare className="w-4 h-4" />
            {chatMessages.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center">{chatMessages.length}</span>}
          </button>
          <button onClick={() => setFullscreen(!fullscreen)} className={`p-1.5 rounded-lg ${isKG ? "bg-yellow-500 text-yellow-900" : "bg-gray-600 text-white"}`}>
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={`${isKG ? "bg-gradient-to-b from-sky-200 via-green-100 to-yellow-100" : "bg-gradient-to-b from-gray-200 to-gray-300"} relative`}>
        <div className="flex">
          <div className="flex-1 p-4">
            {/* BLACKBOARD */}
            <div className="relative mb-4">
              <div className="bg-amber-800 rounded-t-lg px-4 py-1.5 flex items-center justify-between">
                <span className="text-[10px] text-amber-200 font-medium">📋 {isKG ? "Our Board" : "Blackboard"}</span>
                {isTeacher && (
                  <div className="flex items-center gap-2">
                    {CHALK.map((c) => (
                      <button key={c} onClick={() => setDrawColor(c)} className={`w-4 h-4 rounded-full border-2 ${drawColor === c ? "border-white scale-125" : "border-transparent"}`} style={{ backgroundColor: c }} />
                    ))}
                    <button onClick={clearBoard} className="text-[9px] bg-amber-900 text-amber-200 px-2 py-0.5 rounded flex items-center gap-0.5"><Eraser className="w-3 h-3" /> Clear</button>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} width={800} height={320}
                className="w-full rounded-b-lg shadow-inner" style={{ maxHeight: fullscreen ? "50vh" : "280px" }}
              />
              {/* Teacher write input */}
              {isTeacher && teachingMode === "board" && (
                <div className="flex gap-2 mt-2">
                  <input className="flex-1 input-field text-sm" placeholder="Type to write on the board..."
                    value={boardText} onChange={(e) => setBoardText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && writeOnBoard()} />
                  <button onClick={writeOnBoard} className="btn-primary text-xs px-3"><Type className="w-3.5 h-3.5 mr-1" /> Write</button>
                </div>
              )}
              {teachingMode === "voice" && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <Mic className={`w-8 h-8 mx-auto mb-1 ${isTeacher ? "text-emerald-500 animate-pulse" : "text-emerald-400"}`} />
                  <p className="text-xs text-emerald-700 font-medium">{isTeacher ? "Voice Teaching Mode Active" : "Teacher is teaching with voice"}</p>
                </div>
              )}
            </div>

            {/* RAISED HANDS ALERT (Teacher sees this) */}
            {isTeacher && raisedHands.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl animate-pulse">
                <h4 className="text-xs font-bold text-amber-800 mb-2">✋ Raised Hands ({raisedHands.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {raisedHands.map((h: any) => (
                    <div key={h.studentId} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-amber-200">
                      <span className="text-lg animate-bounce">✋</span>
                      <span className="text-xs font-medium text-gray-800">{h.studentName || "Student"}</span>
                      <button onClick={() => ackHand(h.studentId)} className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full hover:bg-emerald-600">Allow</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STUDENT SEATS */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-600 flex items-center gap-1 mb-2">
                <Users className="w-3.5 h-3.5" /> {isKG ? "🪑 Class Friends" : "Students"} ({students.length})
              </h4>
              <div className={`grid ${isKG ? "grid-cols-4 md:grid-cols-6" : "grid-cols-5 md:grid-cols-8"} gap-2`}>
                {students.map((s) => {
                  const hasHand = raisedHands.some((h: any) => h.studentId === s.id);
                  return (
                    <div key={s.id} className={`relative text-center p-2 rounded-xl transition-all ${hasHand ? "bg-amber-100 ring-2 ring-amber-400 scale-105" : isKG ? "bg-white/70" : "bg-white/50"}`}>
                      <div className={`w-full h-1.5 rounded-full mb-1 ${isKG ? "bg-amber-300" : "bg-gray-300"}`} />
                      {s.image ? (
                        <img src={s.image} alt="" className={`mx-auto rounded-full object-cover ${isKG ? "w-10 h-10" : "w-8 h-8"}`} />
                      ) : (
                        <div className={`mx-auto rounded-full flex items-center justify-center text-white font-bold ${
                          isKG ? "w-10 h-10 text-sm bg-gradient-to-br from-pink-400 to-purple-400" : "w-8 h-8 text-[10px] bg-brand-400"
                        }`}>
                          {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                      )}
                      <p className={`mt-1 truncate ${isKG ? "text-[10px] font-bold text-gray-700" : "text-[8px] text-gray-600"}`}>{s.name.split(" ")[0]}</p>
                      {hasHand && <div className="absolute -top-2 -right-1 text-xl animate-bounce">✋</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RAISE HAND (Student only) */}
            {!isTeacher && isLive && (
              <button onClick={toggleHand}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-md ${
                  handRaised
                    ? "bg-amber-400 text-amber-900 scale-105 animate-bounce"
                    : isKG ? "bg-white text-gray-700 hover:bg-amber-100 border-2 border-amber-300" : "bg-white text-gray-700 hover:bg-amber-50 border"
                } ${isKG ? "text-lg" : "text-sm"}`}>
                <Hand className={isKG ? "w-6 h-6" : "w-4 h-4"} />
                {handRaised ? (isKG ? "✋ Hand Up!" : "Lower Hand") : (isKG ? "Raise Hand ✋" : "Raise Hand")}
              </button>
            )}

            {/* Sync indicator */}
            <div className="mt-3 flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${lastPoll > Date.now() - 5000 ? "bg-emerald-400" : "bg-red-400"}`} />
              <span className="text-[9px] text-gray-400">{lastPoll > Date.now() - 5000 ? "Synced" : "Reconnecting..."}</span>
            </div>
          </div>

          {/* CHAT SIDEBAR */}
          {chatOpen && (
            <div className={`w-72 border-l flex flex-col ${isKG ? "bg-white border-yellow-300" : "bg-white border-gray-300"}`}>
              <div className={`px-3 py-2 font-bold text-xs border-b flex items-center justify-between ${isKG ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"}`}>
                <span>{isKG ? "💬 Class Chat" : "Class Chat"} ({chatMessages.length})</span>
                <button onClick={() => setChatOpen(false)}><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-96" id="chat-scroll">
                {chatMessages.length === 0 && <p className="text-[10px] text-gray-400 text-center py-8">No messages yet</p>}
                {chatMessages.map((m: any, i: number) => (
                  <div key={m.id || i} className={`text-xs p-2 rounded-lg ${m.from?.startsWith("Teacher") ? "bg-brand-50 text-brand-800" : "bg-gray-100"}`}>
                    <span className="font-bold">{m.from}</span>
                    <span className="text-[9px] text-gray-400 ml-1">{new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <p className="mt-0.5">{m.message}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t flex gap-1">
                <input className="flex-1 input-field text-xs py-1.5" placeholder={isKG ? "Say something..." : "Type message..."}
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
