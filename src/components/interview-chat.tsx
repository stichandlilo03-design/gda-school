"use client";

import { useState, useEffect, useRef } from "react";
import { sendInterviewMessage, getInterviewMessages } from "@/lib/actions/chat";
import { Send, Loader2, MessageSquare, X, RefreshCw } from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  senderName: string;
  senderRole: string;
  senderId: string;
  createdAt: string;
  isMe: boolean;
}

export default function InterviewChat({ interviewId, onClose }: { interviewId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = async () => {
    const result = await getInterviewMessages(interviewId);
    if (result.messages) {
      setMessages(result.messages);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    // Poll every 3 seconds
    intervalRef.current = setInterval(fetchMessages, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [interviewId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    const result = await sendInterviewMessage({ interviewId, content: newMessage.trim() });
    if (!result.error) {
      setNewMessage("");
      await fetchMessages();
    }
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-600 text-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-semibold">Interview Chat</span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">#{interviewId.slice(-6)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchMessages} className="p-1 hover:bg-white/20 rounded" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-10 h-10 mb-2" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${msg.isMe ? "order-2" : ""}`}>
                <div className={`rounded-2xl px-4 py-2.5 ${
                  msg.isMe
                    ? "bg-brand-600 text-white rounded-br-md"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className={`flex items-center gap-2 mt-1 ${msg.isMe ? "justify-end" : ""}`}>
                  <span className={`text-[10px] ${msg.isMe ? "text-gray-400" : "text-gray-400"}`}>
                    {msg.senderName}
                    <span className={`ml-1 px-1 py-0.5 rounded text-[8px] font-bold ${
                      msg.senderRole === "PRINCIPAL" ? "bg-purple-100 text-purple-600" :
                      msg.senderRole === "TEACHER" ? "bg-emerald-100 text-emerald-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>{msg.senderRole}</span>
                  </span>
                  <span className="text-[10px] text-gray-300">{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:bg-white focus:ring-2 focus:ring-brand-300 transition-colors"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
