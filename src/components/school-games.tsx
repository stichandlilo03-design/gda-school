"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ============================
// GAME DATA
// ============================
const WORD_LISTS: Record<string, string[]> = {
  easy: ["CAT","DOG","SUN","RUN","FUN","CUP","HAT","BAT","PEN","RED","BIG","TOP","MAP","BUS","NET","BOX","JAR","FAN","LOG","HEN","PIG","FOX","OWL","BEE","ANT"],
  medium: ["SCHOOL","TEACHER","PLANET","GARDEN","ANIMAL","BRIDGE","CASTLE","FLOWER","ROCKET","FAMILY","JUNGLE","SUNSET","WINDOW","MIRROR","BASKET","TICKET","AUTUMN","CANDLE","FROZEN","SILVER"],
  hard: ["EDUCATION","KNOWLEDGE","DISCOVERY","ADVENTURE","WONDERFUL","IMPORTANT","BEAUTIFUL","DELICIOUS","ALGORITHM","CHEMISTRY","TELESCOPE","CONTINENT","GYMNASIUM","DANGEROUS","DETECTIVE","FURNITURE"],
};
const MATH_OPS = ["+","-","×"];
const SPELLING_WORDS: Record<string,{word:string;hint:string}[]> = {
  easy:[{word:"APPLE",hint:"A red fruit"},{word:"HAPPY",hint:"Feeling of joy"},{word:"WATER",hint:"You drink this"},{word:"GREEN",hint:"Color of grass"},{word:"LIGHT",hint:"Opposite of dark"},{word:"MUSIC",hint:"You hear this"},{word:"HOUSE",hint:"You live here"},{word:"BREAD",hint:"Baked food"},{word:"TABLE",hint:"Furniture to eat on"},{word:"CHAIR",hint:"You sit on this"}],
  medium:[{word:"BECAUSE",hint:"Giving a reason"},{word:"RECEIVE",hint:"To get something"},{word:"BELIEVE",hint:"To think true"},{word:"LIBRARY",hint:"Place with books"},{word:"SCIENCE",hint:"Study of nature"},{word:"WEATHER",hint:"Rain or sun"},{word:"TROUBLE",hint:"A problem"},{word:"COUNTRY",hint:"Like Nigeria or Kenya"},{word:"MORNING",hint:"Start of day"},{word:"TONIGHT",hint:"This evening"}],
  hard:[{word:"NECESSARY",hint:"Something needed"},{word:"BEAUTIFUL",hint:"Very pretty"},{word:"DIFFERENT",hint:"Not the same"},{word:"GOVERNMENT",hint:"Rules a country"},{word:"ENVIRONMENT",hint:"Nature around us"},{word:"RESTAURANT",hint:"Place to eat"},{word:"TELEVISION",hint:"Screen at home"},{word:"PHOTOGRAPH",hint:"A picture"},{word:"DICTIONARY",hint:"Book of words"},{word:"APPRECIATE",hint:"To be grateful"}],
};

const ALL_QUIZ_QUESTIONS = [
  {q:"What planet is closest to the Sun?",opts:["Venus","Mercury","Mars","Earth"],ans:1},
  {q:"How many sides does a hexagon have?",opts:["5","6","7","8"],ans:1},
  {q:"What is the largest ocean?",opts:["Atlantic","Indian","Pacific","Arctic"],ans:2},
  {q:"What gas do plants breathe in?",opts:["Oxygen","Nitrogen","CO₂","Helium"],ans:2},
  {q:"How many continents are there?",opts:["5","6","7","8"],ans:2},
  {q:"What is 12 × 12?",opts:["124","144","132","156"],ans:1},
  {q:"Which animal is the tallest?",opts:["Elephant","Horse","Giraffe","Camel"],ans:2},
  {q:"What color is an emerald?",opts:["Blue","Red","Green","Yellow"],ans:2},
  {q:"How many legs does a spider have?",opts:["6","8","10","12"],ans:1},
  {q:"What is the capital of France?",opts:["London","Berlin","Madrid","Paris"],ans:3},
  {q:"Which planet is the Red Planet?",opts:["Venus","Mars","Jupiter","Saturn"],ans:1},
  {q:"What is the largest mammal?",opts:["Elephant","Blue Whale","Giraffe","Hippo"],ans:1},
  {q:"How many days in a leap year?",opts:["364","365","366","367"],ans:2},
  {q:"What is the hardest natural substance?",opts:["Gold","Iron","Diamond","Platinum"],ans:2},
  {q:"Which organ pumps blood?",opts:["Brain","Lungs","Heart","Liver"],ans:2},
  {q:"What is 7 × 8?",opts:["54","56","58","64"],ans:1},
  {q:"Boiling point of water in °C?",opts:["90","95","100","110"],ans:2},
  {q:"How many bones in a human body?",opts:["106","206","306","186"],ans:1},
  {q:"Which gas do we breathe to live?",opts:["CO₂","Nitrogen","Oxygen","Hydrogen"],ans:2},
  {q:"Square root of 144?",opts:["10","11","12","14"],ans:2},
  {q:"Sahara Desert is in which continent?",opts:["Asia","Africa","Australia","S. America"],ans:1},
  {q:"What does CPU stand for?",opts:["Central Processing Unit","Computer Personal Unit","Central Power Unit","Core Processing Unit"],ans:0},
  {q:"Which country has the most people?",opts:["USA","India","China","Brazil"],ans:1},
  {q:"How many minutes in 2 hours?",opts:["100","120","140","160"],ans:1},
  {q:"Chemical symbol for water?",opts:["O₂","H₂O","CO₂","NaCl"],ans:1},
  {q:"Longest river in Africa?",opts:["Congo","Niger","Nile","Zambezi"],ans:2},
  {q:"What shape has 3 sides?",opts:["Square","Circle","Triangle","Pentagon"],ans:2},
  {q:"What is 25% of 200?",opts:["25","50","75","100"],ans:1},
  {q:"How many planets in our solar system?",opts:["7","8","9","10"],ans:1},
  {q:"King of the Jungle?",opts:["Tiger","Elephant","Lion","Bear"],ans:2},
  {q:"What is the largest continent?",opts:["Africa","N. America","Europe","Asia"],ans:3},
  {q:"How many zeros in one million?",opts:["5","6","7","8"],ans:1},
  {q:"Which vitamin from sunlight?",opts:["Vitamin A","Vitamin B","Vitamin C","Vitamin D"],ans:3},
  {q:"What is 15 × 15?",opts:["200","215","225","250"],ans:2},
  {q:"Which animal can fly?",opts:["Penguin","Ostrich","Eagle","Dolphin"],ans:2},
  {q:"Freezing point of water?",opts:["-10°C","0°C","10°C","32°C"],ans:1},
  {q:"How many weeks in a year?",opts:["48","50","52","54"],ans:2},
  {q:"Smallest prime number?",opts:["0","1","2","3"],ans:2},
  {q:"Which instrument has 88 keys?",opts:["Guitar","Piano","Violin","Drum"],ans:1},
  {q:"What is 3³?",opts:["9","18","27","81"],ans:2},
  {q:"Which blood type is universal donor?",opts:["A","B","AB","O"],ans:3},
  {q:"Main language in Brazil?",opts:["Spanish","English","Portuguese","French"],ans:2},
  {q:"How many teeth does an adult have?",opts:["28","30","32","34"],ans:2},
  {q:"Capital of Kenya?",opts:["Lagos","Nairobi","Accra","Kampala"],ans:1},
  {q:"Chemical element Fe is?",opts:["Fluorine","Francium","Iron","Lead"],ans:2},
  {q:"What is 1000 ÷ 8?",opts:["120","125","130","135"],ans:1},
  {q:"How many sides on a pentagon?",opts:["4","5","6","7"],ans:1},
  {q:"Biggest bird in the world?",opts:["Eagle","Ostrich","Penguin","Hawk"],ans:1},
  {q:"What is the capital of Egypt?",opts:["Cairo","Accra","Lagos","Nairobi"],ans:0},
  {q:"How many hours in a day?",opts:["12","20","24","36"],ans:2},
];

