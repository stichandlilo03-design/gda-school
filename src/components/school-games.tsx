"use client";
import { useState, useEffect, useCallback } from "react";

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
  easy: [
    {word:"APPLE",hint:"A red fruit"},{word:"HAPPY",hint:"Feeling of joy"},{word:"WATER",hint:"You drink this"},
    {word:"GREEN",hint:"Color of grass"},{word:"LIGHT",hint:"Opposite of dark"},{word:"MUSIC",hint:"You hear this"},
  ],
  medium: [
    {word:"BECAUSE",hint:"Giving a reason"},{word:"RECEIVE",hint:"To get something"},{word:"BELIEVE",hint:"To think true"},
    {word:"LIBRARY",hint:"Place with books"},{word:"SCIENCE",hint:"Study of nature"},{word:"WEATHER",hint:"Rain or sun"},
  ],
  hard: [
    {word:"NECESSARY",hint:"Something needed"},{word:"BEAUTIFUL",hint:"Very pretty"},{word:"DIFFERENT",hint:"Not the same"},
    {word:"GOVERNMENT",hint:"Rules a country"},{word:"ENVIRONMENT",hint:"Nature around us"},{word:"RESTAURANT",hint:"Place to eat"},
  ],
};

// ============================
// TIC TAC TOE GAME
// ============================
function TicTacToe({ playerName }: { playerName: string }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [mode, setMode] = useState<"menu"|"vs_ai"|"vs_local">("menu");
  const [scores, setScores] = useState({ x: 0, o: 0, draw: 0 });
  const [aiDifficulty, setAiDifficulty] = useState<"easy"|"hard">("easy");

  const checkWin = (b: (string|null)[]) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,bb,c] of lines) { if (b[a] && b[a]===b[bb] && b[a]===b[c]) return b[a]; }
    return b.every(Boolean) ? "draw" : null;
  };

  const aiMove = useCallback((b: (string|null)[], diff: string) => {
    const empty = b.map((v,i) => v===null?i:-1).filter(i=>i>=0);
    if (empty.length === 0) return -1;
    if (diff === "hard") {
      // Check for win
      for (const i of empty) { const nb = [...b]; nb[i]="O"; if (checkWin(nb)==="O") return i; }
      // Block player
      for (const i of empty) { const nb = [...b]; nb[i]="X"; if (checkWin(nb)==="X") return i; }
      // Center
      if (empty.includes(4)) return 4;
      // Corners
      const corners = [0,2,6,8].filter(i=>empty.includes(i));
      if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
    }
    return empty[Math.floor(Math.random()*empty.length)];
  }, []);

  const handleClick = (idx: number) => {
    if (board[idx] || checkWin(board)) return;
    const nb = [...board];
    nb[idx] = isX ? "X" : "O";
    setBoard(nb);
    const result = checkWin(nb);
    if (result) {
      if (result === "draw") setScores(s => ({...s,draw:s.draw+1}));
      else if (result === "X") setScores(s => ({...s,x:s.x+1}));
      else setScores(s => ({...s,o:s.o+1}));
    } else if (mode === "vs_ai" && isX) {
      setIsX(false);
      setTimeout(() => {
        const aim = aiMove(nb, aiDifficulty);
        if (aim >= 0) { const ab = [...nb]; ab[aim]="O"; setBoard(ab); const r = checkWin(ab);
          if (r) { if (r==="draw") setScores(s=>({...s,draw:s.draw+1})); else if (r==="O") setScores(s=>({...s,o:s.o+1})); }
          setIsX(true);
        }
      }, 400);
    } else { setIsX(!isX); }
  };

  const reset = () => { setBoard(Array(9).fill(null)); setIsX(true); };
  const winner = checkWin(board);

  if (mode === "menu") return (
    <div className="text-center space-y-4 py-4">
      <div className="text-5xl">❌⭕</div>
      <h3 className="text-lg font-bold">Tic Tac Toe</h3>
      <div className="space-y-2">
        <button onClick={()=>{setMode("vs_ai");setAiDifficulty("easy");}} className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600">🤖 Play vs Computer (Easy)</button>
        <button onClick={()=>{setMode("vs_ai");setAiDifficulty("hard");}} className="w-full py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600">🧠 Play vs Computer (Hard)</button>
        <button onClick={()=>setMode("vs_local")} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600">👫 Play vs Friend (Same Device)</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={()=>{setMode("menu");reset();setScores({x:0,o:0,draw:0});}} className="text-xs text-gray-500 hover:text-gray-700">← Back</button>
        <div className="flex gap-3 text-xs font-bold">
          <span className="text-blue-600">X: {scores.x}</span>
          <span className="text-gray-400">Draw: {scores.draw}</span>
          <span className="text-red-600">O: {scores.o}</span>
        </div>
      </div>
      {winner ? (
        <div className={`text-center py-2 rounded-xl font-bold ${winner==="draw"?"bg-gray-100 text-gray-700":winner==="X"?"bg-blue-100 text-blue-700":"bg-red-100 text-red-700"}`}>
          {winner==="draw" ? "🤝 It's a Draw!" : `${winner==="X"?"❌":"⭕"} ${winner} Wins!`}
        </div>
      ) : (
        <div className="text-center text-sm font-medium">{isX?"❌ X's turn":"⭕ O's turn"}{mode==="vs_ai"&&!isX?" (Computer thinking...)":""}</div>
      )}
      <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
        {board.map((cell,i) => (
          <button key={i} onClick={()=>handleClick(i)} disabled={!!cell||!!winner||(mode==="vs_ai"&&!isX)}
            className={`w-16 h-16 rounded-xl text-2xl font-black transition-all ${cell?"":"hover:bg-gray-100 cursor-pointer"} ${cell==="X"?"bg-blue-100 text-blue-600":""}${cell==="O"?"bg-red-100 text-red-600":""}${!cell?"bg-white border-2 border-gray-200":""}`}>
            {cell==="X"?"❌":cell==="O"?"⭕":""}
          </button>
        ))}
      </div>
      {winner && <button onClick={reset} className="w-full py-2 bg-gray-800 text-white rounded-xl font-bold text-sm">Play Again</button>}
    </div>
  );
}

