"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function EnrollButton({ classId, studentId }: { classId: string; studentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, studentId }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        router.refresh();
      }
    } catch (_e) {
      alert("Failed to enroll. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleEnroll} disabled={loading} className="btn-primary w-full py-2.5 text-sm">
      {loading ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enrolling...</>
      ) : (
        "Enroll in This Class"
      )}
    </button>
  );
}
