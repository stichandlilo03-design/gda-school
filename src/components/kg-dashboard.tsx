"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, BookOpen, Star, Heart, Music, Palette, Trophy, Smile, Sun, Moon, Cloud } from "lucide-react";

const GREETING_BY_TIME = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good Morning", emoji: "🌞", icon: Sun, bg: "from-yellow-300 to-orange-300" };
  if (h < 17) return { text: "Good Afternoon", emoji: "☀️", icon: Cloud, bg: "from-blue-300 to-cyan-300" };
  return { text: "Good Evening", emoji: "🌙", icon: Moon, bg: "from-indigo-400 to-purple-400" };
};

const SUBJECT_FUN: Record<string, { emoji: string; color: string; bg: string }> = {
  Mathematics: { emoji: "🔢", color: "text-blue-700", bg: "bg-blue-100 border-blue-300" },
  English: { emoji: "📖", color: "text-green-700", bg: "bg-green-100 border-green-300" },
  Science: { emoji: "🔬", color: "text-purple-700", bg: "bg-purple-100 border-purple-300" },
  Art: { emoji: "🎨", color: "text-pink-700", bg: "bg-pink-100 border-pink-300" },
  Music: { emoji: "🎵", color: "text-amber-700", bg: "bg-amber-100 border-amber-300" },
  "Physical Education": { emoji: "⚽", color: "text-red-700", bg: "bg-red-100 border-red-300" },
  default: { emoji: "📚", color: "text-indigo-700", bg: "bg-indigo-100 border-indigo-300" },
};

function getSubjectFun(name: string) {
  return SUBJECT_FUN[name] || Object.entries(SUBJECT_FUN).find(([k]) => name.toLowerCase().includes(k.toLowerCase()))?.[1] || SUBJECT_FUN.default;
}

const STARS_MESSAGES = ["You're doing great! ⭐", "Keep it up, superstar! 🌟", "Wow, amazing! 🎉", "You're a champion! 🏆"];

