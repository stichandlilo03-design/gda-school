import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";

export default async function ParentTeachersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: { children: { include: { student: { include: {
      user: { select: { name: true } },
      school: { select: { name: true } },
      enrollments: { where: { status: "ACTIVE" }, include: { class: { include: {
        subject: true,
        teacher: { include: { user: { select: { name: true, email: true, image: true } } } },
      } } } },
    } } } } },
  });

  if (!parent) return <div className="p-8">Not found.</div>;

  // Build unique teachers across all children
  const teacherMap = new Map<string, any>();
  parent.children.forEach((link) => {
    link.student.enrollments.forEach((en: any) => {
      const t = en.class?.teacher;
      if (!t) return;
      if (!teacherMap.has(t.id)) {
        teacherMap.set(t.id, {
          ...t, subjects: [], students: [],
          isOnline: t.isOnline, profileSlug: t.profileSlug,
        });
      }
      const entry = teacherMap.get(t.id)!;
      const sub = en.class?.subject?.name || en.class?.name;
      if (!entry.subjects.includes(sub)) entry.subjects.push(sub);
      if (!entry.students.includes(link.student.user.name)) entry.students.push(link.student.user.name);
    });
  });

  const teachers = Array.from(teacherMap.values());
  const stars = (r: number) => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));

  return (
    <>
      <DashboardHeader title="Teachers" subtitle={`${teachers.length} teachers across your children's classes`} />
      <div className="p-6 lg:p-8 space-y-4">
        {teachers.length === 0 ? (
          <div className="card text-center py-12"><p className="text-sm text-gray-500">No teachers found. Link children and enroll them in classes first.</p></div>
        ) : teachers.map((t: any) => (
          <div key={t.id} className="card">
            <div className="flex items-center gap-4">
              {t.profilePicture || t.user?.image ? (
                <img src={t.profilePicture || t.user.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                  {t.user?.name?.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">{t.user?.name}</h3>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${t.isOnline ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {t.isOnline ? "🟢 Online" : "⚪ Offline"}
                  </span>
                  {t.isVerified && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">✓ Verified</span>}
                </div>
                <p className="text-[10px] text-gray-500">{t.headline || t.user?.email}</p>
                {t.rating > 0 && <p className="text-[10px] text-amber-500">{stars(t.rating)} ({t.totalRatings})</p>}
              </div>
              {t.profileSlug && (
                <a href={`/profile/teacher/${t.profileSlug}`} target="_blank" className="text-[10px] px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 font-medium hover:bg-brand-100">View Profile</a>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-[9px] text-gray-400 mr-1">Teaches:</span>
              {t.subjects.map((s: string) => <span key={s} className="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{s}</span>)}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="text-[9px] text-gray-400 mr-1">Your children:</span>
              {t.students.map((s: string) => <span key={s} className="text-[9px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">{s}</span>)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
