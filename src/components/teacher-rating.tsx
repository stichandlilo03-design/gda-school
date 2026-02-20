"use client";

import { useState } from "react";
import { Star, Send, Loader2, X } from "lucide-react";
import { rateTeacher } from "@/lib/actions/student-management";

export default function TeacherRating({
  teacherId, teacherName, sessionId, classId, onClose, existingRating,
}: {
  teacherId: string; teacherName: string; sessionId?: string; classId?: string;
  onClose: () => void; existingRating?: number;
}) {
  const [rating, setRating] = useState(existingRating || 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (rating === 0) { setError("Please select a rating"); return; }
    setLoading(true); setError("");
    const result = await rateTeacher({ teacherId, sessionId, classId, rating, comment: comment || undefined });
    if (result.error) setError(result.error);
    else setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
        <p className="text-lg">⭐</p>
        <p className="text-sm font-bold text-emerald-800">Thanks for your feedback!</p>
        <p className="text-[10px] text-emerald-600">Your rating helps other students</p>
        <button onClick={onClose} className="text-xs text-emerald-700 underline mt-2">Close</button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-4 relative">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>

      <p className="text-xs font-bold text-gray-800 mb-1">Rate your teacher</p>
      <p className="text-[10px] text-gray-500 mb-3">How was your session with {teacherName}?</p>

      {/* Stars */}
      <div className="flex items-center gap-1 justify-center mb-3">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-125">
            <Star className={`w-8 h-8 ${(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-gray-500 mb-3">
        {rating === 1 ? "Poor" : rating === 2 ? "Fair" : rating === 3 ? "Good" : rating === 4 ? "Very Good" : rating === 5 ? "Excellent!" : "Tap a star"}
      </p>

      {/* Comment */}
      <textarea className="input-field text-xs min-h-[50px] mb-2" placeholder="Optional: Tell others what you liked..." value={comment} onChange={e => setComment(e.target.value)} />

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      <button onClick={submit} disabled={loading || rating === 0} className="btn-primary w-full text-xs py-2">
        {loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <><Send className="w-3 h-3 mr-1" /> Submit Rating</>}
      </button>
    </div>
  );
}
