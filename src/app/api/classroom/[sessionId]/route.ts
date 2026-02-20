import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const s = await db.liveClassSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true, status: true, topic: true, teachingMode: true,
        boardContent: true, boardHistory: true, raisedHands: true,
        chatMessages: true, whispers: true, questions: true,
        reactions: true, polls: true, startedAt: true, teacherId: true, durationMin: true,
        class: { select: { name: true, id: true } },
        teacher: { select: { user: { select: { name: true } } } },
      },
    });
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const liveMinutes = s.startedAt ? Math.round((Date.now() - new Date(s.startedAt).getTime()) / 60000) : 0;
    return NextResponse.json({ ...s, liveMinutes });
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
    if (!ls || ls.status !== "IN_PROGRESS")
      return NextResponse.json({ error: "Not active" }, { status: 400 });

    const arr = (field: any) => (Array.isArray(field) ? [...field] : []);
    const uid = () => Math.random().toString(36).slice(2);

    // BOARD WRITE
    if (action === "board_write") {
      let board = arr(ls.boardContent);
      let history = arr(ls.boardHistory);
      if (body.type === "clear") {
        // Save cleared content to history before clearing
        if (board.length > 0) {
          history.push({ clearedAt: Date.now(), content: board });
        }
        board = [];
      } else if (body.text) {
        board.push({ text: body.text, color: body.color || "#FFF", time: Date.now(), id: uid() });
      }
      await db.liveClassSession.update({ where: { id: sessionId }, data: { boardContent: board, boardHistory: history } });
      return NextResponse.json({ ok: true });
    }

    // SET MODE
    if (action === "set_mode") {
      await db.liveClassSession.update({ where: { id: sessionId }, data: { teachingMode: body.mode || "board" } });
      return NextResponse.json({ ok: true });
    }

    // RAISE HAND
    if (action === "raise_hand") {
      let hands = arr(ls.raisedHands);
      if (body.raised) {
        if (!hands.find((h: any) => h.studentId === body.studentId))
          hands.push({ studentId: body.studentId, studentName: body.studentName || "Student", time: Date.now() });
      } else hands = hands.filter((h: any) => h.studentId !== body.studentId);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { raisedHands: hands } });
      return NextResponse.json({ ok: true });
    }

    // ACK HAND
    if (action === "ack_hand") {
      let hands = arr(ls.raisedHands);
      hands = hands.filter((h: any) => h.studentId !== body.studentId);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { raisedHands: hands } });
      return NextResponse.json({ ok: true });
    }

    // ASK QUESTION
    if (action === "ask_question") {
      let qs = arr(ls.questions);
      qs.push({ id: uid(), studentId: body.studentId, studentName: body.studentName || "Student",
        question: body.question, time: Date.now(), answer: null, answered: false });
      await db.liveClassSession.update({ where: { id: sessionId }, data: { questions: qs } });
      return NextResponse.json({ ok: true });
    }

    // ANSWER QUESTION
    if (action === "answer_question") {
      let qs = arr(ls.questions);
      qs = qs.map((q: any) => q.id === body.questionId ? { ...q, answer: body.answer, answered: true, answeredAt: Date.now() } : q);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { questions: qs } });
      return NextResponse.json({ ok: true });
    }

    // CLASS CHAT
    if (action === "chat") {
      let chat = arr(ls.chatMessages);
      chat.push({ from: body.from || "Anon", message: body.message || "", time: Date.now(), id: uid() });
      if (chat.length > 200) chat = chat.slice(-200);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { chatMessages: chat } });
      return NextResponse.json({ ok: true });
    }

    // WHISPER (private student-to-student message)
    if (action === "whisper") {
      let whispers = arr(ls.whispers);
      whispers.push({
        id: uid(), fromId: body.fromId, fromName: body.fromName,
        toId: body.toId, toName: body.toName,
        message: body.message, time: Date.now(),
      });
      if (whispers.length > 300) whispers = whispers.slice(-300);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { whispers: whispers } });
      return NextResponse.json({ ok: true });
    }

    // REACTION (emoji reaction from anyone)
    if (action === "reaction") {
      let reactions = arr(ls.reactions);
      reactions.push({ from: body.from, emoji: body.emoji, time: Date.now(), id: uid() });
      if (reactions.length > 100) reactions = reactions.slice(-100);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { reactions: reactions } });
      return NextResponse.json({ ok: true });
    }

    // POLL (teacher creates, students vote)
    if (action === "create_poll") {
      let polls = arr(ls.polls);
      polls.push({
        id: uid(), question: body.question,
        options: (body.options || []).map((o: string) => ({ text: o, votes: [], voterNames: [] })),
        createdAt: Date.now(), active: true, correctOption: null,
      });
      await db.liveClassSession.update({ where: { id: sessionId }, data: { polls: polls } });
      return NextResponse.json({ ok: true });
    }

    if (action === "vote_poll") {
      let polls = arr(ls.polls);
      polls = polls.map((p: any) => {
        if (p.id !== body.pollId) return p;
        // Remove previous votes from this student across all options
        const cleaned = p.options.map((o: any) => ({
          ...o,
          votes: (o.votes || []).filter((v: string) => v !== body.studentId),
          voterNames: (o.voterNames || []).filter((v: any) => v.id !== body.studentId),
        }));
        // Add vote to selected option
        return { ...p, options: cleaned.map((o: any, i: number) => {
          if (i !== body.optionIndex) return o;
          return {
            ...o,
            votes: [...o.votes, body.studentId],
            voterNames: [...o.voterNames, { id: body.studentId, name: body.studentName || "Student" }],
          };
        })};
      });
      await db.liveClassSession.update({ where: { id: sessionId }, data: { polls: polls } });
      return NextResponse.json({ ok: true });
    }

    if (action === "close_poll") {
      let polls = arr(ls.polls);
      polls = polls.map((p: any) => p.id === body.pollId ? { ...p, active: false } : p);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { polls: polls } });
      return NextResponse.json({ ok: true });
    }

    if (action === "mark_correct") {
      let polls = arr(ls.polls);
      polls = polls.map((p: any) => p.id === body.pollId ? { ...p, correctOption: body.optionIndex } : p);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { polls: polls } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
