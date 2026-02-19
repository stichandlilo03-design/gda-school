import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const vacancies = await db.vacancy.findMany({
      where: { status: "OPEN", isPublic: true },
      include: {
        school: { select: { name: true, countryCode: true, slug: true, motto: true, currency: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(vacancies);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
