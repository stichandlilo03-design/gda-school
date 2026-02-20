"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Search, MessageSquare, X, Check } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [previews, setPreviews] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine which portal user is in
  const portal = pathname.startsWith("/principal") ? "principal" : pathname.startsWith("/teacher") ? "teacher" : pathname.startsWith("/parent") ? "parent" : "student";
  const messagesLink = `/${portal}/messages`;

  // Fetch unread count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        setUnreadCount(data.count || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Fetch preview messages when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      fetch("/api/notifications/previews")
        .then((r) => r.json())
        .then((data) => setPreviews(data.messages || []))
        .catch(() => {});
    }
  }, [showDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." className="bg-transparent text-sm outline-none w-48 placeholder:text-gray-400" />
          </div>

          {/* Messages link */}
          <Link href={messagesLink} className="relative w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors" title="Messages">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Notification bell with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-4 h-4 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="max-h-[320px] overflow-y-auto">
                  {previews.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No notifications yet</p>
                    </div>
                  ) : (
                    previews.map((msg: any) => (
                      <Link
                        key={msg.id}
                        href={messagesLink}
                        onClick={() => setShowDropdown(false)}
                        className={`flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${!msg.isRead ? "bg-blue-50/50" : ""}`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${!msg.isRead ? "bg-brand-200 text-brand-700" : "bg-gray-200 text-gray-600"}`}>
                          {msg.sender.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs truncate ${!msg.isRead ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                              {msg.sender.name}
                            </p>
                            <span className="text-[9px] text-gray-400 flex-shrink-0">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                          {msg.subject && <p className="text-[10px] text-brand-600 font-medium truncate">{msg.subject}</p>}
                          <p className="text-[10px] text-gray-500 truncate">{msg.content}</p>
                        </div>
                        {!msg.isRead && <div className="w-2 h-2 bg-brand-600 rounded-full mt-2 flex-shrink-0" />}
                      </Link>
                    ))
                  )}
                </div>

                <Link
                  href={messagesLink}
                  onClick={() => setShowDropdown(false)}
                  className="block text-center text-xs font-semibold text-brand-600 p-3 border-t border-gray-100 hover:bg-gray-50"
                >
                  View All Messages
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
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
