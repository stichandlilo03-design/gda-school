"use client";

import { useState, useEffect } from "react";
import {
  startLiveClass, endLiveClass, bulkMarkAttendance, postClassAnnouncement, deleteAnnouncement,
} from "@/lib/actions/classroom";
import { useRouter } from "next/navigation";
import {
  Play, Square, Users, Clock, CheckCircle, XCircle, AlertTriangle,
  Loader2, Megaphone, Bell, Calendar, ChevronDown, ChevronUp, Send, Trash2,
  BookOpen, UserCheck, FolderOpen
} from "lucide-react";
import Link from "next/link";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ATT_OPTIONS = [
  { value: "PRESENT", label: "Present", color: "bg-emerald-500", icon: CheckCircle },
  { value: "LATE", label: "Late", color: "bg-amber-500", icon: Clock },
  { value: "ABSENT", label: "Absent", color: "bg-red-500", icon: XCircle },
  { value: "EXCUSED", label: "Excused", color: "bg-blue-500", icon: AlertTriangle },
];

export default function TeacherClassroomClient({ classes, teacherId }: { classes: any[]; teacherId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || "");
  const [expanded, setExpanded] = useState<string | null>(classes[0]?.id || null);
  const [showAttendance, setShowAttendance] = useState<string | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [showAnnForm, setShowAnnForm] = useState<string | null>(null);
  const [annForm, setAnnForm] = useState({ title: "", content: "", type: "GENERAL", isPinned: false });
  const [topicInput, setTopicInput] = useState("");
  const [timer, setTimer] = useState(0);

  const today = DAYS[new Date().getDay()];
  const now = new Date();

  // Timer for live sessions
  useEffect(() => {
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentClass = classes.find((c) => c.id === selectedClass);

  const handleStartClass = async (classId: string) => {
    setLoading("start-" + classId);
    await startLiveClass(classId, topicInput || undefined);
    setTopicInput("");
    router.refresh();
    setLoading("");
  };

  const handleEndClass = async (sessionId: string) => {
    if (!confirm("End this live session?")) return;
    setLoading("end-" + sessionId);
    await endLiveClass(sessionId);
    router.refresh();
    setLoading("");
  };

  const openAttendance = (classId: string, enrollments: any[], existingAttendance: any[]) => {
    const map: Record<string, string> = {};
    for (const e of enrollments) {
      const existing = existingAttendance.find((a: any) => a.studentId === e.studentId);
      map[e.studentId] = existing?.status || "";
    }
    setAttendanceMap(map);
    setShowAttendance(classId);
  };

  const handleBulkAttendance = async (classId: string) => {
    const records = Object.entries(attendanceMap)
      .filter(([_, status]) => status)
      .map(([studentId, status]) => ({ studentId, status }));
    if (records.length === 0) { setMessage("Mark at least one student"); return; }
    setLoading("att-" + classId);
    await bulkMarkAttendance(classId, records);
    setShowAttendance(null);
    setMessage(`Attendance saved for ${records.length} students`);
    router.refresh();
    setLoading("");
  };

  const markAllPresent = (enrollments: any[]) => {
    const map: Record<string, string> = {};
    for (const e of enrollments) map[e.studentId] = "PRESENT";
    setAttendanceMap(map);
  };

  const handlePostAnnouncement = async (classId: string) => {
    if (!annForm.title || !annForm.content) { setMessage("Fill in title and content"); return; }
    setLoading("ann-" + classId);
    await postClassAnnouncement({ classId, ...annForm });
    setShowAnnForm(null);
    setAnnForm({ title: "", content: "", type: "GENERAL", isPinned: false });
    setMessage("Announcement posted & sent to all students");
    router.refresh();
    setLoading("");
  };

  const handleDeleteAnn = async (id: string) => {
    if (!confirm("Delete?")) return;
    await deleteAnnouncement(id);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-lg p-3 text-sm bg-emerald-50 text-emerald-700 flex justify-between">
          <span>{message}</span><button onClick={() => setMessage("")}>✕</button>
        </div>
      )}

      {/* Today's Overview */}
      <div className="card bg-gradient-to-r from-brand-600 to-brand-700 text-white border-0">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5" />
          <h2 className="text-sm font-bold">{DAY_SHORT[now.getDay()]}, {now.toLocaleDateString(undefined, { month: "long", day: "numeric" })}</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {classes.flatMap((c) =>
            c.schedules.filter((s: any) => s.dayOfWeek === today).map((s: any) => ({
              classId: c.id, className: c.name, startTime: s.startTime, endTime: s.endTime,
              students: c.enrollments.length, isLive: c.liveSessions.length > 0,
            }))
          ).sort((a, b) => a.startTime.localeCompare(b.startTime)).map((item, i) => (
            <div key={i} className={`flex-shrink-0 p-3 rounded-xl min-w-[160px] cursor-pointer ${
              item.isLive ? "bg-red-500/30 border border-red-300" : "bg-white/10 hover:bg-white/20"
            }`} onClick={() => { setSelectedClass(item.classId); setExpanded(item.classId); }}>
              <div className="flex items-center gap-1.5 mb-1">
                {item.isLive && <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />}
                <p className="text-[10px] text-brand-200">{item.startTime} — {item.endTime}</p>
              </div>
              <p className="text-xs font-semibold">{item.className}</p>
              <p className="text-[10px] text-brand-300">{item.students} students</p>
            </div>
          ))}
          {classes.every((c) => c.schedules.every((s: any) => s.dayOfWeek !== today)) && (
            <p className="text-brand-200 text-xs py-2">No classes scheduled today</p>
          )}
        </div>
      </div>

      {/* Class Cards */}
      {classes.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No active classes. Ask the principal to assign classes to you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => {
            const isLive = cls.liveSessions.length > 0;
            const liveSession = cls.liveSessions[0];
            const todaySchedule = cls.schedules.filter((s: any) => s.dayOfWeek === today);
            const isExp = expanded === cls.id;
            const attendedToday = cls.attendances.length;
            const totalStudents = cls.enrollments.length;

            return (
              <div key={cls.id} className={`card ${isLive ? "border-2 border-red-300 bg-red-50/30" : ""}`}>
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm ${isLive ? "bg-red-500 animate-pulse" : "bg-brand-600"}`}>
                    {isLive ? <Play className="w-6 h-6" /> : cls.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-800 truncate">{cls.name}</h3>
                      {isLive && <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">🔴 LIVE</span>}
                      <span className="badge-info text-[10px]">{cls.schoolGrade.gradeLevel}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                      <span><Users className="w-3 h-3 inline" /> {totalStudents} students</span>
                      <span><FolderOpen className="w-3 h-3 inline" /> {cls._count.materials} materials</span>
                      {todaySchedule.length > 0 && <span className="text-brand-600 font-medium">Today: {todaySchedule.map((s: any) => s.startTime + "–" + s.endTime).join(", ")}</span>}
                      {attendedToday > 0 && <span className="text-emerald-600"><UserCheck className="w-3 h-3 inline" /> {attendedToday}/{totalStudents} marked</span>}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!isLive ? (
                      <button onClick={() => handleStartClass(cls.id)} disabled={loading === "start-" + cls.id}
                        className="text-xs px-3 py-2 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 flex items-center gap-1.5 shadow-sm">
                        {loading === "start-" + cls.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Start Class
                      </button>
                    ) : (
                      <button onClick={() => handleEndClass(liveSession.id)} disabled={loading === "end-" + liveSession.id}
                        className="text-xs px-3 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 flex items-center gap-1.5">
                        {loading === "end-" + liveSession.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                        End Class
                      </button>
                    )}
                    <button onClick={() => openAttendance(cls.id, cls.enrollments, cls.attendances)}
                      className="text-xs px-3 py-2 rounded-xl bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> Attendance
                    </button>
                    <button onClick={() => setShowAnnForm(showAnnForm === cls.id ? null : cls.id)}
                      className="text-xs px-3 py-2 rounded-xl bg-amber-50 text-amber-600 font-medium hover:bg-amber-100 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" /> Alert
                    </button>
                    <button onClick={() => setExpanded(isExp ? null : cls.id)} className="text-gray-400 p-1">
                      {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Topic input for starting class */}
                {!isLive && expanded === cls.id && (
                  <div className="mt-3 flex gap-2">
                    <input className="input-field flex-1 text-xs" placeholder="Today's topic (optional)" value={topicInput} onChange={(e) => setTopicInput(e.target.value)} />
                  </div>
                )}

                {/* Attendance Form */}
                {showAttendance === cls.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-blue-600" /> Mark Attendance
                        {isLive && liveSession.startedAt && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Assembly window: first 10 min
                          </span>
                        )}
                      </h4>
                      <div className="flex gap-1.5">
                        <button onClick={() => markAllPresent(cls.enrollments)} className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-600 font-medium">Mark All Present</button>
                        <button onClick={() => { setShowAttendance(null); }} className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-600">Close</button>
                      </div>
                    </div>
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                      {cls.enrollments.map((e: any) => (
                        <div key={e.studentId} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                          {e.student.user.image ? (
                            <img src={e.student.user.image} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                              {e.student.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                            </div>
                          )}
                          <span className="text-xs text-gray-800 flex-1">{e.student.user.name}</span>
                          <div className="flex gap-1">
                            {ATT_OPTIONS.map((opt) => (
                              <button key={opt.value} onClick={() => setAttendanceMap({ ...attendanceMap, [e.studentId]: opt.value })}
                                className={`text-[9px] px-2 py-1 rounded-lg font-medium transition-all ${
                                  attendanceMap[e.studentId] === opt.value
                                    ? `${opt.color} text-white`
                                    : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                                }`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => handleBulkAttendance(cls.id)} disabled={loading === "att-" + cls.id}
                      className="mt-3 btn-primary text-xs w-full py-2 flex items-center justify-center gap-2">
                      {loading === "att-" + cls.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Save Attendance ({Object.values(attendanceMap).filter(Boolean).length}/{cls.enrollments.length})
                    </button>
                  </div>
                )}

                {/* Announcement Form */}
                {showAnnForm === cls.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 p-3 bg-amber-50 rounded-lg space-y-3">
                    <h4 className="text-xs font-bold text-amber-800 flex items-center gap-2">
                      <Megaphone className="w-4 h-4" /> Post Class Announcement
                    </h4>
                    <p className="text-[10px] text-amber-600">This will be visible to students and also sent as a message to each enrolled student.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-500">Title *</label>
                        <input className="input-field text-xs" placeholder="e.g. Homework Due Tomorrow" value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Type</label>
                        <select className="input-field text-xs" value={annForm.type} onChange={(e) => setAnnForm({ ...annForm, type: e.target.value })}>
                          <option value="GENERAL">General</option>
                          <option value="CLASS_REMINDER">Class Reminder</option>
                          <option value="HOMEWORK">Homework</option>
                          <option value="EXAM_NOTICE">Exam Notice</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">Content *</label>
                      <textarea className="input-field text-xs" rows={3} placeholder="Write your announcement..." value={annForm.content} onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })} />
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={annForm.isPinned} onChange={(e) => setAnnForm({ ...annForm, isPinned: e.target.checked })} className="rounded" />
                      Pin this announcement
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => handlePostAnnouncement(cls.id)} disabled={loading === "ann-" + cls.id}
                        className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1">
                        {loading === "ann-" + cls.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Post & Notify Students
                      </button>
                      <button onClick={() => setShowAnnForm(null)} className="btn-ghost text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Expanded: Students + Announcements */}
                {isExp && showAttendance !== cls.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {/* Students list */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Students ({cls.enrollments.length})</p>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5">
                        {cls.enrollments.map((e: any) => {
                          const att = cls.attendances.find((a: any) => a.studentId === e.studentId);
                          return (
                            <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                              {e.student.user.image ? (
                                <img src={e.student.user.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[8px] font-bold">
                                  {e.student.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                </div>
                              )}
                              <span className="text-[10px] text-gray-700 flex-1 truncate">{e.student.user.name}</span>
                              {att && (
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
                                  att.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" :
                                  att.status === "LATE" ? "bg-amber-100 text-amber-700" :
                                  att.status === "ABSENT" ? "bg-red-100 text-red-700" :
                                  "bg-blue-100 text-blue-700"
                                }`}>{att.status}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Schedule */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Weekly Schedule</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cls.schedules.sort((a: any, b: any) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek)).map((s: any) => (
                          <span key={s.id} className={`text-[10px] px-2 py-1 rounded-lg ${s.dayOfWeek === today ? "bg-brand-100 text-brand-700 font-bold" : "bg-gray-100 text-gray-600"}`}>
                            {DAY_SHORT[DAYS.indexOf(s.dayOfWeek)]} {s.startTime}–{s.endTime}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Recent Announcements */}
                    {cls.announcements.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Recent Announcements</p>
                        {cls.announcements.map((a: any) => (
                          <div key={a.id} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg mb-1 border border-amber-100">
                            <Megaphone className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-[10px] font-medium text-gray-800">{a.title}</p>
                              <p className="text-[9px] text-gray-600">{a.content}</p>
                              <p className="text-[8px] text-gray-400 mt-0.5">{a.type} • {new Date(a.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => handleDeleteAnn(a.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link href="/teacher/materials" className="text-[10px] px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 font-medium hover:bg-brand-100">
                        <FolderOpen className="w-3 h-3 inline mr-1" /> Manage Materials
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
