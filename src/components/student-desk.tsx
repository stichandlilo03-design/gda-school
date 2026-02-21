"use client";

import { useState, useRef, useEffect } from "react";
import {
  BookOpen, Download, FileText, Pencil, Save, Trash2, Plus, ChevronLeft,
  ChevronRight, X, BookMarked, FolderOpen, Clock, Bookmark, Loader2,
} from "lucide-react";

interface DeskProps {
  studentName: string;
  subjectName: string;
  boardLines: { text: string; color: string; time: number }[];
  isKG?: boolean;
}

// ========== NOTEBOOK ==========
function Notebook({ subjectName, studentName, isKG, onClose }: {
  subjectName: string; studentName: string; isKG?: boolean; onClose: () => void;
}) {
  const getKey = () => `notebook-${studentName}-${subjectName}`;
  const [pages, setPages] = useState<{id:string;content:string;date:string}[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [saved, setSaved] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getKey());
      if (stored) { setPages(JSON.parse(stored)); }
      else { setPages([{ id: "1", content: "", date: new Date().toLocaleDateString() }]); }
    } catch (_e) {
      setPages([{ id: "1", content: "", date: new Date().toLocaleDateString() }]);
    }
  }, []);

  const savePages = (p: typeof pages) => {
    setPages(p);
    try { localStorage.setItem(getKey(), JSON.stringify(p)); } catch (_e) {}
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const updateContent = (text: string) => {
    const updated = [...pages];
    updated[currentPage] = { ...updated[currentPage], content: text };
    savePages(updated);
  };

  const addPage = () => {
    const updated = [...pages, { id: String(Date.now()), content: "", date: new Date().toLocaleDateString() }];
    savePages(updated);
    setCurrentPage(updated.length - 1);
  };

  const deletePage = () => {
    if (pages.length <= 1) return;
    const updated = pages.filter((_, i) => i !== currentPage);
    savePages(updated);
    setCurrentPage(Math.max(0, currentPage - 1));
  };

  const downloadAll = () => {
    const text = pages.map((p, i) =>
      `--- Page ${i + 1} (${p.date}) ---\n${p.content || "(empty)"}\n`
    ).join("\n");
    const blob = new Blob([`${subjectName} Notebook — ${studentName}\n${"=".repeat(40)}\n\n${text}`], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${subjectName.replace(/\s/g, "-")}-notebook.txt`;
    a.click();
  };

  const page = pages[currentPage] || { content: "", date: "" };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-amber-50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Notebook cover */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookMarked className="w-5 h-5 text-amber-200" />
            <div>
              <h3 className="text-white font-bold text-sm">{subjectName} Notebook</h3>
              <p className="text-amber-300 text-[10px]">{studentName} • {pages.length} pages</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-[10px] text-emerald-300 animate-pulse">✓ Saved</span>}
            <button onClick={downloadAll} className="text-[10px] bg-amber-600 text-white px-2 py-1 rounded flex items-center gap-1">
              <Download className="w-3 h-3" /> Download All
            </button>
            <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center justify-between px-6 py-2 bg-amber-100 border-b border-amber-200">
          <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}
            className="p-1 rounded hover:bg-amber-200 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <div className="flex items-center gap-2">
            {pages.map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i)}
                className={`w-7 h-7 rounded-lg text-[10px] font-bold transition ${i === currentPage ? "bg-amber-700 text-white shadow" : "bg-white text-amber-700 hover:bg-amber-200"}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={addPage} className="w-7 h-7 rounded-lg bg-amber-200 text-amber-700 hover:bg-amber-300 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))} disabled={currentPage >= pages.length - 1}
            className="p-1 rounded hover:bg-amber-200 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>

        {/* Paper */}
        <div className="p-6 relative">
          <div className="absolute left-14 top-0 bottom-0 w-[2px] bg-red-300/50" />
          <p className="text-[9px] text-amber-400 mb-1 text-right">Page {currentPage + 1} • {page.date}</p>
          <textarea
            className={`w-full bg-transparent border-0 focus:ring-0 resize-none leading-8 ${
              isKG ? "text-lg font-bold" : "text-sm"
            }`}
            style={{
              backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #d4c5a9 31px, #d4c5a9 32px)",
              minHeight: "384px", paddingLeft: "56px", fontFamily: isKG ? "Comic Sans MS, cursive" : "Georgia, serif",
            }}
            placeholder={isKG ? "Write here... ✏️" : "Write your notes here..."}
            value={page.content}
            onChange={(e) => updateContent(e.target.value)}
          />
        </div>

        {/* Bottom */}
        <div className="px-6 py-2 bg-amber-100 border-t border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={deletePage} disabled={pages.length <= 1}
              className="text-[10px] text-red-500 hover:text-red-700 disabled:opacity-30 flex items-center gap-0.5">
              <Trash2 className="w-3 h-3" /> Delete Page
            </button>
          </div>
          <p className="text-[10px] text-amber-500">{page.content?.length || 0} characters</p>
        </div>
      </div>
    </div>
  );
}

// ========== MAIN DESK COMPONENT ==========
export default function StudentDesk({ studentName, subjectName, boardLines, isKG }: DeskProps) {
  const [showNotebook, setShowNotebook] = useState(false);
  const [showDesk, setShowDesk] = useState(false);
  const [savedBoards, setSavedBoards] = useState<{subject:string;lines:any[];date:string}[]>([]);
  const [savedNotes, setSavedNotes] = useState<{subject:string;text:string;date:string}[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [hwLoading, setHwLoading] = useState(false);

  // Load desk from localStorage
  useEffect(() => {
    try {
      const boards = localStorage.getItem(`desk-boards-${studentName}`);
      const notes = localStorage.getItem(`desk-notes-${studentName}`);
      if (boards) setSavedBoards(JSON.parse(boards));
      if (notes) setSavedNotes(JSON.parse(notes));
    } catch (_e) {}
  }, [studentName]);

  // Fetch homework when desk opens
  useEffect(() => {
    if (!showDesk) return;
    setHwLoading(true);
    fetch("/api/homework").then(r => r.json()).then(d => {
      setHomework(d.homework || []);
    }).catch(() => {}).finally(() => setHwLoading(false));
  }, [showDesk]);

  // Save board content to desk
  const saveBoardToDesk = () => {
    if (boardLines.length === 0) return;
    const entry = { subject: subjectName, lines: boardLines, date: new Date().toLocaleString() };
    const updated = [entry, ...savedBoards].slice(0, 50);
    setSavedBoards(updated);
    try { localStorage.setItem(`desk-boards-${studentName}`, JSON.stringify(updated)); } catch (_e) {}
  };

  // Download board as text
  const downloadBoard = () => {
    if (boardLines.length === 0) return;
    const text = boardLines.map((l) => l.text).join("\n");
    const content = `${subjectName} — Board Notes\nDate: ${new Date().toLocaleString()}\nTeacher's Board Content:\n${"─".repeat(40)}\n${text}`;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${subjectName.replace(/\s/g, "-")}-board-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
  };

  // Download board as image
  const downloadBoardImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = Math.max(200, 60 + boardLines.length * 30);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#1a3a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#8B7355";
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
    ctx.font = "bold 18px serif";
    ctx.fillStyle = "#FFFFFFBB";
    ctx.textAlign = "center";
    ctx.fillText(subjectName + " — " + new Date().toLocaleDateString(), canvas.width / 2, 35);
    boardLines.forEach((line, i) => {
      ctx.font = "15px Georgia, serif";
      ctx.fillStyle = line.color || "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(line.text || "", 25, 65 + i * 28);
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${subjectName.replace(/\s/g, "-")}-board.png`;
    a.click();
  };

  return (
    <>
      {/* Desk action buttons — shown in classroom */}
      <div className={`flex flex-wrap gap-1.5 ${isKG ? "mt-2" : "mt-1"}`}>
        <button onClick={downloadBoard} disabled={boardLines.length === 0}
          className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-40">
          <Download className="w-3 h-3" /> {isKG ? "📄 Save Text" : "Download Board (TXT)"}
        </button>
        <button onClick={downloadBoardImage} disabled={boardLines.length === 0}
          className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg font-medium bg-teal-100 text-teal-700 hover:bg-teal-200 disabled:opacity-40">
          <Download className="w-3 h-3" /> {isKG ? "🖼️ Save Picture" : "Download Board (IMG)"}
        </button>
        <button onClick={saveBoardToDesk} disabled={boardLines.length === 0}
          className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-40">
          <Bookmark className="w-3 h-3" /> {isKG ? "📚 Save to Desk" : "Save to My Desk"}
        </button>
        <button onClick={() => setShowNotebook(true)}
          className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg font-medium bg-orange-100 text-orange-700 hover:bg-orange-200">
          <Pencil className="w-3 h-3" /> {isKG ? "📓 My Notebook" : "Open Notebook"}
        </button>
        <button onClick={() => setShowDesk(true)}
          className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
          <FolderOpen className="w-3 h-3" /> {isKG ? "🗄️ My Desk" : "My Desk"}
        </button>
      </div>

      {/* Notebook modal */}
      {showNotebook && (
        <Notebook subjectName={subjectName} studentName={studentName} isKG={isKG} onClose={() => setShowNotebook(false)} />
      )}

      {/* Desk modal - saved boards & notes */}
      {showDesk && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDesk(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-indigo-200" />
                <div>
                  <h3 className="text-white font-bold">{isKG ? "🗄️ My School Desk" : "My Desk"}</h3>
                  <p className="text-indigo-200 text-[10px]">{savedBoards.length} saved boards • Your study materials</p>
                </div>
              </div>
              <button onClick={() => setShowDesk(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {/* Saved Boards */}
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4" /> Saved Board Content ({savedBoards.length})
              </h4>
              {savedBoards.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-400 text-sm mb-6">
                  No saved boards yet. Save the teacher&apos;s board during class!
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3 mb-6">
                  {savedBoards.map((board, i) => (
                    <div key={i} className="bg-gray-900 rounded-xl p-4 relative group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-400 font-medium">{board.subject}</span>
                        <span className="text-[9px] text-gray-500 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{board.date}</span>
                      </div>
                      <div className="space-y-0.5 max-h-32 overflow-y-auto">
                        {board.lines.map((l: any, j: number) => (
                          <p key={j} className="text-xs font-mono" style={{ color: l.color || "#fff" }}>{l.text}</p>
                        ))}
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                        <button onClick={() => {
                          const text = board.lines.map((l: any) => l.text).join("\n");
                          const blob = new Blob([`${board.subject}\n${board.date}\n${"─".repeat(30)}\n${text}`], { type: "text/plain" });
                          const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                          a.download = `${board.subject}-${i}.txt`; a.click();
                        }} className="text-[8px] bg-white/20 text-white px-1.5 py-0.5 rounded">📥</button>
                        <button onClick={() => {
                          const updated = savedBoards.filter((_, idx) => idx !== i);
                          setSavedBoards(updated);
                          try { localStorage.setItem(`desk-boards-${studentName}`, JSON.stringify(updated)); } catch (_e) {}
                        }} className="text-[8px] bg-red-500/50 text-white px-1.5 py-0.5 rounded">🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick access links */}
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                <BookMarked className="w-4 h-4" /> Quick Access
              </h4>

              {/* 📝 HOMEWORK SECTION */}
              {homework.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4" /> My Homework
                    <span className="text-[9px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full">{homework.filter((h: any) => !h.submitted).length} pending</span>
                  </h4>
                  <div className="space-y-2 mb-4">
                    {homework.filter((h: any) => !h.submitted).slice(0, 5).map((hw: any) => (
                      <a key={hw.id} href="/student/grades" className="block p-3 bg-brand-50 border border-brand-200 rounded-xl hover:bg-brand-100 transition group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-brand-200 text-brand-700 flex items-center justify-center text-lg shrink-0">
                            {hw.type === "QUIZ" ? "📝" : hw.type === "ASSIGNMENT" ? "📋" : "📚"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{hw.title}</p>
                            <p className="text-[10px] text-gray-500">{hw.subjectName || hw.className}</p>
                            {hw.description && <p className="text-[10px] text-gray-400 truncate mt-0.5">{hw.description}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            {hw.dueDate && (
                              <p className={`text-[9px] font-bold ${hw.overdue ? "text-red-600" : "text-amber-600"}`}>
                                {hw.overdue ? "⚠️ OVERDUE" : `Due: ${new Date(hw.dueDate).toLocaleDateString()}`}
                              </p>
                            )}
                            {hw.hasQuestions && <p className="text-[9px] text-brand-500">{hw.questionCount} questions</p>}
                            <p className="text-[9px] text-brand-600 font-medium group-hover:underline">Open →</p>
                          </div>
                        </div>
                      </a>
                    ))}
                    {homework.filter((h: any) => h.submitted).length > 0 && (
                      <div className="text-[10px] text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                        ✅ {homework.filter((h: any) => h.submitted).length} homework submitted
                      </div>
                    )}
                  </div>
                </div>
              )}
              {hwLoading && (
                <div className="text-center py-3 mb-4">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-gray-400" />
                  <p className="text-[10px] text-gray-400 mt-1">Loading homework...</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button onClick={() => { setShowDesk(false); setShowNotebook(true); }}
                  className="p-4 bg-orange-50 rounded-xl border border-orange-200 hover:bg-orange-100 text-center transition">
                  <span className="text-2xl">📓</span>
                  <p className="text-xs font-bold text-orange-800 mt-1">Notebook</p>
                  <p className="text-[9px] text-orange-500">Write notes</p>
                </button>
                <a href="/student/materials" className="p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 text-center transition">
                  <span className="text-2xl">📚</span>
                  <p className="text-xs font-bold text-blue-800 mt-1">Materials</p>
                  <p className="text-[9px] text-blue-500">Study resources</p>
                </a>
                <a href="/student/grades" className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 hover:bg-emerald-100 text-center transition">
                  <span className="text-2xl">📊</span>
                  <p className="text-xs font-bold text-emerald-800 mt-1">Grades</p>
                  <p className="text-[9px] text-emerald-500">My scores</p>
                </a>
                <a href="/student/grades" className="p-4 bg-rose-50 rounded-xl border border-rose-200 hover:bg-rose-100 text-center transition relative">
                  <span className="text-2xl">📝</span>
                  <p className="text-xs font-bold text-rose-800 mt-1">Homework</p>
                  <p className="text-[9px] text-rose-500">Do homework</p>
                  {homework.filter((h: any) => !h.submitted).length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center font-bold">
                      {homework.filter((h: any) => !h.submitted).length}
                    </span>
                  )}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
