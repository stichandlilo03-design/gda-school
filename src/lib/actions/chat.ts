"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Send a chat message linked to an interview
export async function sendInterviewMessage(data: {
  interviewId: string;
  content: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  // Get the interview to find the other party
  const interview = await db.interview.findUnique({
    where: { id: data.interviewId },
    include: {
      student: { include: { user: true } },
      schoolTeacher: { include: { teacher: { include: { user: true } } } },
      vacancyApp: true,
    },
  });

  if (!interview) return { error: "Interview not found" };

  // Determine receiver
  let receiverId: string | null = null;

  if (session.user.id === interview.interviewerId) {
    // Principal is sending — find the candidate
    if (interview.student) receiverId = interview.student.userId;
    else if (interview.schoolTeacher) receiverId = interview.schoolTeacher.teacher.userId;
  } else {
    // Candidate is sending — send to interviewer
    receiverId = interview.interviewerId;
  }

  if (!receiverId) return { error: "Could not determine recipient" };

  await db.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      subject: `Interview Chat: ${interview.id.slice(-6)}`,
      content: data.content,
    },
  });

  return { success: true };
}

// Get all messages for an interview
export async function getInterviewMessages(interviewId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized", messages: [] };

  const interview = await db.interview.findUnique({
    where: { id: interviewId },
    include: {
      student: true,
      schoolTeacher: { include: { teacher: true } },
    },
  });

  if (!interview) return { error: "Interview not found", messages: [] };

  // Get the two user IDs involved
  const interviewerId = interview.interviewerId;
  let candidateId: string | null = null;
  if (interview.student) candidateId = interview.student.userId;
  else if (interview.schoolTeacher) candidateId = interview.schoolTeacher.teacher.userId;

  if (!candidateId) return { error: "No candidate found", messages: [] };

  // Check the current user is part of this conversation
  if (session.user.id !== interviewerId && session.user.id !== candidateId) {
    return { error: "Not authorized for this interview", messages: [] };
  }

  const subject = `Interview Chat: ${interviewId.slice(-6)}`;

  const messages = await db.message.findMany({
    where: {
      subject,
      OR: [
        { senderId: interviewerId, receiverId: candidateId },
        { senderId: candidateId, receiverId: interviewerId },
      ],
    },
    include: {
      sender: { select: { name: true, role: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Mark unread messages as read
  await db.message.updateMany({
    where: {
      subject,
      receiverId: session.user.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  return {
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      senderName: m.sender.name,
      senderRole: m.sender.role,
      senderId: m.senderId,
      createdAt: m.createdAt.toISOString(),
      isMe: m.senderId === session.user.id,
    })),
  };
}
