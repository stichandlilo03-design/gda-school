"use client";

import { useState, useEffect } from "react";
import {
  startLiveClass, endLiveClass, bulkMarkAttendance, postClassAnnouncement, deleteAnnouncement, convertPrepToLive,
} from "@/lib/actions/classroom";
import { removeStudentFromClass } from "@/lib/actions/student-management";
import { useRouter } from "next/navigation";
import { to12h } from "@/lib/time-utils";
import {
  Play, Square, Users, Clock, CheckCircle, XCircle, AlertTriangle,
  Loader2, Megaphone, Bell, ChevronDown, ChevronUp, Send, Trash2,
  BookOpen, UserCheck, FolderOpen, Monitor, Coffee, UserX, Settings
} from "lucide-react";
import Link from "next/link";
import VisualClassroom from "@/components/visual-classroom";
import ClassAlarm from "@/components/class-alarm";

const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const ATT_OPTIONS = [
  { value: "PRESENT", label: "Present", color: "bg-emerald-500", icon: CheckCircle },
  { value: "LATE", label: "Late", color: "bg-amber-500", icon: Clock },
  { value: "ABSENT", label: "Absent", color: "bg-red-500", icon: XCircle },
  { value: "EXCUSED", label: "Excused", color: "bg-blue-500", icon: AlertTriangle },
];

