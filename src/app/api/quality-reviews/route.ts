import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { canDecideQualityReview } from "@/lib/permissions";

// GET /api/quality-reviews - List reviews
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    const where: any = {};
    if (applicationId) {
      where.applicationId = Number(applicationId);
    } else if (!currentUser || currentUser.role !== "ADMIN") {
      where.application = {
        assignedStaffId: currentUser?.id || 0,
      };
    }

    const reviews = await prisma.qualityReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        application: {
          select: {
            id: true,
            serviceType: true,
            currentStage: true,
            client: { select: { id: true, firstName: true, lastName: true, fileNumber: true } },
          },
        },
        reviewer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ reviews });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/quality-reviews - Request a review
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { applicationId, notes } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: Number(applicationId) },
      include: { documents: { where: { status: { not: "REJECTED" } } } },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const review = await prisma.qualityReview.create({
      data: {
        applicationId: Number(applicationId),
        reviewerId: currentUser.id,
        notes: notes || null,
        documentIds: application.documents.map((d) => d.id),
      },
      include: {
        application: {
          select: {
            id: true,
            serviceType: true,
            currentStage: true,
            client: { select: { id: true, firstName: true, lastName: true, fileNumber: true } },
          },
        },
        reviewer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

// PATCH /api/quality-reviews - Approve / Reject / Request Corrections
export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();
    if (!currentUser || !canDecideQualityReview(currentUser.role)) {
      return NextResponse.json({ error: "Only admins can decide reviews" }, { status: 403 });
    }

    const { id, decision, notes } = await request.json();

    if (!id || !decision) {
      return NextResponse.json({ error: "Review ID and decision are required" }, { status: 400 });
    }

    if (!["APPROVED", "REJECTED", "CORRECTIONS_REQUESTED"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    const review = await prisma.qualityReview.update({
      where: { id: Number(id) },
      data: {
        status: "COMPLETED",
        decision,
        notes: notes || undefined,
        decidedAt: new Date(),
      },
      include: {
        application: {
          select: {
            id: true,
            serviceType: true,
            currentStage: true,
            client: { select: { id: true, firstName: true, lastName: true, fileNumber: true } },
          },
        },
        reviewer: { select: { id: true, name: true } },
      },
    });

    // If approved, mark application as ready for submission
    if (decision === "APPROVED") {
      await prisma.application.update({
        where: { id: review.applicationId },
        data: { currentStage: "QUALITY_REVIEW" },
      });
    }

    return NextResponse.json({ review });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
