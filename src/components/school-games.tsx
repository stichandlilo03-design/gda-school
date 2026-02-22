"use client";
import { useState, useEffect, useCallback, useRef } from "react";

// ============================
// GAME DATA
// ============================
const WORD_LISTS: Record<string, string[]> = {
  easy: ["CAT","DOG","SUN","RUN","FUN","CUP","HAT","BAT","PEN","RED","BIG","TOP","MAP","BUS","NET"],
  medium: ["SCHOOL","TEACHER","PLANET","GARDEN","ANIMAL","BRIDGE","CASTLE","FLOWER","ROCKET","FAMILY"],
  hard: ["EDUCATION","KNOWLEDGE","DISCOVERY","ADVENTURE","WONDERFUL","IMPORTANT","BEAUTIFUL","DELICIOUS","ALGORITHM","CHEMISTRY"],
};
const MATH_OPS = ["+","-","×"];
const SPELLING_WORDS: Record<string, {word:string;hint:string}[]> = {
  easy: [{word:"APPLE",hint:"A red fruit"},{word:"HAPPY",hint:"Feeling of joy"},{word:"WATER",hint:"You drink this"},{word:"GREEN",hint:"Color of grass"},{word:"LIGHT",hint:"Opposite of dark"},{word:"MUSIC",hint:"You hear this"}],
  medium: [{word:"BECAUSE",hint:"Giving a reason"},{word:"RECEIVE",hint:"To get something"},{word:"BELIEVE",hint:"To think true"},{word:"LIBRARY",hint:"Place with books"},{word:"SCIENCE",hint:"Study of nature"},{word:"WEATHER",hint:"Rain or sun"}],
  hard: [{word:"NECESSARY",hint:"Something needed"},{word:"BEAUTIFUL",hint:"Very pretty"},{word:"DIFFERENT",hint:"Not the same"},{word:"GOVERNMENT",hint:"Rules a country"},{word:"ENVIRONMENT",hint:"Nature around us"},{word:"RESTAURANT",hint:"Place to eat"}],
};

// ============================
// ONLINE MULTIPLAYER HOOK
// ============================
function useMultiplayer(studentId: string) {
  const [online, setOnline] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const pollRef = useRef<any>(null);

  const api = useCallback(async (method: string, params: any) => {
    try {
      if (method === "GET") {
        const qs = new URLSearchParams(params).toString();
        const r = await fetch(`/api/games?${qs}`);
        return r.ok ? await r.json() : null;
      } else {
        const r = await fetch("/api/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
        return r.ok ? await r.json() : null;
      }
    } catch (_e) { return null; }
  }, []);

  // Heartbeat + poll for invites
  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (!active) return;
      const d = await api("GET", { action: "heartbeat" });
      if (d) { setOnline(d.online || []); setInvites(d.invites || []); if (d.activeRoom) setActiveRoom(d.activeRoom); }
      if (active) pollRef.current = setTimeout(poll, 3000);
    };
    poll();
    return () => { active = false; clearTimeout(pollRef.current); };
  }, [api]);

  // Poll room state when in game
  useEffect(() => {
    if (!activeRoom?.id) { setRoomData(null); return; }
    let active = true;
    const poll = async () => {
      if (!active) return;
      const d = await api("GET", { action: "poll_room", roomId: activeRoom.id });
      if (d && !d.error) setRoomData(d);
      if (active) setTimeout(poll, 1000);
    };
    poll();
    return () => { active = false; };
  }, [activeRoom?.id, api]);

  const invite = async (guestUserId: string, game: string) => {
    const d = await api("POST", { action: "invite", guestUserId, game });
    if (d?.roomId) setActiveRoom({ id: d.roomId });
    return d;
  };
  const accept = async (roomId: string) => {
    const d = await api("POST", { action: "accept", roomId });
    if (d?.room) setActiveRoom(d.room);
  };
  const decline = async (roomId: string) => { await api("POST", { action: "decline", roomId }); };
  const move = async (roomId: string, mv: any) => {
    const d = await api("POST", { action: "move", roomId, move: mv });
    if (d?.room) setRoomData(d.room);
  };
  const leave = async (roomId: string) => {
    await api("POST", { action: "leave", roomId });
    setActiveRoom(null); setRoomData(null);
  };

  return { online, invites, activeRoom, roomData, invite, accept, decline, move, leave };
}

