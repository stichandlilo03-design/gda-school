"use client";

import { useState } from "react";
import { suspendStudent, reinstateStudent } from "@/lib/actions/school";
import { useRouter } from "next/navigation";
import { GraduationCap, Search, UserX, UserCheck, Loader2 } from "lucide-react";

const GRADE_LABELS: Record<string,string> = {
  K1:"K1",K2:"K2",K3:"K3",G1:"G1",G2:"G2",G3:"G3",G4:"G4",G5:"G5",G6:"G6",
  G7:"G7",G8:"G8",G9:"G9",G10:"G10",G11:"G11",G12:"G12",
};

export default function StudentManager({ students }: { students: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");

  const filtered = students.filter((s: any) => {
    const matchSearch = !search || s.user.name.toLowerCase().includes(search.toLowerCase()) || s.user.email.toLowerCase().includes(search.toLowerCase());
    const matchGrade = !filterGrade || s.gradeLevel === filterGrade;
    return matchSearch && matchGrade;
  });

  const grades = [...new Set(students.map((s: any) => s.gradeLevel))].sort();

  const handleSuspend = async (studentId: string) => {
    if (!confirm("Suspend this student? They will not be able to log in.")) return;
    setLoading(studentId);
    await suspendStudent(studentId);
    router.refresh();
    setLoading("");
  };

  const handleReinstate = async (studentId: string) => {
    setLoading(studentId);
    await reinstateStudent(studentId);
    router.refresh();
    setLoading("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" className="flex-1 py-2.5 text-sm outline-none" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-40" value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
          <option value="">All Grades</option>
          {grades.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <p className="text-xs text-gray-500">{filtered.length} student(s) shown</p>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{students.length === 0 ? "No students enrolled yet." : "No students match your search."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-header px-4 py-3">Student</th>
                <th className="table-header px-4 py-3">Grade</th>
                <th className="table-header px-4 py-3">Classes</th>
                <th className="table-header px-4 py-3">Session</th>
                <th className="table-header px-4 py-3">Status</th>
                <th className="table-header px-4 py-3">Enrolled</th>
                <th className="table-header px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        {s.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.user.name}</p>
                        <p className="text-xs text-gray-500">{s.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="badge-info">{s.gradeLevel}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.enrollments.length}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.preferredSession.replace("SESSION_", "")}</td>
                  <td className="px-4 py-3">
                    <span className={s.user.isActive ? "badge-success" : "badge-danger"}>
                      {s.user.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(s.enrolledAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {s.user.isActive ? (
                      <button onClick={() => handleSuspend(s.id)} disabled={loading === s.id} className="text-red-500 hover:text-red-700 text-xs">
                        {loading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="flex items-center gap-1"><UserX className="w-3 h-3" /> Suspend</span>}
                      </button>
                    ) : (
                      <button onClick={() => handleReinstate(s.id)} disabled={loading === s.id} className="text-emerald-500 hover:text-emerald-700 text-xs">
                        {loading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> Reinstate</span>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
