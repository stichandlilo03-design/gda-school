import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
        questions: true, startedAt: true, teacherId: true, durationMin: true,
        class: { select: { name: true, id: true } },
        teacher: { select: { user: { select: { name: true } } } },
      },
    });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Calculate live duration
    const liveMinutes = session.startedAt
      ? Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000)
      : 0;

    return NextResponse.json({ ...session, liveMinutes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const { action } = body;

    const ls = await db.liveClassSession.findUnique({ where: { id: sessionId } });
    if (!ls || ls.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "Session not active" }, { status: 400 });
    }

    // BOARD WRITE
    if (action === "board_write") {
      let board = Array.isArray(ls.boardContent) ? [...(ls.boardContent as any[])] : [];
      if (body.type === "clear") board = [];
      else if (body.text) board.push({ text: body.text, color: body.color || "#FFF", time: Date.now(), id: Math.random().toString(36).slice(2) });
      await db.liveClassSession.update({ where: { id: sessionId }, data: { boardContent: board } });
      return NextResponse.json({ ok: true });
    }

    // SET MODE (board/voice/video)
    if (action === "set_mode") {
      await db.liveClassSession.update({ where: { id: sessionId }, data: { teachingMode: body.mode || "board" } });
      return NextResponse.json({ ok: true });
    }

    // RAISE HAND
    if (action === "raise_hand") {
      let hands = Array.isArray(ls.raisedHands) ? [...(ls.raisedHands as any[])] : [];
      if (body.raised) {
        if (!hands.find((h: any) => h.studentId === body.studentId))
          hands.push({ studentId: body.studentId, studentName: body.studentName || "Student", time: Date.now() });
      } else {
        hands = hands.filter((h: any) => h.studentId !== body.studentId);
      }
      await db.liveClassSession.update({ where: { id: sessionId }, data: { raisedHands: hands } });
      return NextResponse.json({ ok: true });
    }

    // ACK HAND (teacher allows student to speak)
    if (action === "ack_hand") {
      let hands = Array.isArray(ls.raisedHands) ? [...(ls.raisedHands as any[])] : [];
      hands = hands.filter((h: any) => h.studentId !== body.studentId);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { raisedHands: hands } });
      return NextResponse.json({ ok: true });
    }

    // ASK QUESTION (student after hand accepted)
    if (action === "ask_question") {
      let qs = Array.isArray(ls.questions) ? [...(ls.questions as any[])] : [];
      qs.push({
        id: Math.random().toString(36).slice(2),
        studentId: body.studentId, studentName: body.studentName || "Student",
        question: body.question, time: Date.now(),
        answer: null, answered: false,
      });
      await db.liveClassSession.update({ where: { id: sessionId }, data: { questions: qs } });
      return NextResponse.json({ ok: true });
    }

    // ANSWER QUESTION (teacher)
    if (action === "answer_question") {
      let qs = Array.isArray(ls.questions) ? [...(ls.questions as any[])] : [];
      qs = qs.map((q: any) =>
        q.id === body.questionId ? { ...q, answer: body.answer, answered: true, answeredAt: Date.now() } : q
      );
      await db.liveClassSession.update({ where: { id: sessionId }, data: { questions: qs } });
      return NextResponse.json({ ok: true });
    }

    // CHAT
    if (action === "chat") {
      let chat = Array.isArray(ls.chatMessages) ? [...(ls.chatMessages as any[])] : [];
      chat.push({ from: body.from || "Anon", message: body.message || "", time: Date.now(), id: Math.random().toString(36).slice(2) });
      if (chat.length > 100) chat = chat.slice(-100);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { chatMessages: chat } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
