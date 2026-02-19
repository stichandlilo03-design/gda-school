import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ count: 0 });

  const count = await db.message.count({
    where: { receiverId: session.user.id, isRead: false },
  });

  return NextResponse.json({ count });
}
