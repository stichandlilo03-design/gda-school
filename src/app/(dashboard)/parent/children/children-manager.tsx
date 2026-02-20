"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { linkChildByEmail, unlinkChild } from "@/lib/actions/parent";
import { Users, Plus, Search, Loader2, Trash2, BookOpen, UserCheck, Mail, School } from "lucide-react";

export default function ChildrenManager({ parent }: { parent: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkName, setLinkName] = useState("");

  const handleLink = async () => {
    if (!linkEmail && !linkName) { setMessage("Enter email or name"); return; }
    setLoading("link"); setMessage("");
    const r = await linkChildByEmail(linkEmail, linkName);
    if (r.error) setMessage("Error: " + r.error);
    else { setMessage("✅ " + r.message); setLinkEmail(""); setLinkName(""); router.refresh(); }
    setLoading("");
  };

  const handleUnlink = async (studentId: string, name: string) => {
    if (!confirm(`Remove ${name} from your dashboard?`)) return;
    setLoading(studentId);
    await unlinkChild(studentId);
    setMessage("✅ Child unlinked");
    setLoading(""); router.refresh();
  };

  const children = parent.children || [];

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-xl text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message} <button onClick={() => setMessage("")} className="float-right">✕</button>
        </div>
      )}

      {/* Link Child */}
      <div className="card border-rose-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">🔗 Link a Child</h3>
          <button onClick={() => setShowLink(!showLink)} className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 font-medium">
            {showLink ? "Hide" : "Show Form"}
          </button>
        </div>
        {showLink && (
          <div className="space-y-3">
            <p className="text-[10px] text-gray-500">Enter your child&apos;s student <strong>email</strong> or <strong>full name</strong>. If they registered with your email as parent email, they&apos;ll be auto-linked.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">Child&apos;s Email</label><input type="email" className="input-field" placeholder="child@email.com" value={linkEmail} onChange={e => setLinkEmail(e.target.value)} /></div>
              <div><label className="label">Child&apos;s Full Name</label><input className="input-field" placeholder="Full name as registered" value={linkName} onChange={e => setLinkName(e.target.value)} /></div>
            </div>
            <button onClick={handleLink} disabled={loading === "link"} className="btn-primary text-xs bg-rose-600 hover:bg-rose-700">
              {loading === "link" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Search className="w-3 h-3 mr-1" />}
              Search & Link
            </button>
          </div>
        )}
      </div>

      {/* Children Cards */}
      {children.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No children linked yet</p>
          <p className="text-xs text-gray-400 mt-1">Use the form above to link your children&apos;s student accounts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {children.map((link: any) => {
            const child = link.student;
            if (!child) return null;
            const att = child.attendances || [];
            const present = att.filter((a: any) => a.status === "PRESENT").length;
            const attPct = att.length > 0 ? Math.round((present / att.length) * 100) : 0;

            return (
              <div key={link.id} className="card">
                <div className="flex items-center gap-4">
                  {child.profilePicture || child.user?.image ? (
                    <img src={child.profilePicture || child.user.image} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold">
                      {child.user?.name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-sm font-bold">{child.user?.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700">{child.gradeLevel}</span>
                      {child.idNumber && <span className="text-[9px] text-gray-400 font-mono">{child.idNumber}</span>}
                      <span className="text-[9px] text-gray-400">{link.relation}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                      <span className="flex items-center gap-0.5"><School className="w-3 h-3" /> {child.school?.name}</span>
                      <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" /> {child.user?.email}</span>
                    </div>
                  </div>
                  <button onClick={() => handleUnlink(link.studentId, child.user?.name)} disabled={loading === link.studentId} className="text-xs px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50">
                    {loading === link.studentId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>

                {/* Quick info */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-center">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500 mx-auto" />
                    <div className="text-sm font-bold text-blue-700 mt-0.5">{child.enrollments?.length || 0}</div>
                    <div className="text-[8px] text-blue-600">Subjects</div>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg text-center">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                    <div className="text-sm font-bold text-emerald-700 mt-0.5">{attPct}%</div>
                    <div className="text-[8px] text-emerald-600">Attendance</div>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg text-center">
                    <span className="text-lg">{child.feePaid ? "✅" : "⏳"}</span>
                    <div className="text-[8px] text-amber-600 mt-0.5">{child.feePaid ? "Fees Paid" : "Fees Due"}</div>
                  </div>
                </div>

                {/* Subjects list */}
                {(child.enrollments?.length || 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {child.enrollments.map((en: any) => (
                      <span key={en.id} className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {en.class?.subject?.name || en.class?.name} · {en.class?.teacher?.user?.name?.split(" ")[0]}
                      </span>
                    ))}
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
