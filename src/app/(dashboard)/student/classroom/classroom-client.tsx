"use client";

import { useState, useEffect } from "react";
import { studentJoinClass } from "@/lib/actions/classroom";
import { useRouter } from "next/navigation";
import {
  Play, Clock, CheckCircle, BookOpen, Bell,
  Loader2, Megaphone, ChevronDown, ChevronUp, FolderOpen, Coffee
} from "lucide-react";
import Link from "next/link";
import ClassAlarm from "@/components/class-alarm";
import VisualClassroom from "@/components/visual-classroom";

const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function StudentClassroomClient({
  enrollments, todayAttendance, studentId, studentName, studentGrade, isKG = false,
  sessionDurationMin, breakDurationMin,
}: {
  enrollments: any[]; todayAttendance: any[]; studentId: string; studentName: string;
  studentGrade: string; isKG?: boolean; sessionDurationMin: number; breakDurationMin: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [joinResult, setJoinResult] = useState<Record<string,string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeClassroom, setActiveClassroom] = useState<string | null>(null);
  const [onBreak, setOnBreak] = useState(false);
  const [breakCountdown, setBreakCountdown] = useState(0);

  const today = DAYS[new Date().getDay()];

  // Build alarm schedules ONLY from student's enrolled classes
  const alarmSchedules = enrollments.flatMap((e: any) =>
    (e.class.schedules || []).map((s: any) => ({
      classId: e.class.id,
      className: e.class.name,
      subjectName: e.class.subject?.name || e.class.name,
      teacherName: e.class.teacher?.user?.name || "",
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime || "",
      isLive: (e.class.liveSessions || []).length > 0,
    }))
  );

  // Sort: live first
  const sorted = [...enrollments].sort((a, b) => {
    const aLive = a.class.liveSessions?.length > 0 ? -1 : 0;
    const bLive = b.class.liveSessions?.length > 0 ? -1 : 0;
    if (aLive !== bLive) return aLive - bLive;
    const aToday = a.class.schedules?.some((s: any) => s.dayOfWeek === today) ? -1 : 0;
    const bToday = b.class.schedules?.some((s: any) => s.dayOfWeek === today) ? -1 : 0;
    return aToday - bToday;
  });

  const handleJoin = async (classId: string) => {
    setLoading(classId);
    const result = await studentJoinClass(classId);
    if (result.error) setJoinResult({...joinResult, [classId]: "error"});
    else { setJoinResult({...joinResult, [classId]: result.status || "PRESENT"}); router.refresh(); }
    setLoading("");
  };

  const isAttended = (classId: string) => todayAttendance.some((a: any) => a.classId === classId);
  const getStatus = (classId: string) => todayAttendance.find((a: any) => a.classId === classId)?.status || null;

  // Auto-open first live class
  useEffect(() => {
    const live = sorted.find((e) => e.class.liveSessions?.length > 0);
    if (live && !activeClassroom) setActiveClassroom(live.class.id);
  }, []);

  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(interval);
  }, [router]);

  // Auto-session check
  useEffect(() => {
    fetch("/api/auto-session").catch(() => {});
    const i = setInterval(() => { fetch("/api/auto-session").catch(() => {}); }, 60000);
    return () => clearInterval(i);
  }, []);

  // Break countdown
  useEffect(() => {
    if (!onBreak || breakCountdown <= 0) return;
    const i = setInterval(() => {
      setBreakCountdown(prev => {
        if (prev <= 1) { setOnBreak(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [onBreak, breakCountdown]);

  return (
    <div className="space-y-6">
      <ClassAlarm schedules={alarmSchedules} isKG={isKG} />

      {/* Break overlay */}
      {onBreak && (
        <div className={`p-6 rounded-2xl text-center border-2 ${isKG ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300" : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"}`}>
          <Coffee className={`w-12 h-12 mx-auto mb-3 ${isKG ? "text-amber-500" : "text-blue-500"}`} />
          <h3 className={`text-xl font-bold ${isKG ? "text-amber-800" : "text-blue-800"}`}>
            {isKG ? "☕ Break Time! 🎈" : "Break Time"}
          </h3>
          <p className={`text-sm mt-1 ${isKG ? "text-amber-600" : "text-blue-600"}`}>
            {isKG ? "Rest and come back!" : "Take a rest before next class"}
          </p>
          <div className="mt-3 text-3xl font-mono font-bold text-gray-800">
            {Math.floor(breakCountdown / 60)}:{String(breakCountdown % 60).padStart(2, "0")}
          </div>
          <p className="text-xs text-gray-500 mt-2">{breakDurationMin} minute break</p>
          <button onClick={() => setOnBreak(false)} className="mt-3 text-xs text-gray-400 hover:text-gray-600">Skip break</button>
        </div>
      )}

      {/* Active Visual Classroom */}
      {activeClassroom && !onBreak && (() => {
        const enrollment = enrollments.find((e: any) => e.class.id === activeClassroom);
        if (!enrollment) return null;
        const cls = enrollment.class;
        const liveSession = cls.liveSessions?.[0];
        const isLive = !!liveSession;
        const sessionId = liveSession?.id || "";

        // Verify this class belongs to student's grade
        if (cls.schoolGrade?.gradeLevel !== studentGrade) {
          return (
            <div className="card text-center py-8 border-red-200 bg-red-50">
              <p className="text-red-600 font-bold">⚠️ This class is for Grade {cls.schoolGrade?.gradeLevel}</p>
              <p className="text-xs text-red-400 mt-1">You are in Grade {studentGrade}. You cannot join this class.</p>
              <button onClick={() => setActiveClassroom(null)} className="mt-3 btn-ghost text-xs">Close</button>
            </div>
          );
        }

        const students = (cls.enrollments || []).map((en: any) => ({
          id: en.student?.id || en.studentId,
          name: en.student?.user?.name || "Student",
          image: en.student?.user?.image,
        }));

        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`font-bold ${isKG ? "text-xl text-amber-800" : "text-sm text-gray-700"}`}>
                {isKG ? "🏫 " : ""}Active Classroom
                <span className="ml-2 text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{cls.schoolGrade?.gradeLevel}</span>
                {isLive && <span className="ml-2 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
              </h2>
              <button onClick={() => setActiveClassroom(null)} className="text-xs text-gray-500 hover:text-red-500">Leave</button>
            </div>
            {isLive && sessionId ? (
              <VisualClassroom
                sessionId={sessionId} classId={cls.id}
                subjectName={cls.subject?.name || cls.name}
                teacherName={cls.teacher?.user?.name || "Teacher"}
                students={students} isTeacher={false} isLive={true}
                topic={liveSession?.topic} isKG={isKG}
                studentId={studentId} studentName={studentName}
              />
            ) : (
              <div className={`rounded-2xl p-8 text-center border-2 border-dashed ${isKG ? "bg-yellow-50 border-yellow-300" : "bg-gray-50 border-gray-300"}`}>
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">Waiting for teacher to start class...</p>
                <p className="text-xs text-gray-400 mt-1">Auto-refreshes every 15 seconds</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Class List */}
      <div>
        <h2 className={`font-bold mb-3 ${isKG ? "text-xl text-gray-800" : "text-sm text-gray-700"}`}>
          {isKG ? "📚 My Classes" : `My Classes (Grade ${studentGrade})`}
        </h2>
        {sorted.length === 0 ? (
          <div className={`card text-center py-12 ${isKG ? "bg-yellow-50 border-yellow-200" : ""}`}>
            <BookOpen className={`w-12 h-12 mx-auto mb-3 ${isKG ? "text-yellow-400" : "text-gray-300"}`} />
            <p className={isKG ? "text-lg font-bold text-gray-600" : "text-gray-500"}>No classes for your grade yet.</p>
            <Link href="/student/subjects" className="mt-4 inline-block btn-primary text-sm">Browse Subjects</Link>
          </div>
        ) : (
          <div className={isKG ? "grid md:grid-cols-2 gap-4" : "space-y-3"}>
            {sorted.map((e: any) => {
              const cls = e.class;
              const isLive = cls.liveSessions?.length > 0;
              const attended = isAttended(cls.id);
              const status = getStatus(cls.id);

              // Grade check
              const isMyGrade = cls.schoolGrade?.gradeLevel === studentGrade;

              if (isKG) {
                const emojis: Record<string,string> = { Mathematics: "🔢", English: "📖", Science: "🔬", Art: "🎨", Music: "🎵", default: "📚" };
                const emoji = Object.entries(emojis).find(([k]) => (cls.subject?.name || cls.name).toLowerCase().includes(k.toLowerCase()))?.[1] || emojis.default;
                return (
                  <div key={e.id} onClick={() => isMyGrade && setActiveClassroom(cls.id)}
                    className={`rounded-2xl p-5 border-2 shadow-md transition-all ${!isMyGrade ? "opacity-40 cursor-not-allowed" :
                      isLive ? "bg-red-50 border-red-300 ring-2 ring-red-400 animate-pulse cursor-pointer hover:shadow-lg" : "bg-white border-blue-200 cursor-pointer hover:shadow-lg hover:scale-[1.02]"
                    }`}>
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{emoji}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-extrabold text-gray-800">{cls.subject?.name || cls.name}</h3>
                        <p className="text-sm text-gray-500">Teacher {cls.teacher?.user?.name?.split(" ")[0]}</p>
                        {!isMyGrade && <span className="text-xs text-red-500 font-bold">Not your grade ({cls.schoolGrade?.gradeLevel})</span>}
                        {isLive && isMyGrade && <span className="inline-flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold mt-1 animate-pulse">🔴 LIVE NOW</span>}
                        {attended && <span className="text-xs text-emerald-600 font-bold mt-1 block">✅ Attended!</span>}
                      </div>
                    </div>
                  </div>
                );
              }

              const isExp = expanded === cls.id;
              return (
                <div key={e.id} className={`card transition-all ${!isMyGrade ? "opacity-50" : isLive ? "ring-2 ring-red-400 border-red-200" : ""}`}>
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : cls.id)}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLive ? "bg-red-100 text-red-600" : "bg-brand-100 text-brand-600"}`}>
                      {isLive ? <Play className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-800">{cls.subject?.name || cls.name}</h4>
                        <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded">{cls.schoolGrade?.gradeLevel}</span>
                        {isLive && isMyGrade && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>}
                        {attended && <span className={`text-[10px] px-2 py-0.5 rounded-full ${status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{status}</span>}
                        {!isMyGrade && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Wrong Grade</span>}
                      </div>
                      <p className="text-[10px] text-gray-500">{cls.teacher?.user?.name} • {cls._count?.enrollments || 0} students</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLive && !attended && isMyGrade && (
                        <button onClick={(ev) => { ev.stopPropagation(); handleJoin(cls.id); setActiveClassroom(cls.id); }}
                          disabled={!!loading} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-700 animate-pulse">
                          {loading === cls.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Join"}
                        </button>
                      )}
                      {isMyGrade && (
                        <button onClick={(ev) => { ev.stopPropagation(); setActiveClassroom(cls.id); }}
                          className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-brand-50">Enter</button>
                      )}
                      {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                  {isExp && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      {cls.schedules?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {cls.schedules.sort((a:any,b:any) => DAYS.indexOf(a.dayOfWeek)-DAYS.indexOf(b.dayOfWeek)).map((s:any, i:number) => (
                            <span key={i} className={`text-[10px] px-2 py-1 rounded-lg ${s.dayOfWeek === today ? "bg-brand-100 text-brand-700 font-bold" : "bg-gray-100 text-gray-600"}`}>
                              {DAY_SHORT[DAYS.indexOf(s.dayOfWeek)]} {s.startTime}-{s.endTime}
                            </span>
                          ))}
                        </div>
                      )}
                      {cls.announcements?.length > 0 && cls.announcements.slice(0,3).map((a:any) => (
                        <div key={a.id} className="text-xs bg-amber-50 p-2 rounded-lg">
                          <Megaphone className="w-3 h-3 inline mr-1 text-amber-600" />
                          <span className="font-medium text-amber-800">{a.title}</span> — {a.content?.slice(0,80)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
