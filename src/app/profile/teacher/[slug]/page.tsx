import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PublicTeacherProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const teacher = await db.teacher.findFirst({
    where: { profileSlug: slug },
    include: {
      user: { select: { name: true, countryCode: true, image: true } },
      schools: {
        where: { status: "APPROVED", isActive: true },
        include: { school: { select: { name: true, logo: true } } },
      },
      classes: {
        where: { isActive: true },
        include: { subject: true, enrollments: { where: { status: "ACTIVE" }, select: { id: true } } },
      },
      ratings: { orderBy: { createdAt: "desc" }, take: 5, include: { student: { include: { user: { select: { name: true } } } } } },
    },
  });

  if (!teacher) return notFound();

  const stars = (r: number) => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-5">
            {teacher.profilePicture ? (
              <img src={teacher.profilePicture} alt="" className="w-24 h-24 rounded-2xl object-cover border-4 border-white/30" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold">
                {teacher.user.name?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{teacher.user.name}</h1>
              {teacher.headline && <p className="text-brand-200 mt-1">{teacher.headline}</p>}
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${teacher.isOnline ? "bg-emerald-500 text-white" : "bg-white/20 text-white/70"}`}>
                  {teacher.isOnline ? "🟢 Online" : "⚪ Offline"}
                </span>
                {teacher.rating > 0 && (
                  <span className="text-amber-300 text-sm">{stars(teacher.rating)} ({teacher.totalRatings})</span>
                )}
                {teacher.isVerified && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">✓ Verified</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Intro Video */}
        {teacher.introVideoUrl && (
          <div className="card">
            <h2 className="text-sm font-bold mb-3">🎥 Introduction</h2>
            <video src={teacher.introVideoUrl} controls className="w-full rounded-xl max-h-[400px]" />
          </div>
        )}

        {/* Bio */}
        {teacher.bio && (
          <div className="card">
            <h2 className="text-sm font-bold mb-2">About Me</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{teacher.bio}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-4">
            <div className="text-2xl font-bold text-brand-600">{teacher.yearsExperience}</div>
            <div className="text-[10px] text-gray-500">Years Experience</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-2xl font-bold text-emerald-600">{teacher.classes.length}</div>
            <div className="text-[10px] text-gray-500">Active Classes</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-2xl font-bold text-purple-600">
              {teacher.classes.reduce((s: number, c: any) => s + c.enrollments.length, 0)}
            </div>
            <div className="text-[10px] text-gray-500">Students</div>
          </div>
        </div>

        {/* Subjects */}
        {teacher.classes.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-bold mb-3">📚 Subjects I Teach</h2>
            <div className="flex flex-wrap gap-2">
              {teacher.classes.map((c: any) => (
                <span key={c.id} className="text-xs px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 font-medium">
                  {c.subject?.name || c.name} ({c.enrollments.length} students)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Qualifications */}
        {(teacher.qualifications as string[])?.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-bold mb-3">🎓 Qualifications</h2>
            <div className="space-y-1">
              {(teacher.qualifications as string[]).map((q: any, i: number) => (
                <p key={i} className="text-sm text-gray-600">• {q}</p>
              ))}
            </div>
          </div>
        )}

        {/* Teaching Style */}
        {teacher.teachingStyle && (
          <div className="card">
            <h2 className="text-sm font-bold mb-2">🎯 Teaching Style</h2>
            <p className="text-sm text-gray-600">{teacher.teachingStyle}</p>
          </div>
        )}

        {/* Languages */}
        {(teacher.languages as string[])?.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-bold mb-2">🌍 Languages</h2>
            <div className="flex gap-2">
              {(teacher.languages as string[]).map((l: any, i: number) => (
                <span key={i} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">{l}</span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Reviews */}
        {teacher.ratings.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-bold mb-3">⭐ Student Reviews</h2>
            <div className="space-y-3">
              {teacher.ratings.map((r: any) => (
                <div key={r.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{r.student?.user?.name || "Student"}</span>
                    <span className="text-amber-500 text-xs">{stars(r.rating)}</span>
                  </div>
                  {r.comment && <p className="text-xs text-gray-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schools */}
        {teacher.schools.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-bold mb-2">🏫 Schools</h2>
            {teacher.schools.map((st: any) => (
              <span key={st.id} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">{st.school.name}</span>
            ))}
          </div>
        )}

        {/* Links */}
        <div className="flex gap-3 flex-wrap">
          {teacher.linkedinUrl && <a href={teacher.linkedinUrl} target="_blank" className="text-xs px-4 py-2 rounded-lg bg-blue-600 text-white">LinkedIn</a>}
          {teacher.twitterUrl && <a href={teacher.twitterUrl} target="_blank" className="text-xs px-4 py-2 rounded-lg bg-gray-800 text-white">Twitter/X</a>}
          {teacher.websiteUrl && <a href={teacher.websiteUrl} target="_blank" className="text-xs px-4 py-2 rounded-lg bg-brand-600 text-white">Website</a>}
        </div>

        <div className="text-center pt-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-brand-600">Powered by GDA Schools</Link>
        </div>
      </div>
    </div>
  );
}