function shuffle<T>(arr: T[]): T[] { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }

// PURE win checker — no setState inside!
const TTT_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function checkWin(b: (string|null)[]): { winner: string|null; line: number[] } {
  for (const l of TTT_LINES) {
    if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { winner: b[l[0]], line: l };
  }
  if (b.every(Boolean)) return { winner: "draw", line: [] };
  return { winner: null, line: [] };
}

// ============================
// CLASS TIME CHECK
// ============================
function useClassTimeCheck(todaySlots: {startTime:string;endTime:string}[]) {
  const [blocked, setBlocked] = useState(false);
  const [nextBreak, setNextBreak] = useState("");
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2,"0");
      const mm = now.getMinutes().toString().padStart(2,"0");
      const nowStr = `${hh}:${mm}`;
      let found = false;
      for (const s of todaySlots) {
        if (nowStr >= s.startTime && nowStr < s.endTime) { found = true; setNextBreak(s.endTime); break; }
      }
      setBlocked(found);
    };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [todaySlots]);
  return { blocked, nextBreak };
}

// ============================
// MULTIPLAYER HOOK — fast polling + 10s timeout
// ============================
function useMultiplayer(userId: string) {
  const [online, setOnline] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [inviteStatus, setInviteStatus] = useState<"idle"|"waiting"|"timeout"|"accepted">("idle");
  const inviteTimer = useRef<any>(null);

  const api = useCallback(async (method: string, params: any) => {
    try {
      if (method === "GET") {
        const r = await fetch(`/api/games?${new URLSearchParams(params)}`);
        return r.ok ? await r.json() : null;
      }
      const r = await fetch("/api/games", { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(params) });
      return r.ok ? await r.json() : null;
    } catch (_e) { return null; }
  }, []);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (!active) return;
      const d = await api("GET", { action: "heartbeat" });
      if (d) { setOnline(d.online || []); setInvites(d.invites || []); if (d.activeRoom?.status === "playing") { setActiveRoom(d.activeRoom); setInviteStatus("accepted"); } }
      if (active) setTimeout(poll, 2000);
    };
    poll();
    return () => { active = false; };
  }, [api]);

  useEffect(() => {
    if (!activeRoom?.id) { setRoomData(null); return; }
    let active = true;
    const poll = async () => {
      if (!active) return;
      const d = await api("GET", { action: "poll_room", roomId: activeRoom.id });
      if (d && !d.error) { setRoomData(d); if (d.status === "playing") setInviteStatus("accepted"); }
      if (active) setTimeout(poll, 500);
    };
    poll();
    return () => { active = false; };
  }, [activeRoom?.id, api]);

  const invite = async (guestUserId: string, game: string) => {
    setInviteStatus("waiting");
    const d = await api("POST", { action: "invite", guestUserId, game });
    if (d?.roomId) {
      setActiveRoom({ id: d.roomId });
      clearTimeout(inviteTimer.current);
      inviteTimer.current = setTimeout(async () => {
        const check = await api("GET", { action: "poll_room", roomId: d.roomId });
        if (check?.status === "waiting") {
          await api("POST", { action: "leave", roomId: d.roomId });
          setActiveRoom(null); setRoomData(null); setInviteStatus("timeout");
          setTimeout(() => setInviteStatus("idle"), 3000);
        }
      }, 10000);
    }
  };
  const accept = async (roomId: string) => { const d = await api("POST", { action: "accept", roomId }); if (d?.room) { setActiveRoom(d.room); setInviteStatus("accepted"); } };
  const decline = async (roomId: string) => { await api("POST", { action: "decline", roomId }); };
  const move = async (roomId: string, mv: any) => { const d = await api("POST", { action: "move", roomId, move: mv }); if (d?.room) setRoomData(d.room); };
  const leave = async (roomId: string) => { clearTimeout(inviteTimer.current); await api("POST", { action: "leave", roomId }); setActiveRoom(null); setRoomData(null); setInviteStatus("idle"); };
  return { online, invites, activeRoom, roomData, inviteStatus, invite, accept, decline, move, leave };
}

