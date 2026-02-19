import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const schools = await db.school.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        countryCode: true,
        motto: true,
        _count: { select: { students: true, teachers: true, grades: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(schools);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 });
  }
}
