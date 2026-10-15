import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { pickSampleData } from "./fields";

// GET /api/daily-report-samples – list the current staff member's samples
export async function GET() {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const samples = await prisma.dailyReportSample.findMany({
      where: { staffId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ samples });
  } catch (err) {
    console.error("GET /api/daily-report-samples error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/daily-report-samples – save report content as a new sample
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, data } = await req.json();
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed) return NextResponse.json({ error: "Sample name is required" }, { status: 400 });

    const sample = await prisma.dailyReportSample.create({
      data: { staffId: user.id, name: trimmed.slice(0, 100), data: pickSampleData(data) as object },
    });

    return NextResponse.json({ sample });
  } catch (err) {
    console.error("POST /api/daily-report-samples error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
