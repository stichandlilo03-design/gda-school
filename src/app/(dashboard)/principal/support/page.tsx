"use client";
import { useState, useEffect } from "react";
import DashboardHeader from "@/components/layout/dashboard-header";
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];
const STATUS_COLORS: Record<string, string> = { OPEN: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-amber-100 text-amber-700", RESOLVED: "bg-emerald-100 text-emerald-700", CLOSED: "bg-gray-100 text-gray-500" };

export default function PrincipalSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"new" | "history">("new");

  const loadTickets = async () => {
    const r = await fetch("/api/support");
    if (r.ok) setTickets(await r.json());
  };
  useEffect(() => { loadTickets(); }, []);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, message, priority }) });
    setSubject(""); setMessage(""); setPriority("NORMAL");
    await loadTickets();
    setLoading(false);
    setTab("history");
  };

  return (
    <>
      <DashboardHeader title="Support" subtitle="Contact GDA Schools admin for help" />
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="flex gap-2 mb-6">
          {(["new", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-bold ${tab === t ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}>
              {t === "new" ? "New Ticket" : `My Tickets (${tickets.length})`}
            </button>
          ))}
        </div>

        {tab === "new" && (
          <div className="bg-white rounded-2xl border p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Submit a Support Ticket</h3>
            <p className="text-xs text-gray-500">Describe your issue and our team will respond as soon as possible.</p>
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
            <button onClick={submit} disabled={loading || !subject.trim() || !message.trim()} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Ticket
            </button>
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-3">
            {tickets.length === 0 && <p className="text-center text-gray-400 py-12">No support tickets yet</p>}
            {tickets.map(t => (
              <div key={t.id} className="bg-white rounded-xl border p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">{t.subject}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(t.createdAt).toLocaleString()} | Priority: {t.priority}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLORS[t.status] || "bg-gray-100"}`}>{t.status}</span>
                </div>
                <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">{t.message}</p>
                {t.adminReply && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-[10px] font-bold text-blue-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Admin Reply</p>
                    <p className="text-xs text-blue-800 mt-1">{t.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
