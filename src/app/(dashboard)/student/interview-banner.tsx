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
          <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-purple-800">Admission Interview Scheduled</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-purple-600"><strong>Date:</strong> {new Date(latestInterview.scheduledAt).toLocaleString()}</p>
                  <p className="text-sm text-purple-600"><strong>Duration:</strong> {latestInterview.duration} minutes</p>
                  <p className="text-xs text-purple-400">Interviewer: {latestInterview.interviewer.name}</p>
                </div>
                {/* Interview mode buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <button onClick={() => setChatOpen(!chatOpen)}
                    className={`text-xs px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 ${chatOpen ? "bg-brand-600 text-white" : "bg-white text-brand-600 border border-brand-200 hover:bg-brand-50"}`}>
                    <MessageSquare className="w-3.5 h-3.5" /> Chat with Interviewer
                  </button>
                  {latestInterview.meetingLink && (
                    <a href={latestInterview.meetingLink} target="_blank" rel="noopener"
                      className="text-xs px-4 py-2 rounded-lg bg-white text-purple-600 border border-purple-200 hover:bg-purple-50 font-medium flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" /> Join Zoom/Meet
                    </a>
                  )}
                  <a href="tel:" className="text-xs px-4 py-2 rounded-lg bg-white text-green-600 border border-green-200 hover:bg-green-50 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Phone Call
                  </a>
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

      {/* Interviewed — waiting */}
      {approvalStatus === "INTERVIEWED" && latestInterview && (
        <div>
          <div className="p-5 bg-cyan-50 border border-cyan-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-cyan-200 text-cyan-700 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-cyan-800">Interview Complete</h3>
                <p className="text-sm text-cyan-600">The principal is reviewing your application.</p>
                {latestInterview.result && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-cyan-100">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${latestInterview.result === "PASS" ? "bg-emerald-100 text-emerald-700" : latestInterview.result === "FAIL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{latestInterview.result}</span>
                      {latestInterview.scoreOverall != null && <span className="flex items-center gap-1 text-sm text-cyan-600"><Star className="w-3 h-3" /> {latestInterview.scoreOverall}/100</span>}
                    </div>
                    {latestInterview.feedback && <p className="text-xs text-gray-600 mt-2">{latestInterview.feedback}</p>}
                  </div>
                )}
                <button onClick={() => setChatOpen(!chatOpen)} className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-2">
                  <MessageSquare className="w-3 h-3" /> {chatOpen ? "Hide" : "View"} Chat
                </button>
              </div>
            </div>
          </div>
          {chatOpen && <div className="mt-3"><InterviewChat interviewId={latestInterview.id} onClose={() => setChatOpen(false)} /></div>}
        </div>
      )}

      {/* Pending */}
      {approvalStatus === "PENDING" && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div>
            <div><h3 className="text-base font-bold text-amber-800">Application Pending</h3>
              <p className="text-sm text-amber-600">Your application to {schoolName} is awaiting review.</p></div>
          </div>
        </div>
      )}

      {/* Rejected */}
      {approvalStatus === "REJECTED" && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-4">
            <XCircle className="w-6 h-6 text-red-500" />
            <div><h3 className="text-sm font-bold text-red-800">Application Not Approved</h3></div>
          </div>
        </div>
      )}

      {/* Approved */}
      {approvalStatus === "APPROVED" && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            <p className="text-sm text-emerald-700 font-medium">You are an approved student at {schoolName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
