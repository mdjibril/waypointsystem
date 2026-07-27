import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
    }

    const updates = await prisma.trackingUpdate.findMany({
      where: { applicationId: Number(applicationId) },
      orderBy: { createdAt: "desc" },
      include: {
        updatedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ updates });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch tracking" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { applicationId, status, message, referenceUrl } = await request.json();

    if (!applicationId || !status) {
      return NextResponse.json({ error: "Application ID and status are required" }, { status: 400 });
    }

    const validStatuses = ["SUBMITTED", "UNDER_REVIEW", "ADDITIONAL_INFO_REQUESTED", "DECISION_MADE", "PASSPORT_READY", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid tracking status" }, { status: 400 });
    }

    const update = await prisma.trackingUpdate.create({
      data: {
        applicationId: Number(applicationId),
        status,
        message: message || null,
        referenceUrl: referenceUrl || null,
        updatedById: currentUser.id,
      },
      include: {
        updatedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ update }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create tracking update" }, { status: 500 });
  }
}
