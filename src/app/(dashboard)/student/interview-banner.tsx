"use client";

import { useState } from "react";
import InterviewChat from "@/components/interview-chat";
import { Calendar, Clock, Video, Phone, MessageSquare, AlertCircle, XCircle, CheckCircle, Star } from "lucide-react";

export default function StudentInterviewBanner({
  approvalStatus,
  schoolName,
  latestInterview,
}: {
  approvalStatus: string;
  schoolName: string;
  latestInterview: any | null;
}) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Interview Scheduled */}
      {approvalStatus === "INTERVIEW_SCHEDULED" && latestInterview && (
        <div>
          <div className="p-5 bg-purple-50 border-2 border-purple-300 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-purple-800">Admission Interview Scheduled!</h3>
                <p className="text-xs text-purple-500 mt-0.5">You have been invited for an admission interview at {schoolName}</p>
                <div className="mt-3 p-3 bg-white/80 rounded-xl space-y-1.5">
                  <p className="text-sm text-purple-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <strong>Date:</strong> {new Date(latestInterview.scheduledAt).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-sm text-purple-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <strong>Time:</strong> {new Date(latestInterview.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-sm text-purple-700"><strong>Duration:</strong> {latestInterview.duration} minutes</p>
                  {latestInterview.interviewer && (
                    <p className="text-xs text-purple-500">Interviewer: {latestInterview.interviewer.name}</p>
                  )}
                  {latestInterview.meetingNotes && (
                    <p className="text-xs text-purple-600 mt-2 italic bg-purple-50 p-2 rounded">📋 {latestInterview.meetingNotes}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <button onClick={() => setChatOpen(!chatOpen)}
                    className={`text-xs px-4 py-2.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${chatOpen ? "bg-brand-600 text-white" : "bg-white text-brand-600 border border-brand-200 hover:bg-brand-50"}`}>
                    <MessageSquare className="w-3.5 h-3.5" /> {chatOpen ? "Close Chat" : "Chat with Interviewer"}
                  </button>
                  {latestInterview.meetingLink && (
                    <a href={latestInterview.meetingLink} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-4 py-2.5 rounded-lg bg-white text-purple-600 border border-purple-200 hover:bg-purple-50 font-medium flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" /> Join Video Call
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
          {chatOpen && (
            <div className="mt-3">
              <InterviewChat interviewId={latestInterview.id} onClose={() => setChatOpen(false)} />
            </div>
          )}
        </div>
      )}

      {/* Interviewed — waiting for result */}
      {approvalStatus === "INTERVIEWED" && latestInterview && (
        <div>
          <div className="p-5 bg-cyan-50 border border-cyan-200 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-cyan-200 text-cyan-700 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-cyan-800">Interview Complete — Under Review</h3>
                <p className="text-sm text-cyan-600 mt-1">The principal is reviewing your interview. You will be notified once a decision is made.</p>
                {latestInterview.result && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-cyan-100">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${latestInterview.result === "PASS" ? "bg-emerald-100 text-emerald-700" : latestInterview.result === "FAIL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {latestInterview.result}
                      </span>
                      {latestInterview.scoreOverall != null && (
                        <span className="flex items-center gap-1 text-sm text-cyan-600"><Star className="w-3.5 h-3.5" /> {latestInterview.scoreOverall}/100</span>
                      )}
                    </div>
                    {latestInterview.feedback && <p className="text-xs text-gray-600 mt-2 italic">{latestInterview.feedback}</p>}
                  </div>
                )}
                <button onClick={() => setChatOpen(!chatOpen)} className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-3">
                  <MessageSquare className="w-3 h-3" /> {chatOpen ? "Hide Chat" : "View Interview Chat"}
                </button>
              </div>
            </div>
          </div>
          {chatOpen && <div className="mt-3"><InterviewChat interviewId={latestInterview.id} onClose={() => setChatOpen(false)} /></div>}
        </div>
      )}

      {/* Pending — no interview yet */}
      {approvalStatus === "PENDING" && (
        <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0 animate-pulse">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-800">Admission Pending</h3>
              <p className="text-sm text-amber-600 mt-1">Your application to <strong>{schoolName}</strong> is being reviewed. The principal may schedule an interview with you.</p>
            </div>
          </div>
        </div>
      )}

      {/* Rejected */}
      {approvalStatus === "REJECTED" && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-4">
            <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-red-800">Application Not Approved</h3>
              <p className="text-xs text-red-600 mt-1">Unfortunately your application was not approved. Contact the school for more details.</p>
            </div>
          </div>
        </div>
      )}

      {/* Approved — brief confirmation */}
      {approvalStatus === "APPROVED" && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">You are an approved student at <strong>{schoolName}</strong></p>
          </div>
        </div>
      )}
    </div>
  );
}
