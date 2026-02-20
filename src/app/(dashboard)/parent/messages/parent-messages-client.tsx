"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, getMessagesWith, markAllRead } from "@/lib/actions/messages";
import { Send, MessageSquare, Users, Search, ArrowLeft, Loader2 } from "lucide-react";

export default function ParentMessagesClient({ userId, contacts, messages }: {
  userId: string; contacts: any[]; messages: any[];
}) {
  const router = useRouter();
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [search, setSearch] = useState("");
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Build conversation list from messages
  const convMap = new Map<string, any>();
  messages.forEach(msg => {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const partner = msg.senderId === userId ? msg.receiver : msg.sender;
    if (!convMap.has(partnerId)) {
      const unread = messages.filter(m => m.senderId === partnerId && m.receiverId === userId && !m.isRead).length;
      convMap.set(partnerId, { partner, lastMessage: msg, unread });
    }
  });
  const conversations = Array.from(convMap.values());

  // Merge contacts not yet chatted with
  const allContacts = [
    ...contacts.filter(c => !convMap.has(c.id)).map(c => ({
      partner: c, lastMessage: null, unread: 0,
      meta: { schoolName: c.schoolName, childName: c.childName, type: c.type },
    })),
  ];

  const filteredConvs = conversations.filter(c =>
    !search || c.partner.name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredContacts = allContacts.filter(c =>
    !search || c.partner.name?.toLowerCase().includes(search.toLowerCase())
  );

  const loadChat = async (contact: any) => {
    setSelectedContact(contact);
    setLoadingChat(true);
    const result = await getMessagesWith(contact.id);
    if (result.messages) setChatMessages(result.messages);
    setLoadingChat(false);
    if (conversations.find(c => c.partner.id === contact.id)?.unread > 0) {
      await markAllRead(contact.id);
      router.refresh();
    }
  };

  // Auto-scroll to bottom
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Polling for new messages
  useEffect(() => {
    if (!selectedContact) return;
    const interval = setInterval(async () => {
      const result = await getMessagesWith(selectedContact.id);
      if (result.messages) setChatMessages(result.messages);
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedContact]);

  const handleSend = async () => {
    if (!newMsg.trim() || !selectedContact) return;
    setSending(true);
    await sendMessage({ receiverId: selectedContact.id, content: newMsg.trim() });
    setNewMsg("");
    const result = await getMessagesWith(selectedContact.id);
    if (result.messages) setChatMessages(result.messages);
    setSending(false);
    router.refresh();
  };

  const roleColor = (role: string) => {
    if (role === "PRINCIPAL") return "bg-purple-100 text-purple-700";
    if (role === "TEACHER") return "bg-emerald-100 text-emerald-700";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[400px]">
      {/* Sidebar */}
      <div className={`${selectedContact ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-80 bg-white rounded-2xl border border-gray-200 overflow-hidden`}>
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input className="input-field pl-9 text-xs" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Existing conversations */}
          {filteredConvs.length > 0 && (
            <div className="px-3 py-2"><p className="text-[9px] font-bold text-gray-400 uppercase">Conversations</p></div>
          )}
          {filteredConvs.map(conv => (
            <div key={conv.partner.id}
              onClick={() => loadChat(conv.partner)}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 ${selectedContact?.id === conv.partner.id ? "bg-brand-50" : ""}`}>
              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {conv.partner.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium truncate">{conv.partner.name}</span>
                  <span className={`text-[7px] px-1 py-0.5 rounded ${roleColor(conv.partner.role)}`}>{conv.partner.role}</span>
                </div>
                {conv.lastMessage && (
                  <p className="text-[10px] text-gray-400 truncate">{conv.lastMessage.content?.slice(0, 40)}</p>
                )}
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{conv.unread}</span>
              )}
            </div>
          ))}

          {/* New contacts */}
          {filteredContacts.length > 0 && (
            <div className="px-3 py-2 mt-2"><p className="text-[9px] font-bold text-gray-400 uppercase">Your Children&apos;s Staff</p></div>
          )}
          {filteredContacts.map(item => (
            <div key={item.partner.id}
              onClick={() => loadChat(item.partner)}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
              <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {item.partner.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium truncate">{item.partner.name}</span>
                  <span className={`text-[7px] px-1 py-0.5 rounded ${roleColor(item.partner.role)}`}>{item.meta?.type}</span>
                </div>
                <p className="text-[10px] text-gray-400 truncate">{item.meta?.schoolName} · {item.meta?.childName}&apos;s {item.meta?.type?.toLowerCase()}</p>
              </div>
            </div>
          ))}

          {filteredConvs.length === 0 && filteredContacts.length === 0 && (
            <div className="p-4 text-center text-xs text-gray-400">No contacts found</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!selectedContact ? "hidden lg:flex" : "flex"} flex-1 flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden`}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b flex items-center gap-3">
              <button onClick={() => setSelectedContact(null)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                {selectedContact.name?.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">{selectedContact.name}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded ${roleColor(selectedContact.role)}`}>{selectedContact.role}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingChat ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Start a conversation with {selectedContact.name}</p>
                </div>
              ) : (
                chatMessages.map((msg: any) => {
                  const isMine = msg.senderId === userId;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${isMine ? "bg-rose-500 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"}`}>
                        <p className="text-xs">{msg.content}</p>
                        <p className={`text-[8px] mt-0.5 ${isMine ? "text-rose-200" : "text-gray-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={msgEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <input className="input-field flex-1 text-xs" placeholder="Type a message..."
                  value={newMsg} onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()} />
                <button onClick={handleSend} disabled={sending || !newMsg.trim()}
                  className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:opacity-50">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Select a contact to start chatting</p>
              <p className="text-xs text-gray-400 mt-1">Message your children&apos;s teachers and school principals</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
