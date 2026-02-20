"use client";

import { useState, useEffect, useRef } from "react";
import {
  Hand, Mic, MicOff, Volume2, VolumeX, Pencil, MessageSquare, Users,
  Maximize2, Minimize2, ChevronDown, Send, Eraser, Type, X, Smile,
} from "lucide-react";

interface ClassroomProps {
  classId: string;
  className: string;
  subjectName: string;
  teacherName: string;
  teacherImage?: string;
  students: { id: string; name: string; image?: string }[];
  isTeacher: boolean;
  isLive: boolean;
  topic?: string;
  isKG?: boolean;
  onRaiseHand?: (studentId: string) => void;
}

type BoardItem = { type: "text" | "draw"; content: string; x: number; y: number; color: string; size: number; id: string };

export default function VisualClassroom({
  classId, className, subjectName, teacherName, teacherImage,
  students, isTeacher, isLive, topic, isKG = false, onRaiseHand,
}: ClassroomProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"board" | "voice">(isTeacher ? "board" : "board");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#FFFFFF");
  const [drawSize, setDrawSize] = useState(3);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatLog, setChatLog] = useState<{from: string; msg: string; time: string}[]>([]);
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [fullscreen, setFullscreen] = useState(false);
  const [boardText, setBoardText] = useState("");
  const [boardLines, setBoardLines] = useState<string[]>([]);
  const [seatView, setSeatView] = useState(true);

  // Canvas drawing for blackboard
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = isKG ? "#2D5A27" : "#1a3a1a";
    ctx.fillRect(0, 0, c.width, c.height);
    // Draw chalk border
    ctx.strokeStyle = "#8B7355";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, c.width - 8, c.height - 8);
    // Inner border
    ctx.strokeStyle = "#6B5B3F";
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, c.width - 24, c.height - 24);
    // Title
    ctx.font = "bold 24px serif";
    ctx.fillStyle = "#FFFFFFCC";
    ctx.textAlign = "center";
    ctx.fillText(subjectName + (topic ? " — " + topic : ""), c.width / 2, 45);
    // Dotted line under title
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(30, 60);
    ctx.lineTo(c.width - 30, 60);
    ctx.strokeStyle = "#FFFFFF55";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }, [subjectName, topic, isKG]);

  // Drawing on canvas
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTeacher && mode !== "board") return;
    if (!isTeacher) return; // Only teacher draws
    setIsDrawing(true);
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const rect = c.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isTeacher) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const rect = c.getBoundingClientRect();
    ctx.lineWidth = drawSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = drawColor;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  const clearBoard = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = isKG ? "#2D5A27" : "#1a3a1a";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#8B7355";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, c.width - 8, c.height - 8);
    ctx.font = "bold 24px serif";
    ctx.fillStyle = "#FFFFFFCC";
    ctx.textAlign = "center";
    ctx.fillText(subjectName, c.width / 2, 45);
    setBoardLines([]);
  };

  const writeOnBoard = () => {
    if (!boardText.trim()) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const lineY = 80 + boardLines.length * 35;
    ctx.font = isKG ? "bold 22px Comic Sans MS, cursive" : "20px Georgia, serif";
    ctx.fillStyle = drawColor;
    ctx.textAlign = "left";
    ctx.fillText(boardText, 30, lineY);
    setBoardLines((p) => [...p, boardText]);
    setBoardText("");
  };

  const toggleHand = () => {
    setHandRaised(!handRaised);
    if (!handRaised && onRaiseHand) onRaiseHand(classId);
  };

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    setChatLog((p) => [...p, { from: isTeacher ? "Teacher" : "You", msg: chatMsg, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setChatMsg("");
  };

  const CHALK_COLORS = ["#FFFFFF", "#FFFF00", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FF9F43", "#A55EEA"];
  const bgClass = isKG
    ? "bg-gradient-to-b from-sky-200 via-green-100 to-yellow-100"
    : "bg-gradient-to-b from-gray-200 to-gray-300";

  return (
    <div className={`rounded-2xl overflow-hidden shadow-xl border-2 ${isKG ? "border-yellow-400" : "border-gray-400"} ${fullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}>
      {/* Classroom Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${isKG ? "bg-gradient-to-r from-yellow-400 to-orange-400" : "bg-gradient-to-r from-gray-700 to-gray-800"}`}>
        <div className="flex items-center gap-3">
          {isLive && <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-400" />}
          <div>
            <h3 className={`text-sm font-bold ${isKG ? "text-yellow-900" : "text-white"}`}>
              {isKG ? `🏫 ${subjectName}` : subjectName} {topic ? `— ${topic}` : ""}
            </h3>
            <p className={`text-[10px] ${isKG ? "text-yellow-800" : "text-gray-300"}`}>
              {isTeacher ? `${students.length} students` : `Teacher: ${teacherName}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isTeacher && (
            <div className="flex gap-1 bg-black/20 rounded-lg p-0.5">
              <button onClick={() => setMode("board")} className={`text-[10px] px-2.5 py-1 rounded-md transition ${mode === "board" ? "bg-white text-gray-800 shadow" : "text-white/70"}`}>
                <Pencil className="w-3 h-3 inline mr-1" />Board
              </button>
              <button onClick={() => setMode("voice")} className={`text-[10px] px-2.5 py-1 rounded-md transition ${mode === "voice" ? "bg-white text-gray-800 shadow" : "text-white/70"}`}>
                <Mic className="w-3 h-3 inline mr-1" />Voice
              </button>
            </div>
          )}
          <button onClick={() => setChatOpen(!chatOpen)} className={`p-1.5 rounded-lg ${isKG ? "bg-yellow-500 text-yellow-900" : "bg-gray-600 text-white"}`}>
            <MessageSquare className="w-4 h-4" />
          </button>
          <button onClick={() => setFullscreen(!fullscreen)} className={`p-1.5 rounded-lg ${isKG ? "bg-yellow-500 text-yellow-900" : "bg-gray-600 text-white"}`}>
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={`${bgClass} relative`}>
        <div className="flex">
          {/* Main classroom area */}
          <div className="flex-1 p-4">
            {/* Blackboard */}
            <div className="relative mb-4">
              <div className="bg-amber-800 rounded-t-lg px-4 py-1.5 flex items-center justify-between">
                <span className="text-[10px] text-amber-200 font-medium">📋 {isKG ? "Our Board" : "Blackboard"}</span>
                {isTeacher && (
                  <div className="flex items-center gap-2">
                    {CHALK_COLORS.map((c) => (
                      <button key={c} onClick={() => setDrawColor(c)} className={`w-4 h-4 rounded-full border-2 ${drawColor === c ? "border-white scale-125" : "border-transparent"}`} style={{ backgroundColor: c }} />
                    ))}
                    <select className="text-[9px] bg-amber-700 text-white rounded px-1 py-0.5" value={drawSize} onChange={(e) => setDrawSize(Number(e.target.value))}>
                      <option value={2}>Thin</option><option value={4}>Medium</option><option value={8}>Thick</option>
                    </select>
                    <button onClick={clearBoard} className="text-[9px] bg-amber-900 text-amber-200 px-2 py-0.5 rounded flex items-center gap-0.5"><Eraser className="w-3 h-3" /> Clear</button>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} width={800} height={350}
                className="w-full rounded-b-lg cursor-crosshair shadow-inner" style={{ maxHeight: fullscreen ? "50vh" : "300px" }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              />
              {/* Teacher text input for board */}
              {isTeacher && mode === "board" && (
                <div className="flex gap-2 mt-2">
                  <input className="flex-1 input-field text-sm" placeholder={isKG ? "Type to write on the board..." : "Write on the board..."} value={boardText}
                    onChange={(e) => setBoardText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && writeOnBoard()} />
                  <button onClick={writeOnBoard} className="btn-primary text-xs px-3"><Type className="w-3.5 h-3.5 mr-1" /> Write</button>
                </div>
              )}
              {/* Voice mode indicator */}
              {isTeacher && mode === "voice" && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <Mic className="w-8 h-8 text-emerald-500 mx-auto mb-1 animate-pulse" />
                  <p className="text-xs text-emerald-700 font-medium">Voice Teaching Mode Active</p>
                  <p className="text-[10px] text-emerald-600">Students can hear you. Use your microphone to teach.</p>
                </div>
              )}
            </div>

            {/* Student seats */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-gray-600 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {isKG ? "🪑 Class Friends" : "Students"} ({students.length})
                </h4>
              </div>
              <div className={`grid ${isKG ? "grid-cols-4 md:grid-cols-6" : "grid-cols-5 md:grid-cols-8"} gap-2`}>
                {students.map((s) => {
                  const isHandUp = raisedHands.has(s.id);
                  return (
                    <div key={s.id} className={`relative text-center p-2 rounded-xl transition-all ${isHandUp ? "bg-amber-100 ring-2 ring-amber-400 scale-105" : isKG ? "bg-white/70" : "bg-white/50"} hover:bg-white/90`}>
                      {/* Desk */}
                      <div className={`w-full h-1.5 rounded-full mb-1 ${isKG ? "bg-amber-300" : "bg-gray-300"}`} />
                      {/* Avatar */}
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
                      {/* Raised hand */}
                      {isHandUp && (
                        <div className="absolute -top-2 -right-1 text-xl animate-bounce">✋</div>
                      )}
                      {/* Teacher can accept raised hand */}
                      {isTeacher && isHandUp && (
                        <button onClick={() => setRaisedHands((p) => { const n = new Set(p); n.delete(s.id); return n; })}
                          className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded mt-0.5">Allow</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Raise Hand button (student only) */}
            {!isTeacher && isLive && (
              <div className="flex items-center gap-3">
                <button onClick={toggleHand}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-md ${
                    handRaised
                      ? isKG ? "bg-amber-400 text-amber-900 scale-105 animate-bounce" : "bg-amber-500 text-white scale-105"
                      : isKG ? "bg-white text-gray-700 hover:bg-amber-100 border-2 border-amber-300" : "bg-white text-gray-700 hover:bg-amber-50 border"
                  } ${isKG ? "text-lg" : "text-sm"}`}>
                  <Hand className={`${isKG ? "w-6 h-6" : "w-4 h-4"}`} />
                  {handRaised ? (isKG ? "✋ Hand Up!" : "Hand Raised ✋") : (isKG ? "Raise Hand ✋" : "Raise Hand")}
                </button>
                {handRaised && (
                  <p className={`${isKG ? "text-sm text-amber-700" : "text-xs text-amber-600"}`}>
                    {isKG ? "Teacher will call on you! Wait..." : "Waiting for teacher to respond..."}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Chat sidebar */}
          {chatOpen && (
            <div className={`w-72 border-l flex flex-col ${isKG ? "bg-white border-yellow-300" : "bg-white border-gray-300"}`}>
              <div className={`px-3 py-2 font-bold text-xs border-b flex items-center justify-between ${isKG ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "bg-gray-100 text-gray-700"}`}>
                <span>{isKG ? "💬 Class Chat" : "Class Chat"}</span>
                <button onClick={() => setChatOpen(false)}><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-96">
                {chatLog.length === 0 && <p className="text-[10px] text-gray-400 text-center py-8">No messages yet</p>}
                {chatLog.map((m, i) => (
                  <div key={i} className={`text-xs p-2 rounded-lg ${m.from === "Teacher" ? "bg-brand-50 text-brand-800" : m.from === "You" ? "bg-gray-100 ml-4" : "bg-gray-50"}`}>
                    <span className="font-bold">{m.from}</span>
                    <span className="text-[9px] text-gray-400 ml-1">{m.time}</span>
                    <p className="mt-0.5">{m.msg}</p>
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
