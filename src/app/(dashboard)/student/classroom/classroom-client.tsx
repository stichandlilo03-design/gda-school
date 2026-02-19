"use client";

import { useState } from "react";
import { studentJoinClass } from "@/lib/actions/classroom";
import { useRouter } from "next/navigation";
import {
  Play, Clock, CheckCircle, AlertCircle, Users, BookOpen, Bell,
  Calendar, Loader2, Megaphone, ChevronDown, ChevronUp, FolderOpen
} from "lucide-react";
import Link from "next/link";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StudentClassroomClient({
  enrollments, todayAttendance, studentId,
}: {
  enrollments: any[]; todayAttendance: any[]; studentId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [joinResult, setJoinResult] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = DAYS[new Date().getDay()];
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Sort classes: live first, then today's scheduled, then others
  const sorted = [...enrollments].sort((a, b) => {
    const aLive = a.class.liveSessions.length > 0 ? -1 : 0;
    const bLive = b.class.liveSessions.length > 0 ? -1 : 0;
    if (aLive !== bLive) return aLive - bLive;
    const aToday = a.class.schedules.some((s: any) => s.dayOfWeek === today) ? -1 : 0;
    const bToday = b.class.schedules.some((s: any) => s.dayOfWeek === today) ? -1 : 0;
    return aToday - bToday;
  });

  const handleJoin = async (classId: string) => {
    setLoading(classId);
    const result = await studentJoinClass(classId);
    if (result.error) {
      setJoinResult({ ...joinResult, [classId]: "error" });
    } else {
      setJoinResult({ ...joinResult, [classId]: result.status || "PRESENT" });
      router.refresh();
    }
    setLoading("");
  };

  const isAttendedToday = (classId: string) => todayAttendance.some((a: any) => a.classId === classId);
  const getAttendanceStatus = (classId: string) => {
    const att = todayAttendance.find((a: any) => a.classId === classId);
    return att?.status || null;
  };

  // Upcoming classes today
  const upcomingToday = enrollments.flatMap((e) =>
    e.class.schedules
      .filter((s: any) => s.dayOfWeek === today)
      .map((s: any) => {
        const [h, m] = s.startTime.split(":").map(Number);
        const startMin = h * 60 + m;
        const [eh, em] = s.endTime.split(":").map(Number);
        const endMin = eh * 60 + em;
        return { ...s, className: e.class.name, classId: e.classId, teacherName: e.class.teacher.user.name, startMin, endMin, isNow: nowMinutes >= startMin && nowMinutes <= endMin, isPast: nowMinutes > endMin, isLive: e.class.liveSessions.length > 0 };
      })
  ).sort((a, b) => a.startMin - b.startMin);

  // All announcements flattened
  const allAnnouncements = enrollments.flatMap((e) =>
    e.class.announcements.map((a: any) => ({ ...a, className: e.class.name }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 15);

  return (
    <div className="space-y-6">
      {/* Today's Schedule Bar */}
      <div className="card bg-gradient-to-r from-brand-600 to-brand-700 text-white border-0">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5" />
          <h2 className="text-sm font-bold">Today&apos;s Classes — {DAY_SHORT[new Date().getDay()]}, {now.toLocaleDateString(undefined, { month: "long", day: "numeric" })}</h2>
        </div>
        {upcomingToday.length === 0 ? (
          <p className="text-brand-200 text-xs">No classes scheduled today. Enjoy your free time!</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {upcomingToday.map((cls, i) => (
              <div key={i} className={`flex-shrink-0 p-3 rounded-xl min-w-[160px] ${
                cls.isLive ? "bg-red-500/30 border border-red-300" :
                cls.isNow ? "bg-white/20 border border-white/30" :
                cls.isPast ? "bg-white/10 opacity-60" :
                "bg-white/10"
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  {cls.isLive && <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />}
                  <p className="text-[10px] text-brand-200">{cls.startTime} — {cls.endTime}</p>
                </div>
                <p className="text-xs font-semibold truncate">{cls.className}</p>
                <p className="text-[10px] text-brand-300">{cls.teacherName}</p>
                {cls.isLive && <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full mt-1 inline-block">🔴 LIVE NOW</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Classes — Prominent */}
      {enrollments.filter(e => e.class.liveSessions.length > 0).map((e) => {
        const live = e.class.liveSessions[0];
        const attended = isAttendedToday(e.classId);
        const attStatus = getAttendanceStatus(e.classId);
        const result = joinResult[e.classId];

        return (
          <div key={e.classId} className="card border-2 border-red-300 bg-red-50/50 animate-pulse-slow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500 text-white flex items-center justify-center flex-shrink-0">
                <Play className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <h3 className="text-base font-bold text-gray-800">{e.class.name} — LIVE</h3>
                </div>
                <p className="text-xs text-gray-500">Teacher: {e.class.teacher.user.name}{live.topic ? ` • Topic: ${live.topic}` : ""}</p>
                {live.startedAt && <p className="text-[10px] text-gray-400">Started: {new Date(live.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>}
              </div>
              <div className="flex flex-col gap-1">
                {attended || result ? (
                  <div className={`text-xs px-3 py-2 rounded-xl font-medium flex items-center gap-1.5 ${
                    (attStatus === "PRESENT" || result === "PRESENT") ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {attStatus === "PRESENT" || result === "PRESENT" ? "Joined ✓" : "Joined (Late)"}
                  </div>
                ) : (
                  <button onClick={() => handleJoin(e.classId)} disabled={loading === e.classId}
                    className="text-sm px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200 flex items-center gap-2">
                    {loading === e.classId ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" /> Join Class</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* My Classes */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2"><BookOpen className="w-4 h-4 text-brand-600" /> My Classes</h2>
          {sorted.map((e) => {
            const isLive = e.class.liveSessions.length > 0;
            const todaySchedule = e.class.schedules.filter((s: any) => s.dayOfWeek === today);
            const isExp = expanded === e.classId;
            const attended = isAttendedToday(e.classId);
            const attStatus = getAttendanceStatus(e.classId);

            return (
              <div key={e.id} className={`card ${isLive ? "border-red-200" : ""}`}>
                <div className="flex items-center gap-3">
                  {e.class.teacher.user.image ? (
                    <img src={e.class.teacher.user.image} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-xs font-bold">
                      {e.class.teacher.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">{e.class.name}</p>
                      {isLive && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">LIVE</span>}
                      {attended && <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${attStatus === "PRESENT" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{attStatus}</span>}
                    </div>
                    <p className="text-[10px] text-gray-500">{e.class.teacher.user.name} • {e.class.schoolGrade.gradeLevel} • {e.class._count.enrollments} students</p>
                    {todaySchedule.length > 0 && (
                      <p className="text-[10px] text-brand-600 font-medium">
                        Today: {todaySchedule.map((s: any) => `${s.startTime}–${s.endTime}`).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/student/materials?classId=${e.classId}`} className="text-[10px] px-2 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                      <FolderOpen className="w-3 h-3" />
                    </Link>
                    <button onClick={() => setExpanded(isExp ? null : e.classId)} className="text-gray-400 p-1">
                      {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExp && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    {/* Schedule */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Weekly Schedule</p>
                      <div className="flex flex-wrap gap-1.5">
                        {e.class.schedules.sort((a: any, b: any) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek)).map((s: any) => (
                          <span key={s.id} className={`text-[10px] px-2 py-1 rounded-lg ${s.dayOfWeek === today ? "bg-brand-100 text-brand-700 font-bold" : "bg-gray-100 text-gray-600"}`}>
                            {DAY_SHORT[DAYS.indexOf(s.dayOfWeek)]} {s.startTime}–{s.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Recent announcements */}
                    {e.class.announcements.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Recent Announcements</p>
                        {e.class.announcements.slice(0, 3).map((a: any) => (
                          <div key={a.id} className="p-2 bg-amber-50 rounded-lg mb-1 border border-amber-100">
                            <p className="text-xs font-medium text-gray-800">{a.title}</p>
                            <p className="text-[10px] text-gray-600 mt-0.5">{a.content}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5">{a.teacher.user.name} • {new Date(a.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Stats */}
                    <div className="flex gap-3 text-[10px] text-gray-500">
                      <span>{e.class._count.materials} materials</span>
                      <span>{e.class._count.enrollments} classmates</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {enrollments.length === 0 && (
            <div className="card text-center py-10">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No enrolled classes yet.</p>
              <Link href="/student/teachers" className="text-xs text-brand-600 hover:underline mt-1 inline-block">Browse & join classes →</Link>
            </div>
          )}
        </div>

        {/* Announcements Feed */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Bell className="w-4 h-4 text-amber-600" /> Announcements</h2>
          {allAnnouncements.length === 0 ? (
            <div className="card text-center py-8">
              <Megaphone className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No announcements yet.</p>
            </div>
          ) : (
            allAnnouncements.map((a) => (
              <div key={a.id} className={`card border-l-4 ${
                a.type === "URGENT" ? "border-l-red-500 bg-red-50/30" :
                a.type === "CLASS_REMINDER" ? "border-l-blue-500 bg-blue-50/30" :
                "border-l-amber-400"
              }`}>
                <div className="flex items-start gap-2">
                  {a.type === "URGENT" ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /> :
                   a.type === "CLASS_REMINDER" ? <Clock className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" /> :
                   <Megaphone className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{a.title}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{a.content}</p>
                    <p className="text-[9px] text-gray-400 mt-1">{a.className} • {new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
