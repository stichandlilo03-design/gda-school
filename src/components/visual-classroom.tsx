"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Hand, Mic, Video, Pencil, MessageSquare, Users,
  Maximize2, Minimize2, Send, Eraser, Type, X, HelpCircle, Clock,
  CheckCircle, BookOpen, FileText, Calculator, Globe, Palette,
  BarChart3, Lock, Smile, Settings,
} from "lucide-react";
import StudentDesk from "@/components/student-desk";
import ClassroomVideo from "@/components/classroom-video";

interface Props {
  sessionId: string; classId: string; subjectName: string; teacherName: string;
  students: { id: string; name: string; image?: string }[];
  isTeacher: boolean; isLive: boolean; topic?: string; isKG?: boolean;
  studentId?: string; studentName?: string;
}

// ============ TOOL PANELS ============
function NotesTool({ onClose }: { onClose: () => void }) {
  const [notes, setNotes] = useState("");
  return (
    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> My Notes</h4>
        <div className="flex gap-1">
          <button onClick={() => { if (notes) { const b = new Blob([notes],{type:"text/plain"}); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "class-notes.txt"; a.click(); }}} className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded">Save</button>
          <button onClick={onClose}><X className="w-3.5 h-3.5 text-gray-400" /></button>
        </div>
      </div>
      <textarea className="w-full h-40 p-3 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
        placeholder="Take notes during class..." value={notes} onChange={(e) => setNotes(e.target.value)} />
      <p className="text-[9px] text-gray-400 mt-1">{notes.length} characters • Auto-saved locally</p>
    </div>
  );
}

function CalculatorTool({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);
  const num = (n: string) => { setDisplay(fresh ? n : display + n); setFresh(false); };
  const operate = (o: string) => { setPrev(parseFloat(display)); setOp(o); setFresh(true); };
  const equals = () => {
    if (prev === null || !op) return;
    const cur = parseFloat(display);
    let r = 0;
    if (op === "+") r = prev + cur; else if (op === "-") r = prev - cur;
    else if (op === "×") r = prev * cur; else if (op === "÷") r = cur !== 0 ? prev / cur : 0;
    setDisplay(String(Math.round(r * 1e10) / 1e10)); setPrev(null); setOp(null); setFresh(true);
  };
  const clear = () => { setDisplay("0"); setPrev(null); setOp(null); setFresh(true); };
  const btn = "w-10 h-10 rounded-lg text-sm font-bold flex items-center justify-center transition-all active:scale-95";
  return (
    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-green-800 flex items-center gap-1"><Calculator className="w-3.5 h-3.5" /> Calculator</h4>
        <button onClick={onClose}><X className="w-3.5 h-3.5 text-gray-400" /></button>
      </div>
      <div className="bg-gray-900 text-white text-right p-3 rounded-lg text-xl font-mono mb-2 overflow-x-auto">{display}</div>
      <div className="grid grid-cols-4 gap-1">
        <button onClick={clear} className={`${btn} bg-red-200 text-red-800 col-span-2`}>AC</button>
        <button onClick={() => setDisplay(String(-parseFloat(display)))} className={`${btn} bg-gray-200`}>±</button>
        <button onClick={() => operate("÷")} className={`${btn} bg-amber-200 text-amber-800`}>÷</button>
        {["7","8","9"].map(n => <button key={n} onClick={() => num(n)} className={`${btn} bg-white shadow-sm`}>{n}</button>)}
        <button onClick={() => operate("×")} className={`${btn} bg-amber-200 text-amber-800`}>×</button>
        {["4","5","6"].map(n => <button key={n} onClick={() => num(n)} className={`${btn} bg-white shadow-sm`}>{n}</button>)}
        <button onClick={() => operate("-")} className={`${btn} bg-amber-200 text-amber-800`}>−</button>
        {["1","2","3"].map(n => <button key={n} onClick={() => num(n)} className={`${btn} bg-white shadow-sm`}>{n}</button>)}
        <button onClick={() => operate("+")} className={`${btn} bg-amber-200 text-amber-800`}>+</button>
        <button onClick={() => num("0")} className={`${btn} bg-white shadow-sm col-span-2`}>0</button>
        <button onClick={() => num(".")} className={`${btn} bg-white shadow-sm`}>.</button>
        <button onClick={equals} className={`${btn} bg-emerald-500 text-white`}>=</button>
      </div>
    </div>
  );
}

