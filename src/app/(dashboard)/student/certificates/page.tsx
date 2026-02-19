import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import { Award, Download, ShieldCheck, GraduationCap, Calendar, Copy, ExternalLink } from "lucide-react";

const TYPE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  COMPLETION: { label: "Completion", color: "bg-blue-100 text-blue-700", icon: Award },
  GRADUATION: { label: "Graduation", color: "bg-purple-100 text-purple-700", icon: GraduationCap },
  MERIT: { label: "Merit", color: "bg-amber-100 text-amber-700", icon: Award },
  PARTICIPATION: { label: "Participation", color: "bg-emerald-100 text-emerald-700", icon: Award },
  EXCELLENCE: { label: "Excellence", color: "bg-pink-100 text-pink-700", icon: Award },
};

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { name: true } },
      school: { select: { name: true } },
      certificates: { orderBy: { issuedAt: "desc" } },
    },
  });

  if (!student) return null;

  return (
    <>
      <DashboardHeader title="My Certificates" subtitle="Your academic achievements and certifications" />
      <div className="p-6 lg:p-8 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="stat-card text-center">
            <Award className="w-7 h-7 text-amber-600 mx-auto mb-1" />
            <div className="text-2xl font-bold">{student.certificates.length}</div>
            <div className="text-[10px] text-gray-500">Total Certificates</div>
          </div>
          <div className="stat-card text-center">
            <ShieldCheck className="w-7 h-7 text-emerald-600 mx-auto mb-1" />
            <div className="text-2xl font-bold">{student.certificates.filter((c) => c.blockchainHash).length}</div>
            <div className="text-[10px] text-gray-500">Verified on Blockchain</div>
          </div>
          <div className="stat-card text-center col-span-2 lg:col-span-1">
            <GraduationCap className="w-7 h-7 text-purple-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-gray-800">{student.gradeLevel}</div>
            <div className="text-[10px] text-gray-500">Current Grade Level</div>
          </div>
        </div>

        {student.certificates.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">No Certificates Yet</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Certificates are awarded upon grade completion, outstanding performance, or participation in special programs.
              Keep working hard and your certificates will appear here!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {student.certificates.map((cert) => {
              const ct = TYPE_LABELS[cert.type] || TYPE_LABELS.COMPLETION;
              const Icon = ct.icon;
              return (
                <div key={cert.id} className="card border-t-4 border-t-amber-400 hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900">{cert.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ct.color}`}>{ct.label}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                      <span>Grade Level: <strong>{cert.gradeLevel}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Issued: <strong>{new Date(cert.issuedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</strong></span>
                    </div>
                    {cert.issuedBy && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Award className="w-3.5 h-3.5 text-gray-400" />
                        <span>Issued by: <strong>{cert.issuedBy}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Verification */}
                  <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Verification Code</span>
                      {cert.blockchainHash && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> Blockchain Verified</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-gray-200 flex-1 truncate">{cert.verificationCode}</code>
                    </div>
                  </div>

                  {/* Actions */}
                  {cert.pdfUrl && (
                    <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 text-xs px-4 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 w-full">
                      <Download className="w-3.5 h-3.5" /> Download Certificate
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
