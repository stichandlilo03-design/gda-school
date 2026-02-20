"use client";

import { useState } from "react";
import { approveStudent, rejectStudent, suspendStudent, reinstateStudent, promoteStudent, changeStudentGrade } from "@/lib/actions/student-management";
import { useRouter } from "next/navigation";
import { GraduationCap, Search, UserX, UserCheck, Loader2, ChevronDown, ChevronUp, ArrowUp, Shield, XCircle, Eye } from "lucide-react";
import { getGradeLabelForCountry, getEducationSystem } from "@/lib/education-systems";

export default function StudentManager({ students, countryCode = "NG" }: { students: any[]; countryCode?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [promoteGrade, setPromoteGrade] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const eduSystem = getEducationSystem(countryCode);
  const allGrades = eduSystem.levels.flatMap(l => l.grades);

  const filtered = students.filter((s: any) => {
    const matchSearch = !search || s.user.name?.toLowerCase().includes(search.toLowerCase()) || s.user.email?.toLowerCase().includes(search.toLowerCase());
    const matchGrade = !filterGrade || s.gradeLevel === filterGrade;
    const matchStatus = !filterStatus || s.approvalStatus === filterStatus;
    return matchSearch && matchGrade && matchStatus;
  });

  const grades = [...new Set(students.map((s: any) => s.gradeLevel))].sort();
  const pendingCount = students.filter((s: any) => s.approvalStatus === "PENDING").length;
  const activeCount = students.filter((s: any) => s.approvalStatus === "APPROVED").length;

  const handleApprove = async (id: string) => { setLoading(id); await approveStudent(id); router.refresh(); setLoading(""); };
  const handleReject = async (id: string) => { setLoading(id); await rejectStudent(id, rejectReason); router.refresh(); setLoading(""); setRejectReason(""); };
  const handleSuspend = async (id: string) => {
    if (!suspendReason) { alert("Enter a reason"); return; }
    setLoading(id); await suspendStudent(id, suspendReason); router.refresh(); setLoading(""); setSuspendReason("");
  };
  const handleReinstate = async (id: string) => { setLoading(id); await reinstateStudent(id); router.refresh(); setLoading(""); };
  const handlePromote = async (id: string) => {
    if (!promoteGrade) { alert("Select new grade"); return; }
    setLoading(id); await promoteStudent(id, promoteGrade); router.refresh(); setLoading(""); setPromoteGrade("");
  };
  const handleChangeGrade = async (id: string) => {
    if (!promoteGrade) { alert("Select grade"); return; }
    setLoading(id); await changeStudentGrade(id, promoteGrade); router.refresh(); setLoading(""); setPromoteGrade("");
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-brand-700">{students.length}</p>
          <p className="text-[10px] text-gray-500">Total Students</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-[10px] text-gray-500">Active</p>
        </div>
        <div className={`card text-center py-3 ${pendingCount > 0 ? "ring-2 ring-amber-400" : ""}`}>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-[10px] text-gray-500">Pending Approval</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input-field pl-10" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <select className="input-field w-auto" value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
            <option value="">All Grades</option>
            {grades.map(g => <option key={g} value={g}>{getGradeLabelForCountry(g, countryCode)}</option>)}
          </select>
          <select className="input-field w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingCount > 0 && !filterStatus && (
        <div className="card border-2 border-amber-300 bg-amber-50">
          <h3 className="text-sm font-bold text-amber-800 mb-3">⏳ Pending Approvals ({pendingCount})</h3>
          <div className="space-y-2">
            {students.filter((s: any) => s.approvalStatus === "PENDING").map((s: any) => (
              <div key={s.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{s.user.name}</p>
                  <p className="text-[10px] text-gray-500">{s.user.email} • {getGradeLabelForCountry(s.gradeLevel, countryCode)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(s.id)} disabled={loading === s.id} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700">
                    {loading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "✓ Approve"}
                  </button>
                  <button onClick={() => { setRejectReason(prompt("Reason for rejection (optional):") || ""); handleReject(s.id); }} disabled={loading === s.id}
                    className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">No students found</p>}
        {filtered.map((s: any) => {
          const isExp = expanded === s.id;
          const statusColors: Record<string,string> = {
            APPROVED: "bg-emerald-100 text-emerald-700", PENDING: "bg-amber-100 text-amber-700",
            SUSPENDED: "bg-red-100 text-red-700", REJECTED: "bg-gray-100 text-gray-600",
          };
          return (
            <div key={s.id} className="card">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : s.id)}>
                {s.profilePicture || s.user.image ? (
                  <img src={s.profilePicture || s.user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                    {s.user.name?.charAt(0) || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-800">{s.user.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[s.approvalStatus] || ""}`}>{s.approvalStatus}</span>
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{getGradeLabelForCountry(s.gradeLevel, countryCode)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{s.user.email} • {s.enrollments?.length || 0} classes</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>

              {isExp && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  {/* Promote / Change Grade */}
                  <div className="flex items-center gap-2">
                    <select className="input-field flex-1 text-xs" value={promoteGrade} onChange={e => setPromoteGrade(e.target.value)}>
                      <option value="">Select new grade...</option>
                      {allGrades.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                    <button onClick={() => handlePromote(s.id)} disabled={!promoteGrade || !!loading}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" /> Promote
                    </button>
                    <button onClick={() => handleChangeGrade(s.id)} disabled={!promoteGrade || !!loading}
                      className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700">Move</button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {s.approvalStatus === "PENDING" && (
                      <>
                        <button onClick={() => handleApprove(s.id)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg">✓ Approve</button>
                        <button onClick={() => { setRejectReason(prompt("Reason:") || ""); handleReject(s.id); }} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg">✗ Reject</button>
                      </>
                    )}
                    {s.approvalStatus === "APPROVED" && (
                      <div className="flex items-center gap-2">
                        <input className="input-field text-xs flex-1" placeholder="Suspension reason..." value={suspendReason} onChange={e => setSuspendReason(e.target.value)} />
                        <button onClick={() => handleSuspend(s.id)} disabled={!suspendReason}
                          className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Suspend
                        </button>
                      </div>
                    )}
                    {(s.approvalStatus === "SUSPENDED" || s.approvalStatus === "REJECTED") && (
                      <button onClick={() => handleReinstate(s.id)} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Reinstate
                      </button>
                    )}
                  </div>

                  {/* Info Grid */}
                  <div className="text-[10px] text-gray-500 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl">
                    <span>📅 Joined: {new Date(s.user.createdAt).toLocaleDateString()}</span>
                    <span>🪪 ID: <strong className="text-gray-700 font-mono">{s.idNumber || "Not generated"}</strong></span>
                    <span>🎓 Grade: <strong className="text-gray-700">{getGradeLabelForCountry(s.gradeLevel, countryCode)}</strong></span>
                    <span>📸 Photo: {s.profilePicture ? "✅ Uploaded" : "❌ None"}</span>
                    <span>💰 Fees: <strong className={s.feePaid ? "text-emerald-600" : "text-amber-600"}>{s.feePaid ? "✅ Paid" : "⏳ Due"}</strong></span>
                    <span>📚 Classes: {s.enrollments?.length || 0}</span>
                  </div>

                  {/* Enrolled Subjects */}
                  {(s.enrollments?.length > 0) && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-1">📚 Enrolled Subjects</p>
                      <div className="flex flex-wrap gap-1">
                        {s.enrollments.map((en: any) => (
                          <span key={en.id} className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{en.class?.subject?.name || en.class?.name || "Class"}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parent/Guardian Info */}
                  <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    <p className="text-[10px] font-bold text-rose-700 mb-2">👨‍👩‍👧 Parent / Guardian Details</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-gray-400">From Registration:</span>
                        <p className="text-gray-700">Name: <strong>{s.parentName || "—"}</strong></p>
                        <p className="text-gray-700">Phone: <strong>{s.parentPhone || "—"}</strong></p>
                        <p className="text-gray-700">Email: <strong>{s.parentEmail || "—"}</strong></p>
                      </div>
                      <div>
                        <span className="text-gray-400">Linked Parent Accounts:</span>
                        {(s.parentLinks?.length > 0) ? s.parentLinks.map((pl: any) => (
                          <div key={pl.id} className="mt-1 p-1.5 bg-white rounded-lg">
                            <p className="font-bold text-gray-700">{pl.parent?.user?.name}</p>
                            <p className="text-gray-500">{pl.relation} · {pl.parent?.user?.email} · {pl.parent?.user?.phone || "—"}</p>
                          </div>
                        )) : (
                          <p className="text-gray-400 mt-1">No parent account linked</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Payments */}
                  {(s.payments?.length > 0) && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-1">💰 Recent Payments</p>
                      <div className="space-y-1">
                        {s.payments.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-[10px]">
                            <span>{p.description}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{p.currency} {p.amount?.toLocaleString()}</span>
                              <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${p.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : p.status === "UNDER_REVIEW" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>{p.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
