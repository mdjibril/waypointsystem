import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ reviews: [] });
    }

    const where: any = {};
    if (currentUser.role !== "ADMIN") {
      where.application = {
        assignedStaffId: currentUser.id,
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
            destinationCountry: true,
            currentStage: true,
            clientId: true,
            client: { select: { id: true, firstName: true, lastName: true, fileNumber: true } },
          },
        },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error("Fetch reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "STAFF")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { applicationId, notes } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: Number(applicationId) },
      include: { documents: true },
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
            destinationCountry: true,
            currentStage: true,
            clientId: true,
            client: { select: { id: true, firstName: true, lastName: true, fileNumber: true } },
          },
        },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can decide reviews" }, { status: 403 });
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
        decision,
        status: decision === "CORRECTIONS_REQUESTED" ? "PENDING" : "COMPLETED",
        notes: notes !== undefined ? notes : undefined,
        decidedAt: new Date(),
      },
      include: {
        application: {
          select: {
            id: true,
            serviceType: true,
            destinationCountry: true,
            currentStage: true,
            clientId: true,
            client: { select: { id: true, firstName: true, lastName: true, fileNumber: true } },
          },
        },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ review });
  } catch (error: any) {
    console.error("Update review error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
