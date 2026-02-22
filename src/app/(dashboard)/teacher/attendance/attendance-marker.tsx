"use client";

import { useState } from "react";
import { markAttendance } from "@/lib/actions/teacher";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, Check, X, Clock, AlertCircle } from "lucide-react";

const STATUSES = [
  { value: "PRESENT", label: "Present", color: "bg-emerald-500" },
  { value: "LATE", label: "Late", color: "bg-amber-500" },
  { value: "ABSENT", label: "Absent", color: "bg-red-500" },
  { value: "EXCUSED", label: "Excused", color: "bg-blue-500" },
];

export default function AttendanceMarker({ classes }: { classes: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<Record<string, string>>({});

  const currentClass = classes.find((c: any) => c.id === selectedClass);

  const selectClass = (classId: string) => {
    setSelectedClass(classId);
    const cls = classes.find((c: any) => c.id === classId);
    if (cls) {
      const initial: Record<string, string> = {};
      cls.enrollments.forEach((e: any) => { initial[e.student.id] = "PRESENT"; });
      setRecords(initial);
    }
  };

  const markAll = (status: string) => {
    const updated: Record<string, string> = {};
    Object.keys(records).forEach((k) => { updated[k] = status; });
    setRecords(updated);
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setLoading(true);
    setMessage("");
    const cls = classes.find((c: any) => c.id === selectedClass);
    const result = await markAttendance({
      classId: selectedClass,
      date,
      session: cls.session,
      records: Object.entries(records).map(([studentId, status]) => ({ studentId, status })),
    });
    if (result.error) setMessage("Error: " + result.error);
    else setMessage("Attendance saved successfully!");
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</div>
      )}

      <div className="card">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Select Class</label>
            <select className="input-field" value={selectedClass} onChange={(e) => selectClass(e.target.value)}>
              <option value="">Choose a class...</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} ({c.enrollments.length} students)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {currentClass && currentClass.enrollments.length > 0 ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">{currentClass.name} — {currentClass.enrollments.length} Students</h3>
            <div className="flex gap-2">
              <button onClick={() => markAll("PRESENT")} className="text-xs px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200">All Present</button>
              <button onClick={() => markAll("ABSENT")} className="text-xs px-3 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200">All Absent</button>
            </div>
          </div>

          <div className="space-y-2">
            {currentClass.enrollments.map((enrollment: any, i: number) => (
              <div key={enrollment.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-400 w-6">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {enrollment.student.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{enrollment.student.user.name}</p>
                </div>
                <div className="flex gap-1">
                  {STATUSES.map((s: any) => (
                    <button key={s.value}
                      onClick={() => setRecords((p) => ({ ...p, [enrollment.student.id]: s.value }))}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        records[enrollment.student.id] === s.value
                          ? `${s.color} text-white`
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Present: {Object.values(records).filter((v: any) => v === "PRESENT").length}</span>
              <span>Late: {Object.values(records).filter((v: any) => v === "LATE").length}</span>
              <span>Absent: {Object.values(records).filter((v: any) => v === "ABSENT").length}</span>
              <span>Excused: {Object.values(records).filter((v: any) => v === "EXCUSED").length}</span>
            </div>
            <button onClick={handleSave} disabled={loading} className="btn-primary">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><UserCheck className="w-4 h-4 mr-2" /> Save Attendance</>}
            </button>
          </div>
        </div>
      ) : selectedClass ? (
        <div className="card text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No students enrolled in this class yet.</p>
        </div>
      ) : null}
    </div>
  );
}
