"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Send a message
export async function sendMessage(data: { receiverId: string; subject?: string; content: string }) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await db.message.create({
    data: {
      senderId: session.user.id,
      receiverId: data.receiverId,
      subject: data.subject || null,
      content: data.content,
    },
  });

  revalidatePath("/teacher/messages");
  revalidatePath("/principal/messages");
  revalidatePath("/student/messages");
  return { success: true };
}

// Get all conversations (grouped by contact)
export async function getConversations() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const messages = await db.message.findMany({
    where: {
      OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, role: true, image: true } },
      receiver: { select: { id: true, name: true, role: true, image: true } },
    },
  });

  // Group by conversation partner
  const convMap = new Map<string, any>();
  for (const msg of messages) {
    const partnerId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
    const partner = msg.senderId === session.user.id ? msg.receiver : msg.sender;
    if (!convMap.has(partnerId)) {
      const unread = messages.filter((m) => m.senderId === partnerId && m.receiverId === session.user.id && !m.isRead).length;
      convMap.set(partnerId, { partner, lastMessage: msg, unread });
    }
  }

  return { conversations: Array.from(convMap.values()) };
}

// Get messages with a specific user
export async function getMessagesWith(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: userId },
        { senderId: userId, receiverId: session.user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  });

  // Mark as read
  await db.message.updateMany({
    where: { senderId: userId, receiverId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return { messages };
}

// Get unread count
export async function getUnreadCount() {
  const session = await getServerSession(authOptions);
  if (!session) return 0;

  const count = await db.message.count({
    where: { receiverId: session.user.id, isRead: false },
  });

  return count;
}

// Mark all messages from a user as read
export async function markAllRead(senderId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await db.message.updateMany({
    where: { senderId, receiverId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/teacher/messages");
  revalidatePath("/principal/messages");
  return { success: true };
}