// ============================
// ONLINE TIC TAC TOE
// ============================
function OnlineTicTacToe({ room, myUserId, onMove, onLeave }: { room: any; myUserId: string; onMove: (m: any) => void; onLeave: () => void }) {
  if (!room) return null;
  const board = room.state?.board || Array(9).fill(null);
  const isHost = room.hostId === myUserId;
  const myMark = isHost ? "X" : "O";
  const isMyTurn = room.turn === myUserId;
  const finished = room.status === "finished";
  const winner = room.winner;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-blue-600">❌ {room.hostName}</span>
        <span className="text-xs text-gray-400">vs</span>
        <span className="text-xs font-bold text-red-600">⭕ {room.guestName}</span>
        <button onClick={onLeave} className="text-[10px] text-gray-400 hover:text-red-500 ml-2">Leave</button>
      </div>
      {finished ? (
        <div className={`py-3 rounded-xl font-bold text-base text-center ${winner===myUserId?"bg-emerald-100 text-emerald-700":winner==="draw"?"bg-gray-100 text-gray-700":"bg-red-100 text-red-700"}`}>
          {winner===myUserId?"🎉 You Won!":winner==="draw"?"🤝 Draw!":"😔 You Lost"}
        </div>
      ) : (
        <div className={`text-sm font-bold py-2 rounded-xl text-center ${isMyTurn?"bg-emerald-50 text-emerald-700":"bg-gray-50 text-gray-500"}`}>
          {isMyTurn ? "🎯 Your turn!" : "⏳ Opponent thinking..."}
        </div>
      )}
      <div className="grid grid-cols-3 gap-3 max-w-[300px] mx-auto">
        {board.map((cell: string|null, i: number) => (
          <button key={i}
            onClick={() => { if (isMyTurn && !cell && !finished) onMove({ index: i }); }}
            style={{touchAction:"manipulation", WebkitTapHighlightColor:"transparent"}}
            className={`w-full aspect-square rounded-2xl text-4xl font-black flex items-center justify-center select-none transition-transform
              ${cell==="X" ? "bg-blue-100 text-blue-600 border-2 border-blue-300" :
                cell==="O" ? "bg-red-100 text-red-600 border-2 border-red-300" :
                isMyTurn && !finished ? "bg-white border-2 border-gray-200 active:bg-emerald-50 active:scale-90 cursor-pointer" :
                "bg-gray-50 border-2 border-gray-100"}`}>
            {cell==="X"?"❌":cell==="O"?"⭕":""}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================
// TIC TAC TOE SOLO — FIXED: no setState during render
// ============================
function TicTacToe() {
  // ALL state — winner is tracked as state, NEVER derived from a function call during render
  const [board, setBoard] = useState<(string|null)[]>(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [mode, setMode] = useState<"menu"|"vs_ai"|"vs_local">("menu");
  const [scores, setScores] = useState({ x: 0, o: 0, draw: 0 });
  const [aiDiff, setAiDiff] = useState<"easy"|"hard">("easy");
  const [winLine, setWinLine] = useState<number[]>([]);
  const [winner, setWinner] = useState<string|null>(null);
  const winnerRef = useRef<string|null>(null); // ref mirror to avoid stale closures

  // Handle a win result — safe to call from event handlers only
  const handleWin = (result: { winner: string|null; line: number[] }) => {
    if (!result.winner) return false;
    setWinner(result.winner);
    winnerRef.current = result.winner;
    setWinLine(result.line);
    if (result.winner === "draw") setScores(s => ({...s, draw: s.draw+1}));
    else if (result.winner === "X") setScores(s => ({...s, x: s.x+1}));
    else setScores(s => ({...s, o: s.o+1}));
    return true;
  };

  const getAiMove = (b: (string|null)[], diff: string) => {
    const empty = b.map((v,i) => v===null?i:-1).filter(i=>i>=0);
    if (!empty.length) return -1;
    if (diff === "hard") {
      for (const i of empty) { const t=[...b]; t[i]="O"; if (checkWin(t).winner==="O") return i; }
      for (const i of empty) { const t=[...b]; t[i]="X"; if (checkWin(t).winner==="X") return i; }
      if (empty.includes(4)) return 4;
      const c = [0,2,6,8].filter(i => empty.includes(i));
      if (c.length) return c[Math.floor(Math.random()*c.length)];
    }
    return empty[Math.floor(Math.random()*empty.length)];
  };

  // ALL game logic is INLINE here — no useCallback, no stale closures
  const handleClick = (idx: number) => {
    if (board[idx] || winnerRef.current) return;
    if (mode === "vs_ai" && !isX) return;

    // Place mark
    const nb = [...board];
    nb[idx] = isX ? "X" : "O";
    setBoard(nb);

    // Check for win
    const result = checkWin(nb);
    if (handleWin(result)) return; // game over

    if (mode === "vs_ai") {
      // AI responds after tiny delay
      setIsX(false);
      setTimeout(() => {
        if (winnerRef.current) return;
        const aim = getAiMove(nb, aiDiff);
        if (aim >= 0) {
          const ab = [...nb]; ab[aim] = "O"; setBoard(ab);
          const r2 = checkWin(ab);
          if (!handleWin(r2)) setIsX(true);
        }
      }, 150); // fast AI response
    } else {
      setIsX(!isX);
    }
  };

  const reset = () => { setBoard(Array(9).fill(null)); setIsX(true); setWinLine([]); setWinner(null); winnerRef.current = null; };

  if (mode === "menu") return (
    <div className="text-center space-y-4 py-4">
      <div className="text-6xl animate-bounce">❌⭕</div>
      <h3 className="text-lg font-bold">Tic Tac Toe</h3>
      <div className="space-y-2 max-w-xs mx-auto">
        <button onClick={() => { setMode("vs_ai"); setAiDiff("easy"); reset(); }} className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold text-base active:scale-95 transition" style={{touchAction:"manipulation"}}>🤖 Easy Computer</button>
        <button onClick={() => { setMode("vs_ai"); setAiDiff("hard"); reset(); }} className="w-full py-4 bg-purple-500 text-white rounded-xl font-bold text-base active:scale-95 transition" style={{touchAction:"manipulation"}}>🧠 Hard Computer</button>
        <button onClick={() => { setMode("vs_local"); reset(); }} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold text-base active:scale-95 transition" style={{touchAction:"manipulation"}}>👫 2 Players</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => { setMode("menu"); reset(); setScores({x:0,o:0,draw:0}); }} className="text-sm text-gray-500 font-medium">← Back</button>
        <div className="flex gap-4 text-sm font-bold">
          <span className="text-blue-600">X: {scores.x}</span>
          <span className="text-gray-400">D: {scores.draw}</span>
          <span className="text-red-600">O: {scores.o}</span>
        </div>
      </div>
      {winner ? (
        <div className={`text-center py-3 rounded-2xl font-bold text-lg animate-bounce ${winner==="draw"?"bg-gray-100 text-gray-700":"bg-emerald-100 text-emerald-700"}`}>
          {winner === "draw" ? "🤝 Draw!" : `${winner==="X"?"❌":"⭕"} ${winner} Wins! 🎉`}
        </div>
      ) : (
        <div className="text-center text-base font-bold py-1">{isX ? "❌ X plays" : "⭕ O plays"}{mode==="vs_ai"&&!isX?" 🤔":""}</div>
      )}
      <div className="grid grid-cols-3 gap-3 max-w-[300px] mx-auto">
        {board.map((cell, i) => (
          <button key={i} onClick={() => handleClick(i)}
            style={{touchAction:"manipulation", WebkitTapHighlightColor:"transparent"}}
            className={`w-full aspect-square rounded-2xl text-4xl font-black flex items-center justify-center select-none transition-transform
              ${winLine.includes(i) && winner ? "ring-4 ring-yellow-400 scale-110 bg-yellow-50" : ""}
              ${cell==="X" ? "bg-blue-100 text-blue-600 border-2 border-blue-300" :
                cell==="O" ? "bg-red-100 text-red-600 border-2 border-red-300" :
                !winner ? "bg-white border-2 border-gray-200 active:bg-gray-100 active:scale-90 cursor-pointer" :
                "bg-gray-50 border-2 border-gray-100"}`}>
            {cell==="X"?"❌":cell==="O"?"⭕":""}
          </button>
        ))}
      </div>
      {winner && <button onClick={reset} style={{touchAction:"manipulation"}} className="w-full py-3.5 bg-gray-800 text-white rounded-xl font-bold text-base active:scale-95">🔄 Play Again</button>}
    </div>
  );
}

// ============================
// WORD FILL
// ============================
function WordFill() {
  const [diff, setDiff] = useState<"easy"|"medium"|"hard">("easy");
  const usedRef = useRef<Set<string>>(new Set());
  const [word, setWord] = useState("");
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const maxWrong = 6;

  const newWord = useCallback((d: string) => {
    const list = WORD_LISTS[d] || WORD_LISTS.easy;
    const avail = list.filter(w => !usedRef.current.has(w));
    const pool = avail.length > 0 ? avail : list;
    if (avail.length === 0) usedRef.current.clear();
    const w = pool[Math.floor(Math.random() * pool.length)];
    usedRef.current.add(w);
    setWord(w); setGuessed(new Set()); setWrong(0);
  }, []);

  useEffect(() => { newWord(diff); }, [diff, newWord]);

  const display = word.split("").map(l => guessed.has(l) ? l : "_");
  const won = word.length > 0 && display.every(c => c !== "_");
  const lost = wrong >= maxWrong;

  const guess = (l: string) => {
    if (won || lost || guessed.has(l)) return;
    const ng = new Set(guessed); ng.add(l); setGuessed(ng);
    if (!word.includes(l)) setWrong(w => w + 1);
  };

  const wonHandled = useRef(false);
  useEffect(() => {
    if (won && !wonHandled.current) {
      wonHandled.current = true;
      setScore(s => s + (diff==="hard"?30:diff==="medium"?20:10));
      setStreak(s => s + 1);
    }
    if (lost && !wonHandled.current) { wonHandled.current = true; setStreak(0); }
    // Reset when starting new word
    if (!won && !lost) wonHandled.current = false;
  }, [won, lost]); // eslint-disable-line

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">{(["easy","medium","hard"] as const).map(d => (
          <button key={d} onClick={() => { setDiff(d); usedRef.current.clear(); }} className={`text-xs px-3 py-1.5 rounded-lg font-bold ${diff===d?"bg-brand-500 text-white":"bg-gray-100"}`}>{d}</button>
        ))}</div>
        <div className="text-sm font-bold">⭐ {score} 🔥 {streak}</div>
      </div>
      <div className="text-center py-3">
        <div className="flex justify-center gap-1 mb-3">{Array(maxWrong).fill(0).map((_, i) => <div key={i} className={`w-5 h-5 rounded-full transition-all ${i<wrong?"bg-red-400 scale-110":"bg-gray-200"}`} />)}</div>
        <div className="text-3xl font-mono tracking-[0.7em] font-black mb-1">{display.join("")}</div>
        <div className="text-xs text-gray-400">{word.length} letters · {maxWrong-wrong} tries left</div>
        {won && <div className="mt-3 text-emerald-600 font-bold text-base animate-bounce">🎉 Correct! +{diff==="hard"?30:diff==="medium"?20:10}</div>}
        {lost && <div className="mt-3 text-red-600 font-bold text-base">💀 Answer: {word}</div>}
      </div>
      {!won && !lost ? (
        <div className="flex flex-wrap gap-1.5 justify-center">{
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => (
            <button key={l} onClick={() => guess(l)} disabled={guessed.has(l)}
              style={{touchAction:"manipulation"}} className={`w-9 h-9 rounded-lg text-sm font-bold transition active:scale-90 ${
                guessed.has(l) ? (word.includes(l) ? "bg-emerald-200 text-emerald-800" : "bg-red-200 text-red-800 opacity-40") :
                "bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-brand-300 shadow-sm active:bg-gray-100"}`}>
              {l}
            </button>
          ))}</div>
      ) : (
        <button onClick={() => newWord(diff)} className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold text-sm active:scale-95">Next Word →</button>
      )}
    </div>
  );
}