export default function KGDashboard({
  studentName, enrollments, liveSessions, todaySchedule, recentGrades, attendanceStreak,
}: {
  studentName: string; enrollments: any[]; liveSessions: any[]; todaySchedule: any[];
  recentGrades: any[]; attendanceStreak: number;
}) {
  const [bounce, setBounce] = useState(false);
  const greeting = GREETING_BY_TIME();
  const firstName = studentName.split(" ")[0];

  useEffect(() => {
    const i = setInterval(() => setBounce((b) => !b), 3000);
    return () => clearInterval(i);
  }, []);

  const hasLiveClass = liveSessions.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-white relative overflow-hidden">
      {/* Floating decorations */}
      <div className="absolute top-10 left-10 text-6xl opacity-20 animate-float">🎈</div>
      <div className="absolute top-20 right-20 text-5xl opacity-20 animate-float" style={{ animationDelay: "1s" }}>⭐</div>
      <div className="absolute bottom-20 left-20 text-5xl opacity-15 animate-float" style={{ animationDelay: "2s" }}>🌈</div>
      <div className="absolute bottom-40 right-10 text-4xl opacity-15 animate-float" style={{ animationDelay: "0.5s" }}>🦋</div>

      <div className="relative z-10 p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
        {/* Big Greeting */}
        <div className={`rounded-3xl p-8 bg-gradient-to-r ${greeting.bg} shadow-lg text-center`}>
          <div className="text-6xl mb-3">{greeting.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-md">
            {greeting.text}, {firstName}!
          </h1>
          <p className="text-xl text-white/90 mt-2 font-medium">Ready to learn something awesome today? 🚀</p>
          {attendanceStreak > 2 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/30 px-4 py-2 rounded-full">
              <Trophy className="w-5 h-5 text-yellow-200" />
              <span className="text-white font-bold">{attendanceStreak} Day Streak! {STARS_MESSAGES[Math.floor(Math.random() * STARS_MESSAGES.length)]}</span>
            </div>
          )}
        </div>

        {/* Live Class Alert */}
        {hasLiveClass && (
          <Link href="/student/classroom" className="block">
            <div className="rounded-3xl p-6 bg-gradient-to-r from-red-400 to-pink-500 shadow-lg text-center animate-pulse hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="text-5xl mb-2">🔴</div>
              <h2 className="text-2xl font-extrabold text-white">Your Class is LIVE!</h2>
              <p className="text-lg text-white/90 mt-1">
                {liveSessions[0]?.class?.subject?.name || liveSessions[0]?.class?.name} with Teacher {liveSessions[0]?.class?.teacher?.user?.name?.split(" ")[0]}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 bg-white text-red-600 px-8 py-3 rounded-full font-extrabold text-lg shadow-lg hover:bg-red-50 transition">
                <Play className="w-6 h-6" /> Join Now!
              </div>
            </div>
          </Link>
        )}

        {/* Today's Classes */}
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
            📅 Today&apos;s Classes
          </h2>
          {todaySchedule.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-md border-2 border-dashed border-gray-200">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-xl font-bold text-gray-700">No classes today!</p>
              <p className="text-gray-500 mt-1">Time to play and rest 😴</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {todaySchedule.map((s: any, i: number) => {
                const fun = getSubjectFun(s.subjectName || "");
                const isLive = liveSessions.some((ls: any) => ls.classId === s.classId);
                return (
                  <Link href="/student/classroom" key={i}
                    className={`rounded-2xl p-5 border-2 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer ${fun.bg} ${isLive ? "ring-4 ring-red-400 animate-pulse" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{fun.emoji}</div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-extrabold ${fun.color}`}>{s.subjectName}</h3>
                        <p className="text-sm text-gray-600">Teacher {s.teacherName?.split(" ")[0]}</p>
                        <p className="text-xs text-gray-500 mt-1">{s.startTime} - {s.endTime}</p>
                      </div>
                      {isLive ? (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">LIVE 🔴</span>
                      ) : (
                        <span className="text-2xl">{i === 0 ? "1️⃣" : i === 1 ? "2️⃣" : i === 2 ? "3️⃣" : "📚"}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* My Subjects (big colorful cards) */}
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
            📚 My Subjects
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {enrollments.map((e: any) => {
              const fun = getSubjectFun(e.class?.subject?.name || e.class?.name || "");
              return (
                <Link href="/student/classroom" key={e.id}
                  className={`rounded-2xl p-6 text-center border-2 shadow-md hover:shadow-lg hover:scale-105 transition-all ${fun.bg}`}>
                  <div className="text-5xl mb-3">{fun.emoji}</div>
                  <h3 className={`text-base font-extrabold ${fun.color}`}>{e.class?.subject?.name || e.class?.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">Teacher {e.class?.teacher?.user?.name?.split(" ")[0]}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Fun Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-yellow-200 to-amber-300 p-5 text-center shadow-md">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-3xl font-extrabold text-amber-800">{enrollments.length}</div>
            <div className="text-sm font-bold text-amber-700">Subjects</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-green-200 to-emerald-300 p-5 text-center shadow-md">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-3xl font-extrabold text-emerald-800">{attendanceStreak}</div>
            <div className="text-sm font-bold text-emerald-700">Day Streak</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-pink-200 to-rose-300 p-5 text-center shadow-md">
            <div className="text-4xl mb-2">🌟</div>
            <div className="text-3xl font-extrabold text-rose-800">{recentGrades.length}</div>
            <div className="text-sm font-bold text-rose-700">Scores</div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/student/classroom", label: "Classroom", emoji: "🏫", bg: "bg-blue-100 hover:bg-blue-200" },
            { href: "/student/grades", label: "My Grades", emoji: "📊", bg: "bg-green-100 hover:bg-green-200" },
            { href: "/student/materials", label: "Materials", emoji: "📖", bg: "bg-purple-100 hover:bg-purple-200" },
            { href: "/student/messages", label: "Messages", emoji: "💌", bg: "bg-pink-100 hover:bg-pink-200" },
          ].map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-2xl p-4 text-center ${n.bg} transition-all shadow-sm hover:shadow-md border`}>
              <div className="text-3xl mb-1">{n.emoji}</div>
              <span className="text-sm font-bold text-gray-700">{n.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
