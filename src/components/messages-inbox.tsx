"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Send, Loader2, ArrowLeft, Search, Check, CheckCheck, X, Plus
} from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  PRINCIPAL: "bg-purple-100 text-purple-700",
  TEACHER: "bg-emerald-100 text-emerald-700",
  STUDENT: "bg-blue-100 text-blue-700",
  PARENT: "bg-amber-100 text-amber-700",
  ADMIN: "bg-red-100 text-red-700",
  SUPER_ADMIN: "bg-red-100 text-red-700",
};

export default function MessagesInbox({
  conversations: initialConversations, contacts, currentUserId,
}: {
  conversations: any[]; contacts: any[]; currentUserId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeName, setActiveName] = useState("");
  const [activeRole, setActiveRole] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState(initialConversations);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeTarget, setComposeTarget] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeContent, setComposeContent] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Poll conversations every 8 seconds via API (reliable)
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/messages?action=conversations");
        if (res.ok) {
          const data = await res.json();
          if (data.conversations) setConversations(data.conversations);
        }
      } catch {}
    };
    const i = setInterval(poll, 8000);
    return () => clearInterval(i);
  }, []);

  const filteredConvs = conversations.filter((c: any) =>
    c.partner?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Open a chat with a user
  const openChat = async (userId: string, name: string, role: string) => {
    setActiveChat(userId);
    setActiveName(name);
    setActiveRole(role);
    setLoading("load");
    try {
      const res = await fetch("/api/messages?action=chat&with=" + userId);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
      }
    } catch {}
    setLoading("");
    // Refresh conversation unread counts
    try {
      const res = await fetch("/api/messages?action=conversations");
      if (res.ok) { const d = await res.json(); if (d.conversations) setConversations(d.conversations); }
    } catch {}
  };

  // Send a message via API
  const handleSend = async () => {
    if (!activeChat || !input.trim()) return;
    const text = input.trim();
    setInput("");
    setLoading("send");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: activeChat, content: text }),
      });
      if (res.ok) {
        // Refresh chat immediately
        const chatRes = await fetch("/api/messages?action=chat&with=" + activeChat);
        if (chatRes.ok) { const d = await chatRes.json(); if (d.messages) setMessages(d.messages); }
        // Refresh conversation list
        const convRes = await fetch("/api/messages?action=conversations");
        if (convRes.ok) { const d = await convRes.json(); if (d.conversations) setConversations(d.conversations); }
      }
    } catch {}
    setLoading("");
  };

  // Compose new message via API
  const handleCompose = async () => {
    if (!composeTarget || !composeContent.trim()) return;
    setLoading("compose");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: composeTarget, subject: composeSubject || undefined, content: composeContent }),
      });
      if (res.ok) {
        setShowCompose(false);
        setComposeTarget(""); setComposeSubject(""); setComposeContent("");
        const convRes = await fetch("/api/messages?action=conversations");
        if (convRes.ok) { const d = await convRes.json(); if (d.conversations) setConversations(d.conversations); }
        const contact = contacts.find((c: any) => c.id === composeTarget);
        if (contact) openChat(contact.id, contact.name, contact.role);
      }
    } catch {}
    setLoading("");
  };

  // Auto-scroll on new messages
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Poll active chat every 5 seconds via API
  useEffect(() => {
    if (!activeChat) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/messages?action=chat&with=" + activeChat);
        if (res.ok) { const d = await res.json(); if (d.messages) setMessages(d.messages); }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [activeChat]);

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Left: Conversations */}
      <div className={`w-full md:w-[340px] border-r border-gray-100 flex flex-col ${activeChat ? "hidden md:flex" : "flex"}`}>
        <div className="p-3 border-b border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Messages</h3>
            <button onClick={() => setShowCompose(true)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-brand-600 text-white font-medium flex items-center gap-1">
              <Plus className="w-3 h-3" /> New
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <input className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-xs outline-none" placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No conversations yet</p>
              <button onClick={() => setShowCompose(true)} className="text-xs text-brand-600 mt-2 hover:underline">Start one</button>
            </div>
          ) : (
            filteredConvs.map((conv: any) => (
              <button
                key={conv.partner.id}
                onClick={() => openChat(conv.partner.id, conv.partner.name, conv.partner.role)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${activeChat === conv.partner.id ? "bg-brand-50" : ""}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${conv.unread > 0 ? "bg-brand-200 text-brand-700" : "bg-gray-200 text-gray-600"}`}>
                  {conv.partner.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs truncate ${conv.unread > 0 ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                      {conv.partner.name}
                    </p>
                    <span className="text-[9px] text-gray-400 flex-shrink-0">{formatTime(conv.lastMessage.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={`text-[10px] truncate ${conv.unread > 0 ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                      {conv.lastMessage.senderId === currentUserId ? "You: " : ""}{conv.lastMessage.content}
                    </p>
                    {conv.unread > 0 && (
                      <span className="ml-2 min-w-[18px] h-[18px] bg-brand-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${ROLE_COLORS[conv.partner.role] || "bg-gray-100 text-gray-500"}`}>
                    {conv.partner.role}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Chat */}
      <div className={`flex-1 flex flex-col ${!activeChat ? "hidden md:flex" : "flex"}`}>
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Select a conversation or start a new one</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <button onClick={() => setActiveChat(null)} className="md:hidden p-1"><ArrowLeft className="w-4 h-4" /></button>
              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                {activeName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">{activeName}</h4>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ROLE_COLORS[activeRole] || "bg-gray-100 text-gray-500"}`}>{activeRole}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
              {loading === "load" ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12"><p className="text-xs text-gray-400">No messages yet. Say hello!</p></div>
              ) : (
                <>
                  {messages.map((msg: any, i: number) => {
                    const isMe = msg.senderId === currentUserId;
                    const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex items-center gap-2 my-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-[10px] text-gray-400 px-2">{new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>
                        )}
                        <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-brand-600 text-white rounded-br-md" : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"}`}>
                            {msg.subject && (
                              <p className={`text-[10px] font-bold mb-1 ${isMe ? "text-brand-200" : "text-brand-600"}`}>{msg.subject}</p>
                            )}
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : ""}`}>
                              <span className={`text-[9px] ${isMe ? "text-brand-200" : "text-gray-400"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {isMe && (
                                msg.isRead
                                  ? <CheckCheck className="w-3 h-3 text-brand-200" />
                                  : <Check className="w-3 h-3 text-brand-300" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                />
                <button
                  onClick={handleSend}
                  disabled={loading === "send" || !input.trim()}
                  className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {loading === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Compose new message modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-800">New Message</h3>
              <button onClick={() => setShowCompose(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">To *</label>
              <select className="input-field" value={composeTarget} onChange={(e) => setComposeTarget(e.target.value)}>
                <option value="">Select recipient</option>
                {contacts.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Subject (optional)</label>
              <input className="input-field" placeholder="e.g. Meeting tomorrow" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Message *</label>
              <textarea className="input-field min-h-[100px]" placeholder="Write your message..." value={composeContent} onChange={(e) => setComposeContent(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCompose} disabled={loading === "compose" || !composeTarget || !composeContent.trim()} className="btn-primary flex-1">
                {loading === "compose" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Send Message
              </button>
              <button onClick={() => setShowCompose(false)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h";
  if (diff < 604800000) return Math.floor(diff / 86400000) + "d";
  return d.toLocaleDateString();
}
