import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: fetch conversations or chat messages
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const action = req.nextUrl.searchParams.get("action");

  // Get all conversations
  if (action === "conversations") {
    const messages = await db.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, role: true, image: true } },
        receiver: { select: { id: true, name: true, role: true, image: true } },
      },
    });
    const convMap = new Map<string, any>();
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!convMap.has(partnerId)) {
        const unread = messages.filter(m => m.senderId === partnerId && m.receiverId === userId && !m.isRead).length;
        convMap.set(partnerId, { partner, lastMessage: msg, unread });
      }
    }
    return NextResponse.json({ conversations: Array.from(convMap.values()) });
  }

  // Get chat messages with a specific user
  if (action === "chat") {
    const partnerId = req.nextUrl.searchParams.get("with");
    if (!partnerId) return NextResponse.json({ error: "Missing 'with' param" }, { status: 400 });
    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
    // Mark as read
    await db.message.updateMany({
      where: { senderId: partnerId, receiverId: userId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ messages });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// POST: send a message
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (!body.receiverId || !body.content?.trim()) {
    return NextResponse.json({ error: "Missing receiverId or content" }, { status: 400 });
  }

  const msg = await db.message.create({
    data: {
      senderId: session.user.id,
      receiverId: body.receiverId,
      subject: body.subject || null,
      content: body.content.trim(),
    },
  });

  return NextResponse.json({ ok: true, messageId: msg.id });
}
