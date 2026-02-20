import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Poll classroom state (students + teacher call every 2s)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = await db.liveClassSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true, status: true, topic: true, teachingMode: true,
        boardContent: true, raisedHands: true, chatMessages: true,
        startedAt: true, teacherId: true,
        class: { select: { name: true, id: true } },
        teacher: { select: { user: { select: { name: true } } } },
      },
    });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(session);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}

// POST - Update classroom state (board, hands, chat, mode)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const { action } = body;

    const liveSession = await db.liveClassSession.findUnique({ where: { id: sessionId } });
    if (!liveSession || liveSession.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "Session not active" }, { status: 400 });
    }

    // TEACHER: Write text on board
    if (action === "board_write") {
      const { text, color, type } = body;
      let board = Array.isArray(liveSession.boardContent) ? [...(liveSession.boardContent as any[])] : [];
      if (type === "clear") {
        board = [];
      } else if (text) {
        board.push({ text, color: color || "#FFFFFF", time: Date.now(), id: Math.random().toString(36).slice(2) });
      }
      await db.liveClassSession.update({ where: { id: sessionId }, data: { boardContent: board } });
      return NextResponse.json({ ok: true });
    }

    // TEACHER: Change teaching mode (board/voice)
    if (action === "set_mode") {
      await db.liveClassSession.update({ where: { id: sessionId }, data: { teachingMode: body.mode || "board" } });
      return NextResponse.json({ ok: true });
    }

    // STUDENT: Raise or lower hand
    if (action === "raise_hand") {
      const { studentId, studentName, raised } = body;
      let hands = Array.isArray(liveSession.raisedHands) ? [...(liveSession.raisedHands as any[])] : [];
      if (raised) {
        if (!hands.find((h: any) => h.studentId === studentId)) {
          hands.push({ studentId, studentName: studentName || "Student", time: Date.now() });
        }
      } else {
        hands = hands.filter((h: any) => h.studentId !== studentId);
      }
      await db.liveClassSession.update({ where: { id: sessionId }, data: { raisedHands: hands } });
      return NextResponse.json({ ok: true });
    }

    // TEACHER: Acknowledge raised hand (lower it)
    if (action === "ack_hand") {
      const { studentId } = body;
      let hands = Array.isArray(liveSession.raisedHands) ? [...(liveSession.raisedHands as any[])] : [];
      hands = hands.filter((h: any) => h.studentId !== studentId);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { raisedHands: hands } });
      return NextResponse.json({ ok: true });
    }

    // ANYONE: Send chat message
    if (action === "chat") {
      const { from, message } = body;
      let chat = Array.isArray(liveSession.chatMessages) ? [...(liveSession.chatMessages as any[])] : [];
      chat.push({ from: from || "Anonymous", message: message || "", time: Date.now(), id: Math.random().toString(36).slice(2) });
      if (chat.length > 100) chat = chat.slice(-100);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { chatMessages: chat } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}
