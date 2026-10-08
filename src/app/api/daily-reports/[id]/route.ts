import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

// PATCH /api/daily-reports/[id] – supervisor reviews a report
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const { supervisorComment, supervisorName, selfRating } = await req.json();

    const report = await prisma.dailyReport.update({
      where: { id },
      data: {
        supervisorComment: supervisorComment || null,
        supervisorName: supervisorName || user.name,
        reviewedById: user.id,
        status: "REVIEWED",
        reviewedAt: new Date(),
        ...(selfRating ? { selfRating } : {}),
      },
      include: {
        staff: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ report });
  } catch (err) {
    console.error("PATCH /api/daily-reports/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/daily-reports/[id] – get a single report (staff own, or admin any)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: {
        staff: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = user.role.toUpperCase() === "ADMIN";
    if (!isAdmin && report.staffId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error("GET /api/daily-reports/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/daily-reports/[id] – admin deletes a report
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only admins can delete reports" }, { status: 403 });
    }

    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await prisma.dailyReport.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    await prisma.dailyReport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Report deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/daily-reports/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

