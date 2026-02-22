import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// In-memory game rooms (resets on deploy — fine for games)
const gameRooms: Record<string, {
  id: string; game: string; hostId: string; hostName: string; guestId?: string; guestName?: string;
  status: "waiting" | "playing" | "finished";
  state: any; turn: string; moves: any[]; winner?: string;
  createdAt: number; lastActivity: number;
}> = {};

// Online presence
const onlinePlayers: Record<string, { id: string; studentId: string; name: string; lastSeen: number }> = {};

// Clean stale rooms/players
function cleanup() {
  const now = Date.now();
  for (const [k, v] of Object.entries(onlinePlayers)) { if (now - v.lastSeen > 30000) delete onlinePlayers[k]; }
  for (const [k, v] of Object.entries(gameRooms)) { if (now - v.lastActivity > 300000) delete gameRooms[k]; }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const action = req.nextUrl.searchParams.get("action");

  cleanup();

  // Heartbeat — mark self online
  if (action === "heartbeat") {
    const student = await db.student.findUnique({ where: { userId }, select: { id: true } });
    if (student) {
      onlinePlayers[userId] = { id: userId, studentId: student.id, name: session.user.name || "Player", lastSeen: Date.now() };
    }
    // Return online players + pending invites for this user
    const others = Object.values(onlinePlayers).filter(p => p.id !== userId);
    const myInvites = Object.values(gameRooms).filter(r => r.guestId === userId && r.status === "waiting");
    const myRoom = Object.values(gameRooms).find(r => (r.hostId === userId || r.guestId === userId) && r.status === "playing");
    return NextResponse.json({ online: others, invites: myInvites, activeRoom: myRoom || null });
  }

  // Poll game room state
  if (action === "poll_room") {
    const roomId = req.nextUrl.searchParams.get("roomId");
    if (!roomId || !gameRooms[roomId]) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    const room = gameRooms[roomId];
    room.lastActivity = Date.now();
    return NextResponse.json(room);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const body = await req.json();
  const { action } = body;

  cleanup();

  // Create game room and invite a player
  if (action === "invite") {
    const { guestUserId, game } = body;
    const roomId = Math.random().toString(36).slice(2, 10);
    gameRooms[roomId] = {
      id: roomId, game, hostId: userId, hostName: session.user.name || "Player",
      guestId: guestUserId, guestName: onlinePlayers[guestUserId]?.name || "Player",
      status: "waiting", state: initGameState(game), turn: userId, moves: [],
      createdAt: Date.now(), lastActivity: Date.now(),
    };
    return NextResponse.json({ ok: true, roomId });
  }

  // Accept invite
  if (action === "accept") {
    const { roomId } = body;
    const room = gameRooms[roomId];
    if (!room || room.guestId !== userId) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    room.status = "playing";
    room.state = initGameState(room.game);
    room.turn = room.hostId;
    room.lastActivity = Date.now();
    return NextResponse.json({ ok: true, room });
  }

  // Decline invite
  if (action === "decline") {
    const { roomId } = body;
    if (gameRooms[roomId]) delete gameRooms[roomId];
    return NextResponse.json({ ok: true });
  }

  // Make a move
  if (action === "move") {
    const { roomId, move } = body;
    const room = gameRooms[roomId];
    if (!room || room.status !== "playing") return NextResponse.json({ error: "Invalid room" }, { status: 400 });
    if (room.turn !== userId) return NextResponse.json({ error: "Not your turn" }, { status: 400 });

    const result = applyMove(room, userId, move);
    room.state = result.state;
    room.turn = result.nextTurn;
    room.moves.push({ playerId: userId, move, time: Date.now() });
    room.lastActivity = Date.now();
    if (result.winner) { room.winner = result.winner; room.status = "finished"; }
    return NextResponse.json({ ok: true, room });
  }

  // Leave/forfeit
  if (action === "leave") {
    const { roomId } = body;
    const room = gameRooms[roomId];
    if (room) {
      room.status = "finished";
      room.winner = room.hostId === userId ? room.guestId : room.hostId;
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// Initialize game state
function initGameState(game: string) {
  if (game === "tictactoe") return { board: Array(9).fill(null) };
  if (game === "wordrace") return { word: "", guessed: [], wrong: 0, currentGuesser: "host" };
  return {};
}

// Apply move and return new state + next turn
function applyMove(room: any, playerId: string, move: any) {
  const isHost = playerId === room.hostId;

  if (room.game === "tictactoe") {
    const board = [...room.state.board];
    const idx = move.index;
    if (idx < 0 || idx > 8 || board[idx]) return { state: room.state, nextTurn: room.turn };
    board[idx] = isHost ? "X" : "O";
    const winner = checkTTTWin(board);
    const nextTurn = playerId === room.hostId ? room.guestId : room.hostId;
    if (winner === "X") return { state: { board }, nextTurn, winner: room.hostId };
    if (winner === "O") return { state: { board }, nextTurn, winner: room.guestId };
    if (winner === "draw") return { state: { board }, nextTurn, winner: "draw" };
    return { state: { board }, nextTurn };
  }

  return { state: room.state, nextTurn: room.turn };
}

function checkTTTWin(b: (string | null)[]) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a, bb, c] of lines) { if (b[a] && b[a] === b[bb] && b[a] === b[c]) return b[a]; }
  return b.every(Boolean) ? "draw" : null;
}
