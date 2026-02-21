import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/schools/available — public endpoint for registration
export async function GET() {
  try {
    const schools = await db.school.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        countryCode: true,
        logo: true,
        motto: true,
        _count: {
          select: {
            grades: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Group by country
    const byCountry: Record<string, { id: string; name: string; logo: string | null; motto: string | null; gradeCount: number }[]> = {};
    for (const s of schools) {
      if (!byCountry[s.countryCode]) byCountry[s.countryCode] = [];
      byCountry[s.countryCode].push({
        id: s.id,
        name: s.name,
        logo: s.logo,
        motto: s.motto,
        gradeCount: s._count.grades,
      });
    }

    // Summary: which countries have schools
    const countries = Object.entries(byCountry).map(([code, list]) => ({
      code,
      schoolCount: list.length,
    }));

    return NextResponse.json({ schools: byCountry, countries });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