// ============================
// ONLINE TIC TAC TOE
// ============================
function OnlineTicTacToe({ room, userId, onMove, onLeave }: { room: any; userId: string; onMove: (m: any) => void; onLeave: () => void }) {
  if (!room) return null;
  const board = room.state?.board || Array(9).fill(null);
  const isHost = room.hostId === userId;
  const myMark = isHost ? "X" : "O";
  const isMyTurn = room.turn === userId;
  const finished = room.status === "finished";
  const winner = room.winner;
  const winMsg = winner === "draw" ? "🤝 It's a Draw!" : winner === userId ? "🎉 You Won!" : "😔 You Lost!";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs"><span className="font-bold text-blue-600">❌ {room.hostName}</span> vs <span className="font-bold text-red-600">⭕ {room.guestName}</span></div>
        <button onClick={onLeave} className="text-[10px] text-gray-400 hover:text-red-500">Leave</button>
      </div>
      <div className="text-center">
        {finished ? (
          <div className={`py-2 rounded-xl font-bold text-sm ${winner===userId?"bg-emerald-100 text-emerald-700":winner==="draw"?"bg-gray-100 text-gray-700":"bg-red-100 text-red-700"}`}>{winMsg}</div>
        ) : (
          <div className={`text-sm font-medium py-1 rounded-lg ${isMyTurn?"bg-emerald-50 text-emerald-700 animate-pulse":"bg-gray-50 text-gray-500"}`}>
            {isMyTurn ? `Your turn (${myMark})` : "Opponent's turn..."}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
        {board.map((cell: string | null, i: number) => (
          <button key={i} onClick={() => isMyTurn && !cell && !finished && onMove({ index: i })}
            disabled={!isMyTurn || !!cell || finished}
            className={`w-16 h-16 rounded-xl text-2xl font-black transition-all ${
              cell === "X" ? "bg-blue-100 text-blue-600 scale-100" :
              cell === "O" ? "bg-red-100 text-red-600 scale-100" :
              isMyTurn && !finished ? "bg-white border-2 border-gray-200 hover:bg-gray-50 hover:scale-105 cursor-pointer" :
              "bg-gray-50 border-2 border-gray-100"
            }`}>
            {cell === "X" ? "❌" : cell === "O" ? "⭕" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================
// TIC TAC TOE (Solo/Local)
// ============================
function TicTacToe({ playerName }: { playerName: string }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [mode, setMode] = useState<"menu"|"vs_ai"|"vs_local">("menu");
  const [scores, setScores] = useState({ x: 0, o: 0, draw: 0 });
  const [aiDiff, setAiDiff] = useState<"easy"|"hard">("easy");
  const [lastWin, setLastWin] = useState<number[]>([]);

  const checkWin = (b: (string|null)[]) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const l of lines) { if (b[l[0]] && b[l[0]]===b[l[1]] && b[l[0]]===b[l[2]]) { setLastWin(l); return b[l[0]]; } }
    return b.every(Boolean) ? "draw" : null;
  };

  const aiMove = useCallback((b: (string|null)[], diff: string) => {
    const empty = b.map((v,i) => v===null?i:-1).filter(i=>i>=0);
    if (empty.length===0) return -1;
    if (diff==="hard") {
      const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      for (const i of empty) { const nb=[...b]; nb[i]="O"; for (const l of lines) { if(nb[l[0]]==="O"&&nb[l[1]]==="O"&&nb[l[2]]==="O") return i; } }
      for (const i of empty) { const nb=[...b]; nb[i]="X"; for (const l of lines) { if(nb[l[0]]==="X"&&nb[l[1]]==="X"&&nb[l[2]]==="X") return i; } }
      if (empty.includes(4)) return 4;
      const corners=[0,2,6,8].filter(i=>empty.includes(i));
      if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
    }
    return empty[Math.floor(Math.random()*empty.length)];
  }, []);

  const handleClick = (idx: number) => {
    if (board[idx]||checkWin(board)) return;
    const nb=[...board]; nb[idx]=isX?"X":"O"; setBoard(nb);
    const result=checkWin(nb);
    if (result) { if(result==="draw")setScores(s=>({...s,draw:s.draw+1}));else if(result==="X")setScores(s=>({...s,x:s.x+1}));else setScores(s=>({...s,o:s.o+1})); }
    else if (mode==="vs_ai"&&isX) {
      setIsX(false);
      setTimeout(()=>{const aim=aiMove(nb,aiDiff);if(aim>=0){const ab=[...nb];ab[aim]="O";setBoard(ab);const r=checkWin(ab);if(r){if(r==="draw")setScores(s=>({...s,draw:s.draw+1}));else if(r==="O")setScores(s=>({...s,o:s.o+1}));}setIsX(true);}},400);
    } else setIsX(!isX);
  };

  const reset=()=>{setBoard(Array(9).fill(null));setIsX(true);setLastWin([]);};
  const winner=checkWin(board);

  if (mode==="menu") return (
    <div className="text-center space-y-4 py-4">
      <div className="text-6xl animate-bounce">❌⭕</div>
      <h3 className="text-lg font-bold">Tic Tac Toe</h3>
      <div className="space-y-2 max-w-xs mx-auto">
        <button onClick={()=>{setMode("vs_ai");setAiDiff("easy");}} className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 active:scale-95 transition">🤖 Easy Computer</button>
        <button onClick={()=>{setMode("vs_ai");setAiDiff("hard");}} className="w-full py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 active:scale-95 transition">🧠 Hard Computer</button>
        <button onClick={()=>setMode("vs_local")} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 active:scale-95 transition">👫 Same Device</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={()=>{setMode("menu");reset();setScores({x:0,o:0,draw:0});}} className="text-xs text-gray-500 hover:text-gray-700">← Back</button>
        <div className="flex gap-3 text-xs font-bold"><span className="text-blue-600">X:{scores.x}</span><span className="text-gray-400">Draw:{scores.draw}</span><span className="text-red-600">O:{scores.o}</span></div>
      </div>
      {winner ? (
        <div className={`text-center py-3 rounded-xl font-bold text-sm animate-bounce ${winner==="draw"?"bg-gray-100":"bg-emerald-100 text-emerald-700"}`}>
          {winner==="draw"?"🤝 Draw!":`${winner==="X"?"❌":"⭕"} ${winner} Wins! 🎉`}
        </div>
      ) : <div className="text-center text-sm font-medium">{isX?"❌ X's turn":"⭕ O's turn"}{mode==="vs_ai"&&!isX?" 🤔":""}</div>}
      <div className="grid grid-cols-3 gap-2 max-w-[210px] mx-auto">
        {board.map((cell,i)=>(
          <button key={i} onClick={()=>handleClick(i)} disabled={!!cell||!!winner||(mode==="vs_ai"&&!isX)}
            className={`w-[68px] h-[68px] rounded-xl text-2xl font-black transition-all ${
              lastWin.includes(i)&&winner?"ring-4 ring-yellow-400 scale-110":""} ${
              cell==="X"?"bg-blue-100 text-blue-600":cell==="O"?"bg-red-100 text-red-600":"bg-white border-2 border-gray-200 hover:bg-gray-50 hover:scale-105"}`}>
            {cell==="X"?"❌":cell==="O"?"⭕":""}
          </button>
        ))}
      </div>
      {winner&&<button onClick={reset} className="w-full py-2.5 bg-gray-800 text-white rounded-xl font-bold text-sm active:scale-95 transition">🔄 Play Again</button>}
    </div>
  );
}

// ============================
// WORD FILL (Hangman)
// ============================
function WordFill() {
  const [diff,setDiff]=useState<"easy"|"medium"|"hard">("easy");
  const [word,setWord]=useState("");
  const [guessed,setGuessed]=useState<Set<string>>(new Set());
  const [wrong,setWrong]=useState(0);
  const [score,setScore]=useState(0);
  const [streak,setStreak]=useState(0);
  const maxWrong=6;
  const newWord=useCallback((d:string)=>{const l=WORD_LISTS[d]||WORD_LISTS.easy;setWord(l[Math.floor(Math.random()*l.length)]);setGuessed(new Set());setWrong(0);},[]);
  useEffect(()=>{newWord(diff);},[diff,newWord]);
  const display=word.split("").map(l=>guessed.has(l)?l:"_");
  const won=word&&display.every(c=>c!=="_");
  const lost=wrong>=maxWrong;
  const guess=(l:string)=>{if(won||lost||guessed.has(l))return;const ng=new Set(guessed);ng.add(l);setGuessed(ng);if(!word.includes(l))setWrong(w=>w+1);};
  useEffect(()=>{if(won){setScore(s=>s+(diff==="hard"?30:diff==="medium"?20:10));setStreak(s=>s+1);}if(lost)setStreak(0);},[won,lost,diff]);
  const bodies=["","🦶","🦵","💪","🤚","🧑","💀"];
  const hangman=bodies.slice(0,wrong+1).join(" ");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">{(["easy","medium","hard"]as const).map(d=>(<button key={d} onClick={()=>setDiff(d)} className={`text-[10px] px-2 py-1 rounded-lg font-bold ${diff===d?"bg-brand-500 text-white":"bg-gray-100"}`}>{d}</button>))}</div>
        <div className="text-xs font-bold">⭐ {score} · 🔥 {streak}</div>
      </div>
      <div className="text-center py-2">
        <div className="text-3xl mb-1 h-10">{hangman||"😊"}</div>
        <div className="text-2xl font-mono tracking-[0.6em] font-black">{display.join("")}</div>
        <div className="mt-1 text-xs text-gray-400">{word.length} letters · {maxWrong-wrong} tries left</div>
        <div className="flex justify-center gap-0.5 mt-1">{Array(maxWrong).fill(0).map((_,i)=><div key={i} className={`w-3 h-3 rounded-full ${i<wrong?"bg-red-400":"bg-gray-200"}`} />)}</div>
        {won&&<div className="mt-2 text-emerald-600 font-bold text-sm animate-bounce">🎉 Correct! +{diff==="hard"?30:diff==="medium"?20:10}</div>}
        {lost&&<div className="mt-2 text-red-600 font-bold text-sm">💀 Answer: <span className="text-black">{word}</span></div>}
      </div>
      {!won&&!lost?(
        <div className="flex flex-wrap gap-1 justify-center">{
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l=>(
            <button key={l} onClick={()=>guess(l)} disabled={guessed.has(l)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition active:scale-90 ${guessed.has(l)?(word.includes(l)?"bg-emerald-200 text-emerald-800":"bg-red-200 text-red-800 opacity-40"):"bg-white border hover:bg-gray-50 shadow-sm"}`}>{l}</button>
          ))}</div>
      ):(<button onClick={()=>newWord(diff)} className="w-full py-2.5 bg-gray-800 text-white rounded-xl font-bold text-sm active:scale-95">Next Word →</button>)}
    </div>
  );
}

// ============================
// MATH CHALLENGE
// ============================
function MathChallenge() {
  const [level,setLevel]=useState(1);const [score,setScore]=useState(0);const [lives,setLives]=useState(3);
  const [q,setQ]=useState({text:"",answer:0});const [input,setInput]=useState("");const [fb,setFb]=useState("");
  const [timeLeft,setTimeLeft]=useState(15);const [gameOver,setGameOver]=useState(false);const [total,setTotal]=useState(0);
  const [combo,setCombo]=useState(0);

  const genQ=useCallback((lv:number)=>{
    const max=lv<=3?10:lv<=6?50:100;
    const op=MATH_OPS[Math.floor(Math.random()*Math.min(lv,3))];
    let a=Math.floor(Math.random()*max)+1,b=Math.floor(Math.random()*max)+1;
    if(op==="-"&&a<b)[a,b]=[b,a];
    return{text:`${a} ${op} ${b} = ?`,answer:op==="+"?a+b:op==="-"?a-b:a*b};
  },[]);

  useEffect(()=>{setQ(genQ(level));setTimeLeft(Math.max(8,18-level));},[level,genQ]);
  useEffect(()=>{
    if(gameOver||!q.text)return;
    const t=setInterval(()=>{setTimeLeft(p=>{if(p<=1){setLives(l=>{if(l<=1)setGameOver(true);return l-1;});setFb("⏰ Time's up!");setCombo(0);setQ(genQ(level));return Math.max(8,18-level);}return p-1;});},1000);
    return()=>clearInterval(t);
  },[q,gameOver,level,genQ]);

  const submit=()=>{
    const ans=parseInt(input);if(isNaN(ans))return;setTotal(t=>t+1);
    if(ans===q.answer){const c=combo+1;setCombo(c);const pts=level*10*(c>=5?3:c>=3?2:1);setScore(s=>s+pts);setFb(`✅ +${pts}${c>=3?` 🔥x${c}`:""}`);if((total+1)%5===0)setLevel(l=>l+1);}
    else{setLives(l=>{if(l<=1)setGameOver(true);return l-1;});setFb(`❌ Was ${q.answer}`);setCombo(0);}
    setInput("");if(!gameOver){setQ(genQ(level));setTimeLeft(Math.max(8,18-level));}
  };

  if(gameOver) return (
    <div className="text-center py-6 space-y-3">
      <div className="text-6xl">🏆</div><h3 className="text-lg font-bold">Game Over!</h3>
      <p className="text-3xl font-black text-brand-600">{score} pts</p>
      <p className="text-sm text-gray-500">Level {level} · {total} answered</p>
      <button onClick={()=>{setScore(0);setLives(3);setLevel(1);setTotal(0);setGameOver(false);setFb("");setCombo(0);setQ(genQ(1));}} className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold active:scale-95">Play Again</button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold">
        <span>Lv.{level}</span><span>⭐ {score}</span>
        {combo>=3&&<span className="text-orange-500 animate-pulse">🔥 x{combo}</span>}
        <span>{"❤️".repeat(lives)}{"🖤".repeat(3-lives)}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full transition-all ${timeLeft<=3?"bg-red-500":"bg-brand-500"}`} style={{width:`${(timeLeft/Math.max(8,18-level))*100}%`}} /></div>
      <div className="text-center"><div className="text-3xl font-black py-4">{q.text}</div>{fb&&<div className={`text-sm font-bold ${fb.includes("✅")?"text-emerald-600":"text-red-600"}`}>{fb}</div>}</div>
      <div className="flex gap-2"><input type="number" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} className="flex-1 text-center text-xl font-bold border-2 rounded-xl py-2 focus:border-brand-500 outline-none" placeholder="?" autoFocus /><button onClick={submit} className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold active:scale-95">Go!</button></div>
    </div>
  );
}

// ============================
// SPELLING BEE
// ============================
function SpellingBee() {
  const [diff,setDiff]=useState<"easy"|"medium"|"hard">("easy");const [idx,setIdx]=useState(0);const [input,setInput]=useState("");
  const [score,setScore]=useState(0);const [results,setResults]=useState<{word:string;correct:boolean}[]>([]);const [show,setShow]=useState(false);const [done,setDone]=useState(false);
  const words=SPELLING_WORDS[diff]||SPELLING_WORDS.easy;const current=words[idx];
  const speak=(w:string)=>{if(typeof window!=="undefined"&&window.speechSynthesis){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(w);u.rate=0.8;window.speechSynthesis.speak(u);}};
  const submit=()=>{const correct=input.toUpperCase().trim()===current.word;if(correct)setScore(s=>s+(diff==="hard"?30:diff==="medium"?20:10));setResults(r=>[...r,{word:current.word,correct}]);setShow(true);};
  const next=()=>{setShow(false);setInput("");if(idx+1>=words.length)setDone(true);else setIdx(i=>i+1);};
  const restart=()=>{setIdx(0);setInput("");setScore(0);setResults([]);setShow(false);setDone(false);};

  if(done) return (
    <div className="text-center py-6 space-y-3">
      <div className="text-5xl">🐝</div><h3 className="text-lg font-bold">Complete!</h3>
      <p className="text-2xl font-black text-brand-600">{score} pts</p>
      <p className="text-sm text-gray-500">{results.filter(r=>r.correct).length}/{results.length} correct</p>
      <div className="flex flex-wrap gap-1 justify-center">{results.map((r,i)=><span key={i} className={`text-[10px] px-2 py-1 rounded-full font-bold ${r.correct?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{r.correct?"✅":"❌"} {r.word}</span>)}</div>
      <button onClick={restart} className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold">Again</button>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">{(["easy","medium","hard"]as const).map(d=>(<button key={d} onClick={()=>{setDiff(d);restart();}} className={`text-[10px] px-2 py-1 rounded-lg font-bold ${diff===d?"bg-amber-500 text-white":"bg-gray-100"}`}>{d}</button>))}</div>
        <span className="text-xs font-bold">⭐ {score} · {idx+1}/{words.length}</span>
      </div>
      <div className="text-center py-4">
        <div className="text-5xl mb-2">🐝</div>
        <p className="text-sm text-gray-500 mb-1">Hint: <strong className="text-gray-700">{current.hint}</strong></p>
        <button onClick={()=>speak(current.word)} className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl text-sm font-bold hover:bg-amber-200 mb-3 active:scale-95">🔊 Hear word</button>
        {show?(<div className={`py-3 rounded-xl font-bold ${results[results.length-1]?.correct?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{results[results.length-1]?.correct?"✅ Correct!":"❌ Was: "+current.word}</div>):(
          <div className="flex gap-2 max-w-xs mx-auto"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} className="flex-1 text-center text-lg font-bold border-2 rounded-xl py-2 uppercase tracking-wider focus:border-amber-500 outline-none" placeholder="Spell it..." autoFocus /><button onClick={submit} className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold active:scale-95">Check</button></div>
        )}
      </div>
      {show&&<button onClick={next} className="w-full py-2 bg-gray-800 text-white rounded-xl font-bold text-sm">{idx+1>=words.length?"Results":"Next →"}</button>}
    </div>
  );
}

// ============================
// MEMORY MATCH
// ============================
function MemoryMatch() {
  const emojis=["🍎","🍊","🍋","🍇","🍉","🍓","🌟","🎈"];
  const [cards,setCards]=useState<{emoji:string;flipped:boolean;matched:boolean}[]>([]);
  const [flipped,setFlipped]=useState<number[]>([]);const [moves,setMoves]=useState(0);const [matches,setMatches]=useState(0);const [best,setBest]=useState(999);
  const init=useCallback(()=>{setCards([...emojis,...emojis].sort(()=>Math.random()-0.5).map(e=>({emoji:e,flipped:false,matched:false})));setFlipped([]);setMoves(0);setMatches(0);},[]);
  useEffect(()=>{init();},[init]);
  const flip=(i:number)=>{if(flipped.length>=2||cards[i].flipped||cards[i].matched)return;const nc=[...cards];nc[i].flipped=true;setCards(nc);const nf=[...flipped,i];setFlipped(nf);
    if(nf.length===2){setMoves(m=>m+1);if(cards[nf[0]].emoji===nc[i].emoji){setTimeout(()=>{const mc=[...nc];mc[nf[0]].matched=true;mc[nf[1]].matched=true;setCards(mc);setFlipped([]);setMatches(m=>{const nm=m+1;if(nm===emojis.length)setBest(b=>Math.min(b,moves+1));return nm;});},300);}else{setTimeout(()=>{const uc=[...nc];uc[nf[0]].flipped=false;uc[nf[1]].flipped=false;setCards(uc);setFlipped([]);},800);}}};
  const won=matches===emojis.length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold"><span>Moves: {moves}</span><span>{matches}/{emojis.length} matched</span>{best<999&&<span>Best: {best}</span>}</div>
      {won&&<div className="text-center py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold animate-bounce">🎉 Won in {moves} moves!</div>}
      <div className="grid grid-cols-4 gap-2 max-w-[240px] mx-auto">{cards.map((c,i)=>(<button key={i} onClick={()=>flip(i)} disabled={c.flipped||c.matched} className={`w-14 h-14 rounded-xl text-2xl transition-all transform ${c.flipped||c.matched?"bg-white border-2 border-brand-300 scale-100":"bg-brand-500 hover:bg-brand-600 scale-95 hover:scale-100"}`}>{c.flipped||c.matched?c.emoji:"?"}</button>))}</div>
      {won&&<button onClick={init} className="w-full py-2 bg-gray-800 text-white rounded-xl font-bold text-sm">Again</button>}
    </div>
  );
}

// ============================
// QUICK QUIZ GAME
// ============================
function QuickQuiz() {
  const questions = [
    {q:"What planet is closest to the Sun?",opts:["Venus","Mercury","Mars","Earth"],ans:1},
    {q:"How many sides does a hexagon have?",opts:["5","6","7","8"],ans:1},
    {q:"What is the largest ocean?",opts:["Atlantic","Indian","Pacific","Arctic"],ans:2},
    {q:"What gas do plants breathe in?",opts:["Oxygen","Nitrogen","Carbon Dioxide","Helium"],ans:2},
    {q:"How many continents are there?",opts:["5","6","7","8"],ans:2},
    {q:"What is 12 × 12?",opts:["124","144","132","156"],ans:1},
    {q:"Which animal is the tallest?",opts:["Elephant","Horse","Giraffe","Camel"],ans:2},
    {q:"What color is an emerald?",opts:["Blue","Red","Green","Yellow"],ans:2},
    {q:"Who wrote Romeo and Juliet?",opts:["Dickens","Shakespeare","Twain","Austen"],ans:1},
    {q:"How many legs does a spider have?",opts:["6","8","10","12"],ans:1},
  ];
  const [idx,setIdx]=useState(0);const [score,setScore]=useState(0);const [picked,setPicked]=useState<number|null>(null);const [done,setDone]=useState(false);const [streak,setStreak]=useState(0);
  const current=questions[idx];
  const pick=(i:number)=>{if(picked!==null)return;setPicked(i);if(i===current.ans){setScore(s=>s+10);setStreak(s=>s+1);}else setStreak(0);setTimeout(()=>{if(idx+1>=questions.length)setDone(true);else{setIdx(j=>j+1);setPicked(null);}},1200);};
  if(done) return (<div className="text-center py-6 space-y-3"><div className="text-5xl">🧠</div><h3 className="text-lg font-bold">Quiz Complete!</h3><p className="text-2xl font-black text-brand-600">{score}/{questions.length*10}</p><button onClick={()=>{setIdx(0);setScore(0);setPicked(null);setDone(false);setStreak(0);}} className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold">Retry</button></div>);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold"><span>Q{idx+1}/{questions.length}</span>{streak>=3&&<span className="text-orange-500">🔥 x{streak}</span>}<span>⭐ {score}</span></div>
      <div className="h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-brand-500 rounded-full transition-all" style={{width:`${((idx+1)/questions.length)*100}%`}} /></div>
      <p className="text-sm font-bold text-center py-3">{current.q}</p>
      <div className="grid grid-cols-2 gap-2">{current.opts.map((o,i)=>(<button key={i} onClick={()=>pick(i)} disabled={picked!==null}
        className={`py-3 px-4 rounded-xl text-sm font-bold transition active:scale-95 ${picked===null?"bg-white border-2 border-gray-200 hover:border-brand-300":i===current.ans?"bg-emerald-100 text-emerald-700 border-2 border-emerald-300 scale-105":picked===i?"bg-red-100 text-red-700 border-2 border-red-300 shake":"bg-gray-50 border-2 border-gray-100 opacity-50"}`}>{o}</button>))}</div>
    </div>
  );
}

// ============================
// MAIN GAMES COMPONENT
// ============================
const GAMES = [
  { id:"tictactoe", name:"Tic Tac Toe", icon:"❌⭕", desc:"Classic X and O", color:"from-blue-500 to-purple-500", online:true },
  { id:"wordfill", name:"Word Fill", icon:"📝", desc:"Guess the hidden word", color:"from-emerald-500 to-teal-500", online:false },
  { id:"math", name:"Math Challenge", icon:"🔢", desc:"Speed math with combos", color:"from-orange-500 to-red-500", online:false },
  { id:"spelling", name:"Spelling Bee", icon:"🐝", desc:"Spell words correctly", color:"from-amber-500 to-yellow-500", online:false },
  { id:"memory", name:"Memory Match", icon:"🧠", desc:"Find matching pairs", color:"from-pink-500 to-rose-500", online:false },
  { id:"quiz", name:"Quick Quiz", icon:"💡", desc:"General knowledge", color:"from-indigo-500 to-blue-500", online:false },
];

export default function SchoolGames({ studentId, userId, studentName, schoolName, gradeLevel }: {
  studentId: string; userId: string; studentName: string; schoolName: string; gradeLevel: string;
}) {
  const [active, setActive] = useState<string|null>(null);
  const [tab, setTab] = useState<"games"|"online"|"competitions">("games");
  const mp = useMultiplayer(userId);

  return (
    <div className="space-y-4">
      {/* Invite notifications */}
      {mp.invites.length > 0 && (
        <div className="space-y-2">
          {mp.invites.map((inv: any) => (
            <div key={inv.id} className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 flex items-center gap-3 animate-pulse">
              <span className="text-3xl">🎮</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-800">{inv.hostName} wants to play {inv.game}!</p>
                <p className="text-[10px] text-blue-600">Accept to start the game</p>
              </div>
              <button onClick={() => { mp.accept(inv.id); setTab("online"); }} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 active:scale-95">✅ Accept</button>
              <button onClick={() => mp.decline(inv.id)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200">❌</button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-1 rounded-xl border">
        {([
          { id:"games"as const, label:"🎮 Solo Games" },
          { id:"online"as const, label:`🌐 Online (${mp.online.length})` },
          { id:"competitions"as const, label:"🏅 Compete" },
        ]).map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setActive(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${tab===t.id?"bg-brand-500 text-white shadow":"text-gray-500 hover:bg-gray-50"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== SOLO GAMES TAB ===== */}
      {tab==="games"&&!active&&(
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GAMES.map(g=>(
            <button key={g.id} onClick={()=>setActive(g.id)}
              className="p-4 rounded-2xl bg-white border-2 border-gray-100 hover:border-brand-300 hover:shadow-lg transition-all text-center space-y-2 active:scale-95">
              <div className="text-4xl">{g.icon}</div>
              <h4 className="text-sm font-bold">{g.name}</h4>
              <p className="text-[10px] text-gray-400">{g.desc}</p>
              <div className={`text-[9px] px-3 py-1 rounded-full bg-gradient-to-r ${g.color} text-white font-bold inline-block`}>PLAY</div>
            </button>
          ))}
        </div>
      )}
      {tab==="games"&&active&&(
        <div className="bg-white rounded-2xl border-2 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <button onClick={()=>setActive(null)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">← Back</button>
            <h3 className="text-sm font-bold">{GAMES.find(g=>g.id===active)?.icon} {GAMES.find(g=>g.id===active)?.name}</h3>
            <div />
          </div>
          {active==="tictactoe"&&<TicTacToe playerName={studentName} />}
          {active==="wordfill"&&<WordFill />}
          {active==="math"&&<MathChallenge />}
          {active==="spelling"&&<SpellingBee />}
          {active==="memory"&&<MemoryMatch />}
          {active==="quiz"&&<QuickQuiz />}
        </div>
      )}

      {/* ===== ONLINE TAB ===== */}
      {tab==="online"&&(
        <div className="space-y-4">
          {/* Active online game */}
          {mp.roomData && mp.roomData.status === "playing" && (
            <div className="bg-white rounded-2xl border-2 border-blue-300 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-blue-700">🎮 Live Game</h3>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold animate-pulse">● LIVE</span>
              </div>
              <OnlineTicTacToe room={mp.roomData} userId={userId} onMove={(m) => mp.move(mp.roomData.id, m)} onLeave={() => mp.leave(mp.roomData.id)} />
            </div>
          )}

          {/* Waiting for opponent */}
          {mp.activeRoom && mp.roomData?.status === "waiting" && (
            <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-6 text-center space-y-2">
              <div className="text-4xl animate-bounce">⏳</div>
              <p className="text-sm font-bold text-amber-800">Waiting for opponent to accept...</p>
              <button onClick={() => mp.leave(mp.activeRoom.id)} className="text-xs text-gray-500 hover:text-red-500">Cancel</button>
            </div>
          )}

          {/* Game over */}
          {mp.roomData?.status === "finished" && (
            <div className={`rounded-2xl border-2 p-6 text-center space-y-3 ${mp.roomData.winner===userId?"bg-emerald-50 border-emerald-200":"bg-red-50 border-red-200"}`}>
              <div className="text-5xl">{mp.roomData.winner===userId?"🏆":mp.roomData.winner==="draw"?"🤝":"😔"}</div>
              <h3 className="text-lg font-bold">{mp.roomData.winner===userId?"You Won!":mp.roomData.winner==="draw"?"Draw!":"You Lost"}</h3>
              <button onClick={() => { mp.leave(mp.roomData.id); }} className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold text-sm active:scale-95">Back to Lobby</button>
            </div>
          )}

          {/* Online players list */}
          {!mp.roomData?.status || mp.roomData.status === "finished" ? (
            <div className="bg-white rounded-2xl border-2 p-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                🌐 Online Players
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{mp.online.length} online</span>
              </h3>
              {mp.online.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="text-4xl">😴</div>
                  <p className="text-sm text-gray-400">No other students online right now</p>
                  <p className="text-[10px] text-gray-300">Players appear when they open the Games page</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mp.online.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">{p.name?.charAt(0) || "?"}</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{p.name}</p>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /><span className="text-[10px] text-emerald-600">Online</span></div>
                      </div>
                      <button onClick={() => mp.invite(p.id, "tictactoe")}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 active:scale-95 flex items-center gap-1">
                        ❌⭕ Challenge
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ===== COMPETITIONS TAB ===== */}
      {tab==="competitions"&&(
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border-2 p-4 space-y-3">
            <h3 className="text-sm font-bold">🏅 Active Competitions</h3>
            {[
              { icon:"🔢", name:"Weekly Math Championship", desc:`Compete in speed math — ${gradeLevel} students`, prize:"Star Student Badge", color:"amber", game:"math", ends:"Friday" },
              { icon:"🐝", name:"Spelling Bee Tournament", desc:"Test your spelling school-wide", prize:"Spelling Champion", color:"emerald", game:"spelling", ends:"Next week" },
              { icon:"🧠", name:"Memory Master Challenge", desc:"Fewest moves wins!", prize:"Brain Power Badge", color:"purple", game:"memory", ends:"Always open" },
              { icon:"💡", name:"Quiz Bowl", desc:"10 questions, fastest wins", prize:"Quiz Master Badge", color:"indigo", game:"quiz", ends:"This month" },
            ].map((c,i) => (
              <div key={i} className={`p-4 rounded-xl bg-gradient-to-r from-${c.color}-50 to-${c.color}-50/50 border border-${c.color}-200`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{c.icon}</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">{c.name}</h4>
                    <p className="text-[10px] text-gray-500">{c.desc}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">🏆 {c.prize}</span>
                      <span className="text-[9px] text-gray-400">Ends: {c.ends}</span>
                    </div>
                  </div>
                  <button onClick={() => { setTab("games"); setActive(c.game); }}
                    className={`px-4 py-2 bg-${c.color}-500 text-white rounded-xl text-xs font-bold hover:opacity-90 active:scale-95`}>Join</button>
                </div>
              </div>
            ))}
          </div>
          {/* Leaderboard */}
          <div className="bg-white rounded-2xl border-2 p-4 space-y-3">
            <h3 className="text-sm font-bold">🏆 {schoolName} Leaderboard</h3>
            <div className="flex items-end justify-center gap-3 py-4">
              <div className="text-center"><div className="w-14 h-20 bg-gray-200 rounded-t-xl flex items-end justify-center pb-1"><span className="text-lg">🥈</span></div><p className="text-[9px] font-bold mt-1">2nd</p></div>
              <div className="text-center"><div className="w-14 h-28 bg-amber-200 rounded-t-xl flex items-end justify-center pb-1"><span className="text-2xl">🥇</span></div><p className="text-[9px] font-bold mt-1">1st</p></div>
              <div className="text-center"><div className="w-14 h-16 bg-orange-100 rounded-t-xl flex items-end justify-center pb-1"><span className="text-lg">🥉</span></div><p className="text-[9px] font-bold mt-1">3rd</p></div>
            </div>
            <p className="text-center text-[10px] text-gray-400">Play games and compete to climb the leaderboard!</p>
          </div>
        </div>
      )}
    </div>
  );
}
