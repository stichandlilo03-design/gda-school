"use client";
import { useState, useEffect, useRef } from "react";
import DashboardHeader from "@/components/layout/dashboard-header";
import { MessageSquare, Send, CheckCircle, Loader2, ArrowLeft, Plus } from "lucide-react";

const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];
const STATUS_COLORS: Record<string, string> = { OPEN: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-amber-100 text-amber-700", RESOLVED: "bg-emerald-100 text-emerald-700", CLOSED: "bg-gray-100 text-gray-500" };

type Thread = { from: string; text: string; at: string }[];

function getThread(ticket: any): Thread {
  // Build thread from adminNote (JSON array) or fallback to message + adminReply
  let thread: Thread = [];
  try {
    if (ticket.adminNote) thread = JSON.parse(ticket.adminNote);
  } catch (_e) {}
  // If no thread yet, build from existing fields
  if (thread.length === 0) {
    thread.push({ from: "principal", text: ticket.message, at: ticket.createdAt });
    if (ticket.adminReply) {
      thread.push({ from: "admin", text: ticket.adminReply, at: ticket.updatedAt || ticket.createdAt });
    }
  }
  return thread;
}

export default function PrincipalSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"list" | "new" | "thread">("list");
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [reply, setReply] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);

  const loadTickets = async () => {
    const r = await fetch("/api/support");
    if (r.ok) setTickets(await r.json());
  };
  useEffect(() => { loadTickets(); }, []);

  // Poll active ticket for updates
  useEffect(() => {
    if (!activeTicket) return;
    const poll = async () => {
      const r = await fetch("/api/support");
      if (r.ok) {
        const all = await r.json();
        setTickets(all);
        const updated = all.find((t: any) => t.id === activeTicket.id);
        if (updated) setActiveTicket(updated);
      }
    };
    const i = setInterval(poll, 8000);
    return () => clearInterval(i);
  }, [activeTicket?.id]);

  useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeTicket]);

  const submitNewTicket = async () => {
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, message, priority }) });
    setSubject(""); setMessage(""); setPriority("NORMAL");
    await loadTickets();
    setLoading(false);
    setView("list");
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeTicket) return;
    setLoading(true);
    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reply", ticketId: activeTicket.id, message: reply }),
    });
    setReply("");
    // Refresh
    const r = await fetch("/api/support");
    if (r.ok) {
      const all = await r.json();
      setTickets(all);
      const updated = all.find((t: any) => t.id === activeTicket.id);
      if (updated) setActiveTicket(updated);
    }
    setLoading(false);
  };

  const openTickets = tickets.filter(t => t.status !== "CLOSED");
  const closedTickets = tickets.filter(t => t.status === "CLOSED");

  return (
    <>
      <DashboardHeader title="Support" subtitle="Contact GDA Schools admin for help" />
      <div className="p-6 lg:p-8 max-w-4xl">
        {/* LIST VIEW */}
        {view === "list" && (
          <>
            <button onClick={() => setView("new")} className="btn-primary mb-6 flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Support Ticket
            </button>

            {tickets.length === 0 && (
              <div className="text-center py-16">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No support tickets yet</p>
                <p className="text-xs text-gray-400 mt-1">Submit a ticket if you need help from the GDA team</p>
              </div>
            )}

            {openTickets.length > 0 && (
              <>
                <p className="text-xs font-bold text-gray-500 mb-2">ACTIVE ({openTickets.length})</p>
                {openTickets.map(t => (
                  <TicketCard key={t.id} ticket={t} onClick={() => { setActiveTicket(t); setView("thread"); }} />
                ))}
              </>
            )}

            {closedTickets.length > 0 && (
              <>
                <p className="text-xs font-bold text-gray-400 mt-6 mb-2">CLOSED ({closedTickets.length})</p>
                {closedTickets.map(t => (
                  <TicketCard key={t.id} ticket={t} onClick={() => { setActiveTicket(t); setView("thread"); }} />
                ))}
              </>
            )}
          </>
        )}

        {/* NEW TICKET */}
        {view === "new" && (
          <div className="bg-white rounded-2xl border p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <button onClick={() => setView("list")} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-4 h-4" /></button>
              <h3 className="text-sm font-bold text-gray-700">New Support Ticket</h3>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Subject</label>
              <input className="input-field w-full mt-1" placeholder="Brief description of your issue..." value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Priority</label>
              <div className="flex gap-2 mt-1">
                {PRIORITIES.map(p => (
                  <button key={p} onClick={() => setPriority(p)} className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${priority === p ? (p === "URGENT" ? "bg-red-500 text-white border-red-500" : p === "HIGH" ? "bg-amber-500 text-white border-amber-500" : "bg-brand-600 text-white border-brand-600") : "bg-white text-gray-600 border-gray-200"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Message</label>
              <textarea className="input-field w-full mt-1" rows={5} placeholder="Describe your issue in detail..." value={message} onChange={e => setMessage(e.target.value)} />
            </div>
            <button onClick={submitNewTicket} disabled={loading || !subject.trim() || !message.trim()} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Ticket
            </button>
          </div>
        )}

        {/* THREAD VIEW — Chat-style conversation */}
        {view === "thread" && activeTicket && (
          <div className="bg-white rounded-2xl border shadow-sm flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <button onClick={() => { setView("list"); setActiveTicket(null); }} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-4 h-4" /></button>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">{activeTicket.subject}</h4>
                  <p className="text-[10px] text-gray-400">{new Date(activeTicket.createdAt).toLocaleString()} | Priority: {activeTicket.priority}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${STATUS_COLORS[activeTicket.status] || "bg-gray-100"}`}>{activeTicket.status}</span>
            </div>

            {/* Messages thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
              {getThread(activeTicket).map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "admin" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.from === "admin" ? "bg-blue-50 border border-blue-200 rounded-bl-md" : "bg-brand-600 text-white rounded-br-md"}`}>
                    <p className={`text-[9px] font-bold mb-0.5 ${msg.from === "admin" ? "text-blue-600" : "text-brand-200"}`}>
                      {msg.from === "admin" ? "🛡️ GDA Admin" : "You"}
                    </p>
                    <p className={`text-sm leading-relaxed ${msg.from === "admin" ? "text-gray-800" : "text-white"}`}>{msg.text}</p>
                    <p className={`text-[8px] mt-1 ${msg.from === "admin" ? "text-blue-400" : "text-brand-200"}`}>
                      {new Date(msg.at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={threadEndRef} />

              {activeTicket.status === "RESOLVED" && (
                <div className="flex items-center gap-2 justify-center py-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-emerald-600 font-medium">This ticket has been resolved</p>
                </div>
              )}
              {activeTicket.status === "CLOSED" && (
                <div className="flex items-center gap-2 justify-center py-2">
                  <p className="text-xs text-gray-400">This ticket is closed</p>
                </div>
              )}
            </div>

            {/* Reply input — only if ticket is not CLOSED */}
            {activeTicket.status !== "CLOSED" && (
              <div className="p-3 border-t bg-white">
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-200"
                    placeholder={activeTicket.status === "RESOLVED" ? "Reopen with a follow-up..." : "Type your reply..."}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply()}
                  />
                  <button onClick={sendReply} disabled={loading || !reply.trim()} className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function TicketCard({ ticket, onClick }: { ticket: any; onClick: () => void }) {
  const thread = getThread(ticket);
  const lastMsg = thread[thread.length - 1];
  const hasAdminReply = thread.some(m => m.from === "admin");
  const unread = hasAdminReply && thread[thread.length - 1].from === "admin";

  return (
    <button onClick={onClick} className={`w-full text-left bg-white rounded-xl border p-4 shadow-sm mb-2 hover:border-brand-300 transition ${unread ? "border-blue-300 bg-blue-50/30" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-800 truncate">{ticket.subject}</h4>
            {unread && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">{new Date(ticket.createdAt).toLocaleString()} | {ticket.priority}</p>
          <p className="text-xs text-gray-500 mt-1 truncate">
            {lastMsg.from === "admin" ? "🛡️ Admin: " : "You: "}{lastMsg.text}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 ml-3">
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[ticket.status] || "bg-gray-100"}`}>{ticket.status}</span>
          <span className="text-[9px] text-gray-400">{thread.length} message{thread.length > 1 ? "s" : ""}</span>
        </div>
      </div>
    </button>
  );
}
