"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationBell({ messagesPath }: { messagesPath: string }) {
  const [count, setCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const prevCount = useRef(0);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/unread-count");
        if (res.ok) {
          const data = await res.json();
          const newCount = data.count || 0;
          // Play sound if count increased
          if (newCount > prevCount.current && prevCount.current >= 0) {
            setFlash(true);
            setTimeout(() => setFlash(false), 3000);
            try {
              const ac = new AudioContext();
              const osc = ac.createOscillator();
              const gain = ac.createGain();
              osc.connect(gain); gain.connect(ac.destination);
              osc.frequency.value = 800; gain.gain.value = 0.2;
              osc.start(); osc.stop(ac.currentTime + 0.1);
              setTimeout(() => {
                try {
                  const o2 = ac.createOscillator();
                  const g2 = ac.createGain();
                  o2.connect(g2); g2.connect(ac.destination);
                  o2.frequency.value = 1000; g2.gain.value = 0.2;
                  o2.start(); o2.stop(ac.currentTime + 0.1);
                } catch {}
              }, 150);
            } catch {}
          }
          prevCount.current = newCount;
          setCount(newCount);
        }
      } catch {}
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href={messagesPath} className={`relative p-2 rounded-lg transition ${flash ? "bg-red-50 animate-bounce" : "hover:bg-gray-100"}`}>
      <Bell className={`w-5 h-5 ${flash ? "text-red-500" : "text-gray-600"}`} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
