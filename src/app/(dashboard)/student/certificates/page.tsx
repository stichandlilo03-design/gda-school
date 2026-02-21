import { getServerSession } from "next-auth";
import { checkStudentAccess } from "@/lib/student-access";
import StudentAccessGate from "@/components/student-access-gate";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/layout/dashboard-header";
import { Award, Download, QrCode, Shield } from "lucide-react";

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // Access gate: block unapproved / unpaid students
  const access = await checkStudentAccess(session.user.id);
  if (access && !access.hasFullAccess) {
    return <StudentAccessGate access={access} pageName="Certificates" />;
  }


  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: {
      certificates: { orderBy: { issuedAt: "desc" } },
      user: { select: { name: true } },
    },
  });

  const typeLabels: Record<string, string> = {
    GRADE_COMPLETION: "Grade Completion Certificate",
    PRIMARY_LEAVING: "Primary School Leaving Certificate",
    JUNIOR_SECONDARY: "Junior Secondary Certificate",
    SENIOR_SECONDARY_DIPLOMA: "Senior Secondary Diploma",
  };

  const typeColors: Record<string, string> = {
    GRADE_COMPLETION: "from-blue-400 to-indigo-500",
    PRIMARY_LEAVING: "from-emerald-400 to-teal-500",
    JUNIOR_SECONDARY: "from-amber-400 to-orange-500",
    SENIOR_SECONDARY_DIPLOMA: "from-purple-400 to-violet-500",
  };

  return (
    <>
      <DashboardHeader title="Certificates" subtitle="Your earned certificates and credentials" />
      <div className="p-6 lg:p-8 space-y-6">
        <div className="card bg-brand-50 border-brand-200">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-semibold text-brand-800">Blockchain Verified</span>
          </div>
          <p className="text-xs text-brand-600">All certificates come with unique verification codes and QR codes for instant verification by employers and institutions.</p>
        </div>

        {student?.certificates && student.certificates.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {student.certificates.map((cert) => (
              <div key={cert.id} className="card overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${typeColors[cert.type] || "from-gray-400 to-gray-500"}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{cert.title}</h3>
                      <p className="text-sm text-gray-500">{typeLabels[cert.type] || cert.type}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Award className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Student:</span>
                      <span className="font-medium text-gray-800">{student.user.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Grade Level:</span>
                      <span className="font-medium text-gray-800">{cert.gradeLevel}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Issued:</span>
                      <span className="font-medium text-gray-800">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Verification Code:</span>
                    </div>
                    <p className="text-sm font-mono font-bold text-gray-800 mt-1">{cert.verificationCode}</p>
                  </div>

                  {cert.pdfUrl && (
                    <a href={cert.pdfUrl} target="_blank" rel="noopener" className="btn-primary w-full text-sm">
                      <Download className="w-4 h-4 mr-1" /> Download PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Certificates Yet</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Certificates are awarded upon grade completion, primary leaving, junior secondary completion, and senior secondary graduation.
              Keep learning and you will earn them!
            </p>
          </div>
        )}
      </div>
    </>
  );
}