// ============================
// WORD FILL GAME
// ============================
function WordFill() {
  const [diff, setDiff] = useState<"easy"|"medium"|"hard">("easy");
  const [word, setWord] = useState("");
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const maxWrong = 6;

  const newWord = useCallback((d: string) => {
    const list = WORD_LISTS[d] || WORD_LISTS.easy;
    setWord(list[Math.floor(Math.random()*list.length)]);
    setGuessed(new Set()); setWrong(0);
  }, []);

  useEffect(() => { newWord(diff); }, [diff, newWord]);

  const display = word.split("").map(l => guessed.has(l) ? l : "_");
  const won = word && display.every(c => c !== "_");
  const lost = wrong >= maxWrong;

  const guess = (letter: string) => {
    if (won || lost || guessed.has(letter)) return;
    const ng = new Set(guessed); ng.add(letter); setGuessed(ng);
    if (!word.includes(letter)) setWrong(w => w+1);
  };

  useEffect(() => {
    if (won) { setScore(s => s + (diff==="hard"?30:diff==="medium"?20:10)); setStreak(s=>s+1); }
    if (lost) setStreak(0);
  }, [won, lost, diff]);

  const hangmanParts = ["😵","🫥","😰","😟","😐","🙂","😊"];
  const face = hangmanParts[Math.min(wrong, hangmanParts.length-1)];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(["easy","medium","hard"] as const).map(d => (
            <button key={d} onClick={()=>setDiff(d)} className={`text-[10px] px-2 py-1 rounded-lg font-bold ${diff===d?"bg-brand-500 text-white":"bg-gray-100"}`}>{d}</button>
          ))}
        </div>
        <div className="text-xs font-bold">⭐ {score} pts · 🔥 {streak} streak</div>
      </div>
      <div className="text-center">
        <div className="text-4xl mb-2">{face}</div>
        <div className="text-xl font-mono tracking-[0.5em] font-black">{display.join("")}</div>
        <div className="mt-1 text-xs text-gray-400">{word.length} letters · {maxWrong-wrong} tries left</div>
        {won && <div className="mt-2 text-emerald-600 font-bold text-sm animate-bounce">🎉 Correct! +{diff==="hard"?30:diff==="medium"?20:10} pts</div>}
        {lost && <div className="mt-2 text-red-600 font-bold text-sm">💀 The word was: <span className="text-black">{word}</span></div>}
      </div>
      {!won && !lost ? (
        <div className="flex flex-wrap gap-1 justify-center">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => (
            <button key={l} onClick={()=>guess(l)} disabled={guessed.has(l)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition ${guessed.has(l) ? (word.includes(l) ? "bg-emerald-200 text-emerald-800" : "bg-red-200 text-red-800 opacity-50") : "bg-white border hover:bg-gray-50 active:scale-90"}`}>
              {l}
            </button>
          ))}
        </div>
      ) : (
        <button onClick={()=>newWord(diff)} className="w-full py-2 bg-gray-800 text-white rounded-xl font-bold text-sm">Next Word</button>
      )}
    </div>
  );
}

// ============================
// MATH CHALLENGE GAME
// ============================
function MathChallenge() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [question, setQuestion] = useState({ text: "", answer: 0 });
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameOver, setGameOver] = useState(false);
  const [total, setTotal] = useState(0);

  const genQuestion = useCallback((lv: number) => {
    const max = lv <= 3 ? 10 : lv <= 6 ? 50 : 100;
    const op = MATH_OPS[Math.floor(Math.random()*Math.min(lv, 3))];
    let a = Math.floor(Math.random()*max)+1, b = Math.floor(Math.random()*max)+1;
    if (op === "-" && a < b) [a,b] = [b,a];
    const ans = op==="+"?a+b:op==="-"?a-b:a*b;
    return { text: `${a} ${op} ${b} = ?`, answer: ans };
  }, []);

  useEffect(() => { setQuestion(genQuestion(level)); setTimeLeft(Math.max(8, 18-level)); }, [level, genQuestion]);

  useEffect(() => {
    if (gameOver || !question.text) return;
    const t = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { setLives(l => { if (l<=1) setGameOver(true); return l-1; }); setFeedback("⏰ Time's up!"); setQuestion(genQuestion(level)); return Math.max(8,18-level); } return p-1; });
    }, 1000);
    return () => clearInterval(t);
  }, [question, gameOver, level, genQuestion]);

  const submit = () => {
    const ans = parseInt(input);
    if (isNaN(ans)) return;
    setTotal(t=>t+1);
    if (ans === question.answer) {
      const pts = level * 10;
      setScore(s => s+pts); setFeedback(`✅ Correct! +${pts}`);
      if (total > 0 && (total+1) % 5 === 0) setLevel(l=>l+1);
    } else {
      setLives(l => { if (l<=1) setGameOver(true); return l-1; });
      setFeedback(`❌ Wrong! Answer was ${question.answer}`);
    }
    setInput("");
    if (!gameOver) { setQuestion(genQuestion(level)); setTimeLeft(Math.max(8,18-level)); }
  };

  if (gameOver) return (
    <div className="text-center py-6 space-y-3">
      <div className="text-5xl">🏆</div>
      <h3 className="text-lg font-bold">Game Over!</h3>
      <p className="text-2xl font-black text-brand-600">{score} points</p>
      <p className="text-sm text-gray-500">Level {level} · {total} questions answered</p>
      <button onClick={()=>{setScore(0);setLives(3);setLevel(1);setTotal(0);setGameOver(false);setFeedback("");setQuestion(genQuestion(1));}} className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold">Play Again</button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold">
        <span>Level {level}</span>
        <span>⭐ {score}</span>
        <span>{"❤️".repeat(lives)}{"🖤".repeat(3-lives)}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-brand-500 transition-all" style={{width:`${(timeLeft/Math.max(8,18-level))*100}%`}} /></div>
      <div className="text-center">
        <div className="text-3xl font-black py-4">{question.text}</div>
        {feedback && <div className={`text-sm font-bold mb-2 ${feedback.includes("✅")?"text-emerald-600":"text-red-600"}`}>{feedback}</div>}
      </div>
      <div className="flex gap-2">
        <input type="number" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
          className="flex-1 text-center text-xl font-bold border-2 border-gray-300 rounded-xl py-2 focus:border-brand-500 outline-none" placeholder="?" autoFocus />
        <button onClick={submit} className="px-6 py-2 bg-brand-600 text-white rounded-xl font-bold">Go</button>
      </div>
    </div>
  );
}

// ============================
// SPELLING BEE GAME
// ============================
function SpellingBee() {
  const [diff, setDiff] = useState<"easy"|"medium"|"hard">("easy");
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<{word:string;correct:boolean}[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [done, setDone] = useState(false);

  const words = SPELLING_WORDS[diff] || SPELLING_WORDS.easy;
  const current = words[idx];

  const speak = (w: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(w);
      u.rate = 0.8; u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    }
  };

  const submit = () => {
    const correct = input.toUpperCase().trim() === current.word;
    if (correct) setScore(s => s + (diff==="hard"?30:diff==="medium"?20:10));
    setResults(r => [...r, { word: current.word, correct }]);
    setShowResult(true);
  };

  const next = () => {
    setShowResult(false); setInput("");
    if (idx + 1 >= words.length) setDone(true);
    else setIdx(i => i+1);
  };

  const restart = () => { setIdx(0); setInput(""); setScore(0); setResults([]); setShowResult(false); setDone(false); };

  if (done) return (
    <div className="text-center py-6 space-y-3">
      <div className="text-5xl">🐝</div>
      <h3 className="text-lg font-bold">Spelling Bee Complete!</h3>
      <p className="text-2xl font-black text-brand-600">{score} points</p>
      <p className="text-sm text-gray-500">{results.filter(r=>r.correct).length}/{results.length} correct</p>
      <div className="flex flex-wrap gap-1 justify-center">
        {results.map((r,i) => <span key={i} className={`text-[10px] px-2 py-1 rounded-full font-bold ${r.correct?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>{r.correct?"✅":"❌"} {r.word}</span>)}
      </div>
      <button onClick={restart} className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold">Play Again</button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">{(["easy","medium","hard"] as const).map(d => (
          <button key={d} onClick={()=>{setDiff(d);restart();}} className={`text-[10px] px-2 py-1 rounded-lg font-bold ${diff===d?"bg-amber-500 text-white":"bg-gray-100"}`}>{d}</button>
        ))}</div>
        <span className="text-xs font-bold">⭐ {score} · {idx+1}/{words.length}</span>
      </div>
      <div className="text-center py-4">
        <div className="text-4xl mb-2">🐝</div>
        <p className="text-sm text-gray-500 mb-1">Hint: <span className="font-bold text-gray-700">{current.hint}</span></p>
        <button onClick={()=>speak(current.word)} className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl text-sm font-bold hover:bg-amber-200 mb-3">🔊 Hear the word</button>
        {showResult ? (
          <div className={`py-3 rounded-xl font-bold ${results[results.length-1]?.correct?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}>
            {results[results.length-1]?.correct ? "✅ Correct!" : `❌ Wrong! Correct spelling: ${current.word}`}
          </div>
        ) : (
          <div className="flex gap-2 max-w-xs mx-auto">
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
              className="flex-1 text-center text-lg font-bold border-2 rounded-xl py-2 uppercase tracking-wider focus:border-amber-500 outline-none" placeholder="Type spelling..." autoFocus />
            <button onClick={submit} className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold">Check</button>
          </div>
        )}
      </div>
      {showResult && <button onClick={next} className="w-full py-2 bg-gray-800 text-white rounded-xl font-bold text-sm">{idx+1>=words.length?"See Results":"Next Word"}</button>}
    </div>
  );
}

// ============================
// MEMORY MATCH GAME
// ============================
function MemoryMatch() {
  const emojis = ["🍎","🍊","🍋","🍇","🍉","🍓","🌟","🎈"];
  const [cards, setCards] = useState<{emoji:string;flipped:boolean;matched:boolean}[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [best, setBest] = useState(999);

  const init = useCallback(() => {
    const deck = [...emojis,...emojis].sort(()=>Math.random()-0.5).map(e=>({emoji:e,flipped:false,matched:false}));
    setCards(deck); setFlipped([]); setMoves(0); setMatches(0);
  }, []);

  useEffect(()=>{ init(); }, [init]);

  const flip = (i: number) => {
    if (flipped.length >= 2 || cards[i].flipped || cards[i].matched) return;
    const nc = [...cards]; nc[i].flipped = true; setCards(nc);
    const nf = [...flipped, i]; setFlipped(nf);
    if (nf.length === 2) {
      setMoves(m=>m+1);
      if (cards[nf[0]].emoji === nc[i].emoji) {
        setTimeout(()=>{
          const mc = [...nc]; mc[nf[0]].matched=true; mc[nf[1]].matched=true; setCards(mc); setFlipped([]);
          setMatches(m=>{const nm=m+1; if(nm===emojis.length) setBest(b=>Math.min(b,moves+1)); return nm;});
        },300);
      } else {
        setTimeout(()=>{const uc=[...nc];uc[nf[0]].flipped=false;uc[nf[1]].flipped=false;setCards(uc);setFlipped([]);},800);
      }
    }
  };

  const won = matches === emojis.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold">
        <span>Moves: {moves}</span>
        <span>Matched: {matches}/{emojis.length}</span>
        {best < 999 && <span>Best: {best}</span>}
      </div>
      {won && <div className="text-center py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold animate-bounce">🎉 You Won in {moves} moves!</div>}
      <div className="grid grid-cols-4 gap-2 max-w-[240px] mx-auto">
        {cards.map((c,i) => (
          <button key={i} onClick={()=>flip(i)} disabled={c.flipped||c.matched}
            className={`w-14 h-14 rounded-xl text-2xl font-bold transition-all transform ${c.flipped||c.matched?"bg-white border-2 border-brand-300 scale-100":"bg-brand-500 hover:bg-brand-600 scale-95 hover:scale-100"}`}>
            {c.flipped||c.matched?c.emoji:"?"}
          </button>
        ))}
      </div>
      {won && <button onClick={init} className="w-full py-2 bg-gray-800 text-white rounded-xl font-bold text-sm">Play Again</button>}
    </div>
  );
}

// ============================
// MAIN GAMES COMPONENT
// ============================
const GAMES = [
  { id: "tictactoe", name: "Tic Tac Toe", icon: "❌⭕", desc: "Classic X and O game", color: "from-blue-500 to-purple-500" },
  { id: "wordfill", name: "Word Fill", icon: "📝", desc: "Guess the hidden word", color: "from-emerald-500 to-teal-500" },
  { id: "math", name: "Math Challenge", icon: "🔢", desc: "Speed math problems", color: "from-orange-500 to-red-500" },
  { id: "spelling", name: "Spelling Bee", icon: "🐝", desc: "Spell words correctly", color: "from-amber-500 to-yellow-500" },
  { id: "memory", name: "Memory Match", icon: "🧠", desc: "Find matching pairs", color: "from-pink-500 to-rose-500" },
];

export default function SchoolGames({ studentId, studentName, schoolName, gradeLevel }: {
  studentId: string; studentName: string; schoolName: string; gradeLevel: string;
}) {
  const [active, setActive] = useState<string|null>(null);
  const [leaderboard, setLeaderboard] = useState<{name:string;score:number;game:string}[]>([]);
  const [tab, setTab] = useState<"games"|"leaderboard"|"competitions">("games");

  // Simulated leaderboard (would be DB-backed in full version)
  useEffect(() => {
    setLeaderboard([
      { name: studentName, score: 0, game: "All" },
      { name: "Top Player", score: 850, game: "Math Challenge" },
      { name: "Word Master", score: 720, game: "Word Fill" },
      { name: "Spell Champ", score: 640, game: "Spelling Bee" },
    ]);
  }, [studentName]);

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex gap-2 bg-white p-1 rounded-xl border">
        {([
          { id: "games" as const, label: "🎮 Games", count: GAMES.length },
          { id: "leaderboard" as const, label: "🏆 Leaderboard", count: null },
          { id: "competitions" as const, label: "🏅 Competitions", count: null },
        ]).map(t => (
          <button key={t.id} onClick={()=>{setTab(t.id);setActive(null);}}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${tab===t.id?"bg-brand-500 text-white shadow":"text-gray-500 hover:bg-gray-50"}`}>
            {t.label}{t.count?` (${t.count})`:""}
          </button>
        ))}
      </div>

      {/* GAMES TAB */}
      {tab === "games" && !active && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GAMES.map(g => (
            <button key={g.id} onClick={()=>setActive(g.id)}
              className="p-4 rounded-2xl bg-white border-2 border-gray-100 hover:border-brand-300 hover:shadow-lg transition-all text-center space-y-2 active:scale-95">
              <div className="text-4xl">{g.icon}</div>
              <h4 className="text-sm font-bold">{g.name}</h4>
              <p className="text-[10px] text-gray-400">{g.desc}</p>
              <div className={`text-[9px] px-3 py-1 rounded-full bg-gradient-to-r ${g.color} text-white font-bold`}>PLAY</div>
            </button>
          ))}
          {/* Coming soon cards */}
          {["🏃 Race", "🧩 Puzzle"].map(g => (
            <div key={g} className="p-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 text-center space-y-2 opacity-60">
              <div className="text-3xl">{g.split(" ")[0]}</div>
              <h4 className="text-sm font-bold text-gray-400">{g.split(" ").slice(1).join(" ")}</h4>
              <p className="text-[10px] text-gray-300">Coming Soon</p>
            </div>
          ))}
        </div>
      )}

      {/* Active game */}
      {tab === "games" && active && (
        <div className="bg-white rounded-2xl border-2 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <button onClick={()=>setActive(null)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">← All Games</button>
            <h3 className="text-sm font-bold">{GAMES.find(g=>g.id===active)?.icon} {GAMES.find(g=>g.id===active)?.name}</h3>
            <div />
          </div>
          {active === "tictactoe" && <TicTacToe playerName={studentName} />}
          {active === "wordfill" && <WordFill />}
          {active === "math" && <MathChallenge />}
          {active === "spelling" && <SpellingBee />}
          {active === "memory" && <MemoryMatch />}
        </div>
      )}

      {/* LEADERBOARD TAB */}
      {tab === "leaderboard" && (
        <div className="bg-white rounded-2xl border-2 p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">🏆 {schoolName} Leaderboard</h3>
          <p className="text-xs text-gray-400">Top players across all games this term</p>
          <div className="space-y-2">
            {/* Podium */}
            <div className="flex items-end justify-center gap-2 py-4">
              <div className="text-center"><div className="w-14 h-20 bg-gray-200 rounded-t-xl flex items-end justify-center pb-1"><span className="text-lg">🥈</span></div><p className="text-[9px] font-bold mt-1">2nd</p></div>
              <div className="text-center"><div className="w-14 h-28 bg-amber-200 rounded-t-xl flex items-end justify-center pb-1"><span className="text-xl">🥇</span></div><p className="text-[9px] font-bold mt-1">1st</p></div>
              <div className="text-center"><div className="w-14 h-16 bg-orange-100 rounded-t-xl flex items-end justify-center pb-1"><span className="text-lg">🥉</span></div><p className="text-[9px] font-bold mt-1">3rd</p></div>
            </div>
            {/* List */}
            {leaderboard.sort((a,b)=>b.score-a.score).map((p,i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${p.name===studentName?"bg-brand-50 border border-brand-200":"bg-gray-50"}`}>
                <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">{i+1}</span>
                <div className="flex-1"><p className="text-sm font-bold">{p.name}{p.name===studentName?" (You)":""}</p><p className="text-[10px] text-gray-400">{p.game}</p></div>
                <span className="text-sm font-black text-brand-600">{p.score}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center">Play games to earn points and climb the leaderboard!</p>
        </div>
      )}

      {/* COMPETITIONS TAB */}
      {tab === "competitions" && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border-2 p-4 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">🏅 Active Competitions</h3>
            {/* Competition cards */}
            <div className="space-y-2">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔢</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">Weekly Math Championship</h4>
                    <p className="text-[10px] text-gray-500">Compete against all {gradeLevel} students in speed math</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">🏆 Prize: Star Student Badge</span>
                      <span className="text-[9px] text-gray-400">Ends Friday</span>
                    </div>
                  </div>
                  <button onClick={()=>{setTab("games");setActive("math");}} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600">Join</button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🐝</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">Spelling Bee Tournament</h4>
                    <p className="text-[10px] text-gray-500">Test your spelling against the whole school</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">🏆 Prize: Spelling Champion</span>
                      <span className="text-[9px] text-gray-400">Ends next week</span>
                    </div>
                  </div>
                  <button onClick={()=>{setTab("games");setActive("spelling");}} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600">Join</button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🧠</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">Memory Master Challenge</h4>
                    <p className="text-[10px] text-gray-500">Who can match all pairs in fewest moves?</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-bold">🏆 Prize: Brain Power Badge</span>
                      <span className="text-[9px] text-gray-400">Always open</span>
                    </div>
                  </div>
                  <button onClick={()=>{setTab("games");setActive("memory");}} className="px-4 py-2 bg-purple-500 text-white rounded-xl text-xs font-bold hover:bg-purple-600">Join</button>
                </div>
              </div>
            </div>
          </div>

          {/* Past competition results */}
          <div className="bg-white rounded-2xl border-2 p-4 space-y-2">
            <h4 className="text-sm font-bold">📜 Past Results</h4>
            <div className="text-center py-4 text-gray-400 text-xs">
              <p>No completed competitions yet.</p>
              <p className="text-[10px]">Join a competition above to start competing!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
