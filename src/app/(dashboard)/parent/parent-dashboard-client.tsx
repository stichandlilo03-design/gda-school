"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { linkChildByEmail } from "@/lib/actions/parent";
import {
  Users, BookOpen, Calendar, Award, Clock, CreditCard,
  ChevronDown, ChevronUp, Plus, Loader2, Search, CheckCircle,
  AlertCircle, UserCheck, TrendingUp, Star, School,
} from "lucide-react";
import Link from "next/link";
import { to12h } from "@/lib/time-utils";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ParentDashboardClient({ parent }: { parent: any }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(parent.children[0]?.studentId || null);
  const [showLink, setShowLink] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkName, setLinkName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLink = async () => {
    if (!linkEmail && !linkName) { setMessage("Enter child's email or name"); return; }
    setLoading(true); setMessage("");
    const r = await linkChildByEmail(linkEmail, linkName);
    if (r.error) setMessage("Error: " + r.error);
    else { setMessage("✅ " + (r.message || "Child linked!")); setLinkEmail(""); setLinkName(""); router.refresh(); }
    setLoading(false);
  };

  const children = parent.children || [];

  // Aggregate stats
  const totalChildren = children.length;
  const totalSubjects = children.reduce((s: number, c: any) => s + (c.student?.enrollments?.length || 0), 0);
  const totalAttendance = children.reduce((s: number, c: any) => {
    const att = c.student?.attendances || [];
    const present = att.filter((a: any) => a.status === "PRESENT").length;
    return s + (att.length > 0 ? Math.round((present / att.length) * 100) : 0);
  }, 0);
  const avgAttendance = totalChildren > 0 ? Math.round(totalAttendance / totalChildren) : 0;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-xl text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message}
          <button onClick={() => setMessage("")} className="float-right opacity-60">✕</button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
          <Users className="w-5 h-5 text-rose-500 mb-1" />
          <div className="text-2xl font-bold text-rose-700">{totalChildren}</div>
          <div className="text-[10px] text-rose-600">Children Linked</div>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <BookOpen className="w-5 h-5 text-blue-500 mb-1" />
          <div className="text-2xl font-bold text-blue-700">{totalSubjects}</div>
          <div className="text-[10px] text-blue-600">Total Subjects</div>
        </div>
        <div className="card bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <UserCheck className="w-5 h-5 text-emerald-500 mb-1" />
          <div className="text-2xl font-bold text-emerald-700">{avgAttendance}%</div>
          <div className="text-[10px] text-emerald-600">Avg Attendance</div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <School className="w-5 h-5 text-purple-500 mb-1" />
          <div className="text-2xl font-bold text-purple-700">{new Set(children.map((c: any) => c.student?.school?.name)).size}</div>
          <div className="text-[10px] text-purple-600">Schools</div>
        </div>
      </div>

      {/* Link Child Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-800">
          {totalChildren === 0 ? "🔗 Link Your Children" : `👨‍👩‍👧‍👦 My Children (${totalChildren})`}
        </h2>
        <button onClick={() => setShowLink(!showLink)} className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 font-medium hover:bg-rose-100 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Link Child
        </button>
      </div>

      {/* Link Child Form */}
      {showLink && (
        <div className="card border-rose-200 bg-rose-50/30">
          <h3 className="text-sm font-bold mb-3">🔗 Link a Child to Your Account</h3>
          <p className="text-[10px] text-gray-500 mb-3">Enter your child&apos;s <strong>email</strong> (used during student registration) or their <strong>full name</strong>. We&apos;ll search and link them to your dashboard.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="label">Child&apos;s Email</label><input type="email" className="input-field bg-white" placeholder="child@email.com" value={linkEmail} onChange={e => setLinkEmail(e.target.value)} /></div>
            <div><label className="label">Child&apos;s Full Name</label><input className="input-field bg-white" placeholder="As registered in school" value={linkName} onChange={e => setLinkName(e.target.value)} /></div>
          </div>
          <button onClick={handleLink} disabled={loading} className="btn-primary text-xs mt-3 bg-rose-600 hover:bg-rose-700">
            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Search className="w-3 h-3 mr-1" />}
            Search & Link Child
          </button>
        </div>
      )}

      {/* No children */}
      {totalChildren === 0 && !showLink && (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No children linked yet</p>
          <p className="text-xs text-gray-400 mt-1">Click &quot;Link Child&quot; above to connect your children&apos;s student accounts</p>
          <button onClick={() => setShowLink(true)} className="btn-primary mt-4 text-xs bg-rose-600 hover:bg-rose-700">
            <Plus className="w-3 h-3 mr-1" /> Link Your First Child
          </button>
        </div>
      )}

      {/* Children Cards */}
      {children.map((link: any) => {
        const child = link.student;
        if (!child) return null;
        const isExp = expanded === link.studentId;
        const enrollments = child.enrollments || [];
        const attendances = child.attendances || [];
        const scores = child.scores || [];
        const payments = child.payments || [];
        const presentCount = attendances.filter((a: any) => a.status === "PRESENT").length;
        const attPercent = attendances.length > 0 ? Math.round((presentCount / attendances.length) * 100) : 0;
        const todayClasses = enrollments.filter((e: any) => e.class?.schedules?.length > 0);
        const currency = child.school?.currency || "USD";

        return (
          <div key={link.id} className="card border-l-4 border-l-rose-400">
            {/* Header */}
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExp ? null : link.studentId)}>
              {child.profilePicture || child.user?.image ? (
                <img src={child.profilePicture || child.user.image} alt="" className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg font-bold">
                  {child.user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">{child.user?.name}</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium">{child.gradeLevel}</span>
                  {child.idNumber && <span className="text-[8px] text-gray-400">{child.idNumber}</span>}
                </div>
                <p className="text-[10px] text-gray-500">{child.school?.name} · {enrollments.length} subjects · {link.relation}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[9px] text-emerald-600">📊 {attPercent}% attendance</span>
                  <span className="text-[9px] text-blue-600">📚 {enrollments.length} classes</span>
                  {child.isSuspended && <span className="text-[9px] text-red-600">⚠️ Suspended</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {child.feePaid ? (
                  <span className="text-[9px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">✅ Fees Paid</span>
                ) : (
                  <span className="text-[9px] px-2 py-1 rounded-full bg-amber-100 text-amber-700">💰 Fees Due</span>
                )}
                {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>

            {/* Expanded */}
            {isExp && (
              <div className="mt-4 space-y-4 pt-4 border-t border-gray-100">
                {/* Today's Schedule */}
                {todayClasses.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">📅 Today&apos;s Classes</h4>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {todayClasses.map((en: any) => (
                        <div key={en.id} className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs font-bold text-blue-800">{en.class?.subject?.name || en.class?.name}</p>
                          <p className="text-[10px] text-blue-600">{en.class?.teacher?.user?.name}</p>
                          {en.class?.schedules?.[0] && (
                            <p className="text-[9px] text-blue-500">{to12h(en.class.schedules[0].startTime)} – {to12h(en.class.schedules[0].endTime)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Subjects */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">📚 Enrolled Subjects</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {enrollments.map((en: any) => (
                      <span key={en.id} className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {en.class?.subject?.name || en.class?.name} <span className="text-gray-400">({en.class?.teacher?.user?.name?.split(" ")[0]})</span>
                      </span>
                    ))}
                    {enrollments.length === 0 && <p className="text-[10px] text-gray-400">No subjects enrolled yet</p>}
                  </div>
                </div>

                {/* Recent Grades */}
                {scores.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">📊 Recent Grades</h4>
                    <div className="space-y-1.5">
                      {scores.slice(0, 5).map((s: any) => {
                        const pct = s.assessment?.maxScore > 0 ? Math.round((s.score / s.assessment.maxScore) * 100) : 0;
                        const color = pct >= 70 ? "text-emerald-600 bg-emerald-50" : pct >= 50 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
                        return (
                          <div key={s.id} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg text-[10px]">
                            <div>
                              <span className="font-medium">{s.assessment?.title || "Assessment"}</span>
                              <span className="text-gray-400 ml-1">({s.class?.subject?.name})</span>
                            </div>
                            <span className={`font-bold px-2 py-0.5 rounded ${color}`}>{s.score}/{s.assessment?.maxScore} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Attendance Summary */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">✅ Attendance (Last 30 records)</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-200 flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-600">{attPercent}%</span>
                    </div>
                    <div className="text-[10px] text-gray-600 space-y-0.5">
                      <p>✅ Present: {presentCount}</p>
                      <p>❌ Absent: {attendances.filter((a: any) => a.status === "ABSENT").length}</p>
                      <p>⏰ Late: {attendances.filter((a: any) => a.status === "LATE").length}</p>
                      <p>Total: {attendances.length} records</p>
                    </div>
                  </div>
                </div>

                {/* Fee Status */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">💰 Fee Payments</h4>
                  {payments.length > 0 ? (
                    <div className="space-y-1.5">
                      {payments.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg text-[10px]">
                          <div>
                            <span className="font-medium">{p.feeStructure?.term || "Fee"}</span>
                            <span className="text-gray-400 ml-1">{new Date(p.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{currency} {p.amount?.toLocaleString()}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${p.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : p.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{p.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400">No payment records found</p>
                  )}
                </div>

                {/* Quick Links */}
                <div className="flex gap-2 flex-wrap pt-2">
                  <Link href="/parent/attendance" className="text-[10px] px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium hover:bg-emerald-100">View Full Attendance →</Link>
                  <Link href="/parent/grades" className="text-[10px] px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-medium hover:bg-blue-100">View All Grades →</Link>
                  <Link href="/parent/fees" className="text-[10px] px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 font-medium hover:bg-amber-100">View Fees →</Link>
                  <Link href="/parent/timetable" className="text-[10px] px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 font-medium hover:bg-purple-100">View Timetable →</Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
