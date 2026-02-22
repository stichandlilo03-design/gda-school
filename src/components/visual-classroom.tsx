"use client";
import { useState, useEffect, useRef } from "react";
import {
  Hand, Mic, Video, Pencil, MessageSquare, Users,
  Maximize2, Minimize2, Send, Eraser, Type, X, HelpCircle, Clock,
  CheckCircle, BookOpen, FileText, Calculator, Globe, Palette,
  BarChart3, Lock, Smile, Settings, Volume2, VolumeX, Save,
} from "lucide-react";
import StudentDesk from "@/components/student-desk";
import ClassroomVideo from "@/components/classroom-video";

interface Props {
  sessionId: string; classId: string; subjectName: string; teacherName: string;
  students: { id: string; name: string; image?: string }[];
  isTeacher: boolean; isLive: boolean; topic?: string; isKG?: boolean;
  studentId?: string; studentName?: string;
  onSessionEnd?: () => void;
  onNewSession?: (newSessionId: string, isPrep?: boolean) => void;
  onPrepChange?: (isPrep: boolean) => void;
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
    } catch (_e) { setResult({ error: "Could not connect" }); }
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
  const { sessionId: initialSessionId, classId, subjectName, teacherName, students,
    isTeacher, isLive, topic, isKG = false, studentId, studentName,
    onSessionEnd, onNewSession, onPrepChange } = props;

  // ============ SESSION STATE — ALL REFS to avoid stale closures ============
  const sessionIdRef = useRef(initialSessionId || "");
  const statusRef = useRef<"active"|"ended"|"searching">(initialSessionId ? "active" : (isTeacher ? "active" : "searching"));
  const pollErrorsRef = useRef(0);
  const searchCountRef = useRef(0);
  const onSessionEndRef = useRef(onSessionEnd);
  const onNewSessionRef = useRef(onNewSession);
  const onPrepChangeRef = useRef(onPrepChange);
  useEffect(() => { onSessionEndRef.current = onSessionEnd; }, [onSessionEnd]);
  useEffect(() => { onNewSessionRef.current = onNewSession; }, [onNewSession]);
  useEffect(() => { onPrepChangeRef.current = onPrepChange; }, [onPrepChange]);

  // Render state — ONLY used for UI, updated FROM refs
  const [renderTick, setRenderTick] = useState(0);
  const forceRender = () => setRenderTick(t => t + 1);

  // Sync prop changes into ref
  useEffect(() => {
    if (initialSessionId && initialSessionId !== sessionIdRef.current) {
      sessionIdRef.current = initialSessionId;
      statusRef.current = "active";
      pollErrorsRef.current = 0;
      searchCountRef.current = 0;
      forceRender();
    }
  }, [initialSessionId]);

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
  const [panel, setPanel] = useState<"chat"|"qa"|"whisper"|"poll"|"hw"|null>(null);
  const [activeTool, setActiveTool] = useState<string|null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [boardText, setBoardText] = useState("");
  const [drawColor, setDrawColor] = useState("#FFFFFF");
  const [showBoardMath, setShowBoardMath] = useState(false);
  const BOARD_MATH = ["π","√","∛","²","³","⁴","÷","×","±","≠","≈","≤","≥","∞","∑","∫","Δ","θ","α","β","γ","∠","⊥","∥","½","⅓","¼","⁻¹","ⁿ","∈","∉","⊂","⊃","∪","∩","→","⟹","∀","∃","ℝ","ℤ","ℕ","°","μ","Ω","λ","σ"];
  const [handRaised, setHandRaised] = useState(false);
  const [handAccepted, setHandAccepted] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  // Track which answers student has already seen (to show notification for NEW answers)
  const seenAnswerIds = useRef<Set<string>>(new Set());
  const firstDataLoad = useRef(true);
  const [answeredAlert, setAnsweredAlert] = useState<{question: string; answer: string} | null>(null);
  // Notification system — track counts to detect new items
  const prevChatCount = useRef(0);
  const prevWhisperCount = useRef(0);
  const prevReactionCount = useRef(0);
  const prevTeachingMode = useRef("board");
  const [chatNotif, setChatNotif] = useState<{from: string; message: string} | null>(null);
  const [whisperNotif, setWhisperNotif] = useState<{from: string; message: string} | null>(null);
  const [modeNotif, setModeNotif] = useState<string | null>(null);
  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadWhisper, setUnreadWhisper] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [lastPoll, setLastPoll] = useState(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const prevMsgCount = useRef(0);
  const myUserId = isTeacher ? "teacher" : studentId || "unknown";
  const [whisperTo, setWhisperTo] = useState<{id:string;name:string}|null>(null);
  const [whisperMsg, setWhisperMsg] = useState("");
  const [boardTheme, setBoardTheme] = useState(0);
  const [textColorOverride, setTextColorOverride] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showKGTools, setShowKGTools] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [readAloudText, setReadAloudText] = useState<string | null>(null);
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [readSpeed, setReadSpeed] = useState(0.85);
  const [readMusical, setReadMusical] = useState(false);
  const [boardFontSize, setBoardFontSize] = useState(16);
  const [savedBoards, setSavedBoards] = useState<{name:string;lines:any[];time:number}[]>([]);
  const [showSavedBoards, setShowSavedBoards] = useState(false);
  const [boardDrawMode, setBoardDrawMode] = useState<"off"|"circle"|"underline"|"freehand">("off");
  const [boardAnnotations, setBoardAnnotations] = useState<any[]>([]);
  const boardOverlayRef = useRef<HTMLCanvasElement>(null);
  const drawStartRef = useRef<{x:number;y:number}|null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => setAvailableVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  const pickVoice = () => {
    if (availableVoices.length === 0) return undefined;
    const keywords = voiceGender === "female" ? ["female","woman","zira","samantha","karen","fiona","moira","tessa"] : ["male","man","david","daniel","james","thomas","fred","alex"];
    let v = availableVoices.find(v => keywords.some(k => v.name.toLowerCase().includes(k)) && v.lang.startsWith("en"));
    if (!v) v = availableVoices.find(v => keywords.some(k => v.name.toLowerCase().includes(k)));
    return v || availableVoices.find(v => v.lang.startsWith("en")) || availableVoices[0];
  };
  const [floatingReactions, setFloatingReactions] = useState<{id:string;emoji:string;x:number}[]>([]);
  const [pollQ, setPollQ] = useState(""); const [pollOpts, setPollOpts] = useState(["","",""]);
  const [examMode, setExamMode] = useState<"poll"|"test"|"exam">("poll");
  const [examTitle, setExamTitle] = useState("");
  const [examQuestions, setExamQuestions] = useState<{question:string;options:string[];correctOption:number|null;timeLimitSec:number}[]>([]);
  const [examSaving, setExamSaving] = useState(false);
  const [hwTitle, setHwTitle] = useState("");
  const [hwDesc, setHwDesc] = useState("");
  const [hwDue, setHwDue] = useState("");
  const [hwType, setHwType] = useState("HOMEWORK");
  const [hwSending, setHwSending] = useState(false);
  const [hwSent, setHwSent] = useState("");
  const [isSessionPrep, setIsSessionPrep] = useState(false);
  const [prepHidden, setPrepHidden] = useState<Record<string, boolean>>({});

  // Notify parent when prep status changes
  const prevPrepRef = useRef(isSessionPrep);
  useEffect(() => {
    if (prevPrepRef.current !== isSessionPrep) {
      prevPrepRef.current = isSessionPrep;
      if (onPrepChangeRef.current) onPrepChangeRef.current(isSessionPrep);
    }
  }, [isSessionPrep]);

  // ============ CORE API FUNCTIONS — read refs directly, never stale ============
  const post = async (action: string, data: any = {}) => {
    const sid = sessionIdRef.current;
    if (!sid) { console.warn("post: no sessionId for", action); return; }
    try {
      const r = await fetch(`/api/classroom/${sid}`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({action,...data})
      });
      if (!r.ok) console.warn("post failed:", action, r.status);
      // CRITICAL: Re-poll immediately so everyone gets the update fast
      setTimeout(() => { if (pollRef.current) pollRef.current(); }, 300);
    } catch (e) {
      console.warn("post error:", action, e);
    }
  };

  // ============ SINGLE POLL FUNCTION — uses refs, never stale ============
  const pollRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const lastQuestionsJson = useRef("");
  pollRef.current = async () => {
    const status = statusRef.current;
    const sid = sessionIdRef.current;

    // === SEARCHING: look for an active session ===
    if (status === "searching") {
      if (isTeacher) return;
      searchCountRef.current++;
      try {
        const r = await fetch(`/api/classroom/active?classId=${classId}`);
        if (r.ok) {
          const d = await r.json();
          if (d.session) {
            sessionIdRef.current = d.session.id;
            statusRef.current = "active";
            pollErrorsRef.current = 0;
            searchCountRef.current = 0;
            setIsSessionPrep(!!d.session.isPrep);
            forceRender();
            if (onNewSessionRef.current) onNewSessionRef.current(d.session.id, !!d.session.isPrep);
            return;
          }
        }
      } catch (_e) {}
      // NEVER give up searching — student stays ready for teacher to start
      return;
    }

    // === ENDED: stop polling ===
    if (status === "ended") return;

    // === ACTIVE: poll the session ===
    if (!sid) {
      if (!isTeacher) {
        statusRef.current = "searching";
        searchCountRef.current = 0;
        forceRender();
      }
      return;
    }

    try {
      const r = await fetch(`/api/classroom/${sid}?role=${isTeacher ? "teacher" : "student"}`);
      if (!r.ok) {
        pollErrorsRef.current++;
        // Very tolerant — 30 consecutive errors before searching (60 seconds at 2s interval)
        if (!isTeacher && pollErrorsRef.current >= 30) {
          statusRef.current = "searching";
          searchCountRef.current = 0;
          pollErrorsRef.current = 0;
          forceRender();
        }
        return;
      }
      const d = await r.json();
      pollErrorsRef.current = 0;

      if (d.status === "ENDED") {
        if (!isTeacher) {
          // Session ended — go back to searching for a new one
          sessionIdRef.current = "";
          statusRef.current = "searching";
          searchCountRef.current = 0;
          forceRender();
        }
        return;
      }

      // Update state from server
      statusRef.current = "active";
      setBoardLines(Array.isArray(d.boardContent) ? d.boardContent : []);
      setRaisedHands(Array.isArray(d.raisedHands) ? d.raisedHands : []);

      // CHAT notifications — detect new messages
      const serverChat = Array.isArray(d.chatMessages) ? d.chatMessages : [];
      if (serverChat.length > prevChatCount.current && prevChatCount.current > 0) {
        const newest = serverChat[serverChat.length - 1];
        const myName = isTeacher ? "Teacher" : studentName;
        // Only notify if message is from someone else AND chat panel isn't open
        if (newest && newest.from !== myName) {
          setChatNotif({ from: newest.from, message: newest.message });
          if (panel !== "chat") setUnreadChat(prev => prev + (serverChat.length - prevChatCount.current));
          setTimeout(() => setChatNotif(null), 5000);
        }
      }
      prevChatCount.current = serverChat.length;
      setChatMessages(serverChat);

      // WHISPER notifications — detect new whispers for this student
      const serverWhispers = Array.isArray(d.whispers) ? d.whispers : [];
      if (!isTeacher && studentId) {
        const myW = serverWhispers.filter((w:any) => w.toId === studentId);
        const oldMyW = prevWhisperCount.current;
        if (myW.length > oldMyW && oldMyW > 0) {
          const newest = myW[myW.length - 1];
          if (newest) {
            setWhisperNotif({ from: newest.fromName, message: newest.message });
            if (panel !== "whisper") setUnreadWhisper(prev => prev + (myW.length - oldMyW));
            setTimeout(() => setWhisperNotif(null), 5000);
          }
        }
        prevWhisperCount.current = myW.length;
      }
      setWhispers(serverWhispers);

      // Only update questions if server data actually changed (prevents disrupting teacher typing)
      const qJson = JSON.stringify(d.questions || []);
      if (qJson !== lastQuestionsJson.current) {
        lastQuestionsJson.current = qJson;
        const serverQs = Array.isArray(d.questions) ? d.questions : [];
        setQuestions(serverQs);
        // Detect NEW answers to THIS student's questions
        if (!isTeacher && studentId) {
          if (firstDataLoad.current) {
            // First load: mark all existing answered questions as "seen"
            for (const q of serverQs) {
              if (q.answered) seenAnswerIds.current.add(q.id);
            }
            firstDataLoad.current = false;
          } else {
            for (const q of serverQs) {
              if (q.studentId === studentId && q.answered && q.answer && !seenAnswerIds.current.has(q.id)) {
                seenAnswerIds.current.add(q.id);
                setAnsweredAlert({ question: q.question, answer: q.answer });
                setPanel("qa");
                setTimeout(() => setAnsweredAlert(null), 8000);
              }
            }
          }
        }
      }

      // REACTION notifications
      const serverReactions = Array.isArray(d.reactions) ? d.reactions : [];
      setReactions(serverReactions.filter((r: any) => r.type !== "annotation"));
      // Sync board annotations from teacher
      if (!isTeacher) {
        const anns = serverReactions.filter((r: any) => r.type === "annotation");
        setBoardAnnotations(anns);
      }
      setPolls(Array.isArray(d.polls) ? d.polls : []);

      // MODE CHANGE notification — teacher switched board/voice/video
      const serverMode = d.teachingMode || "board";
      if (serverMode !== prevTeachingMode.current && prevTeachingMode.current !== "") {
        if (!isTeacher) {
          const labels: Record<string,string> = { board: "📋 Blackboard", voice: "🎤 Voice Call", video: "📹 Video Call" };
          setModeNotif(`Teacher switched to ${labels[serverMode] || serverMode}`);
          setTimeout(() => setModeNotif(null), 5000);
        }
        prevTeachingMode.current = serverMode;
      }
      if (d.teachingMode) setTeachingMode(d.teachingMode);

      if (d.liveMinutes !== undefined) setLiveMinutes(d.liveMinutes);
      if (d.isPrep !== undefined) setIsSessionPrep(d.isPrep);
      if (d.prepHidden) setPrepHidden(typeof d.prepHidden === "object" ? d.prepHidden : {});

      // Read aloud broadcast — student hears teacher's read-aloud
      if (d.readAloudText && !isTeacher && d.readAloudText !== readAloudText) {
        setReadAloudText(d.readAloudText);
        if (d.readAloudVoice) setVoiceGender(d.readAloudVoice);
        if (d.readSpeed) setReadSpeed(d.readSpeed);
        if (d.readMusical != null) setReadMusical(d.readMusical);
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const gender = d.readAloudVoice || voiceGender;
          const spd = d.readSpeed || readSpeed;
          const musical = d.readMusical ?? readMusical;
          if (musical) {
            const phrases = d.readAloudText.split(/[.,!?\n]+/).filter((p: string) => p.trim());
            const melody = [1.0, 1.15, 1.3, 1.2, 1.05, 1.25, 1.35, 1.1];
            let idx = 0;
            const speakN = () => {
              if (idx >= phrases.length) { setIsReading(false); return; }
              const p = phrases[idx].trim();
              if (!p) { idx++; speakN(); return; }
              const u = new SpeechSynthesisUtterance(p);
              u.rate = Math.max(0.1, spd * 0.7);
              u.pitch = (gender === "female" ? 1.4 : 1.15) * melody[idx % melody.length];
              u.volume = 1;
              const v = pickVoice(); if (v) u.voice = v;
              u.onend = () => { idx++; speakN(); };
              u.onerror = () => { idx++; speakN(); };
              window.speechSynthesis.speak(u);
            };
            setIsReading(true);
            speakN();
          } else {
            const utter = new SpeechSynthesisUtterance(d.readAloudText);
            utter.rate = spd;
            utter.pitch = gender === "female" ? (isKG ? 1.15 : 1.0) : (isKG ? 0.9 : 0.85);
            utter.volume = 1;
            const voice = pickVoice(); if (voice) utter.voice = voice;
            setIsReading(true);
            utter.onend = () => setIsReading(false);
            utter.onerror = () => setIsReading(false);
            window.speechSynthesis.speak(utter);
          }
        }
      }
      setLastPoll(Date.now());
      // Detect when teacher acks student's raised hand
      if (!isTeacher && handRaised && !(d.raisedHands||[]).find((h:any) => h.studentId === studentId)) {
        setHandRaised(false); setHandAccepted(true);
      }
    } catch (_e) {
      pollErrorsRef.current++;
    }
  };

  // Single interval — never recreates, always calls latest pollRef.current
  useEffect(() => {
    let active = true;
    const tick = () => { if (active && pollRef.current) pollRef.current(); };
    tick(); // Immediate first poll
    const i = setInterval(tick, 2000); // 2s for smooth classroom sync
    return () => { active = false; clearInterval(i); };
  }, []); // Empty deps — runs once, interval never recreates




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
      // If it's a clap for someone, play clap sound + announce (for receiving side)
      if (latest.type === "clap" && latest.forStudent) {
        const fromMe = (isTeacher && latest.from === "Teacher") || (!isTeacher && latest.from === studentName);
        if (!fromMe) {
          // Other participants hear the clap
          announceClap(latest.from || "Someone", latest.forStudent);
        }
      }
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
    const bfs = boardFontSize || 16;
    const font = isKG ? `bold ${bfs + 1}px Comic Sans MS, cursive` : `${bfs}px Georgia, serif`;
    const lineH = bfs + 10;
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
    const neededH = 70 + totalLines * lineH + 20;
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
        y += lineH;
      });
    });
  }, [boardLines, subjectName, topic, isKG, boardTheme, textColorOverride, isTeacher, boardFontSize]);

  // Draw annotations overlay (circles, underlines, freehand)
  useEffect(() => {
    const oc = boardOverlayRef.current; if (!oc) return;
    const ctx = oc.getContext("2d"); if (!ctx) return;
    // Match main canvas size
    const mc = canvasRef.current;
    if (mc) { oc.width = mc.width; oc.height = mc.height; }
    ctx.clearRect(0, 0, oc.width, oc.height);
    for (const a of boardAnnotations) {
      ctx.strokeStyle = a.color || "#FF0000";
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      if (a.type === "circle") {
        const cx = (a.x1 + a.x2) / 2, cy = (a.y1 + a.y2) / 2;
        const rx = Math.abs(a.x2 - a.x1) / 2, ry = Math.abs(a.y2 - a.y1) / 2;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (a.type === "underline") {
        ctx.beginPath(); ctx.moveTo(a.x1, a.y2); ctx.lineTo(a.x2, a.y2);
        ctx.lineWidth = 4; ctx.stroke();
      } else if (a.type === "freehand" && a.points) {
        ctx.beginPath();
        a.points.forEach((p: any, i: number) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
        ctx.stroke();
      }
    }
  }, [boardAnnotations]);

  // Board overlay mouse handlers
  const boardOverlayDown = (e: React.MouseEvent) => {
    if (boardDrawMode === "off" || !isTeacher) return;
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 800;
    const y = ((e.clientY - r.top) / r.height) * (canvasRef.current?.height || 260);
    if (boardDrawMode === "freehand") {
      drawStartRef.current = { x, y };
      setBoardAnnotations(prev => [...prev, { type: "freehand", color: "#FF4444", points: [{ x, y }], id: Date.now() }]);
    } else {
      drawStartRef.current = { x, y };
    }
  };
  const boardOverlayMove = (e: React.MouseEvent) => {
    if (!drawStartRef.current || boardDrawMode === "off" || !isTeacher) return;
    if (boardDrawMode === "freehand") {
      const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 800;
      const y = ((e.clientY - r.top) / r.height) * (canvasRef.current?.height || 260);
      setBoardAnnotations(prev => {
        const cp = [...prev];
        const last = cp[cp.length - 1];
        if (last && last.type === "freehand") last.points = [...(last.points || []), { x, y }];
        return cp;
      });
    }
  };
  const boardOverlayUp = (e: React.MouseEvent) => {
    if (!drawStartRef.current || boardDrawMode === "off" || !isTeacher) return;
    const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x2 = ((e.clientX - r.left) / r.width) * 800;
    const y2 = ((e.clientY - r.top) / r.height) * (canvasRef.current?.height || 260);
    if (boardDrawMode === "circle" || boardDrawMode === "underline") {
      const ann = { type: boardDrawMode, x1: drawStartRef.current.x, y1: drawStartRef.current.y, x2, y2, color: "#FF4444", id: Date.now() };
      setBoardAnnotations(prev => [...prev, ann]);
      post("board_annotate", ann);
    } else if (boardDrawMode === "freehand") {
      const last = boardAnnotations[boardAnnotations.length - 1];
      if (last) post("board_annotate", last);
    }
    drawStartRef.current = null;
  };

  // Actions (use the post function defined above)

  const writeBoard = () => {
    if (boardText.trim() && isTeacher) {
      // Optimistic: show text on board immediately (don't wait for poll)
      setBoardLines(prev => [...prev, { text: boardText, color: drawColor, time: Date.now(), id: Math.random().toString(36).slice(2) }]);
      post("board_write", {text:boardText,color:drawColor});
      setBoardText("");
    }
  };
  const clearBoard = () => {
    if (isTeacher) {
      setBoardLines([]); // Optimistic clear
      post("board_write", {type:"clear"});
    }
  };

  // Read board text aloud using SpeechSynthesis
  const readAloud = (text?: string) => {
    const content = text || boardLines.map((l: any) => l.text).join(". ");
    if (!content.trim()) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (readMusical) {
      // SINGING MODE — phrase-by-phrase with melodic pitch variation
      const phrases = content.split(/[.,!?\n]+/).filter((p: string) => p.trim());
      const melody = [1.0, 1.15, 1.3, 1.2, 1.05, 1.25, 1.35, 1.1];
      let idx = 0;
      const speakNext = () => {
        if (idx >= phrases.length) { setIsReading(false); return; }
        const p = phrases[idx].trim();
        if (!p) { idx++; speakNext(); return; }
        const u = new SpeechSynthesisUtterance(p);
        u.rate = Math.max(0.1, readSpeed * 0.7);
        u.pitch = (voiceGender === "female" ? 1.4 : 1.15) * melody[idx % melody.length];
        u.volume = 1;
        const v = pickVoice(); if (v) u.voice = v;
        u.onend = () => { idx++; speakNext(); };
        u.onerror = () => { idx++; speakNext(); };
        window.speechSynthesis.speak(u);
      };
      setIsReading(true);
      speakNext();
    } else {
      const utter = new SpeechSynthesisUtterance(content);
      utter.rate = readSpeed;
      utter.pitch = voiceGender === "female" ? (isKG ? 1.15 : 1.0) : (isKG ? 0.9 : 0.85);
      utter.volume = 1;
      const voice = pickVoice(); if (voice) utter.voice = voice;
      setIsReading(true);
      utter.onend = () => setIsReading(false);
      utter.onerror = () => setIsReading(false);
      window.speechSynthesis.speak(utter);
    }
    // Broadcast to students
    if (isTeacher) post("read_aloud", { text: content, voiceGender, readSpeed, readMusical });
  };
  const stopReading = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    setIsReading(false);
  };
  const setMode = (m: string) => { post("set_mode", {mode:m}); setTeachingMode(m); };
  const toggleHand = () => {
    const n = !handRaised;
    setHandRaised(n);
    setHandAccepted(false);
    // Optimistic: update raised hands list immediately
    if (n) {
      setRaisedHands(prev => [...prev.filter((h:any) => h.studentId !== studentId), { studentId, studentName: studentName || "Student", time: Date.now() }]);
    } else {
      setRaisedHands(prev => prev.filter((h:any) => h.studentId !== studentId));
    }
    post("raise_hand", {studentId, studentName, raised: n});
  };
  const ackHand = (sid: string) => {
    setRaisedHands(prev => prev.filter((h:any) => h.studentId !== sid)); // Optimistic
    post("ack_hand", {studentId: sid});
  };
  const sendChat = () => {
    if (!chatMsg.trim()) return;
    const from = isTeacher ? "Teacher" : (studentName || "Student");
    // Optimistic: show in chat immediately
    setChatMessages(prev => [...prev, { from, message: chatMsg, time: Date.now(), id: Math.random().toString(36).slice(2) }]);
    post("chat", {from, message: chatMsg});
    setChatMsg("");
  };
  const askQuestion = () => {
    if (!questionText.trim()) return;
    // Optimistic: add question locally
    setQuestions(prev => [...prev, { id: Math.random().toString(36).slice(2), studentId, studentName: studentName || "Student", question: questionText, time: Date.now(), answer: null, answered: false }]);
    post("ask_question", {studentId, studentName, question: questionText});
    setQuestionText("");
    setHandAccepted(false);
  };
  const answerQ = (qId: string) => {
    const txt = answerText[qId] || "";
    if (!txt.trim()) return;
    // Optimistic: mark answered locally
    setQuestions(prev => prev.map((q:any) => q.id === qId ? { ...q, answer: txt, answered: true, answeredAt: Date.now() } : q));
    post("answer_question", {questionId: qId, answer: txt});
    setAnswerText(prev => ({ ...prev, [qId]: "" }));
  };
  const sendWhisper = () => {
    if (!whisperMsg.trim() || !whisperTo) return;
    // Optimistic: show whisper locally
    setWhispers(prev => [...prev, { id: Math.random().toString(36).slice(2), fromId: studentId, fromName: studentName || "Student", toId: whisperTo.id, toName: whisperTo.name, message: whisperMsg, time: Date.now() }]);
    post("whisper", {fromId: studentId, fromName: studentName, toId: whisperTo.id, toName: whisperTo.name, message: whisperMsg});
    setWhisperMsg("");
  };
  const sendReaction = (emoji: string) => post("reaction",{from:isTeacher?"Teacher":studentName,emoji});

  // === CLAP SYSTEM ===
  const clapSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Create a clapping burst sound
      for (let i = 0; i < 3; i++) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let j = 0; j < data.length; j++) data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (data.length * 0.2));
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const gain = ctx.createGain();
        gain.gain.value = 0.4;
        src.connect(gain).connect(ctx.destination);
        src.start(ctx.currentTime + i * 0.12);
      }
    } catch (_e) {}
  };

  const announceClap = (fromName: string, forName: string) => {
    clapSound();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const msg = new SpeechSynthesisUtterance(`${fromName} is clapping for ${forName}! Well done ${forName}!`);
      msg.rate = 0.95; msg.pitch = voiceGender === "female" ? 1.15 : 0.9; msg.volume = 1;
      const voice = pickVoice(); if (voice) msg.voice = voice;
      window.speechSynthesis.speak(msg);
    }
  };

  const sendClap = (forStudent: string) => {
    const fromName = isTeacher ? "Teacher" : (studentName || "A classmate");
    post("reaction", { from: fromName, emoji: "👏", type: "clap", forStudent });
    announceClap(fromName, forStudent);
  };
  const togglePrepHide = (field: string) => {
    // Update local state immediately for instant UI feedback
    setPrepHidden(prev => ({ ...prev, [field]: !prev[field] }));
    post("toggle_prep_hidden", { field });
  };
  const createPoll = () => {
    if (!pollQ.trim()) return;
    post("create_poll",{question:pollQ,options:pollOpts.filter(o=>o.trim()),mode:"poll"});
    setPollQ(""); setPollOpts(["","",""]);
  };
  const addExamQuestion = () => {
    setExamQuestions(q => [...q, { question: "", options: ["","","",""], correctOption: null, timeLimitSec: 60 }]);
  };
  const updateExamQ = (idx: number, field: string, val: any) => {
    setExamQuestions(qs => qs.map((q,i) => i===idx ? {...q, [field]: val} : q));
  };
  const updateExamOpt = (qIdx: number, oIdx: number, val: string) => {
    setExamQuestions(qs => qs.map((q,i) => {
      if (i!==qIdx) return q;
      const opts = [...q.options]; opts[oIdx]=val; return {...q, options: opts};
    }));
  };
  const submitExam = () => {
    const valid = examQuestions.filter(q => q.question.trim() && q.options.filter(o=>o.trim()).length >= 2);
    if (valid.length === 0) { alert("Add at least 1 question with 2+ options"); return; }
    post("create_exam", {
      mode: examMode, title: examTitle || (examMode === "test" ? "Class Test" : "Examination"),
      questions: valid.map(q => ({ ...q, options: q.options.filter(o=>o.trim()) })),
    });
    setExamTitle(""); setExamQuestions([]); setExamMode("poll");
  };
  const saveExamToGrades = async (examId: string) => {
    setExamSaving(true);
    try { await fetch(`/api/classroom/${sessionIdRef.current}`, { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action:"save_exam_to_grades",examId}) }); } catch (_e) {}
    setExamSaving(false);
  };

  const sendHomework = async () => {
    if (!hwTitle.trim()) { alert("Enter homework title"); return; }
    setHwSending(true);
    try {
      const res = await fetch("/api/classroom/" + sessionIdRef.current, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_homework", title: hwTitle, description: hwDesc, dueDate: hwDue, type: hwType, classId }),
      });
      const d = await res.json();
      if (d.ok) {
        setHwSent(`✅ "${hwTitle}" assigned to all students! They'll get a notification.`);
        setHwTitle(""); setHwDesc(""); setHwDue(""); setHwType("HOMEWORK");
        setTimeout(() => setHwSent(""), 5000);
      } else { alert(d.error || "Failed to assign"); }
    } catch (_e) { alert("Failed to assign homework"); }
    setHwSending(false);
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
    <div className={`rounded-2xl overflow-hidden shadow-xl border-2 ${isKG?"border-yellow-400":"border-gray-400"} ${fullscreen?"fixed inset-0 z-50 rounded-none":""} relative`}>
      {/* SESSION ENDED OVERLAY */}
      {statusRef.current === "ended" && !isTeacher && (
        <div className="absolute inset-0 z-[70] bg-black/80 flex items-center justify-center">
          <div className="text-center p-8 max-w-sm">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">Class Has Ended</h3>
            <p className="text-sm text-gray-300 mb-4">The teacher has ended this session.</p>
            <button onClick={() => { statusRef.current = "searching"; sessionIdRef.current = ""; searchCountRef.current = 0; pollErrorsRef.current = 0; forceRender(); }}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold mr-2 hover:bg-brand-700">
              Wait for Next Session
            </button>
          </div>
        </div>
      )}
      {/* SEARCHING FOR SESSION OVERLAY */}
      {statusRef.current === "searching" && !sessionIdRef.current && !isTeacher && (
        <div className="absolute inset-0 z-[70] bg-black/60 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-white font-medium">Waiting for teacher to start class...</p>
            <p className="text-[10px] text-gray-300 mt-1">Auto-checking every 2 seconds</p>
          </div>
        </div>
      )}
      {/* RECONNECTING — had session but lost connection */}
      {statusRef.current === "searching" && !!sessionIdRef.current && !isTeacher && (
        <div className="absolute top-2 left-2 right-2 z-[70] bg-amber-500 text-white text-xs px-3 py-2 rounded-lg animate-pulse font-bold text-center">
          ⚡ Reconnecting to class...
        </div>
      )}
      {/* CONNECTION WARNING */}
      {pollErrorsRef.current > 5 && statusRef.current === "active" && (
        <div className="absolute top-2 right-2 z-[70] bg-amber-500 text-white text-[9px] px-2 py-1 rounded-full animate-pulse font-bold">
          ⚠️ Weak connection
        </div>
      )}
      {/* Floating reactions */}
      {floatingReactions.map(r => (
        <div key={r.id} className="fixed z-[60] text-3xl animate-bounce pointer-events-none"
          style={{ bottom: "20%", left: `${r.x}%`, animation: "floatUp 3s ease-out forwards" }}>{r.emoji}</div>
      ))}
      <style>{`@keyframes floatUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-200px)} }`}</style>

      {/* HEADER */}
      <div className={`px-3 py-2 flex items-center justify-between ${isKG?"bg-gradient-to-r from-yellow-400 to-orange-400":"bg-gradient-to-r from-gray-700 to-gray-800"}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isSessionPrep ? "bg-amber-400 animate-pulse" : "bg-red-500 animate-pulse"}`} />
          <div>
            <h3 className={`text-xs font-bold ${isKG?"text-yellow-900":"text-white"} flex items-center gap-1.5`}>
              {isKG?"🏫 ":""}{subjectName}
              {isSessionPrep
                ? <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full">PREP</span>
                : <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">LIVE</span>
              }
            </h3>
            <p className={`text-[9px] ${isKG?"text-yellow-800":"text-gray-400"}`}>
              {isTeacher?`${students.length} students`:`Teacher: ${teacherName}`}
              {!isTeacher && teachingMode !== "board" && (
                <span className="ml-1.5 bg-blue-500/80 text-white px-1.5 py-0.5 rounded text-[8px]">
                  {teachingMode === "video" ? "📹 Video" : "🎤 Voice"}
                </span>
              )}
            </p>
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
            {!isTeacher && answeredAlert && <span className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-emerald-500 text-[7px] text-white rounded-full flex items-center justify-center animate-bounce">!</span>}
          </button>
          <button onClick={() => { setPanel(panel==="chat"?null:"chat"); setUnreadChat(0); setChatNotif(null); }} className="relative p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white">
            <MessageSquare className="w-3 h-3" />
            {unreadChat > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 text-[7px] text-white rounded-full flex items-center justify-center animate-bounce">{unreadChat}</span>}
          </button>
          {!isTeacher && <button onClick={() => { setPanel(panel==="whisper"?null:"whisper"); setUnreadWhisper(0); setWhisperNotif(null); }} className="relative p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white">
            <Lock className="w-3 h-3" />
            {unreadWhisper > 0 ? <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-pink-500 text-[7px] text-white rounded-full flex items-center justify-center animate-bounce">{unreadWhisper}</span>
            : myWhispers.length>0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-pink-500/60 text-[7px] text-white rounded-full flex items-center justify-center">{myWhispers.length}</span>}
          </button>}
          {isTeacher && <button onClick={() => setPanel(panel==="poll"?null:"poll")} className="p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white"><BarChart3 className="w-3 h-3" /></button>}
          {isTeacher && <button onClick={() => setPanel(panel==="hw"?null:"hw")} className="p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white" title="Assign Homework"><FileText className="w-3 h-3" /></button>}
          {/* Voice & Read Controls */}
          <div className="flex items-center gap-0.5 bg-black/20 rounded-lg p-0.5">
            <button onClick={() => setVoiceGender("female")} className={`text-[7px] px-1 py-0.5 rounded ${voiceGender === "female" ? "bg-pink-400 text-white" : "text-white/40"}`} title="Female voice">♀</button>
            <button onClick={() => setVoiceGender("male")} className={`text-[7px] px-1 py-0.5 rounded ${voiceGender === "male" ? "bg-blue-400 text-white" : "text-white/40"}`} title="Male voice">♂</button>
            <button onClick={() => setReadMusical(!readMusical)} className={`text-[7px] px-1 py-0.5 rounded ${readMusical ? "bg-purple-400 text-white" : "text-white/40"}`} title="Musical/sing-song tone">🎵</button>
          </div>
          {/* Speed control */}
          <div className="flex items-center gap-0.5 bg-black/20 rounded-lg px-1 py-0.5" title={`Speed: ${readSpeed.toFixed(1)}x`}>
            <button onClick={() => setReadSpeed(Math.max(0.1, readSpeed - 0.1))} className="text-[7px] text-white/60 hover:text-white px-0.5">🐢</button>
            <span className="text-[6px] text-white/50 w-5 text-center">{readSpeed.toFixed(1)}x</span>
            <button onClick={() => setReadSpeed(Math.min(2.0, readSpeed + 0.1))} className="text-[7px] text-white/60 hover:text-white px-0.5">🐇</button>
          </div>
          {/* Font size control */}
          <div className="flex items-center gap-0.5 bg-black/20 rounded-lg px-1 py-0.5" title={`Board font: ${boardFontSize}px`}>
            <button onClick={() => setBoardFontSize(Math.max(10, boardFontSize - 2))} className="text-[7px] text-white/60 hover:text-white font-bold">A-</button>
            <span className="text-[6px] text-white/50 w-4 text-center">{boardFontSize}</span>
            <button onClick={() => setBoardFontSize(Math.min(32, boardFontSize + 2))} className="text-[8px] text-white/60 hover:text-white font-bold">A+</button>
          </div>
          {/* Save & read buttons */}
          {isTeacher && (
            <button onClick={() => {
              const name = `Board ${new Date().toLocaleTimeString()}`;
              setSavedBoards(prev => [...prev, { name, lines: [...boardLines], time: Date.now() }]);
              alert(`✅ Board saved as "${name}"`);
            }} className="p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white" title="Save board content">
              <Save className="w-3 h-3" />
            </button>
          )}
          {isTeacher && savedBoards.length > 0 && (
            <button onClick={() => setShowSavedBoards(!showSavedBoards)} className={`p-1 rounded-lg text-[7px] font-bold ${showSavedBoards ? "bg-blue-400 text-white" : "bg-gray-600 text-white/60 hover:text-white"}`} title="Load saved boards">
              📂{savedBoards.length}
            </button>
          )}
          <button onClick={() => isReading ? stopReading() : readAloud()}
            className={`p-1 rounded-lg ${isReading ? "bg-emerald-500 text-white animate-pulse" : "bg-gray-600 text-white/60 hover:text-white"}`}
            title="Read board text aloud">
            {isReading ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          </button>
          {isKG && isTeacher && (
            <button onClick={() => setShowKGTools(!showKGTools)}
              className={`p-1 rounded-lg ${showKGTools ? "bg-yellow-400 text-yellow-900" : "bg-gray-600 text-white/60 hover:text-white"}`}
              title="KG Learning Tools">
              <span className="text-[10px] font-bold">🧒</span>
            </button>
          )}
          {!isTeacher && <button onClick={() => setShowSettings(!showSettings)} className="p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white"><Settings className="w-3 h-3" /></button>}
          <button onClick={() => setFullscreen(!fullscreen)} className="p-1 rounded-lg bg-gray-600 text-white/60 hover:text-white">
            {fullscreen?<Minimize2 className="w-3 h-3" />:<Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* ANSWERED QUESTION NOTIFICATION — student sees this when teacher replies */}
      {answeredAlert && !isTeacher && (
        <div className="px-3 py-2.5 bg-emerald-500 text-white cursor-pointer" onClick={() => { setAnsweredAlert(null); setPanel("qa"); }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">Teacher answered your question!</p>
              <p className="text-[10px] opacity-90 truncate">Q: {answeredAlert.question}</p>
              <p className="text-[10px] font-bold truncate">A: {answeredAlert.answer}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setAnsweredAlert(null); }} className="text-white/80 hover:text-white text-sm">✕</button>
          </div>
        </div>
      )}

      {/* CHAT NOTIFICATION — new message from someone */}
      {chatNotif && (
        <div className="px-3 py-2 bg-blue-500 text-white cursor-pointer animate-pulse" onClick={() => { setChatNotif(null); setUnreadChat(0); setPanel("chat"); }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">{chatNotif.from} sent a message</p>
              <p className="text-[10px] opacity-90 truncate">{chatNotif.message}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setChatNotif(null); }} className="text-white/80 hover:text-white text-sm">✕</button>
          </div>
        </div>
      )}

      {/* WHISPER NOTIFICATION — private message */}
      {whisperNotif && !isTeacher && (
        <div className="px-3 py-2 bg-pink-500 text-white cursor-pointer animate-pulse" onClick={() => { setWhisperNotif(null); setUnreadWhisper(0); setPanel("whisper"); }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">🤫</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">{whisperNotif.from} whispered to you</p>
              <p className="text-[10px] opacity-90 truncate">{whisperNotif.message}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setWhisperNotif(null); }} className="text-white/80 hover:text-white text-sm">✕</button>
          </div>
        </div>
      )}

      {/* MODE CHANGE NOTIFICATION — teacher switched mode */}
      {modeNotif && !isTeacher && (
        <div className="px-3 py-2 bg-indigo-500 text-white text-center animate-pulse">
          <p className="text-xs font-bold">{modeNotif}</p>
        </div>
      )}

      {/* PREP CONTROLS BAR — Teacher can hide/show content from students */}
      {isSessionPrep && isTeacher && (
        <div className="px-3 py-1.5 bg-amber-100 border-b border-amber-300 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-amber-800">🔒 Prep Mode — Hide from students:</span>
          {([
            { key: "board", label: "Board", icon: "📋" },
            { key: "polls", label: "Polls/Exams", icon: "📊" },
            { key: "chat", label: "Chat", icon: "💬" },
            { key: "qa", label: "Q&A", icon: "❓" },
          ] as const).map(item => (
            <button key={item.key} onClick={() => togglePrepHide(item.key)}
              className={`text-[9px] px-2 py-0.5 rounded-full font-bold border transition ${
                prepHidden[item.key]
                  ? "bg-red-100 border-red-400 text-red-700"
                  : "bg-emerald-100 border-emerald-400 text-emerald-700"
              }`}>
              {item.icon} {item.label}: {prepHidden[item.key] ? "HIDDEN" : "VISIBLE"}
            </button>
          ))}
        </div>
      )}

      {/* PREP BANNER — Student sees what's hidden */}
      {isSessionPrep && !isTeacher && (
        <div className="px-3 py-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-800">📚 Review Session — Get ready for class!</span>
          </div>
          <p className="text-[10px] text-amber-700 mt-0.5">
            Your teacher is preparing. You can chat, ask questions, and review the board.
            {Object.values(prepHidden).some(v => v) && (
              <span className="ml-1 text-amber-500">
                🔒 Hidden: {prepHidden.board && "Board "}{prepHidden.polls && "Polls "}{prepHidden.chat && "Chat "}{prepHidden.qa && "Q&A "}
              </span>
            )}
          </p>
        </div>
      )}

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

            {/* MODE BANNER — show students what mode teacher is in */}
            {!isTeacher && (teachingMode==="video"||teachingMode==="voice") && (
              <div className="p-2.5 bg-blue-50 border-2 border-blue-300 rounded-xl text-center">
                <p className="text-xs font-bold text-blue-800">
                  {teachingMode==="video" ? "📹 Teacher is on Video Call" : "🎤 Teacher is on Voice Call"}
                </p>
                <p className="text-[10px] text-blue-600 mt-0.5">Click &quot;Join with Video&quot; or &quot;Voice Only&quot; below to connect</p>
              </div>
            )}

            {/* Video / Voice — WebRTC */}
            {(teachingMode==="video"||teachingMode==="voice") && (
              <ClassroomVideo
                sessionId={sessionIdRef.current}
                userId={myUserId}
                userName={isTeacher ? teacherName : (studentName || "Student")}
                isTeacher={isTeacher}
              />
            )}

            {/* RAISED HANDS — TOP of classroom so teacher sees immediately */}
            {isTeacher && raisedHands.length > 0 && (
              <div className="p-2.5 bg-amber-50 border-2 border-amber-300 rounded-xl animate-pulse">
                <h4 className="text-xs font-bold text-amber-800 mb-1.5">✋ Raised Hands ({raisedHands.length})</h4>
                <div className="flex flex-wrap gap-1.5">
                  {raisedHands.map((h:any) => (
                    <div key={h.studentId} className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-full shadow-sm border border-amber-200">
                      <span className="animate-bounce text-lg">✋</span>
                      <span className="text-xs font-bold">{h.studentName}</span>
                      <button onClick={() => ackHand(h.studentId)} className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold hover:bg-emerald-600">Allow</button>
                      <button onClick={() => sendClap(h.studentName?.split(" ")[0] || "Student")} className="text-[9px] bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-bold hover:bg-amber-500" title="Clap for this student">👏</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BLACKBOARD */}
            <div className="relative">
              {/* Hidden overlay for students during prep */}
              {isSessionPrep && !isTeacher && prepHidden.board && (
                <div className="absolute inset-0 z-10 bg-gray-800/90 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">Board Hidden</p>
                    <p className="text-[10px] text-gray-400">Teacher is preparing content. It will be visible when class goes live.</p>
                  </div>
                </div>
              )}
              <div className="bg-amber-800 rounded-t-lg px-3 py-1 flex items-center justify-between">
                <span className="text-[9px] text-amber-200">📋 {isKG?"Our Board":"Blackboard"}</span>
                {isTeacher && (
                  <div className="flex items-center gap-1">
                    {CHALK.map(c => <button key={c} onClick={() => setDrawColor(c)} className={`w-3 h-3 rounded-full ${drawColor===c?"ring-2 ring-white scale-125":""}`} style={{backgroundColor:c}} />)}
                    <button onClick={() => {
                      const txt = prompt("Text to circle/highlight:");
                      if (txt) {
                        const circled = `⭕ ${txt} ⭕`;
                        setBoardLines((prev: any) => [...prev, { text: circled, color: "#FFD700", time: Date.now(), id: Math.random().toString(36).slice(2) }]);
                        post("board_write", { text: circled, color: "#FFD700" });
                      }
                    }} className="text-[7px] bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded ml-0.5" title="Circle/highlight text on board">⭕</button>
                    <button onClick={() => {
                      const txt = prompt("Text to underline:");
                      if (txt) {
                        const underlined = `▬▬ ${txt} ▬▬`;
                        setBoardLines((prev: any) => [...prev, { text: underlined, color: "#FF6B6B", time: Date.now(), id: Math.random().toString(36).slice(2) }]);
                        post("board_write", { text: underlined, color: "#FF6B6B" });
                      }
                    }} className="text-[7px] bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded" title="Underline text on board">U̲</button>
                    <button onClick={clearBoard} className="text-[8px] bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded ml-1"><Eraser className="w-2.5 h-2.5 inline" /> Clear</button>
                  </div>
                )}
              </div>
              <div className="overflow-y-auto rounded-b-lg" style={{maxHeight: fullscreen ? "50vh" : "300px"}}>
                <div className="relative">
                  <canvas ref={canvasRef} width={800} height={260} className="w-full shadow-inner" />
                  {/* Drawing overlay — teacher can circle/underline/freehand */}
                  <canvas ref={boardOverlayRef} width={800} height={260}
                    className={`absolute inset-0 w-full h-full ${boardDrawMode !== "off" && isTeacher ? "cursor-crosshair z-10" : "pointer-events-none"}`}
                    onMouseDown={boardOverlayDown} onMouseMove={boardOverlayMove}
                    onMouseUp={boardOverlayUp} onMouseLeave={() => { drawStartRef.current = null; }} />
                </div>
              </div>
              {/* Draw mode toolbar */}
              {isTeacher && (
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <span className="text-[8px] text-gray-400 mr-1">Draw:</span>
                  {([
                    { mode: "off" as const, label: "Off", icon: "✏️" },
                    { mode: "circle" as const, label: "Circle", icon: "⭕" },
                    { mode: "underline" as const, label: "Underline", icon: "▬" },
                    { mode: "freehand" as const, label: "Free", icon: "✍️" },
                  ]).map(d => (
                    <button key={d.mode} onClick={() => setBoardDrawMode(d.mode)}
                      className={`text-[8px] px-2 py-1 rounded-lg font-medium transition ${boardDrawMode === d.mode ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      {d.icon} {d.label}
                    </button>
                  ))}
                  {boardAnnotations.length > 0 && (
                    <button onClick={() => { setBoardAnnotations([]); post("board_annotate", { type: "clear_all" }); }}
                      className="text-[8px] px-2 py-1 rounded-lg bg-gray-100 text-red-500 hover:bg-red-50 font-medium ml-1">
                      🗑️ Clear marks
                    </button>
                  )}
                  {boardDrawMode !== "off" && <span className="text-[8px] text-red-500 font-bold animate-pulse ml-1">Drawing mode ON — drag on board</span>}
                </div>
              )}
              {isTeacher && (<>
                <div className="flex gap-2 mt-1.5">
                  <input className="flex-1 input-field text-sm" placeholder="Write on board..."
                    value={boardText} onChange={e => setBoardText(e.target.value)} onKeyDown={e => e.key==="Enter"&&writeBoard()} />
                  <button onClick={() => setShowBoardMath(!showBoardMath)} className={`text-xs px-2 py-1 rounded-lg font-bold ${showBoardMath ? "bg-green-500 text-white" : "bg-green-800 text-green-200 hover:bg-green-700"}`} title="Math symbols">∑</button>
                  <button onClick={writeBoard} className="btn-primary text-xs px-3"><Type className="w-3 h-3 mr-1" />Write</button>
                </div>
                {showBoardMath && (
                  <div className="flex flex-wrap gap-0.5 mt-1 p-1.5 bg-gray-900 rounded-lg border border-green-700">
                    {BOARD_MATH.map(sym => (
                      <button key={sym} onClick={() => setBoardText(prev => prev + sym)}
                        className="w-6 h-6 bg-gray-800 hover:bg-green-700 text-white rounded text-xs font-mono flex items-center justify-center">{sym}</button>
                    ))}
                  </div>
                )}
              </>)}
            </div>

            {/* Polls hidden during prep */}
            {isSessionPrep && !isTeacher && prepHidden.polls && (
              <div className="p-3 bg-gray-100 border border-gray-200 rounded-xl text-center">
                <BarChart3 className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-[10px] text-gray-500 font-bold">Polls & Exams Hidden</p>
                <p className="text-[9px] text-gray-400">Teacher is setting up. Will be visible when class goes live.</p>
              </div>
            )}

            {/* Active Poll (simple) */}
            {polls.filter((p:any) => p.active && !p.questions).map((p:any) => {
              const myVoted = p.options.some((o:any) => (o.votes||[]).includes(studentId));
              return (
              <div key={p.id} className="p-3 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-indigo-800 flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> Poll {myVoted && !isTeacher && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">✓ Answered (locked)</span>}</h4>
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
                        <button onClick={() => !isTeacher && !myVoted && post("vote_poll",{pollId:p.id,optionIndex:i,studentId,studentName})}
                          disabled={!isTeacher && myVoted}
                          className={`w-full text-left p-2 rounded-lg border transition ${isCorrect ? "bg-emerald-100 border-emerald-400 ring-1 ring-emerald-300" : voted ? "bg-indigo-100 border-indigo-400 font-bold" : myVoted ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed" : "bg-white border-gray-200 hover:border-indigo-300"}`}>
                          <div className="flex items-center justify-between text-xs">
                            <span>{isCorrect && "✅ "}{o.text}</span>
                            {(isTeacher || myVoted) && <span className="text-gray-500">{o.votes?.length || 0} votes ({pct}%)</span>}
                          </div>
                          {(isTeacher || myVoted) && <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1"><div className={`h-full rounded-full transition-all ${isCorrect ? "bg-emerald-500" : "bg-indigo-500"}`} style={{width:`${pct}%`}} /></div>}
                        </button>
                        {isTeacher && (o.voterNames?.length > 0) && (
                          <div className="ml-2 mt-0.5 flex flex-wrap gap-1">
                            {(o.voterNames || []).map((v:any, vi:number) => (
                              <span key={vi} className={`text-[9px] px-1.5 py-0.5 rounded-full ${isCorrect ? "bg-emerald-200 text-emerald-800" : "bg-gray-200 text-gray-600"}`}>{v.name || v}</span>
                            ))}
                          </div>
                        )}
                        {isTeacher && p.correctOption == null && (
                          <button onClick={() => post("mark_correct",{pollId:p.id,optionIndex:i})}
                            className="text-[8px] text-emerald-600 hover:text-emerald-800 ml-2 mt-0.5">✓ Mark correct</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isTeacher && (
                  <p className="text-[9px] text-gray-400 mt-2">
                    {p.options.reduce((s:number,o:any) => s + (o.votes?.length||0), 0)} total votes • Answers are locked after selection
                    {p.correctOption != null && " • Correct answer marked ✅"}
                  </p>
                )}
              </div>
            );})}

            {/* Active Exam/Test */}
            {polls.filter((p:any) => p.questions && (p.active || p.finished)).map((exam:any) => {
              const curQ = exam.questions?.[exam.currentQuestion];
              const isFinished = exam.finished;
              // Calculate student score
              const myScore = isFinished ? exam.questions.reduce((s:number, q:any) => {
                if (q.correctOption == null) return s;
                const myOpt = q.options.findIndex((o:any) => (o.votes||[]).includes(studentId));
                return myOpt === q.correctOption ? s+1 : s;
              }, 0) : 0;
              const myVotedCurrent = curQ ? curQ.options.some((o:any) => (o.votes||[]).includes(studentId)) : false;

              return (
                <div key={exam.id} className={`p-3 border-2 rounded-xl ${exam.mode==="exam" ? "bg-red-50 border-red-200" : "bg-purple-50 border-purple-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-xs font-bold flex items-center gap-1 ${exam.mode==="exam"?"text-red-800":"text-purple-800"}`}>
                      {exam.mode==="exam" ? "📝 EXAM" : "📋 TEST"}: {exam.title}
                      <span className="text-[9px] bg-white/60 px-1.5 py-0.5 rounded">Q{(exam.currentQuestion||0)+1}/{exam.totalQuestions}</span>
                    </h4>
                    {isTeacher && !isFinished && (
                      <div className="flex gap-1">
                        {!exam.started && <button onClick={() => post("start_exam",{examId:exam.id})} className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded">▶ Start</button>}
                        {exam.started && <button onClick={() => post("advance_exam",{examId:exam.id})} className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded">Next Q →</button>}
                        <button onClick={() => post("end_exam",{examId:exam.id})} className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded">End</button>
                      </div>
                    )}
                  </div>

                  {/* Current question for students */}
                  {curQ && curQ.active && !isFinished && (
                    <div>
                      <ExamTimer timeLimitSec={curQ.timeLimitSec} startedAt={curQ.startedAt} onExpire={() => {}} />
                      <p className="text-sm font-medium text-gray-800 mb-2">Q{exam.currentQuestion+1}. {curQ.question}</p>
                      <div className="space-y-1.5">
                        {curQ.options.map((o:any, i:number) => {
                          const voted = (o.votes||[]).includes(studentId);
                          return (
                            <button key={i}
                              onClick={() => !isTeacher && !myVotedCurrent && post("vote_exam_question",{examId:exam.id,questionId:curQ.id,optionIndex:i,studentId,studentName})}
                              disabled={!isTeacher && myVotedCurrent}
                              className={`w-full text-left p-2.5 rounded-lg border transition text-xs ${voted ? "bg-indigo-100 border-indigo-400 font-bold" : myVotedCurrent ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed" : "bg-white border-gray-200 hover:border-indigo-300"}`}>
                              <span className="font-medium mr-2 text-gray-400">{String.fromCharCode(65+i)}.</span> {o.text}
                              {voted && <span className="float-right text-[9px] text-emerald-600">✓ Locked</span>}
                              {isTeacher && <span className="float-right text-[9px] text-gray-400">{o.votes?.length||0} answered</span>}
                            </button>
                          );
                        })}
                      </div>
                      {!isTeacher && myVotedCurrent && <p className="text-[9px] text-amber-600 mt-2">🔒 Your answer is locked. Waiting for next question...</p>}
                      {!isTeacher && !myVotedCurrent && <p className="text-[9px] text-red-600 mt-2 animate-pulse">⚡ Select your answer — you cannot change it once selected!</p>}
                    </div>
                  )}

                  {/* Waiting for start */}
                  {!exam.started && !isFinished && !isTeacher && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600 animate-pulse">⏳ Waiting for teacher to start the {exam.mode}...</p>
                      <p className="text-[10px] text-gray-400 mt-1">{exam.totalQuestions} questions total</p>
                    </div>
                  )}

                  {/* Between questions */}
                  {exam.started && !curQ?.active && !isFinished && !isTeacher && (
                    <div className="text-center py-4"><p className="text-sm text-gray-500 animate-pulse">⏳ Waiting for next question...</p></div>
                  )}

                  {/* Finished — show results */}
                  {isFinished && (
                    <div className="space-y-2">
                      {(!isTeacher && !exam.showResults) ? (
                        <div className="text-center py-4">
                          <p className="text-sm font-bold text-gray-700">✅ {exam.mode === "exam" ? "Exam" : "Test"} Complete!</p>
                          <p className="text-xs text-gray-500 mt-1">Waiting for teacher to release results...</p>
                        </div>
                      ) : (
                        <>
                          {!isTeacher && <div className="text-center mb-3">
                            <p className="text-lg font-bold">{myScore}/{exam.totalQuestions}</p>
                            <p className="text-[10px] text-gray-500">Your Score ({Math.round(myScore/exam.totalQuestions*100)}%)</p>
                          </div>}
                          {exam.questions.map((q:any, qi:number) => {
                            const myAns = q.options.findIndex((o:any) => (o.votes||[]).includes(studentId));
                            const isRight = myAns === q.correctOption;
                            return (
                              <div key={qi} className="p-2 bg-white rounded-lg border text-xs">
                                <p className="font-medium mb-1">Q{qi+1}. {q.question}</p>
                                {q.options.map((o:any, oi:number) => (
                                  <div key={oi} className={`ml-2 py-0.5 flex items-center gap-1 ${q.correctOption===oi ? "text-emerald-700 font-bold" : myAns===oi && !isRight ? "text-red-600 line-through" : "text-gray-600"}`}>
                                    <span>{String.fromCharCode(65+oi)}. {o.text}</span>
                                    {q.correctOption===oi && <span className="text-[9px]">✅</span>}
                                    {myAns===oi && !isRight && <span className="text-[9px]">❌</span>}
                                    {isTeacher && <span className="text-[9px] text-gray-400 ml-auto">{o.votes?.length||0}</span>}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                          {isTeacher && !exam.showResults && (
                            <button onClick={() => post("show_exam_results",{examId:exam.id})} className="w-full text-xs py-2 rounded-lg bg-blue-600 text-white font-bold">📊 Release Results to Students</button>
                          )}
                          {isTeacher && (
                            <button onClick={() => saveExamToGrades(exam.id)} disabled={examSaving}
                              className="w-full text-xs py-2 rounded-lg bg-emerald-600 text-white font-bold">
                              {examSaving ? "Saving..." : "💾 Save to Gradebook (Auto-creates Assessment + Scores)"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

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
                  const isMe = !isTeacher && s.id === studentId;
                  return (
                    <div key={s.id} className={`relative text-center p-1 rounded-xl transition ${hasHand?"bg-amber-100 ring-1 ring-amber-400 scale-105":"bg-white/50 hover:bg-white/80"}`}>
                      <div className="w-full h-0.5 rounded-full bg-gray-200 mb-0.5" />
                      <div className={`mx-auto rounded-full w-6 h-6 flex items-center justify-center text-white font-bold text-[8px] ${isKG?"bg-gradient-to-br from-pink-400 to-purple-400":"bg-brand-400"}`}>
                        {s.name.split(" ").map((n: string)=>n[0]).join("").slice(0,2)}
                      </div>
                      <p className="text-[7px] text-gray-500 mt-0.5 truncate">{s.name.split(" ")[0]}</p>
                      {hasHand && <div className="absolute -top-1 -right-0.5 text-xs animate-bounce">✋</div>}
                      {/* Clap & Whisper buttons */}
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        {!isMe && (
                          <button onClick={(e) => { e.stopPropagation(); sendClap(s.name.split(" ")[0]); }}
                            className="text-[9px] px-1 py-0.5 rounded bg-amber-100 hover:bg-amber-200 active:scale-90 transition" title={`Clap for ${s.name}`}>
                            👏
                          </button>
                        )}
                        {!isTeacher && !isMe && (
                          <button onClick={(e) => { e.stopPropagation(); setWhisperTo(s); setPanel("whisper"); }}
                            className="text-[9px] px-1 py-0.5 rounded bg-blue-100 hover:bg-blue-200 transition" title={`Whisper to ${s.name}`}>
                            💬
                          </button>
                        )}
                        {isMe && <span className="text-[7px] text-emerald-500 font-bold">You</span>}
                      </div>
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
                <div className={`w-1.5 h-1.5 rounded-full ${lastPoll>Date.now()-4000?"bg-emerald-400 animate-pulse":"bg-red-400"}`} />
                <span className="text-[8px] text-gray-400">{lastPoll>Date.now()-4000?"Live":"Reconnecting..."}</span>
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
                {isSessionPrep && !isTeacher && prepHidden.chat ? (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                      <Lock className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-500">Chat Hidden</p>
                      <p className="text-[9px] text-gray-400">Teacher is preparing. Chat will open when class starts.</p>
                    </div>
                  </div>
                ) : (<>
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
                            value={answerText[q.id] || ""} onChange={e => setAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))} onKeyDown={e => e.key==="Enter"&&answerQ(q.id)} />
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

              {/* POLL / TEST / EXAM (teacher create) */}
              {panel==="poll" && isTeacher && (<>
                <div className="px-3 py-2 bg-indigo-50 border-b flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-800">📊 Polls / Tests / Exams</span>
                  <button onClick={() => setPanel(null)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto max-h-[70vh]">
                  {/* Mode tabs */}
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    {(["poll","test","exam"] as const).map(m => (
                      <button key={m} onClick={() => setExamMode(m)}
                        className={`flex-1 text-[10px] py-1.5 rounded-md font-bold ${examMode===m ? m==="exam"?"bg-red-500 text-white":m==="test"?"bg-purple-500 text-white":"bg-indigo-500 text-white" : "text-gray-500"}`}>
                        {m==="poll"?"📊 Quick Poll":m==="test"?"📋 Test":"📝 Exam"}
                      </button>
                    ))}
                  </div>

                  {/* Quick Poll (single question) */}
                  {examMode === "poll" && (
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
                      <p className="text-[9px] text-amber-600">🔒 Students cannot change answers once selected</p>
                    </div>
                  )}

                  {/* Test / Exam (multi-question) */}
                  {(examMode === "test" || examMode === "exam") && (
                    <div className="space-y-3">
                      <div className={`p-2 rounded-lg ${examMode==="exam"?"bg-red-50 border border-red-200":"bg-purple-50 border border-purple-200"}`}>
                        <p className="text-[10px] font-bold">{examMode==="exam"?"📝 Exam Mode":"📋 Test Mode"}</p>
                        <p className="text-[9px] text-gray-500">{examMode==="exam"?"Grouped as exam. Timed per question. Hidden results until you release.":"Grouped as test. Timed per question. Results auto-shown."}</p>
                      </div>
                      <input className="input-field text-xs" placeholder={examMode==="exam"?"Exam title...":"Test title..."} value={examTitle} onChange={e => setExamTitle(e.target.value)} />

                      {examQuestions.map((q, qi) => (
                        <div key={qi} className="p-2 bg-gray-50 rounded-lg border space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-600">Q{qi+1}</span>
                            <div className="flex items-center gap-1">
                              <input type="number" className="input-field text-[10px] w-14 py-0.5 text-center" min={10} max={600}
                                value={q.timeLimitSec} onChange={e => updateExamQ(qi,"timeLimitSec",+e.target.value)} />
                              <span className="text-[9px] text-gray-400">sec</span>
                              <button onClick={() => setExamQuestions(qs => qs.filter((_,i) => i!==qi))} className="text-red-400 hover:text-red-600 ml-1">✕</button>
                            </div>
                          </div>
                          <input className="input-field text-xs" placeholder={`Question ${qi+1}...`} value={q.question} onChange={e => updateExamQ(qi,"question",e.target.value)} />
                          {q.options.map((o, oi) => (
                            <div key={oi} className="flex items-center gap-1">
                              <button onClick={() => updateExamQ(qi,"correctOption",oi)}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] ${q.correctOption===oi ? "bg-emerald-500 border-emerald-600 text-white" : "border-gray-300"}`}>
                                {q.correctOption===oi && "✓"}
                              </button>
                              <input className="input-field text-[10px] flex-1" placeholder={`${String.fromCharCode(65+oi)}. Option`}
                                value={o} onChange={e => updateExamOpt(qi,oi,e.target.value)} />
                            </div>
                          ))}
                          <button onClick={() => updateExamQ(qi,"options",[...q.options,""])} className="text-[9px] text-indigo-600">+ option</button>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <button onClick={addExamQuestion} className="flex-1 text-[10px] py-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-300 hover:text-indigo-600">
                          + Add Question
                        </button>
                      </div>

                      {examQuestions.length > 0 && (
                        <button onClick={submitExam}
                          className={`w-full text-xs py-2 rounded-lg text-white font-bold ${examMode==="exam"?"bg-red-600 hover:bg-red-700":"bg-purple-600 hover:bg-purple-700"}`}>
                          📤 Create {examMode==="exam"?"Exam":"Test"} ({examQuestions.length} questions)
                        </button>
                      )}
                    </div>
                  )}

                  {/* Existing polls/exams list */}
                  {polls.length>0 && <div className="border-t pt-2">
                    <h5 className="text-[10px] font-bold text-gray-500 mb-1">All ({polls.length})</h5>
                    {polls.map((p:any) => {
                      if (p.questions) {
                        // Exam/Test
                        return (
                          <div key={p.id} className={`text-[10px] p-2 rounded-lg mb-1.5 ${p.active?"bg-red-50 border border-red-200":"bg-gray-50"}`}>
                            <p className="font-bold">{p.mode==="exam"?"📝":"📋"} {p.title} ({p.totalQuestions}Q) {p.active&&<span className="text-red-500">(Live)</span>} {p.finished&&<span className="text-emerald-600">(Done)</span>}</p>
                            {p.finished && (
                              <div className="flex gap-1 mt-1">
                                {!p.showResults && <button onClick={() => post("show_exam_results",{examId:p.id})} className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Show Results</button>}
                                <button onClick={() => saveExamToGrades(p.id)} disabled={examSaving} className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{examSaving?"Saving...":"Save to Grades"}</button>
                              </div>
                            )}
                          </div>
                        );
                      }
                      // Regular poll
                      return (
                        <div key={p.id} className={`text-[10px] p-2 rounded-lg mb-1.5 ${p.active?"bg-indigo-50 border border-indigo-200":"bg-gray-50"}`}>
                          <p className="font-medium mb-1">{p.question} {p.active&&<span className="text-indigo-600">(Active)</span>}</p>
                          {p.options.map((o:any,i:number) => (
                            <div key={i} className="ml-1 mb-0.5">
                              <span className={p.correctOption===i?"text-emerald-700 font-bold":"text-gray-600"}>
                                {p.correctOption===i&&"✅ "}{o.text}: {o.votes?.length||0}
                              </span>
                              {p.correctOption==null && (
                                <button onClick={()=>post("mark_correct",{pollId:p.id,optionIndex:i})} className="text-[8px] text-emerald-500 ml-1">✓</button>
                              )}
                            </div>
                          ))}
                          <p className="text-[8px] text-gray-400">{p.options.reduce((s:number,o:any)=>s+(o.votes?.length||0),0)} votes • 🔒 locked</p>
                        </div>
                      );
                    })}
                  </div>}
                </div>
              </>)}

              {/* HOMEWORK PANEL */}
              {panel==="hw" && isTeacher && (<>
                <div className="px-3 py-2 bg-brand-50 border-b flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-800">📝 Assign Homework</span>
                  <button onClick={() => setPanel(null)}><X className="w-3.5 h-3.5 text-gray-400" /></button>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {hwSent && <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">{hwSent}</div>}
                  <p className="text-[10px] text-gray-500">Assign homework to all students in this class. They&apos;ll get a notification and see it on their desk.</p>
                  <input className="input-field text-xs w-full" placeholder="Homework title *" value={hwTitle} onChange={e => setHwTitle(e.target.value)} />
                  <textarea className="input-field text-xs w-full" rows={3} placeholder="Instructions (optional)" value={hwDesc} onChange={e => setHwDesc(e.target.value)} />
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">Due Date</label>
                    <input type="date" className="input-field text-xs w-full" value={hwDue} onChange={e => setHwDue(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">Type</label>
                    <select className="input-field text-xs w-full" value={hwType} onChange={e => setHwType(e.target.value)}>
                      <option value="HOMEWORK">Homework</option>
                      <option value="ASSIGNMENT">Assignment</option>
                      <option value="QUIZ">Quiz</option>
                    </select>
                  </div>
                  <button onClick={sendHomework} disabled={hwSending || !hwTitle.trim()} className="btn-primary text-xs w-full py-2 flex items-center justify-center gap-1">
                    {hwSending ? "Assigning..." : <><Send className="w-3 h-3" /> Assign to {students.length} Students</>}
                  </button>
                  <div className="text-[9px] text-gray-400 border-t pt-2">
                    <p>For MCQ/math questions, use <strong>Polls &amp; Exams</strong> or <a href="/teacher/gradebook" className="text-brand-600 underline">Gradebook</a>.</p>
                  </div>
                </div>
              </>)}
            </div>
          )}
        </div>

        {/* Reading Indicator — shows when teacher or student is hearing read-aloud */}
        {isReading && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg z-50 flex items-center gap-2 animate-pulse">
            <Volume2 className="w-4 h-4" /> 🔊 Reading aloud...
            {!isTeacher ? null : <button onClick={stopReading} className="ml-2 underline text-[10px]">Stop</button>}
          </div>
        )}

        {/* Saved Boards Panel */}
        {showSavedBoards && isTeacher && savedBoards.length > 0 && (
          <div className="absolute bottom-4 right-80 w-56 max-h-[50%] bg-white rounded-xl shadow-2xl border z-50 overflow-y-auto">
            <div className="px-3 py-2 bg-blue-500 rounded-t-xl flex items-center justify-between">
              <span className="text-xs font-bold text-white">📂 Saved Boards</span>
              <button onClick={() => setShowSavedBoards(false)}><X className="w-3.5 h-3.5 text-white" /></button>
            </div>
            <div className="p-2 space-y-1.5">
              {savedBoards.map((sb, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer"
                  onClick={() => {
                    setBoardLines(sb.lines);
                    sb.lines.forEach((l: any) => post("board_write", { text: l.text, color: l.color }));
                    setShowSavedBoards(false);
                  }}>
                  <span className="text-xs">📋</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold">{sb.name}</p>
                    <p className="text-[8px] text-gray-400">{sb.lines.length} lines</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSavedBoards(prev => prev.filter((_, j) => j !== i)); }}
                    className="text-[8px] text-red-400 hover:text-red-600">✕</button>
                </div>
              ))}
              <p className="text-[8px] text-gray-400 text-center mt-1">⚠️ Saved locally — cleared when you leave</p>
            </div>
          </div>
        )}

        {/* KG Tools Panel — floating overlay */}
        {showKGTools && isKG && isTeacher && (
          <div className="absolute bottom-4 right-4 w-72 max-h-[60%] bg-white rounded-2xl shadow-2xl border-2 border-yellow-400 z-50 overflow-y-auto">
            <div className="px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-t-xl flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-900">🧒 KG Learning Tools</span>
              <button onClick={() => setShowKGTools(false)}><X className="w-3.5 h-3.5 text-yellow-900" /></button>
            </div>
            <div className="p-3 space-y-3">
              <p className="text-[10px] text-gray-500">Tap any item to write it on the board. Students will see it!</p>

              {/* Read Board Aloud */}
              <button onClick={() => readAloud()} className="w-full py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-200 flex items-center justify-center gap-2">
                <Volume2 className="w-4 h-4" /> 🔊 Read Board Aloud to Class
              </button>

              {/* ABC Alphabet */}
              <div>
                <p className="text-[10px] font-bold text-yellow-800 mb-1">🔤 Alphabet (tap to write & read)</p>
                <div className="flex flex-wrap gap-1">
                  {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                    <button key={letter} onClick={() => {
                      const text = `${letter} — ${letter.toLowerCase()}`;
                      setBoardLines((prev: any) => [...prev, { text, color: "#FFD700", time: Date.now(), id: Math.random().toString(36).slice(2) }]);
                      post("board_write", { text, color: "#FFD700" });
                      readAloud(`${letter}. ${letter} for ${
                        {A:"Apple",B:"Ball",C:"Cat",D:"Dog",E:"Elephant",F:"Fish",G:"Goat",H:"Hat",I:"Igloo",J:"Jug",K:"Kite",L:"Lion",M:"Mango",N:"Nest",O:"Orange",P:"Pen",Q:"Queen",R:"Rabbit",S:"Sun",T:"Tree",U:"Umbrella",V:"Van",W:"Water",X:"Xylophone",Y:"Yam",Z:"Zebra"}[letter] || letter
                      }`);
                    }}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-purple-400 text-white font-bold text-sm hover:scale-110 transition flex items-center justify-center">
                      {letter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numbers 0-20 */}
              <div>
                <p className="text-[10px] font-bold text-yellow-800 mb-1">🔢 Numbers (tap to write & read)</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from({length: 21}, (_, i) => i).map((num) => (
                    <button key={num} onClick={() => {
                      const text = `${num}`;
                      setBoardLines((prev: any) => [...prev, { text, color: "#00BFFF", time: Date.now(), id: Math.random().toString(36).slice(2) }]);
                      post("board_write", { text, color: "#00BFFF" });
                      readAloud(`${num}`);
                    }}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 text-white font-bold text-xs hover:scale-110 transition flex items-center justify-center">
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <p className="text-[10px] font-bold text-yellow-800 mb-1">🎨 Colors (tap to teach)</p>
                <div className="flex flex-wrap gap-1">
                  {[
                    {name:"Red",hex:"#FF0000"},{name:"Blue",hex:"#0000FF"},{name:"Green",hex:"#008000"},
                    {name:"Yellow",hex:"#FFD700"},{name:"Orange",hex:"#FFA500"},{name:"Purple",hex:"#800080"},
                    {name:"Pink",hex:"#FF69B4"},{name:"Brown",hex:"#8B4513"},{name:"Black",hex:"#000000"},
                    {name:"White",hex:"#FFFFFF"},{name:"Grey",hex:"#808080"},
                  ].map((c) => (
                    <button key={c.name} onClick={() => {
                      setBoardLines((prev: any) => [...prev, { text: `🎨 ${c.name}`, color: c.hex, time: Date.now(), id: Math.random().toString(36).slice(2) }]);
                      post("board_write", { text: `🎨 ${c.name}`, color: c.hex });
                      readAloud(`This color is ${c.name}`);
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold hover:scale-105 transition border-2"
                    style={{ backgroundColor: c.hex, color: ["#FFD700","#FFFFFF","#FF69B4","#FFA500"].includes(c.hex) ? "#333" : "#FFF", borderColor: c.hex === "#FFFFFF" ? "#ccc" : c.hex }}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shapes */}
              <div>
                <p className="text-[10px] font-bold text-yellow-800 mb-1">🔷 Shapes (tap to teach)</p>
                <div className="flex flex-wrap gap-1">
                  {[
                    {shape:"⭕",name:"Circle"},{shape:"⬜",name:"Square"},{shape:"🔺",name:"Triangle"},
                    {shape:"⬟",name:"Pentagon"},{shape:"⭐",name:"Star"},{shape:"💎",name:"Diamond"},
                    {shape:"🟢",name:"Sphere"},{shape:"📦",name:"Cube"},{shape:"🔻",name:"Cone"},
                  ].map((s) => (
                    <button key={s.name} onClick={() => {
                      setBoardLines((prev: any) => [...prev, { text: `${s.shape} ${s.name}`, color: "#FFD700", time: Date.now(), id: Math.random().toString(36).slice(2) }]);
                      post("board_write", { text: `${s.shape} ${s.name}`, color: "#FFD700" });
                      readAloud(`This shape is called a ${s.name}`);
                    }}
                    className="px-2 py-1 rounded-lg bg-pink-100 text-pink-800 text-xs font-bold hover:bg-pink-200 transition">
                      {s.shape} {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Phrases */}
              <div>
                <p className="text-[10px] font-bold text-yellow-800 mb-1">🎤 Read Aloud Phrases</p>
                <div className="space-y-1">
                  {[
                    "A B C D E F G, H I J K L M N O P, Q R S T U V, W X Y and Z. Now I know my ABCs, next time won't you sing with me!",
                    "1, 2, 3, 4, 5. Once I caught a fish alive. 6, 7, 8, 9, 10. Then I let it go again!",
                    "Good morning class! Are you ready to learn today?",
                    "Let us read together. Repeat after me.",
                    "Very good! Well done everyone! You are all very smart!",
                    "Can anyone tell me what this is?",
                  ].map((phrase, i) => (
                    <button key={i} onClick={() => readAloud(phrase)}
                      className="w-full text-left text-[10px] px-2 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition truncate">
                      🔊 {phrase.slice(0, 60)}{phrase.length > 60 ? "..." : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Read Aloud */}
              <div>
                <p className="text-[10px] font-bold text-yellow-800 mb-1">✏️ Type & Read Aloud</p>
                <div className="flex gap-1">
                  <input className="input-field text-xs flex-1 py-1" placeholder="Type anything to read aloud..."
                    onKeyDown={(e) => { if (e.key === "Enter") { readAloud((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; }}} />
                  <button onClick={(e) => {
                    const input = (e.target as HTMLElement).parentElement?.querySelector("input") as HTMLInputElement;
                    if (input?.value) { readAloud(input.value); input.value = ""; }
                  }} className="px-2 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold">🔊</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student KG Read-Aloud button */}
        {isKG && !isTeacher && (
          <div className="absolute bottom-4 right-4 z-40">
            <button onClick={() => readAloud(boardLines.map((l: any) => l.text).join(". "))}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg hover:scale-110 transition flex items-center justify-center"
              title="Read what is on the board">
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Exam question countdown timer
function ExamTimer({ timeLimitSec, startedAt, onExpire }: { timeLimitSec: number; startedAt: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(timeLimitSec);
  useEffect(() => {
    const calc = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const rem = Math.max(0, timeLimitSec - elapsed);
      setRemaining(rem);
      if (rem <= 0) onExpire();
    };
    calc();
    const i = setInterval(calc, 1000);
    return () => clearInterval(i);
  }, [timeLimitSec, startedAt, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const urgent = remaining <= 10;

  return (
    <div className={`flex items-center gap-2 mb-2 ${urgent ? "animate-pulse" : ""}`}>
      <div className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${urgent ? "bg-red-500 text-white" : "bg-gray-200 text-gray-800"}`}>
        ⏱ {mins}:{String(secs).padStart(2, "0")}
      </div>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${urgent ? "bg-red-500" : "bg-indigo-500"}`}
          style={{ width: `${(remaining / timeLimitSec) * 100}%` }} />
      </div>
    </div>
  );
}