// ============================
// MATH CHALLENGE
// ============================
function MathChallenge() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [qText, setQText] = useState("");
  const [qAnswer, setQAnswer] = useState(0);
  const [input, setInput] = useState("");
  const [fb, setFb] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameOver, setGameOver] = useState(false);
  const [total, setTotal] = useState(0);
  const [combo, setCombo] = useState(0);
  const usedRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<any>(null);

  const genQ = useCallback((lv: number) => {
    let attempts = 0, text = "", answer = 0;
    do {
      const max = lv <= 3 ? 10 : lv <= 6 ? 50 : 100;
      const op = MATH_OPS[Math.floor(Math.random() * Math.min(lv, 3))];
      let a = Math.floor(Math.random() * max) + 1, b = Math.floor(Math.random() * max) + 1;
      if (op === "-" && a < b) [a, b] = [b, a];
      text = `${a} ${op} ${b} = ?`;
      answer = op === "+" ? a+b : op === "-" ? a-b : a*b;
      attempts++;
    } while (usedRef.current.has(text) && attempts < 50);
    usedRef.current.add(text);
    return { text, answer };
  }, []);

  const nextQ = useCallback((lv: number) => {
    const q = genQ(lv);
    setQText(q.text); setQAnswer(q.answer);
    setTimeLeft(Math.max(8, 18 - lv));
  }, [genQ]);

  useEffect(() => { nextQ(level); }, [level, nextQ]);

  useEffect(() => {
    if (gameOver) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          setLives(l => { if (l <= 1) setGameOver(true); return l - 1; });
          setFb("⏰ Time!"); setCombo(0); nextQ(level);
          return Math.max(8, 18 - level);
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameOver, level, nextQ]);

  const submit = () => {
    const ans = parseInt(input);
    if (isNaN(ans)) return;
    setTotal(t => t + 1);
    if (ans === qAnswer) {
      const c = combo + 1; setCombo(c);
      const pts = level * 10 * (c >= 5 ? 3 : c >= 3 ? 2 : 1);
      setScore(s => s + pts);
      setFb(`✅ +${pts}${c >= 3 ? ` 🔥x${c}` : ""}`);
      if ((total + 1) % 5 === 0) setLevel(l => l + 1);
    } else {
      setLives(l => { if (l <= 1) setGameOver(true); return l - 1; });
      setFb(`❌ ${qAnswer}`); setCombo(0);
    }
    setInput("");
    nextQ(level);
  };

  if (gameOver) return (
    <div className="text-center py-6 space-y-3">
      <div className="text-5xl">🏆</div><h3 className="text-lg font-bold">Game Over!</h3>
      <p className="text-3xl font-black text-brand-600">{score}</p>
      <p className="text-sm text-gray-500">Level {level} · {total} answered</p>
      <button onClick={() => { setScore(0); setLives(3); setLevel(1); setTotal(0); setGameOver(false); setFb(""); setCombo(0); usedRef.current.clear(); nextQ(1); }} className="px-6 py-2.5 bg-gray-800 text-white rounded-xl font-bold active:scale-95">Play Again</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-bold">
        <span>Lv.{level}</span>
        {combo >= 3 && <span className="text-orange-500 animate-pulse">🔥 x{combo}</span>}
        <span>⭐ {score}</span>
        <span>{"❤️".repeat(lives)}{"🖤".repeat(3 - lives)}</span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full transition-all rounded-full ${timeLeft <= 3 ? "bg-red-500 animate-pulse" : "bg-brand-500"}`} style={{ width: `${(timeLeft / Math.max(8, 18-level)) * 100}%` }} /></div>
      <div className="text-center">
        <div className="text-4xl font-black py-4">{qText}</div>
        {fb && <div className={`text-sm font-bold ${fb.includes("✅") ? "text-emerald-600" : "text-red-600"}`}>{fb}</div>}
      </div>
      <div className="flex gap-2">
        <input type="number" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
          className="flex-1 text-center text-2xl font-bold border-2 rounded-xl py-3 focus:border-brand-500 outline-none" placeholder="?" autoFocus />
        <button onClick={submit} className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold text-lg active:scale-95">Go!</button>
      </div>
    </div>
  );
}

// ============================
// SPELLING BEE
// ============================
function SpellingBee() {
  const [diff, setDiff] = useState<"easy"|"medium"|"hard">("easy");
  const words = useMemo(() => shuffle(SPELLING_WORDS[diff] || SPELLING_WORDS.easy), [diff]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<{word:string;correct:boolean}[]>([]);
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const current = words[idx];

  const speak = (w: string) => { if (typeof window !== "undefined" && window.speechSynthesis) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(w); u.rate = 0.8; window.speechSynthesis.speak(u); } };
  const submit = () => { const ok = input.toUpperCase().trim() === current.word; if (ok) setScore(s => s + (diff==="hard"?30:diff==="medium"?20:10)); setResults(r => [...r, { word: current.word, correct: ok }]); setShow(true); };
  const next = () => { setShow(false); setInput(""); if (idx + 1 >= words.length) setDone(true); else setIdx(i => i + 1); };
  const restart = () => { setIdx(0); setInput(""); setScore(0); setResults([]); setShow(false); setDone(false); };

  if (done) return (
    <div className="text-center py-6 space-y-3">
      <div className="text-5xl">🐝</div><h3 className="text-lg font-bold">Complete!</h3>
      <p className="text-2xl font-black text-brand-600">{score}</p>
      <p className="text-sm text-gray-500">{results.filter(r => r.correct).length}/{results.length} correct</p>
      <div className="flex flex-wrap gap-1 justify-center">{results.map((r, i) => <span key={i} className={`text-xs px-2 py-1 rounded-full font-bold ${r.correct?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{r.correct?"✅":"❌"} {r.word}</span>)}</div>
      <button onClick={restart} className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold">Again</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">{(["easy","medium","hard"] as const).map(d => (<button key={d} onClick={() => { setDiff(d); restart(); }} className={`text-xs px-3 py-1.5 rounded-lg font-bold ${diff===d?"bg-amber-500 text-white":"bg-gray-100"}`}>{d}</button>))}</div>
        <span className="text-sm font-bold">⭐ {score} · {idx + 1}/{words.length}</span>
      </div>
      <div className="text-center py-3">
        <div className="text-5xl mb-2">🐝</div>
        <p className="text-sm text-gray-500 mb-2">Hint: <strong className="text-gray-700">{current.hint}</strong></p>
        <button onClick={() => speak(current.word)} className="px-5 py-2.5 bg-amber-100 text-amber-800 rounded-xl text-sm font-bold active:scale-95 mb-3">🔊 Hear Word</button>
        {show ? (
          <div className={`py-3 rounded-xl font-bold text-base ${results[results.length-1]?.correct?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>
            {results[results.length-1]?.correct ? "✅ Correct!" : "❌ Was: " + current.word}
          </div>
        ) : (
          <div className="flex gap-2 max-w-xs mx-auto">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
              className="flex-1 text-center text-lg font-bold border-2 rounded-xl py-2.5 uppercase tracking-wider focus:border-amber-500 outline-none" placeholder="Spell it..." autoFocus />
            <button onClick={submit} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl font-bold active:scale-95">✓</button>
          </div>
        )}
      </div>
      {show && <button onClick={next} className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold text-sm">{idx + 1 >= words.length ? "See Results" : "Next →"}</button>}
    </div>
  );
}

// ============================
// MEMORY MATCH
// ============================
function MemoryMatch() {
  const emojis = ["🍎","🍊","🍋","🍇","🍉","🍓","🌟","🎈"];
  const [cards, setCards] = useState<{emoji:string;flipped:boolean;matched:boolean}[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [best, setBest] = useState(999);

  const init = useCallback(() => {
    setCards(shuffle([...emojis,...emojis]).map(e => ({emoji:e, flipped:false, matched:false})));
    setFlipped([]); setMoves(0); setMatches(0);
  }, []);
  useEffect(() => { init(); }, [init]);

  const flip = (i: number) => {
    if (flipped.length >= 2 || cards[i].flipped || cards[i].matched) return;
    const nc = [...cards]; nc[i] = {...nc[i], flipped: true}; setCards(nc);
    const nf = [...flipped, i]; setFlipped(nf);
    if (nf.length === 2) {
      setMoves(m => m + 1);
      if (cards[nf[0]].emoji === nc[i].emoji) {
        setTimeout(() => {
          setCards(prev => prev.map((c, ci) => ci===nf[0]||ci===nf[1] ? {...c, matched: true} : c));
          setFlipped([]);
          setMatches(m => { const nm = m + 1; if (nm === emojis.length) setBest(b => Math.min(b, moves + 1)); return nm; });
        }, 300);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((c, ci) => ci===nf[0]||ci===nf[1] ? {...c, flipped: false} : c));
          setFlipped([]);
        }, 700);
      }
    }
  };

  const won = matches === emojis.length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-bold"><span>Moves: {moves}</span><span>{matches}/{emojis.length}</span>{best < 999 && <span>Best: {best}</span>}</div>
      {won && <div className="text-center py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-base animate-bounce">🎉 Won in {moves} moves!</div>}
      <div className="grid grid-cols-4 gap-2.5 max-w-[260px] mx-auto">{cards.map((c, i) => (
        <button key={i} onClick={() => flip(i)} disabled={c.flipped || c.matched}
          style={{touchAction:"manipulation"}} className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${
            c.flipped || c.matched ? "bg-white border-2 border-brand-300" : "bg-brand-500 hover:bg-brand-600 hover:scale-105 active:scale-95"}`}>
          {c.flipped || c.matched ? c.emoji : "?"}
        </button>
      ))}</div>
      {won && <button onClick={init} className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold text-sm">Play Again</button>}
    </div>
  );
}