export default function TeacherClassroomClient({ classes, teacherId, sessionDurationMin, breakDurationMin }: { classes: any[]; teacherId: string; sessionDurationMin: number; breakDurationMin: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState<string | null>(classes[0]?.id || null);
  const [showAttendance, setShowAttendance] = useState<string | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [showAnnForm, setShowAnnForm] = useState<string | null>(null);
  const [annForm, setAnnForm] = useState({ title: "", content: "", type: "GENERAL", isPinned: false });
  const [topicInput, setTopicInput] = useState("");
  const [activeVisual, setActiveVisual] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [onBreak, setOnBreak] = useState(false);
  const [breakCountdown, setBreakCountdown] = useState(0);
  const [prepDuration, setPrepDuration] = useState(15);

  const today = DAYS[new Date().getDay()];

  // Build alarm schedules
  const alarmSchedules = classes.flatMap((cls: any) =>
    (cls.schedules || []).map((s: any) => ({
      classId: cls.id, className: cls.name,
      subjectName: cls.subject?.name || cls.name,
      teacherName: "You", dayOfWeek: s.dayOfWeek,
      startTime: s.startTime, endTime: s.endTime || "",
      isLive: (cls.liveSessions || []).length > 0,
      isPrep: cls.liveSessions?.[0]?.isPrep || false,
    }))
  );

  // Auto-open visual for any live class
  useEffect(() => {
    const liveClass = classes.find((c) => c.liveSessions?.length > 0);
    if (liveClass && !activeVisual) {
      setActiveVisual(liveClass.id);
      setActiveSessionId(liveClass.liveSessions[0].id);
    }
  }, [classes]);

  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(interval);
  }, [router]);

  // Trigger auto-session check
  useEffect(() => {
    fetch("/api/auto-session").catch(() => {});
    const i = setInterval(() => { fetch("/api/auto-session").catch(() => {}); }, 60000);
    return () => clearInterval(i);
  }, []);

  // Break countdown timer
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

  const [classMessage, setClassMessage] = useState("");

  const handleStartClass = async (classId: string) => {
    setLoading("start-" + classId);
    setClassMessage("");
    const result = await startLiveClass(classId, topicInput || undefined);
    setTopicInput("");
    if (result.error) {
      setClassMessage(result.error);
    } else if (result.sessionId) {
      setActiveVisual(classId);
      setActiveSessionId(result.sessionId);
      if ((result as any).lateMinutes > 0) {
        setClassMessage(`⏰ You joined ${(result as any).lateMinutes} minutes late. This has been recorded. You'll still be credited for the time you teach.`);
      }
    }
    router.refresh();
    setLoading("");
  };

  const handleStartPrep = async (classId: string) => {
    setLoading("prep-" + classId);
    setClassMessage("");
    const result = await startLiveClass(classId, topicInput || "Class Preparation", true, prepDuration);
    setTopicInput("");
    if (result.error) {
      setClassMessage(result.error);
    } else if (result.sessionId) {
      setActiveVisual(classId);
      setActiveSessionId(result.sessionId);
      setClassMessage(`📋 Prep session started (${prepDuration} min). Set up your board, materials, and polls. Students can join to prepare. Click "Go Live" when ready to start the real class.`);
    }
    router.refresh();
    setLoading("");
  };

  const handleGoLive = async (sessionId: string, classId: string) => {
    if (!confirm("Convert this prep into a real live class? Board content will be kept. Payment tracking starts now.")) return;
    setLoading("golive-" + sessionId);
    const result = await convertPrepToLive(sessionId);
    if (result.error) {
      setClassMessage("Error: " + result.error);
    } else {
      setClassMessage("🔴 Class is now LIVE! Board content preserved. Payment credits started.");
      // Don't call router.refresh() — it disrupts the classroom
      // The visual classroom polls every 3 seconds and will see isPrep=false
    }
    setLoading("");
  };

  const handleEndClass = async (sessionId: string) => {
    if (!confirm("End this live session?")) return;
    setLoading("end-" + sessionId);
    const result = await endLiveClass(sessionId);
    setActiveVisual(null);
    setActiveSessionId(null);
    // Trigger break timer
    setOnBreak(true);
    setBreakCountdown(breakDurationMin * 60);
    router.refresh();
    setLoading("");
  };

  const handleBulkAttendance = async (classId: string) => {
    const records = Object.entries(attendanceMap).map(([studentId, status]) => ({ studentId, status }));
    if (records.length === 0) { setMessage("Mark at least one student"); return; }
    setLoading("att-" + classId);
    const result = await bulkMarkAttendance(classId, records);
    if (result.error) setMessage("Error: " + result.error);
    else { setMessage("Attendance saved!"); setShowAttendance(null); setAttendanceMap({}); router.refresh(); }
    setLoading("");
    setTimeout(() => setMessage(""), 3000);
  };

  const handlePostAnn = async (classId: string) => {
    if (!annForm.title) return;
    setLoading("ann");
    await postClassAnnouncement({ classId, ...annForm });
    setShowAnnForm(null);
    setAnnForm({ title: "", content: "", type: "GENERAL", isPinned: false });
    router.refresh();
    setLoading("");
  };

  const markAll = (classId: string, status: string) => {
    const cls = classes.find((c: any) => c.id === classId);
    if (!cls) return;
    const map: Record<string, string> = {};
    cls.enrollments.forEach((e: any) => { map[e.student.id] = status; });
    setAttendanceMap(map);
  };

  return (
    <div className="space-y-6">
      <ClassAlarm schedules={alarmSchedules} />

      {message && <div className={`p-3 rounded-lg text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</div>}
      {classMessage && (
        <div className={`p-3 rounded-lg text-sm flex items-center justify-between ${classMessage.includes("Error") || classMessage.includes("Another") ? "bg-red-50 text-red-700" : classMessage.includes("late") ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
          <span>{classMessage}</span>
          <button onClick={() => setClassMessage("")} className="text-xs opacity-60 ml-2">✕</button>
        </div>
      )}

      {/* Session info */}
      <div className="flex items-center gap-4 text-[10px] text-gray-500">
        <span>⏱️ Session: {sessionDurationMin}min</span>
        <span>☕ Break: {breakDurationMin}min</span>
        <span>📊 Credits auto-added to payroll on session end</span>
      </div>

      {/* Break timer */}
      {onBreak && (
        <div className="p-6 rounded-2xl text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <Coffee className="w-12 h-12 mx-auto mb-3 text-blue-500" />
          <h3 className="text-xl font-bold text-blue-800">Break Time</h3>
          <p className="text-sm text-blue-600 mt-1">Session ended. Take a {breakDurationMin}-minute break before next class.</p>
          <div className="mt-3 text-3xl font-mono font-bold text-gray-800">
            {Math.floor(breakCountdown / 60)}:{String(breakCountdown % 60).padStart(2, "0")}
          </div>
          <button onClick={() => setOnBreak(false)} className="mt-3 text-xs text-gray-400 hover:text-gray-600">Skip break</button>
        </div>
      )}

      {/* Visual Classroom (when active) */}
      {activeVisual && activeSessionId && (() => {
        const cls = classes.find((c: any) => c.id === activeVisual);
        if (!cls) return null;
        const students = cls.enrollments.map((e: any) => ({
          id: e.student?.id || e.studentId,
          name: e.student?.user?.name || "Student",
          image: e.student?.user?.image,
        }));
        const isKG = ["K1","K2","K3"].includes(cls.schoolGrade?.gradeLevel || "");
        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Monitor className="w-4 h-4" /> {cls.liveSessions?.[0]?.isPrep ? "Prep —" : "Teaching —"} {cls.subject?.name || cls.name}
                <span className={`text-[10px] text-white px-2 py-0.5 rounded-full ${cls.liveSessions?.[0]?.isPrep ? "bg-amber-500" : "bg-red-500 animate-pulse"}`}>{cls.liveSessions?.[0]?.isPrep ? "PREP" : "LIVE"}</span>
                {cls.liveSessions?.[0]?.isPrep && cls.liveSessions?.[0]?.startedAt && (
                  <PrepTimer startedAt={cls.liveSessions[0].startedAt} durationMin={cls.liveSessions[0].durationMin || 15} />
                )}
              </h2>
              <div className="flex items-center gap-2">
                {cls.liveSessions?.[0]?.isPrep && (
                  <button onClick={() => handleGoLive(cls.liveSessions[0].id, cls.id)} disabled={!!loading}
                    className="text-xs px-3 py-1 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center gap-1 animate-pulse">
                    <Play className="w-3 h-3" /> Go Live
                  </button>
                )}
                <button onClick={() => { setActiveVisual(null); setActiveSessionId(null); }} className="text-xs text-gray-500 hover:text-red-500">Close Board</button>
              </div>
            </div>
            <VisualClassroom
              sessionId={activeSessionId || ""}
              classId={cls.id}
              subjectName={cls.subject?.name || cls.name}
              teacherName="You"
              students={students}
              isTeacher={true}
              isLive={true}
              topic={cls.liveSessions?.[0]?.topic}
              isKG={isKG}
            />
          </div>
        );
      })()}

      {/* Class Cards */}
      {classes.map((cls: any) => {
        const isExp = expanded === cls.id;
        const liveSession = cls.liveSessions?.[0];
        const isLive = !!liveSession;
        const todayScheds = cls.schedules?.filter((s: any) => s.dayOfWeek === today) || [];
        const isKG = ["K1","K2","K3"].includes(cls.schoolGrade?.gradeLevel || "");

        return (
          <div key={cls.id} className={`card ${isLive ? "ring-2 ring-red-400 border-red-200" : ""}`}>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : cls.id)}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLive ? "bg-red-100 text-red-600" : "bg-brand-100 text-brand-600"}`}>
                {isLive ? <Play className="w-5 h-5 animate-pulse" /> : <BookOpen className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-800">{cls.subject?.name || cls.name}</h4>
                  <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded">{cls.schoolGrade?.gradeLevel}</span>
                  {isLive && liveSession?.isPrep && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">PREP</span>}
                  {isLive && !liveSession?.isPrep && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>}
                  {isKG && <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full">🧒 KG</span>}
                </div>
                <p className="text-[10px] text-gray-500">{cls.enrollments.length} students • {cls._count?.materials || 0} materials</p>
              </div>
              <div className="flex items-center gap-2">
                {!isLive ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input className="input-field text-[10px] w-24 py-1" placeholder="Topic..." value={topicInput} onChange={(e) => setTopicInput(e.target.value)} />
                    <button onClick={() => handleStartClass(cls.id)} disabled={loading === "start-" + cls.id}
                      className="text-[10px] px-2.5 py-1.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center gap-1">
                      {loading === "start-" + cls.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Start
                    </button>
                    <div className="flex items-center gap-0.5">
                      <select className="input-field text-[10px] py-1 w-14" value={prepDuration} onChange={e => setPrepDuration(+e.target.value)}>
                        {[5,10,15,20,30,45,60].map(m => <option key={m} value={m}>{m}m</option>)}
                      </select>
                      <button onClick={() => handleStartPrep(cls.id)} disabled={loading === "prep-" + cls.id}
                        className="text-[10px] px-2 py-1.5 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 flex items-center gap-1" title="Open a prep session — set up board, polls, materials. No payment.">
                        {loading === "prep-" + cls.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings className="w-3 h-3" />} Prep
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setActiveVisual(cls.id); setActiveSessionId(liveSession.id); }}
                      className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                      <Monitor className="w-3 h-3 inline mr-0.5" /> Board
                    </button>
                    {liveSession.isPrep && (
                      <button onClick={() => handleGoLive(liveSession.id, cls.id)} disabled={loading === "golive-" + liveSession.id}
                        className="text-[10px] px-2.5 py-1.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center gap-1 animate-pulse">
                        {loading === "golive-" + liveSession.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Go Live
                      </button>
                    )}
                    <button onClick={() => handleEndClass(liveSession.id)} disabled={loading === "end-" + liveSession.id}
                      className="text-[10px] px-2.5 py-1.5 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-800 flex items-center gap-1">
                      {loading === "end-" + liveSession.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />} End
                    </button>
                    {liveSession.isPrep && liveSession.startedAt && (
                      <PrepTimer startedAt={liveSession.startedAt} durationMin={liveSession.durationMin || 15} />
                    )}
                  </div>
                )}
                {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>

            {todayScheds.length > 0 && (
              <div className="flex gap-1 mt-2">
                {todayScheds.map((s: any, i: number) => (
                  <span key={i} className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-lg font-medium">Today: {to12h(s.startTime)}-{to12h(s.endTime)}</span>
                ))}
              </div>
            )}

            {isExp && (
              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setShowAttendance(showAttendance === cls.id ? null : cls.id)}
                    className="text-[10px] px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-medium flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Attendance
                  </button>
                  <button onClick={() => setShowAnnForm(showAnnForm === cls.id ? null : cls.id)}
                    className="text-[10px] px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-medium flex items-center gap-1">
                    <Megaphone className="w-3 h-3" /> Announce
                  </button>
                  <Link href="/teacher/materials" className="text-[10px] px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" /> Materials
                  </Link>
                </div>

                {/* Attendance */}
                {showAttendance === cls.id && (
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-bold text-emerald-800">Mark Attendance</h5>
                      <div className="flex gap-1">
                        {ATT_OPTIONS.slice(0, 3).map((opt) => (
                          <button key={opt.value} onClick={() => markAll(cls.id, opt.value)}
                            className={`text-[9px] px-2 py-0.5 rounded text-white ${opt.color}`}>All {opt.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {cls.enrollments.map((en: any) => {
                        const existing = cls.attendances?.find((a: any) => a.studentId === en.student.id);
                        return (
                          <div key={en.student.id} className="flex items-center gap-3 bg-white p-2 rounded-lg">
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold">
                              {en.student.user.image ? <img src={en.student.user.image} alt="" className="w-7 h-7 rounded-full" /> : en.student.user.name[0]}
                            </div>
                            <span className="text-xs flex-1">{en.student.user.name}</span>
                            <button onClick={async () => {
                              const reason = prompt(`Remove ${en.student.user.name} from this class? Enter reason:`);
                              if (reason !== null) {
                                await removeStudentFromClass(en.id, reason || "Removed by teacher");
                                router.refresh();
                              }
                            }} className="text-red-300 hover:text-red-600 p-0.5" title="Remove from class">
                              <UserX className="w-3 h-3" />
                            </button>
                            {existing ? (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${existing.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : existing.status === "LATE" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{existing.status}</span>
                            ) : (
                              <div className="flex gap-0.5">
                                {ATT_OPTIONS.map((opt) => (
                                  <button key={opt.value} onClick={() => setAttendanceMap((p) => ({...p, [en.student.id]: opt.value}))}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition text-white text-[8px] ${
                                      attendanceMap[en.student.id] === opt.value ? opt.color + " ring-2 ring-offset-1 ring-gray-400" : "bg-gray-200 text-gray-500"
                                    }`}>{opt.label[0]}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => handleBulkAttendance(cls.id)} disabled={loading === "att-" + cls.id}
                      className="btn-primary text-xs mt-3 w-full">
                      {loading === "att-" + cls.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />} Save Attendance
                    </button>
                  </div>
                )}

                {/* Announcement form */}
                {showAnnForm === cls.id && (
                  <div className="p-4 bg-amber-50 rounded-xl space-y-2">
                    <input className="input-field text-sm" placeholder="Title" value={annForm.title} onChange={(e) => setAnnForm((p) => ({...p, title: e.target.value}))} />
                    <textarea className="input-field text-sm min-h-[60px]" placeholder="Content..." value={annForm.content} onChange={(e) => setAnnForm((p) => ({...p, content: e.target.value}))} />
                    <div className="flex gap-2">
                      <button onClick={() => handlePostAnn(cls.id)} disabled={loading === "ann"} className="btn-primary text-xs">
                        {loading === "ann" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 mr-1" />} Post
                      </button>
                      <button onClick={() => setShowAnnForm(null)} className="btn-ghost text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Student list */}
                {showAttendance !== cls.id && (
                  <div>
                    <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Students ({cls.enrollments.length})</h5>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {cls.enrollments.map((en: any) => (
                        <div key={en.student.id} className="text-center p-2 bg-gray-50 rounded-lg">
                          {en.student.user.image ? (
                            <img src={en.student.user.image} alt="" className="w-8 h-8 rounded-full mx-auto" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 mx-auto flex items-center justify-center text-[10px] font-bold">{en.student.user.name[0]}</div>
                          )}
                          <p className="text-[9px] text-gray-600 mt-1 truncate">{en.student.user.name.split(" ")[0]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cls.announcements?.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Announcements</h5>
                    {cls.announcements.slice(0, 3).map((a: any) => (
                      <div key={a.id} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg mb-1">
                        <Megaphone className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-amber-800">{a.title}</p>
                          {a.content && <p className="text-[10px] text-gray-600">{a.content.slice(0, 100)}</p>}
                        </div>
                        <button onClick={() => { deleteAnnouncement(a.id); router.refresh(); }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Prep session countdown timer
function PrepTimer({ startedAt, durationMin }: { startedAt: string | Date; durationMin: number }) {
  const [remaining, setRemaining] = useState(durationMin * 60);
  useEffect(() => {
    const calc = () => {
      const start = new Date(startedAt).getTime();
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setRemaining(Math.max(0, durationMin * 60 - elapsed));
    };
    calc();
    const i = setInterval(calc, 1000);
    return () => clearInterval(i);
  }, [startedAt, durationMin]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const urgent = remaining <= 60;
  const expired = remaining <= 0;

  return (
    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${expired ? "bg-red-500 text-white animate-pulse" : urgent ? "bg-amber-400 text-amber-900" : "bg-amber-100 text-amber-700"}`}>
      {expired ? "⏰ Prep time up!" : `⏱ ${mins}:${String(secs).padStart(2, "0")}`}
    </span>
  );
}
