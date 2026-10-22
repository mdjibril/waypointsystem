import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { isValidTransition, stageForDecision, DecisionOutcome, isTerminalStage, firstStage, stageLabel } from "@/lib/workflow";
import { routeForApplication } from "@/lib/serviceWorkflows";
import { WorkflowStage } from "@/types";
import { logActivity } from "@/lib/activityLog";
import { createNotification } from "@/lib/notifications";
import { canAccessClient, canTransitionApplication } from "@/lib/permissions";

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

    if (!canAccessClient(currentUser.role, application.client.assignedStaffId, currentUser.id)) {
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

    if (application.status === "ARCHIVED") {
      return NextResponse.json(
        { error: "This application is archived. Restore it from the archive before moving it." },
        { status: 400 }
      );
    }

    const fromStage = application.currentStage as WorkflowStage;
    const route = routeForApplication(application);

    if (!canTransitionApplication(currentUser.role, application.client.assignedStaffId, currentUser.id, fromStage, toStage as WorkflowStage)) {
      return NextResponse.json(
        { error: "You do not have permission to move this application" },
        { status: 403 }
      );
    }

    // Decision outcomes of WITHDRAWN / PENDING_ACTION only update decisionStatus and keep the current stage.
    const isSameStageDecisionUpdate =
      fromStage === "DECISION" &&
      toStage === "DECISION" &&
      (decisionStatus === "WITHDRAWN" || decisionStatus === "PENDING_ACTION");

    // Notes-only update (no stage change) — just record a note on the current stage
    const isNoteOnlyUpdate = fromStage === toStage && !!note && !decisionStatus;

    if (!isSameStageDecisionUpdate && !isNoteOnlyUpdate && !isValidTransition(fromStage, toStage as WorkflowStage, route)) {
      return NextResponse.json(
        { error: `Cannot move from ${stageLabel(fromStage, route)} to ${stageLabel(toStage, route)} on the ${application.serviceType} route` },
        { status: 400 }
      );
    }

    if (decisionStatus && (decisionStatus === "APPROVED" || decisionStatus === "REFUSED")) {
      const expectedStage = stageForDecision(decisionStatus as DecisionOutcome, route);
      if (expectedStage !== toStage) {
        return NextResponse.json(
          { error: `Decision "${decisionStatus}" must move the application to ${expectedStage}` },
          { status: 400 }
        );
      }
    }

    // Notes-only update: just create a history entry without changing the application
    if (isNoteOnlyUpdate) {
      const historyEntry = await prisma.applicationStageHistory.create({
        data: {
          applicationId: Number(id),
          fromStage,
          toStage,
          phase: application.phase,
          changedById: currentUser.id,
          note,
        },
        include: { changedBy: { select: { id: true, name: true } } },
      });

      return NextResponse.json({ historyEntry }, { status: 201 });
    }

    const newStatus = isTerminalStage(toStage as WorkflowStage, route)
      ? "COMPLETED"
      : toStage === firstStage(route)
        ? "NOT_STARTED"
        : "IN_PROGRESS";

    const [updatedApplication, historyEntry] = await prisma.$transaction([
      prisma.application.update({
        where: { id: Number(id) },
        data: {
          currentStage: toStage,
          status: newStatus,
          ...(decisionStatus !== undefined ? { decisionStatus: decisionStatus || null } : {}),
        },
        include: {
          client: { select: { id: true, fileNumber: true, firstName: true, lastName: true, assignedStaffId: true } },
          assignedStaff: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.applicationStageHistory.create({
        data: {
          applicationId: Number(id),
          fromStage,
          toStage,
          phase: application.phase,
          changedById: currentUser.id,
          note: note || null,
        },
        include: { changedBy: { select: { id: true, name: true } } },
      }),
    ]);

    await logActivity({
      clientId: updatedApplication.clientId,
      entityType: "APPLICATION",
      entityId: updatedApplication.id,
      action: "STAGE_CHANGED",
      description: `${fromStage ? `${stageLabel(fromStage, route)} → ` : ""}${stageLabel(toStage, route)}${note ? ` — ${note}` : ""}`,
      actorId: currentUser.id,
    });

    const notifyStaffId = updatedApplication.assignedStaffId;
    if (notifyStaffId && notifyStaffId !== currentUser.id) {
      await createNotification({
        userId: notifyStaffId,
        type: "STAGE_CHANGED",
        title: "Application stage changed",
        message: `${updatedApplication.client.firstName} ${updatedApplication.client.lastName}'s application moved to ${stageLabel(toStage, route)}.`,
        link: `clients:${updatedApplication.clientId}`,
      });
    }

    return NextResponse.json({ application: updatedApplication, history: historyEntry });
  } catch (error: any) {
    console.error("Stage transition error:", error);
    return NextResponse.json(
      { error: "Failed to move application to the new stage" },
      { status: 500 }
    );
  }
}
