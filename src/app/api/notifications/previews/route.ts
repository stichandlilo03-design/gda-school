import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ messages: [] });

    const messages = await db.message.findMany({
      where: { receiverId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        sender: { select: { id: true, name: true, role: true, image: true } },
      },
    });

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}