// ============================
// QUICK QUIZ
// ============================
function QuickQuiz() {
  const questions = useMemo(() => shuffle(ALL_QUIZ_QUESTIONS).slice(0, 15), []);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number|null>(null);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(12);
  const current = questions[idx];
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (done || picked !== null) { clearInterval(timerRef.current); return; }
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(p => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          setPicked(-1); setStreak(0);
          setTimeout(() => { if (idx + 1 >= questions.length) setDone(true); else { setIdx(j => j + 1); setPicked(null); setTimer(12); } }, 1500);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [idx, done, picked, questions.length]);

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === current.ans) { setScore(s => s + (streak >= 4 ? 30 : streak >= 2 ? 20 : 10)); setStreak(s => s + 1); } else setStreak(0);
    setTimeout(() => { if (idx + 1 >= questions.length) setDone(true); else { setIdx(j => j + 1); setPicked(null); setTimer(12); } }, 1200);
  };

  const restart = () => { setIdx(0); setScore(0); setPicked(null); setDone(false); setStreak(0); setTimer(12); };

  if (done) return (
    <div className="text-center py-6 space-y-3">
      <div className="text-5xl">🧠</div><h3 className="text-lg font-bold">Quiz Done!</h3>
      <p className="text-2xl font-black text-brand-600">{score}/{questions.length * 10}</p>
      <button onClick={restart} className="px-6 py-2.5 bg-gray-800 text-white rounded-xl font-bold">New Quiz</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-bold">
        <span>Q{idx + 1}/{questions.length}</span>
        {streak >= 3 && <span className="text-orange-500 animate-pulse">🔥 x{streak}</span>}
        <span>⭐ {score}</span>
        <span className={timer <= 3 ? "text-red-500 animate-pulse" : ""}>{timer}s</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${((idx+1)/questions.length)*100}%` }} /></div>
      <p className="text-base font-bold text-center py-3">{current.q}</p>
      <div className="grid grid-cols-2 gap-3">{current.opts.map((o, i) => (
        <button key={i} onClick={() => pick(i)} disabled={picked !== null}
          style={{touchAction:"manipulation"}} className={`py-3.5 px-4 rounded-xl text-sm font-bold transition active:scale-95 ${
            picked === null ? "bg-white border-2 border-gray-200 hover:border-brand-300 hover:bg-brand-50 active:bg-gray-100" :
            i === current.ans ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300 scale-105" :
            picked === i ? "bg-red-100 text-red-700 border-2 border-red-300" :
            "bg-gray-50 border-2 border-gray-100 opacity-50"}`}>{o}</button>
      ))}</div>
      {picked === -1 && <div className="text-center text-sm text-red-500 font-bold">⏰ Time up! Answer: {current.opts[current.ans]}</div>}
    </div>
  );
}

// ============================
// MAIN COMPONENT
// ============================
const GAMES = [
  { id: "tictactoe", name: "Tic Tac Toe", icon: "❌⭕", desc: "Classic X and O", color: "from-blue-500 to-purple-500" },
  { id: "wordfill", name: "Word Fill", icon: "📝", desc: "Guess the word", color: "from-emerald-500 to-teal-500" },
  { id: "math", name: "Math Challenge", icon: "🔢", desc: "Speed math + combos", color: "from-orange-500 to-red-500" },
  { id: "spelling", name: "Spelling Bee", icon: "🐝", desc: "Spell it right", color: "from-amber-500 to-yellow-500" },
  { id: "memory", name: "Memory Match", icon: "🧠", desc: "Find matching pairs", color: "from-pink-500 to-rose-500" },
  { id: "quiz", name: "Quick Quiz", icon: "💡", desc: "15 random questions", color: "from-indigo-500 to-blue-500" },
];

export default function SchoolGames({ studentId, userId, studentName, schoolName, gradeLevel, todaySlots = [] }: {
  studentId: string; userId: string; studentName: string; schoolName: string; gradeLevel: string;
  todaySlots?: { startTime: string; endTime: string }[];
}) {
  const [active, setActive] = useState<string|null>(null);
  const [tab, setTab] = useState<"games"|"online"|"competitions">("games");
  const mp = useMultiplayer(userId);
  const classTime = useClassTimeCheck(todaySlots);

  if (classTime.blocked) return (
    <div className="max-w-md mx-auto text-center py-12 space-y-4">
      <div className="text-6xl">📚</div>
      <h2 className="text-xl font-bold text-gray-800">Class Time!</h2>
      <p className="text-sm text-gray-500">Games are locked during class hours.</p>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-700">Class ends at <strong>{classTime.nextBreak}</strong></p>
        <p className="text-xs text-blue-500 mt-1">Games unlock during break 🎮</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {mp.invites.map((inv: any) => (
        <div key={inv.id} className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <span className="text-3xl">🎮</span>
          <div className="flex-1"><p className="text-sm font-bold text-blue-800">{inv.hostName} wants to play!</p></div>
          <button onClick={() => { mp.accept(inv.id); setTab("online"); }} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold active:scale-95">✅ Accept</button>
          <button onClick={() => mp.decline(inv.id)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-bold">❌</button>
        </div>
      ))}

      {mp.inviteStatus === "timeout" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-amber-700">😕 No response — try someone else!</p>
        </div>
      )}

      <div className="flex gap-1 bg-white p-1 rounded-xl border">
        {([{id:"games" as const,label:"🎮 Solo"},{id:"online" as const,label:`🌐 Online (${mp.online.length})`},{id:"competitions" as const,label:"🏅 Compete"}]).map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setActive(null); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${tab===t.id?"bg-brand-500 text-white shadow":"text-gray-500 hover:bg-gray-50"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "games" && !active && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{GAMES.map(g => (
          <button key={g.id} onClick={() => setActive(g.id)}
            className="p-5 rounded-2xl bg-white border-2 border-gray-100 hover:border-brand-300 hover:shadow-lg transition-all text-center space-y-2 active:scale-95">
            <div className="text-4xl">{g.icon}</div><h4 className="text-sm font-bold">{g.name}</h4><p className="text-[10px] text-gray-400">{g.desc}</p>
            <div className={`text-[10px] px-3 py-1 rounded-full bg-gradient-to-r ${g.color} text-white font-bold inline-block`}>PLAY</div>
          </button>
        ))}</div>
      )}

      {tab === "games" && active && (
        <div className="bg-white rounded-2xl border-2 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setActive(null)} className="text-xs text-gray-500 font-medium">← Back</button>
            <h3 className="text-sm font-bold">{GAMES.find(g=>g.id===active)?.icon} {GAMES.find(g=>g.id===active)?.name}</h3>
            <div />
          </div>
          {active === "tictactoe" && <TicTacToe />}
          {active === "wordfill" && <WordFill />}
          {active === "math" && <MathChallenge />}
          {active === "spelling" && <SpellingBee />}
          {active === "memory" && <MemoryMatch />}
          {active === "quiz" && <QuickQuiz />}
        </div>
      )}

      {tab === "online" && (
        <div className="space-y-4">
          {mp.roomData?.status === "playing" && (
            <div className="bg-white rounded-2xl border-2 border-blue-300 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-blue-700">🎮 Live Game</h3>
                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold animate-pulse">● LIVE</span>
              </div>
              <OnlineTicTacToe room={mp.roomData} myUserId={userId} onMove={m => mp.move(mp.roomData.id, m)} onLeave={() => mp.leave(mp.roomData.id)} />
            </div>
          )}

          {mp.inviteStatus === "waiting" && (
            <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-6 text-center space-y-3">
              <div className="text-4xl animate-bounce">⏳</div>
              <p className="text-sm font-bold text-amber-800">Waiting for response...</p>
              <p className="text-xs text-amber-600">Auto-cancels in 10 seconds</p>
              <button onClick={() => mp.activeRoom?.id && mp.leave(mp.activeRoom.id)} className="text-xs text-gray-500 hover:text-red-500">Cancel</button>
            </div>
          )}

          {mp.roomData?.status === "finished" && (
            <div className={`rounded-2xl border-2 p-6 text-center space-y-3 ${mp.roomData.winner===userId?"bg-emerald-50 border-emerald-200":"bg-red-50 border-red-200"}`}>
              <div className="text-5xl">{mp.roomData.winner===userId?"🏆":mp.roomData.winner==="draw"?"🤝":"😔"}</div>
              <h3 className="text-lg font-bold">{mp.roomData.winner===userId?"You Won!":mp.roomData.winner==="draw"?"Draw!":"You Lost"}</h3>
              <button onClick={() => mp.leave(mp.roomData.id)} className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold text-sm active:scale-95">Back</button>
            </div>
          )}

          {(!mp.roomData || mp.roomData.status === "finished") && mp.inviteStatus !== "waiting" && (
            <div className="bg-white rounded-2xl border-2 p-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">🌐 Online <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{mp.online.length}</span></h3>
              {mp.online.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="text-4xl">😴</div>
                  <p className="text-sm text-gray-400">No classmates online right now</p>
                  <p className="text-[10px] text-gray-300">Tell friends to open Games!</p>
                </div>
              ) : (
                <div className="space-y-2">{mp.online.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">{p.name?.charAt(0) || "?"}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{p.name}</p>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /><span className="text-[10px] text-emerald-600">Online</span></div>
                    </div>
                    <button onClick={() => mp.invite(p.id, "tictactoe")} className="px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-bold active:scale-95">❌⭕ Challenge</button>
                  </div>
                ))}</div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "competitions" && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border-2 p-4 space-y-3">
            <h3 className="text-sm font-bold">🏅 Competitions</h3>
            {[{icon:"🔢",name:"Weekly Math Championship",desc:"Speed math",prize:"Star Student",game:"math",ends:"Friday"},
              {icon:"🐝",name:"Spelling Bee",desc:"School-wide",prize:"Spelling Champ",game:"spelling",ends:"Next week"},
              {icon:"🧠",name:"Memory Master",desc:"Fewest moves",prize:"Brain Power",game:"memory",ends:"Always"},
              {icon:"💡",name:"Quiz Bowl",desc:"15 questions",prize:"Quiz Master",game:"quiz",ends:"This month"},
            ].map((c, i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-50 border flex items-center gap-3">
                <span className="text-3xl">{c.icon}</span>
                <div className="flex-1"><h4 className="text-sm font-bold">{c.name}</h4><p className="text-[10px] text-gray-500">{c.desc} · 🏆 {c.prize}</p></div>
                <button onClick={() => { setTab("games"); setActive(c.game); }} className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold active:scale-95">Play</button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border-2 p-4 text-center space-y-3">
            <h3 className="text-sm font-bold">🏆 {schoolName} Leaderboard</h3>
            <div className="flex items-end justify-center gap-3 py-4">
              <div className="text-center"><div className="w-14 h-20 bg-gray-200 rounded-t-xl flex items-end justify-center pb-1">🥈</div><p className="text-[9px] font-bold mt-1">2nd</p></div>
              <div className="text-center"><div className="w-14 h-28 bg-amber-200 rounded-t-xl flex items-end justify-center pb-1">🥇</div><p className="text-[9px] font-bold mt-1">1st</p></div>
              <div className="text-center"><div className="w-14 h-16 bg-orange-100 rounded-t-xl flex items-end justify-center pb-1">🥉</div><p className="text-[9px] font-bold mt-1">3rd</p></div>
            </div>
            <p className="text-[10px] text-gray-400">Play to climb the leaderboard!</p>
          </div>
        </div>
      )}
    </div>
  );
}
