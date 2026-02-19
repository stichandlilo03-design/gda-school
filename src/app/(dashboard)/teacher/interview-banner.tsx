"use client";

import { useState } from "react";
import InterviewChat from "@/components/interview-chat";
import { Calendar, Clock, Video, Phone, MessageSquare, AlertCircle, XCircle, CheckCircle, Star, School } from "lucide-react";

export default function TeacherInterviewBanner({
  interviewScheduled,
  interviewed,
  pendingSchools,
  rejectedSchools,
  activeSchool,
}: {
  interviewScheduled: any[];
  interviewed: any[];
  pendingSchools: any[];
  rejectedSchools: any[];
  activeSchool: any | null;
}) {
  const [chatOpen, setChatOpen] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Interview Scheduled */}
      {interviewScheduled.map((st: any) => (
        <div key={st.id}>
          <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-purple-800">Interview Scheduled — {st.school.name}</h3>
                {st.interviews[0] && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-purple-600"><strong>Date:</strong> {new Date(st.interviews[0].scheduledAt).toLocaleString()}</p>
                    <p className="text-sm text-purple-600"><strong>Duration:</strong> {st.interviews[0].duration} minutes</p>
                    <p className="text-xs text-purple-400">Interviewer: {st.interviews[0].interviewer.name}</p>
                  </div>
                )}
                {/* Interview mode buttons */}
                {st.interviews[0] && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button onClick={() => setChatOpen(chatOpen === st.interviews[0].id ? null : st.interviews[0].id)}
                      className={`text-xs px-4 py-2 rounded-lg font-medium flex items-center gap-1.5 ${chatOpen === st.interviews[0].id ? "bg-brand-600 text-white" : "bg-white text-brand-600 border border-brand-200 hover:bg-brand-50"}`}>
                      <MessageSquare className="w-3.5 h-3.5" /> Chat with Interviewer
                    </button>
                    {st.interviews[0].meetingLink && (
                      <a href={st.interviews[0].meetingLink} target="_blank" rel="noopener"
                        className="text-xs px-4 py-2 rounded-lg bg-white text-purple-600 border border-purple-200 hover:bg-purple-50 font-medium flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" /> Join Zoom/Meet
                      </a>
                    )}
                    <a href="tel:" className="text-xs px-4 py-2 rounded-lg bg-white text-green-600 border border-green-200 hover:bg-green-50 font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone Call
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Chat panel */}
          {chatOpen === st.interviews[0]?.id && (
            <div className="mt-3">
              <InterviewChat interviewId={st.interviews[0].id} onClose={() => setChatOpen(null)} />
            </div>
          )}
        </div>
      ))}

      {/* Interviewed */}
      {interviewed.map((st: any) => (
        <div key={st.id}>
          <div className="p-5 bg-cyan-50 border border-cyan-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-cyan-200 text-cyan-700 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-cyan-800">Interview Complete — {st.school.name}</h3>
                <p className="text-sm text-cyan-600">Awaiting the principal's decision.</p>
                {st.interviews[0] && st.interviews[0].result && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-cyan-100">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${st.interviews[0].result === "PASS" ? "bg-emerald-100 text-emerald-700" : st.interviews[0].result === "FAIL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{st.interviews[0].result}</span>
                      {st.interviews[0].scoreOverall != null && <span className="flex items-center gap-1 text-sm text-cyan-600"><Star className="w-3 h-3" /> {st.interviews[0].scoreOverall}/100</span>}
                    </div>
                    {st.interviews[0].feedback && <p className="text-xs text-gray-600 mt-2">{st.interviews[0].feedback}</p>}
                  </div>
                )}
                {st.interviews[0] && (
                  <button onClick={() => setChatOpen(chatOpen === st.interviews[0].id ? null : st.interviews[0].id)}
                    className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-2">
                    <MessageSquare className="w-3 h-3" /> {chatOpen === st.interviews[0].id ? "Hide" : "View"} Chat
                  </button>
                )}
              </div>
            </div>
          </div>
          {chatOpen === st.interviews[0]?.id && (
            <div className="mt-3"><InterviewChat interviewId={st.interviews[0].id} onClose={() => setChatOpen(null)} /></div>
          )}
        </div>
      ))}

      {/* Pending */}
      {pendingSchools.map((st: any) => (
        <div key={st.id} className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center"><AlertCircle className="w-6 h-6" /></div>
            <div>
              <h3 className="text-base font-bold text-amber-800">Application Pending — {st.school.name}</h3>
              <p className="text-sm text-amber-600">Awaiting review. The principal may schedule an interview or approve directly.</p>
            </div>
          </div>
        </div>
      ))}

      {/* Rejected */}
      {rejectedSchools.map((st: any) => (
        <div key={st.id} className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-4">
            <XCircle className="w-6 h-6 text-red-500" />
            <div><h3 className="text-sm font-bold text-red-800">Not Approved — {st.school.name}</h3></div>
          </div>
        </div>
      ))}

      {/* Approved school info */}
      {activeSchool && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center"><School className="w-6 h-6" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-emerald-800">{activeSchool.school.name}</h3>
                <span className="text-[10px] bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-bold">APPROVED</span>
              </div>
              {activeSchool.school.motto && <p className="text-xs text-emerald-600 italic">"{activeSchool.school.motto}"</p>}
              <div className="flex items-center gap-4 mt-1 text-xs text-emerald-500">
                <span>Country: {activeSchool.school.countryCode}</span>
                <span>Currency: {activeSchool.school.currency}</span>
                <span>Joined: {new Date(activeSchool.hiredAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
