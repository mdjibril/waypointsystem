import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { pickSampleData } from "../fields";

async function loadOwnSample(rawId: string, userId: number) {
  const id = parseInt(rawId, 10);
  if (isNaN(id)) return { error: NextResponse.json({ error: "Invalid ID" }, { status: 400 }) };
  const sample = await prisma.dailyReportSample.findUnique({ where: { id } });
  if (!sample || sample.staffId !== userId) {
    return { error: NextResponse.json({ error: "Sample not found" }, { status: 404 }) };
  }
  return { sample };
}

// PATCH /api/daily-report-samples/[id] – rename and/or replace a sample's content
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: rawId } = await params;
    const found = await loadOwnSample(rawId, user.id);
    if (found.error) return found.error;

    const { name, data } = await req.json();
    const trimmed = typeof name === "string" ? name.trim() : undefined;
    if (trimmed === "") return NextResponse.json({ error: "Sample name is required" }, { status: 400 });

    const sample = await prisma.dailyReportSample.update({
      where: { id: found.sample.id },
      data: {
        ...(trimmed ? { name: trimmed.slice(0, 100) } : {}),
        ...(data !== undefined ? { data: pickSampleData(data) as object } : {}),
      },
    });

    return NextResponse.json({ sample });
  } catch (err) {
    console.error("PATCH /api/daily-report-samples/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/daily-report-samples/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: rawId } = await params;
    const found = await loadOwnSample(rawId, user.id);
    if (found.error) return found.error;

    await prisma.dailyReportSample.delete({ where: { id: found.sample.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/daily-report-samples/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
