"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationBell({ messagesPath }: { messagesPath: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/unread-count");
        if (res.ok) {
          const data = await res.json();
          setCount(data.count || 0);
        }
      } catch {}
    };
    check();
    const interval = setInterval(check, 15000); // Every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href={messagesPath} className="relative p-2 rounded-lg hover:bg-gray-100 transition">
      <Bell className="w-5 h-5 text-gray-600" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
