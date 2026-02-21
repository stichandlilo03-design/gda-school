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
        reactions: true, polls: true, videoFeeds: true, rtcSignals: true, startedAt: true, teacherId: true, durationMin: true,
        isPrep: true, prepHidden: true,
        class: { select: { name: true, id: true } },
        teacher: { select: { user: { select: { name: true } } } },
      },
    });
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const liveMinutes = s.startedAt ? Math.round((Date.now() - new Date(s.startedAt).getTime()) / 60000) : 0;

    // If prep session, filter hidden elements for non-teacher requests
    const role = req.nextUrl.searchParams.get("role");
    const hidden = (s.isPrep && s.prepHidden && typeof s.prepHidden === "object") ? s.prepHidden as Record<string, boolean> : {};

    if (s.isPrep && role !== "teacher") {
      return NextResponse.json({
        ...s,
        liveMinutes,
        boardContent: hidden.board ? [] : s.boardContent,
        boardHistory: hidden.board ? [] : s.boardHistory,
        polls: hidden.polls ? [] : s.polls,
        chatMessages: hidden.chat ? [] : s.chatMessages,
        questions: hidden.qa ? [] : s.questions,
        whispers: hidden.whisper ? [] : s.whispers,
        prepHidden: hidden, // students see WHICH things are hidden (for UI messaging)
      });
    }

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
        mode: body.mode || "poll", // "poll" | "test" | "exam"
      });
      await db.liveClassSession.update({ where: { id: sessionId }, data: { polls: polls } });
      return NextResponse.json({ ok: true });
    }

    // CREATE EXAM/TEST - multiple questions with timing
    if (action === "create_exam") {
      let polls = arr(ls.polls);
      const examId = uid();
      const questions = (body.questions || []).map((q: any, idx: number) => ({
        id: uid(),
        examId,
        questionNumber: idx + 1,
        question: q.question,
        options: (q.options || []).map((o: string) => ({ text: o, votes: [], voterNames: [] })),
        correctOption: q.correctOption ?? null,
        timeLimitSec: q.timeLimitSec || 60,
        active: false,
        closed: false,
      }));
      polls.push({
        id: examId,
        mode: body.mode || "exam", // "test" | "exam"
        title: body.title || (body.mode === "test" ? "Class Test" : "Examination"),
        questions,
        currentQuestion: -1, // not started yet
        totalQuestions: questions.length,
        createdAt: Date.now(),
        active: true,
        started: false,
        finished: false,
        showResults: false,
      });
      await db.liveClassSession.update({ where: { id: sessionId }, data: { polls: polls } });
      return NextResponse.json({ ok: true, examId });
    }

    // START EXAM - activate first question
    if (action === "start_exam") {
      let polls = arr(ls.polls);
      polls = polls.map((p: any) => {
        if (p.id !== body.examId) return p;
        const qs = [...p.questions];
        if (qs.length > 0) { qs[0].active = true; qs[0].startedAt = Date.now(); }
        return { ...p, started: true, currentQuestion: 0, questions: qs };
      });
      await db.liveClassSession.update({ where: { id: sessionId }, data: { polls: polls } });
      return NextResponse.json({ ok: true });
    }

    // ADVANCE EXAM - move to next question (auto or manual)
    if (action === "advance_exam") {
      let polls = arr(ls.polls);
      polls = polls.map((p: any) => {
        if (p.id !== body.examId) return p;
        const qs = [...p.questions];
        const cur = p.currentQuestion;
        if (cur >= 0 && cur < qs.length) { qs[cur].active = false; qs[cur].closed = true; }
        const next = cur + 1;
        if (next < qs.length) {
          qs[next].active = true;
          qs[next].startedAt = Date.now();
          return { ...p, currentQuestion: next, questions: qs };
        }
        // All questions done
        return { ...p, currentQuestion: next, questions: qs, finished: true, active: false };
      });
      await db.liveClassSession.update({ where: { id: sessionId }, data: { polls: polls } });
      return NextResponse.json({ ok: true });
    }

    // END EXAM - force end early
    if (action === "end_exam") {
      let polls = arr(ls.polls);
      polls = polls.map((p: any) => {
        if (p.id !== body.examId) return p;
        const qs = p.questions.map((q: any) => ({ ...q, active: false, closed: true }));
        return { ...p, questions: qs, finished: true, active: false };
      });
      await db.liveClassSession.update({ where: { id: sessionId }, data: { polls: polls } });
      return NextResponse.json({ ok: true });
    }

    // SHOW EXAM RESULTS
    if (action === "show_exam_results") {
      let polls = arr(ls.polls);
      polls = polls.map((p: any) => p.id === body.examId ? { ...p, showResults: true } : p);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { polls: polls } });
      return NextResponse.json({ ok: true });
    }

    // SAVE EXAM TO GRADES - teacher saves exam results to Assessment+Score records
    if (action === "save_exam_to_grades") {
      const exam = arr(ls.polls).find((p: any) => p.id === body.examId);
      if (!exam || !exam.finished) return NextResponse.json({ error: "Exam not finished" }, { status: 400 });

      // Find active term
      const cls = await db.class.findUnique({ where: { id: ls.classId }, include: { schoolGrade: { include: { school: true } } } });
      if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 400 });
      const activeTerm = await db.term.findFirst({ where: { schoolId: cls.schoolGrade.schoolId, isActive: true } });

      const assessmentType = exam.mode === "exam" ? "END_OF_TERM_EXAM" : exam.mode === "test" ? "MID_TERM_TEST" : "CONTINUOUS_ASSESSMENT";
      const totalQs = exam.questions.length;

      // Create Assessment
      const assessment = await db.assessment.create({
        data: {
          classId: ls.classId,
          termId: activeTerm?.id || null,
          type: assessmentType,
          title: exam.title || `${exam.mode === "exam" ? "Exam" : "Test"} - ${new Date().toLocaleDateString()}`,
          maxScore: totalQs,
          weight: exam.mode === "exam" ? 3 : 1,
          isPublished: true,
          gradeStatus: "SUBMITTED",
          submittedAt: new Date(),
        },
      });

      // Calculate each student's score from all questions
      const studentScores: Record<string, { correct: number; name: string }> = {};
      for (const q of exam.questions) {
        if (q.correctOption == null) continue;
        for (const opt of q.options) {
          for (const voter of (opt.voterNames || [])) {
            if (!studentScores[voter.id]) studentScores[voter.id] = { correct: 0, name: voter.name };
          }
        }
        // Check who voted for the correct option
        const correctOpt = q.options[q.correctOption];
        if (correctOpt) {
          for (const voter of (correctOpt.voterNames || [])) {
            if (studentScores[voter.id]) studentScores[voter.id].correct++;
          }
        }
      }

      // Create Score records
      for (const [studentId, data] of Object.entries(studentScores)) {
        try {
          await db.score.create({
            data: {
              studentId,
              assessmentId: assessment.id,
              score: data.correct,
              feedback: `${data.correct}/${totalQs} correct in classroom ${exam.mode}`,
              gradedAt: new Date(),
            },
          });
        } catch (_e) { /* skip if student doesn't exist or duplicate */ }
      }

      return NextResponse.json({ ok: true, assessmentId: assessment.id, studentCount: Object.keys(studentScores).length });
    }

    if (action === "vote_poll") {
      let polls = arr(ls.polls);
      polls = polls.map((p: any) => {
        if (p.id !== body.pollId) return p;
        // LOCK-IN: check if student already voted on this poll
        const alreadyVoted = p.options.some((o: any) => (o.votes || []).includes(body.studentId));
        if (alreadyVoted) return p; // Don't allow changing answer
        // Add vote to selected option
        return { ...p, options: p.options.map((o: any, i: number) => {
          if (i !== body.optionIndex) return o;
          return {
            ...o,
            votes: [...(o.votes || []), body.studentId],
            voterNames: [...(o.voterNames || []), { id: body.studentId, name: body.studentName || "Student" }],
          };
        })};
      });
      await db.liveClassSession.update({ where: { id: sessionId }, data: { polls: polls } });
      return NextResponse.json({ ok: true });
    }

    // VOTE ON EXAM QUESTION - lock-in per question
    if (action === "vote_exam_question") {
      let polls = arr(ls.polls);
      polls = polls.map((p: any) => {
        if (p.id !== body.examId) return p;
        const qs = p.questions.map((q: any) => {
          if (q.id !== body.questionId) return q;
          if (q.closed) return q; // question already closed
          // LOCK-IN: check if already voted
          const alreadyVoted = q.options.some((o: any) => (o.votes || []).includes(body.studentId));
          if (alreadyVoted) return q;
          return { ...q, options: q.options.map((o: any, i: number) => {
            if (i !== body.optionIndex) return o;
            return {
              ...o,
              votes: [...(o.votes || []), body.studentId],
              voterNames: [...(o.voterNames || []), { id: body.studentId, name: body.studentName || "Student" }],
            };
          })};
        });
        return { ...p, questions: qs };
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

    // ===== WEBRTC SIGNALING =====
    // Join as RTC participant
    if (action === "rtc_join") {
      let feeds = arr(ls.videoFeeds);
      feeds = feeds.filter((f: any) => f.odid !== body.userId);
      feeds.push({
        odid: body.userId,
        name: body.userName || "User",
        isTeacher: body.isTeacher || false,
        camOn: body.camOn ?? true,
        micOn: body.micOn ?? true,
        ts: Date.now(),
      });
      await db.liveClassSession.update({ where: { id: sessionId }, data: { videoFeeds: feeds } });
      return NextResponse.json({ ok: true });
    }

    // Leave RTC
    if (action === "rtc_leave") {
      let feeds = arr(ls.videoFeeds);
      feeds = feeds.filter((f: any) => f.odid !== body.userId);
      // Also clean up their signals
      let sigs = arr(ls.rtcSignals);
      sigs = sigs.filter((s: any) => s.from !== body.userId && s.to !== body.userId);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { videoFeeds: feeds, rtcSignals: sigs } });
      return NextResponse.json({ ok: true });
    }

    // Update cam/mic status without full rejoin
    if (action === "rtc_status") {
      let feeds = arr(ls.videoFeeds);
      feeds = feeds.map((f: any) => f.odid === body.userId ? { ...f, camOn: body.camOn, micOn: body.micOn, ts: Date.now() } : f);
      await db.liveClassSession.update({ where: { id: sessionId }, data: { videoFeeds: feeds } });
      return NextResponse.json({ ok: true });
    }

    // Post a WebRTC signal (offer/answer/ice)
    if (action === "rtc_signal") {
      let sigs = arr(ls.rtcSignals);
      // Prune signals older than 30s
      sigs = sigs.filter((s: any) => Date.now() - s.ts < 30000);
      sigs.push({
        id: uid(),
        from: body.from,
        to: body.to,
        type: body.type, // "offer" | "answer" | "ice"
        data: body.data,
        fromName: body.fromName,
        fromIsTeacher: body.fromIsTeacher,
        ts: Date.now(),
      });
      await db.liveClassSession.update({ where: { id: sessionId }, data: { rtcSignals: sigs } });
      return NextResponse.json({ ok: true });
    }

    // Consume (delete) processed signals
    if (action === "rtc_consume") {
      let sigs = arr(ls.rtcSignals);
      const ids = body.signalIds || [];
      sigs = sigs.filter((s: any) => !ids.includes(s.id));
      await db.liveClassSession.update({ where: { id: sessionId }, data: { rtcSignals: sigs } });
      return NextResponse.json({ ok: true });
    }

    // PREP: Toggle hidden elements (teacher controls what students see)
    if (action === "toggle_prep_hidden") {
      const hidden = (ls.prepHidden && typeof ls.prepHidden === "object") ? { ...(ls.prepHidden as any) } : {};
      const field = body.field; // "board" | "polls" | "chat" | "qa" | "whisper"
      hidden[field] = !hidden[field];
      await db.liveClassSession.update({ where: { id: sessionId }, data: { prepHidden: hidden } });
      return NextResponse.json({ ok: true, hidden });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
