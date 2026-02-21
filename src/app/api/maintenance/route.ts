import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const config = await db.siteConfig.findUnique({ where: { key: "maintenance_mode" } });
    const val = config?.value as any;
    return NextResponse.json({ enabled: val?.enabled || false, reason: val?.reason || "" });
  } catch (_e) {
    return NextResponse.json({ enabled: false, reason: "" });
  }
}
