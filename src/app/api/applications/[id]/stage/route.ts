import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { isValidTransition, stageForDecision, DecisionOutcome } from "@/lib/workflow";
import { WorkflowStage } from "@/types";

// GET /api/applications/[id]/stage - Stage history for an application
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id: Number(id) },
      include: { client: { select: { assignedStaffId: true } } },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (currentUser.role !== "ADMIN" && application.client.assignedStaffId !== currentUser.id) {
      return NextResponse.json(
        { error: "You do not have access to this application" },
        { status: 403 }
      );
    }

    const history = await prisma.applicationStageHistory.findMany({
      where: { applicationId: Number(id) },
      orderBy: { createdAt: "asc" },
      include: { changedBy: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("Fetch stage history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stage history" },
      { status: 500 }
    );
  }
}

// POST /api/applications/[id]/stage - Move an application to a new stage (ADMIN, or assigned STAFF)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { toStage, decisionStatus, note } = await request.json();

    if (!toStage) {
      return NextResponse.json(
        { error: "Target stage is required" },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id: Number(id) },
      include: { client: { select: { assignedStaffId: true } } },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (currentUser.role !== "ADMIN" && application.client.assignedStaffId !== currentUser.id) {
      return NextResponse.json(
        { error: "You do not have permission to move this application" },
        { status: 403 }
      );
    }

    const fromStage = application.currentStage as WorkflowStage;

    // Decision outcomes of WITHDRAWN / PENDING_ACTION only update decisionStatus and keep the current stage.
    const isSameStageDecisionUpdate =
      fromStage === "DECISION" &&
      toStage === "DECISION" &&
      (decisionStatus === "WITHDRAWN" || decisionStatus === "PENDING_ACTION");

    if (!isSameStageDecisionUpdate && !isValidTransition(fromStage, toStage as WorkflowStage)) {
      return NextResponse.json(
        { error: `Cannot move from ${fromStage} to ${toStage}` },
        { status: 400 }
      );
    }

    if (decisionStatus && (decisionStatus === "APPROVED" || decisionStatus === "REFUSED")) {
      const expectedStage = stageForDecision(decisionStatus as DecisionOutcome);
      if (expectedStage !== toStage) {
        return NextResponse.json(
          { error: `Decision "${decisionStatus}" must move the application to ${expectedStage}` },
          { status: 400 }
        );
      }
    }

    const [updatedApplication, historyEntry] = await prisma.$transaction([
      prisma.application.update({
        where: { id: Number(id) },
        data: {
          currentStage: toStage,
          ...(decisionStatus !== undefined ? { decisionStatus: decisionStatus || null } : {}),
        },
        include: {
          client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
          assignedStaff: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.applicationStageHistory.create({
        data: {
          applicationId: Number(id),
          fromStage,
          toStage,
          changedById: currentUser.id,
          note: note || null,
        },
        include: { changedBy: { select: { id: true, name: true } } },
      }),
    ]);

    return NextResponse.json({ application: updatedApplication, history: historyEntry });
  } catch (error: any) {
    console.error("Stage transition error:", error);
    return NextResponse.json(
      { error: "Failed to move application to the new stage" },
      { status: 500 }
    );
  }
}