function WhiteboardTool({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(3);
  const draw = (e: React.MouseEvent) => {
    if (!drawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const r = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
    ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.stroke();
  };
  const start = (e: React.MouseEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const r = canvasRef.current!.getBoundingClientRect();
    ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  };
  const clear = () => { const ctx = canvasRef.current?.getContext("2d"); if (ctx) ctx.clearRect(0, 0, 600, 300); };
  return (
    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-purple-800 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> My Whiteboard</h4>
        <div className="flex items-center gap-2">
          {["#000","#e53e3e","#3182ce","#38a169","#d69e2e","#805ad5"].map(c => (
            <button key={c} onClick={() => setColor(c)} className={`w-4 h-4 rounded-full border-2 ${color === c ? "border-gray-800 scale-125" : "border-transparent"}`} style={{backgroundColor:c}} />
          ))}
          <select value={size} onChange={e => setSize(+e.target.value)} className="text-[9px] border rounded px-1">
            <option value="2">Thin</option><option value="3">Med</option><option value="6">Thick</option>
          </select>
          <button onClick={clear} className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded">Clear</button>
          <button onClick={onClose}><X className="w-3.5 h-3.5 text-gray-400" /></button>
        </div>
      </div>
      <canvas ref={canvasRef} width={600} height={300}
        className="w-full bg-white rounded-lg border cursor-crosshair"
        onMouseDown={start} onMouseMove={draw} onMouseUp={() => setDrawing(false)} onMouseLeave={() => setDrawing(false)} />
    </div>
  );
}

function DictionaryTool({ onClose }: { onClose: () => void }) {
  const [word, setWord] = useState(""); const [result, setResult] = useState<any>(null); const [loading, setLoading] = useState(false);
  const search = async () => {
    if (!word.trim()) return; setLoading(true);
    try {
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.trim()}`);
      if (r.ok) { const d = await r.json(); setResult(d[0]); } else setResult({ error: "Word not found" });
    } catch { setResult({ error: "Could not connect" }); }
    setLoading(false);
  };
  return (
    <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-cyan-800 flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Dictionary</h4>
        <button onClick={onClose}><X className="w-3.5 h-3.5 text-gray-400" /></button>
      </div>
      <div className="flex gap-2 mb-3">
        <input className="flex-1 input-field text-sm" placeholder="Look up a word..." value={word}
          onChange={e => setWord(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} />
        <button onClick={search} disabled={loading} className="btn-primary text-xs px-4">{loading ? "..." : "Search"}</button>
      </div>
      {result && !result.error && (
        <div className="bg-white p-3 rounded-lg text-xs space-y-1.5 max-h-48 overflow-y-auto">
          <p className="font-bold text-lg text-gray-800">{result.word}</p>
          {result.phonetic && <p className="text-gray-500 italic">{result.phonetic}</p>}
          {result.meanings?.slice(0,3).map((m: any, i: number) => (
            <div key={i} className="mt-1">
              <span className="font-bold text-cyan-700">{m.partOfSpeech}</span>
              {m.definitions?.slice(0,2).map((d: any, j: number) => (
                <p key={j} className="ml-3 text-gray-600">• {d.definition}</p>
              ))}
            </div>
          ))}
        </div>
      )}
      {result?.error && <p className="text-sm text-red-500">{result.error}</p>}
    </div>
  );
}

function DrawingTool({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState<"pen"|"eraser">("pen");
  const [color, setColor] = useState("#e53e3e"); const [size, setSize] = useState(4);
  const draw = (e: React.MouseEvent) => {
    if (!drawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const r = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
    if (tool === "eraser") { ctx.strokeStyle = "#fff"; ctx.lineWidth = 20; }
    else { ctx.strokeStyle = color; ctx.lineWidth = size; }
    ctx.lineCap = "round"; ctx.stroke();
  };
  const start = (e: React.MouseEvent) => {
    setDrawing(true); const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return; const r = canvasRef.current!.getBoundingClientRect();
    ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  };
  const save = () => {
    if (!canvasRef.current) return;
    const a = document.createElement("a"); a.download = "drawing.png"; a.href = canvasRef.current.toDataURL(); a.click();
  };
  return (
    <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-pink-800 flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> Drawing Pad</h4>
        <div className="flex items-center gap-2">
          <button onClick={() => setTool("pen")} className={`text-[9px] px-2 py-0.5 rounded ${tool==="pen" ? "bg-pink-600 text-white" : "bg-gray-200"}`}>✏️ Pen</button>
          <button onClick={() => setTool("eraser")} className={`text-[9px] px-2 py-0.5 rounded ${tool==="eraser" ? "bg-pink-600 text-white" : "bg-gray-200"}`}>🧹 Eraser</button>
          {["#e53e3e","#3182ce","#38a169","#d69e2e","#805ad5","#000"].map(c => (
            <button key={c} onClick={() => { setColor(c); setTool("pen"); }} className={`w-3.5 h-3.5 rounded-full ${color===c && tool==="pen" ? "ring-2 ring-gray-800" : ""}`} style={{backgroundColor:c}} />
          ))}
          <button onClick={save} className="text-[9px] bg-pink-600 text-white px-2 py-0.5 rounded">💾 Save</button>
          <button onClick={onClose}><X className="w-3.5 h-3.5 text-gray-400" /></button>
        </div>
      </div>
      <canvas ref={canvasRef} width={600} height={300} className="w-full bg-white rounded-lg border cursor-crosshair"
        onMouseDown={start} onMouseMove={draw} onMouseUp={() => setDrawing(false)} onMouseLeave={() => setDrawing(false)} />
    </div>
  );
}

// ============ BOARD THEMES (student customization) ============
const BOARD_THEMES = [
  { name: "Classic Green", bg: "#1a3a1a", border: "#8B7355" },
  { name: "Dark Blue", bg: "#0d1b2a", border: "#3a6ea5" },
  { name: "Purple Night", bg: "#1a0a2e", border: "#7c3aed" },
  { name: "Warm Brown", bg: "#2d1810", border: "#a0522d" },
  { name: "Ocean Teal", bg: "#0a2e2a", border: "#2dd4bf" },
  { name: "Midnight", bg: "#0f0f1a", border: "#6366f1" },
];

const TEXT_COLORS = [
  { name: "Default", color: "" },
  { name: "Bright White", color: "#FFFFFF" },
  { name: "Neon Green", color: "#39FF14" },
  { name: "Cyan", color: "#00FFFF" },
  { name: "Gold", color: "#FFD700" },
  { name: "Pink", color: "#FF69B4" },
  { name: "Orange", color: "#FF8C00" },
];

// ============ MAIN COMPONENT ============
export default function VisualClassroom(props: Props) {
  const { sessionId, classId, subjectName, teacherName, students,
    isTeacher, isLive, topic, isKG = false, studentId, studentName } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Server state
  const [boardLines, setBoardLines] = useState<any[]>([]);
  const [raisedHands, setRaisedHands] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [whispers, setWhispers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [teachingMode, setTeachingMode] = useState("board");
  const [liveMinutes, setLiveMinutes] = useState(0);

  // Local UI state
  const [panel, setPanel] = useState<"chat"|"qa"|"whisper"|"poll"|null>(null);
  const [activeTool, setActiveTool] = useState<string|null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [boardText, setBoardText] = useState("");
  const [drawColor, setDrawColor] = useState("#FFFFFF");
  const [handRaised, setHandRaised] = useState(false);
  const [handAccepted, setHandAccepted] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [lastPoll, setLastPoll] = useState(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const prevMsgCount = useRef(0);
  const myUserId = isTeacher ? "teacher" : studentId || "unknown";
  // Whisper
  const [whisperTo, setWhisperTo] = useState<{id:string;name:string}|null>(null);
  const [whisperMsg, setWhisperMsg] = useState("");
  // Student board customization
  const [boardTheme, setBoardTheme] = useState(0);
  const [textColorOverride, setTextColorOverride] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  // Reactions
  const [floatingReactions, setFloatingReactions] = useState<{id:string;emoji:string;x:number}[]>([]);
  // Poll
  const [pollQ, setPollQ] = useState(""); const [pollOpts, setPollOpts] = useState(["","",""]);

  // ===== POLL SERVER =====
  const pollServer = useCallback(async () => {
    if (!sessionId) return;
    try {
      const r = await fetch(`/api/classroom/${sessionId}`);
      if (!r.ok) return;
      const d = await r.json();
      setBoardLines(Array.isArray(d.boardContent) ? d.boardContent : []);
      setRaisedHands(Array.isArray(d.raisedHands) ? d.raisedHands : []);
      setChatMessages(Array.isArray(d.chatMessages) ? d.chatMessages : []);
      setWhispers(Array.isArray(d.whispers) ? d.whispers : []);
      setQuestions(Array.isArray(d.questions) ? d.questions : []);
      setReactions(Array.isArray(d.reactions) ? d.reactions : []);
      setPolls(Array.isArray(d.polls) ? d.polls : []);
      if (d.teachingMode) setTeachingMode(d.teachingMode);
      if (d.liveMinutes !== undefined) setLiveMinutes(d.liveMinutes);
      setLastPoll(Date.now());
      if (!isTeacher && handRaised && !(d.raisedHands||[]).find((h:any) => h.studentId === studentId)) {
        setHandRaised(false); setHandAccepted(true);
      }
    } catch {}
  }, [sessionId, handRaised, studentId, isTeacher]);

  useEffect(() => { pollServer(); const i = setInterval(pollServer, 2000); return () => clearInterval(i); }, [pollServer]);

  // Auto-scroll chat only on new messages & user hasn't scrolled up
  useEffect(() => {
    const newCount = chatMessages.length + whispers.length;
    if (newCount > prevMsgCount.current && !userScrolledUp) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMsgCount.current = newCount;
  }, [chatMessages, whispers, userScrolledUp]);

  // Show floating reactions
  useEffect(() => {
    if (reactions.length === 0) return;
    const latest = reactions[reactions.length - 1];
    if (latest && Date.now() - latest.time < 4000) {
      const id = latest.id;
      setFloatingReactions(prev => [...prev, { id, emoji: latest.emoji, x: 20 + Math.random() * 60 }]);
      setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 3000);
    }
  }, [reactions]);

  // ===== RENDER BOARD =====
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const theme = isTeacher ? BOARD_THEMES[0] : BOARD_THEMES[boardTheme];

    // Word-wrap helper
    const wrapText = (text: string, maxW: number, font: string): string[] => {
      ctx.font = font;
      const words = text.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width > maxW && line) {
          lines.push(line);
          line = word;
        } else { line = test; }
      }
      if (line) lines.push(line);
      return lines;
    };

    // Calculate total lines needed
    const font = isKG ? "bold 17px Comic Sans MS, cursive" : "15px Georgia, serif";
    const maxTextW = c.width - 44;
    let totalLines = 0;
    const wrappedAll: { lines: string[]; color: string }[] = [];
    boardLines.forEach((bl: any) => {
      const wrapped = wrapText(bl.text || "", maxTextW, font);
      wrappedAll.push({ lines: wrapped, color: bl.color || "#FFF" });
      totalLines += wrapped.length;
    });

    // Resize canvas height dynamically
    const minH = 200;
    const neededH = 70 + totalLines * 28 + 20;
    c.height = Math.max(minH, neededH);

    // Draw board background
    ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = theme.border; ctx.lineWidth = 6; ctx.strokeRect(3, 3, c.width-6, c.height-6);
    ctx.font = "bold 18px serif"; ctx.fillStyle = "#FFFFFFAA"; ctx.textAlign = "center";
    ctx.fillText(subjectName + (topic ? " — " + topic : ""), c.width/2, 34);
    ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(25,48); ctx.lineTo(c.width-25,48);
    ctx.strokeStyle = "#FFFFFF33"; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);

    // Draw wrapped text
    let y = 70;
    wrappedAll.forEach((entry) => {
      ctx.font = font;
      ctx.fillStyle = (!isTeacher && textColorOverride) ? textColorOverride : entry.color;
      ctx.textAlign = "left";
      entry.lines.forEach((line) => {
        ctx.fillText(line, 22, y);
        y += 28;
      });
    });
  }, [boardLines, subjectName, topic, isKG, boardTheme, textColorOverride, isTeacher]);

  // Actions
  const post = async (action: string, data: any = {}) => {
    if (!sessionId) return;
    try { await fetch(`/api/classroom/${sessionId}`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({action,...data}) }); setTimeout(pollServer, 200); } catch {}
  };

  const writeBoard = () => { if (boardText.trim() && isTeacher) { post("board_write", {text:boardText,color:drawColor}); setBoardText(""); }};
  const clearBoard = () => { if (isTeacher) post("board_write", {type:"clear"}); };
  const setMode = (m: string) => { post("set_mode", {mode:m}); setTeachingMode(m); };
  const toggleHand = () => { const n=!handRaised; setHandRaised(n); setHandAccepted(false); post("raise_hand",{studentId,studentName,raised:n}); };
  const ackHand = (sid: string) => post("ack_hand",{studentId:sid});
  const sendChat = () => { if (!chatMsg.trim()) return; post("chat",{from:isTeacher?"Teacher":studentName,message:chatMsg}); setChatMsg(""); };
  const askQuestion = () => { if (!questionText.trim()) return; post("ask_question",{studentId,studentName,question:questionText}); setQuestionText(""); setHandAccepted(false); };
  const answerQ = (qId: string) => { if (!answerText.trim()) return; post("answer_question",{questionId:qId,answer:answerText}); setAnswerText(""); };
  const sendWhisper = () => {
    if (!whisperMsg.trim() || !whisperTo) return;
    post("whisper",{fromId:studentId,fromName:studentName,toId:whisperTo.id,toName:whisperTo.name,message:whisperMsg});
    setWhisperMsg("");
  };
  const sendReaction = (emoji: string) => post("reaction",{from:isTeacher?"Teacher":studentName,emoji});
  const createPoll = () => {
    if (!pollQ.trim()) return;
    post("create_poll",{question:pollQ,options:pollOpts.filter(o=>o.trim())});
    setPollQ(""); setPollOpts(["","",""]);
  };

  const CHALK = ["#FFFFFF","#FFFF00","#FF6B6B","#4ECDC4","#45B7D1","#FF9F43","#A55EEA"];
  const unanswered = questions.filter((q:any)=>!q.answered).length;
  const myWhispers = whispers.filter((w:any) => w.fromId === studentId || w.toId === studentId);
  const EMOJIS = ["👍","👏","❤️","🎉","💡","😂","🤔","🔥"];

  // TOOLS config
  const TOOLS = [
    { key: "notes", icon: BookOpen, label: "Notes", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
    { key: "calc", icon: Calculator, label: "Calculator", color: "bg-green-100 text-green-700 hover:bg-green-200" },
    { key: "whiteboard", icon: FileText, label: "Whiteboard", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
    { key: "dictionary", icon: Globe, label: "Dictionary", color: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200" },
    { key: "drawing", icon: Palette, label: "Drawing", color: "bg-pink-100 text-pink-700 hover:bg-pink-200" },
  ];

  return (
    <div className={`rounded-2xl overflow-hidden shadow-xl border-2 ${isKG?"border-yellow-400":"border-gray-400"} ${fullscreen?"fixed inset-0 z-50 rounded-none":""}`}>
      {/* Floating reactions */}
      {floatingReactions.map(r => (
        <div key={r.id} className="fixed z-[60] text-3xl animate-bounce pointer-events-none"
          style={{ bottom: "20%", left: `${r.x}%`, animation: "floatUp 3s ease-out forwards" }}>{r.emoji}</div>
      ))}
      <style>{`@keyframes floatUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-200px)} }`}</style>

      {/* HEADER */}
      <div className={`px-3 py-2 flex items-center justify-between ${isKG?"bg-gradient-to-r from-yellow-400 to-orange-400":"bg-gradient-to-r from-gray-700 to-gray-800"}`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <div>
            <h3 className={`text-xs font-bold ${isKG?"text-yellow-900":"text-white"}`}>{isKG?"🏫 ":""}{subjectName}</h3>
            <p className={`text-[9px] ${isKG?"text-yellow-800":"text-gray-400"}`}>{isTeacher?`${students.length} students`:`Teacher: ${teacherName}`}</p>
          </div>
        </div>
        {/* Timer */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs ${liveMinutes>=35?"bg-red-500/30 text-red-200":liveMinutes>=30?"bg-amber-500/20 text-amber-200":"bg-white/10 text-white"}`}>
          <Clock className="w-3 h-3" /><span className="font-mono font-bold">{String(liveMinutes).padStart(2,"0")}min</span><span className="text-[8px] opacity-60">/40</span>
        </div>
        <div className="flex items-center gap-1">
          {isTeacher && (
            <div className="flex gap-0.5 bg-black/20 rounded-lg p-0.5">
              {[{m:"board",i:Pencil},{m:"voice",i:Mic},{m:"video",i:Video}].map(({m,i:Icon}) => (
                <button key={m} onClick={() => setMode(m)} className={`text-[8px] px-1.5 py-1 rounded ${teachingMode===m?"bg-white text-gray-800":"text-white/60"}`}>
                  <Icon className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
          {/* Reaction button */}
          <div className="relative group">
            <button className="p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white"><Smile className="w-3 h-3" /></button>
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border p-1.5 hidden group-hover:flex gap-0.5 z-50">
              {EMOJIS.map(e => <button key={e} onClick={() => sendReaction(e)} className="text-lg hover:scale-125 transition">{e}</button>)}
            </div>
          </div>
          <button onClick={() => setPanel(panel==="qa"?null:"qa")} className="relative p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white">
            <HelpCircle className="w-3 h-3" />
            {unanswered>0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-[7px] text-white rounded-full flex items-center justify-center">{unanswered}</span>}
          </button>
          <button onClick={() => setPanel(panel==="chat"?null:"chat")} className="relative p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white">
            <MessageSquare className="w-3 h-3" />
          </button>
          {!isTeacher && <button onClick={() => setPanel(panel==="whisper"?null:"whisper")} className="relative p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white">
            <Lock className="w-3 h-3" />
            {myWhispers.length>0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-pink-500 text-[7px] text-white rounded-full flex items-center justify-center">{myWhispers.length}</span>}
          </button>}
          {isTeacher && <button onClick={() => setPanel(panel==="poll"?null:"poll")} className="p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white"><BarChart3 className="w-3 h-3" /></button>}
          {!isTeacher && <button onClick={() => setShowSettings(!showSettings)} className="p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white"><Settings className="w-3 h-3" /></button>}
          <button onClick={() => setFullscreen(!fullscreen)} className="p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white">
            {fullscreen?<Minimize2 className="w-3 h-3" />:<Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <div className={`${isKG?"bg-gradient-to-b from-sky-100 to-yellow-50":"bg-gradient-to-b from-gray-100 to-gray-200"}`}>
        <div className="flex">
          <div className="flex-1 p-3 space-y-3 overflow-y-auto" style={{maxHeight: fullscreen ? "calc(100vh - 50px)" : "auto"}}>
            {/* Student board settings */}
            {!isTeacher && showSettings && (
              <div className="p-3 bg-white rounded-xl border shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1"><Settings className="w-3 h-3" /> Board Settings</h4>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">Board Theme</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {BOARD_THEMES.map((t,i) => (
                      <button key={i} onClick={() => setBoardTheme(i)}
                        className={`w-8 h-8 rounded-lg border-2 ${boardTheme===i?"border-brand-500 ring-2 ring-brand-200":"border-transparent"}`}
                        style={{backgroundColor:t.bg}} title={t.name} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">Text Color Override</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {TEXT_COLORS.map(t => (
                      <button key={t.name} onClick={() => setTextColorOverride(t.color)}
                        className={`px-2 py-1 text-[9px] rounded-lg border ${textColorOverride===t.color?"border-brand-500 bg-brand-50 font-bold":"border-gray-200"}`}>
                        {t.color && <span className="w-2.5 h-2.5 rounded-full inline-block mr-1" style={{backgroundColor:t.color}} />}
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Video / Voice — WebRTC */}
            {(teachingMode==="video"||teachingMode==="voice") && (
              <ClassroomVideo
                sessionId={sessionId}
                userId={myUserId}
                userName={isTeacher ? teacherName : (studentName || "Student")}
                isTeacher={isTeacher}
              />
            )}

            {/* BLACKBOARD */}
            <div className="relative">
              <div className="bg-amber-800 rounded-t-lg px-3 py-1 flex items-center justify-between">
                <span className="text-[9px] text-amber-200">📋 {isKG?"Our Board":"Blackboard"}</span>
                {isTeacher && (
                  <div className="flex items-center gap-1">
                    {CHALK.map(c => <button key={c} onClick={() => setDrawColor(c)} className={`w-3 h-3 rounded-full ${drawColor===c?"ring-2 ring-white scale-125":""}`} style={{backgroundColor:c}} />)}
                    <button onClick={clearBoard} className="text-[8px] bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded ml-1"><Eraser className="w-2.5 h-2.5 inline" /> Clear</button>
                  </div>
                )}
              </div>
              <div className="overflow-y-auto rounded-b-lg" style={{maxHeight: fullscreen ? "50vh" : "300px"}}>
                <canvas ref={canvasRef} width={800} height={260} className="w-full shadow-inner" />
              </div>
              {isTeacher && teachingMode==="board" && (
                <div className="flex gap-2 mt-1.5">
                  <input className="flex-1 input-field text-sm" placeholder="Write on board..."
                    value={boardText} onChange={e => setBoardText(e.target.value)} onKeyDown={e => e.key==="Enter"&&writeBoard()} />
                  <button onClick={writeBoard} className="btn-primary text-xs px-3"><Type className="w-3 h-3 mr-1" />Write</button>
                </div>
              )}
            </div>

            {/* Active Poll */}
            {polls.filter((p:any) => p.active).map((p:any) => (
              <div key={p.id} className="p-3 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-indigo-800 flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> Poll</h4>
                  {isTeacher && <button onClick={() => post("close_poll",{pollId:p.id})} className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded">Close</button>}
                </div>
                <p className="text-sm font-medium text-gray-800 mb-2">{p.question}</p>
                <div className="space-y-1.5">
                  {p.options.map((o:any, i:number) => {
                    const total = p.options.reduce((s:number,opt:any) => s + (opt.votes?.length || 0), 0);
                    const pct = total > 0 ? Math.round((o.votes?.length || 0) / total * 100) : 0;
                    const voted = (o.votes || []).includes(studentId);
                    const isCorrect = p.correctOption === i;
                    return (
                      <div key={i}>
                        <button onClick={() => !isTeacher && post("vote_poll",{pollId:p.id,optionIndex:i,studentId,studentName})}
                          className={`w-full text-left p-2 rounded-lg border transition ${isCorrect ? "bg-emerald-100 border-emerald-400 ring-1 ring-emerald-300" : voted ? "bg-indigo-100 border-indigo-400 font-bold" : "bg-white border-gray-200 hover:border-indigo-300"}`}>
                          <div className="flex items-center justify-between text-xs">
                            <span>{isCorrect && "✅ "}{o.text}</span>
                            <span className="text-gray-500">{o.votes?.length || 0} votes ({pct}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1"><div className={`h-full rounded-full transition-all ${isCorrect ? "bg-emerald-500" : "bg-indigo-500"}`} style={{width:`${pct}%`}} /></div>
                        </button>
                        {/* Teacher sees voter names */}
                        {isTeacher && (o.voterNames?.length > 0 || o.votes?.length > 0) && (
                          <div className="ml-2 mt-0.5 flex flex-wrap gap-1">
                            {(o.voterNames || []).map((v:any, vi:number) => (
                              <span key={vi} className={`text-[9px] px-1.5 py-0.5 rounded-full ${isCorrect ? "bg-emerald-200 text-emerald-800" : "bg-gray-200 text-gray-600"}`}>
                                {v.name || v}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Teacher mark correct */}
                        {isTeacher && !p.correctOption && p.correctOption !== 0 && (
                          <button onClick={() => post("mark_correct",{pollId:p.id,optionIndex:i})}
                            className="text-[8px] text-emerald-600 hover:text-emerald-800 ml-2 mt-0.5">✓ Mark correct</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isTeacher && (
                  <p className="text-[9px] text-gray-400 mt-2">
                    {p.options.reduce((s:number,o:any) => s + (o.votes?.length||0), 0)} total votes
                    {p.correctOption !== null && p.correctOption !== undefined && " • Correct answer marked ✅"}
                  </p>
                )}
              </div>
            ))}

            {/* RAISED HANDS (teacher) */}
            {isTeacher && raisedHands.length > 0 && (
              <div className="p-2.5 bg-amber-50 border-2 border-amber-300 rounded-xl">
                <h4 className="text-[10px] font-bold text-amber-800 mb-1.5">✋ Raised Hands ({raisedHands.length})</h4>
                <div className="flex flex-wrap gap-1.5">
                  {raisedHands.map((h:any) => (
                    <div key={h.studentId} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm border border-amber-200 animate-pulse">
                      <span className="animate-bounce">✋</span>
                      <span className="text-[10px] font-medium">{h.studentName}</span>
                      <button onClick={() => ackHand(h.studentId)} className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">Allow</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TOOLS */}
            <div className="flex flex-wrap gap-1.5">
              {TOOLS.map(({key,icon:Icon,label,color}) => (
                <button key={key} onClick={() => setActiveTool(activeTool===key?null:key)}
                  className={`flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg font-medium transition ${activeTool===key?"ring-2 ring-brand-400 shadow":""} ${color}`}>
                  <Icon className="w-3 h-3" />{label}
                </button>
              ))}
            </div>

            {/* Tool panels */}
            {activeTool==="notes" && <NotesTool onClose={() => setActiveTool(null)} />}
            {activeTool==="calc" && <CalculatorTool onClose={() => setActiveTool(null)} />}
            {activeTool==="whiteboard" && <WhiteboardTool onClose={() => setActiveTool(null)} />}
            {activeTool==="dictionary" && <DictionaryTool onClose={() => setActiveTool(null)} />}
            {activeTool==="drawing" && <DrawingTool onClose={() => setActiveTool(null)} />}

            {/* STUDENTS + STUDENT CONTROLS */}
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mb-1.5"><Users className="w-3 h-3" /> {students.length} Students</h4>
              <div className={`grid ${isKG?"grid-cols-4 md:grid-cols-6":"grid-cols-6 md:grid-cols-8"} gap-1`}>
                {students.map(s => {
                  const hasHand = raisedHands.some((h:any) => h.studentId === s.id);
                  return (
                    <div key={s.id} className={`relative text-center p-1 rounded-xl transition cursor-pointer ${hasHand?"bg-amber-100 ring-1 ring-amber-400 scale-105":"bg-white/50 hover:bg-white/80"}`}
                      onClick={() => { if (!isTeacher && s.id !== studentId) { setWhisperTo(s); setPanel("whisper"); } }}>
                      <div className="w-full h-0.5 rounded-full bg-gray-200 mb-0.5" />
                      <div className={`mx-auto rounded-full w-6 h-6 flex items-center justify-center text-white font-bold text-[8px] ${isKG?"bg-gradient-to-br from-pink-400 to-purple-400":"bg-brand-400"}`}>
                        {s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                      </div>
                      <p className="text-[7px] text-gray-500 mt-0.5 truncate">{s.name.split(" ")[0]}</p>
                      {hasHand && <div className="absolute -top-1 -right-0.5 text-xs animate-bounce">✋</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Student: raise hand + ask question */}
            {!isTeacher && isLive && (
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={toggleHand}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition shadow ${
                    handRaised?"bg-amber-400 text-amber-900 scale-105 animate-bounce":"bg-white text-gray-700 hover:bg-amber-50 border"
                  } text-sm`}>
                  <Hand className="w-4 h-4" />{handRaised?"✋ Raised":"Raise Hand"}
                </button>
                {handAccepted && (
                  <div className="flex-1 flex gap-1.5 items-center p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <input className="flex-1 input-field text-sm py-1" placeholder="Ask your question..."
                      value={questionText} onChange={e => setQuestionText(e.target.value)} onKeyDown={e => e.key==="Enter"&&askQuestion()} />
                    <button onClick={askQuestion} className="btn-primary text-xs px-3 py-1">Ask</button>
                  </div>
                )}
              </div>
            )}

            {/* Reaction bar */}
            <div className="flex items-center gap-1">
              {EMOJIS.map(e => <button key={e} onClick={() => sendReaction(e)} className="text-lg hover:scale-125 transition active:scale-90">{e}</button>)}
              <span className="text-[9px] text-gray-400 ml-2">React</span>
              <div className="ml-auto flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${lastPoll>Date.now()-5000?"bg-emerald-400":"bg-red-400"}`} />
                <span className="text-[8px] text-gray-400">{lastPoll>Date.now()-5000?"Synced":"..."}</span>
                {liveMinutes >= 35 && <span className="text-[9px] text-red-500 font-bold animate-pulse ml-2">⏰ {40-liveMinutes}min left</span>}
              </div>
            </div>

            {/* STUDENT DESK — download board, notebook, saved boards */}
            {!isTeacher && (
              <StudentDesk
                studentName={studentName || "Student"}
                subjectName={subjectName}
                boardLines={boardLines}
                isKG={isKG}
              />
            )}
          </div>

          {/* ===== SIDE PANELS ===== */}
          {panel && (
            <div className="w-72 border-l bg-white flex flex-col" style={{maxHeight: fullscreen ? "calc(100vh - 50px)" : "600px"}}>
              {/* CHAT */}
              {panel==="chat" && (<>
                <div className="px-3 py-2 bg-gray-100 border-b flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">💬 Class Chat</span>
                  <button onClick={() => setPanel(null)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5" ref={chatScrollRef}
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
                    setUserScrolledUp(!nearBottom);
                  }}>
                  {chatMessages.length===0 && <p className="text-[10px] text-gray-400 text-center py-6">No messages</p>}
                  {chatMessages.map((m:any,i:number) => (
                    <div key={m.id||i} className={`text-[11px] p-1.5 rounded-lg ${m.from==="Teacher"?"bg-brand-50":"bg-gray-50"}`}>
                      <span className="font-bold">{m.from}</span>
                      <span className="text-[9px] text-gray-400 ml-1">{new Date(m.time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                      <p className="mt-0.5">{m.message}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-2 border-t">
                  {userScrolledUp && (
                    <button onClick={() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); setUserScrolledUp(false); }}
                      className="w-full text-[9px] text-blue-600 bg-blue-50 py-1 rounded-lg mb-1 hover:bg-blue-100">↓ New messages — scroll down</button>
                  )}
                  <div className="flex gap-1">
                    <input className="flex-1 input-field text-xs py-1" placeholder="Message..." value={chatMsg}
                      onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key==="Enter"&&sendChat()} />
                    <button onClick={sendChat} className="p-1 bg-brand-600 text-white rounded-lg"><Send className="w-3 h-3" /></button>
                  </div>
                </div>
              </>)}

              {/* Q&A */}
              {panel==="qa" && (<>
                <div className="px-3 py-2 bg-amber-50 border-b flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">❓ Q&A ({questions.length})</span>
                  <button onClick={() => setPanel(null)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {questions.length===0 && <p className="text-[10px] text-gray-400 text-center py-6">No questions yet</p>}
                  {questions.map((q:any) => (
                    <div key={q.id} className={`p-2 rounded-lg border text-xs ${q.answered?"bg-emerald-50 border-emerald-200":"bg-amber-50 border-amber-200"}`}>
                      <p className="text-[9px] text-gray-500 font-medium">{q.studentName}</p>
                      <p className="font-medium mt-0.5">{q.question}</p>
                      {q.answered && <p className="text-emerald-700 mt-1 bg-emerald-100 p-1.5 rounded text-[11px]">💬 {q.answer}</p>}
                      {isTeacher && !q.answered && (
                        <div className="flex gap-1 mt-1.5">
                          <input className="flex-1 input-field text-[10px] py-0.5" placeholder="Answer..."
                            onChange={e => setAnswerText(e.target.value)} onKeyDown={e => e.key==="Enter"&&answerQ(q.id)} />
                          <button onClick={() => answerQ(q.id)} className="text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded">Reply</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>)}

              {/* WHISPER */}
              {panel==="whisper" && (<>
                <div className="px-3 py-2 bg-pink-50 border-b flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-800">🤫 Whisper {whisperTo ? `→ ${whisperTo.name}` : ""}</span>
                  <button onClick={() => setPanel(null)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
                </div>
                {!whisperTo ? (
                  <div className="p-3">
                    <p className="text-[10px] text-gray-500 mb-2">Click a classmate to whisper:</p>
                    <div className="space-y-1">
                      {students.filter(s => s.id !== studentId).map(s => (
                        <button key={s.id} onClick={() => setWhisperTo(s)}
                          className="w-full text-left text-xs p-2 rounded-lg bg-gray-50 hover:bg-pink-50 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center text-[9px] font-bold">{s.name[0]}</div>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                      {myWhispers.filter((w:any) =>
                        (w.fromId===studentId && w.toId===whisperTo.id) ||
                        (w.fromId===whisperTo.id && w.toId===studentId)
                      ).map((w:any) => (
                        <div key={w.id} className={`text-[11px] p-1.5 rounded-lg ${w.fromId===studentId?"bg-pink-50 ml-4":"bg-gray-50 mr-4"}`}>
                          <span className="font-bold text-[9px]">{w.fromName}</span>
                          <p className="mt-0.5">{w.message}</p>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="p-2 border-t">
                      <div className="flex gap-1">
                        <button onClick={() => setWhisperTo(null)} className="p-1 text-gray-400 hover:text-gray-600"><Users className="w-3 h-3" /></button>
                        <input className="flex-1 input-field text-xs py-1" placeholder={`Whisper to ${whisperTo.name}...`}
                          value={whisperMsg} onChange={e => setWhisperMsg(e.target.value)} onKeyDown={e => e.key==="Enter"&&sendWhisper()} />
                        <button onClick={sendWhisper} className="p-1 bg-pink-500 text-white rounded-lg"><Send className="w-3 h-3" /></button>
                      </div>
                      <p className="text-[8px] text-pink-400 mt-0.5">🔒 Only {whisperTo.name} can see this</p>
                    </div>
                  </>
                )}
              </>)}

              {/* POLL (teacher create) */}
              {panel==="poll" && isTeacher && (<>
                <div className="px-3 py-2 bg-indigo-50 border-b flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800">📊 Polls</span>
                  <button onClick={() => setPanel(null)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
                </div>
                <div className="p-3 space-y-3">
                  <div className="space-y-2">
                    <input className="input-field text-sm" placeholder="Poll question..." value={pollQ} onChange={e => setPollQ(e.target.value)} />
                    {pollOpts.map((o,i) => (
                      <input key={i} className="input-field text-xs" placeholder={`Option ${i+1}`}
                        value={o} onChange={e => { const n=[...pollOpts]; n[i]=e.target.value; setPollOpts(n); }} />
                    ))}
                    <div className="flex gap-2">
                      <button onClick={() => setPollOpts([...pollOpts,""])} className="text-[9px] text-indigo-600">+ Add option</button>
                      <button onClick={createPoll} className="btn-primary text-xs">Create Poll</button>
                    </div>
                  </div>
                  {polls.length>0 && <div className="border-t pt-2">
                    <h5 className="text-[10px] font-bold text-gray-500 mb-1">All Polls ({polls.length})</h5>
                    {polls.map((p:any) => (
                      <div key={p.id} className={`text-[10px] p-2 rounded-lg mb-1.5 ${p.active?"bg-indigo-50 border border-indigo-200":"bg-gray-50"}`}>
                        <p className="font-medium mb-1">{p.question} {p.active&&<span className="text-indigo-600">(Active)</span>}</p>
                        {p.options.map((o:any,i:number) => (
                          <div key={i} className="ml-1 mb-1">
                            <div className="flex items-center gap-1">
                              <span className={p.correctOption===i?"text-emerald-700 font-bold":"text-gray-600"}>
                                {p.correctOption===i&&"✅ "}{o.text}: {o.votes?.length||0}
                              </span>
                              {p.correctOption===null && p.correctOption!==0 && !p.correctOption && (
                                <button onClick={()=>post("mark_correct",{pollId:p.id,optionIndex:i})} className="text-[8px] text-emerald-500 hover:text-emerald-700">✓correct</button>
                              )}
                            </div>
                            {(o.voterNames||[]).length>0 && (
                              <div className="flex flex-wrap gap-0.5 ml-2">
                                {(o.voterNames||[]).map((v:any,vi:number) => (
                                  <span key={vi} className={`text-[8px] px-1 rounded ${p.correctOption===i?"bg-emerald-100 text-emerald-700":"bg-gray-200 text-gray-500"}`}>{v.name||v}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        <p className="text-[8px] text-gray-400">{p.options.reduce((s:number,o:any)=>s+(o.votes?.length||0),0)} total votes</p>
                      </div>
                    ))}
                  </div>}
                </div>
              </>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
