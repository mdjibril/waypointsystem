import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { canManageApplications } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";
import { routeFromService } from "@/lib/serviceTypes";
import { firstStage, isTerminalStage, routeStages, stageLabel } from "@/lib/workflow";
import { WorkflowStage } from "@/types";

// POST /api/applications/[id]/switch-service - Move an application created before service workflows
// (still on the old 15-stage route) onto one of the services, at the step the client has really reached.
// Admin only. Its earlier stage history is kept for staff.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!canManageApplications(currentUser.role)) {
      return NextResponse.json({ error: "Only administrators can move applications to a service" }, { status: 403 });
    }

    const { id } = await params;
    const { serviceTypeId, stage } = await request.json();

    if (!serviceTypeId || !stage) {
      return NextResponse.json({ error: "Service and step are required" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({ where: { id: Number(id) } });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.workflowRoute) {
      return NextResponse.json(
        { error: "This application is already on a service route" },
        { status: 400 }
      );
    }

    const service = await prisma.serviceType.findUnique({
      where: { id: Number(serviceTypeId) },
      include: { workflowSteps: { orderBy: { order: "asc" } } },
    });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    if (!service.isActive) {
      return NextResponse.json({ error: "This service is no longer offered" }, { status: 400 });
    }

    const route = routeFromService(service);
    if (!(routeStages(route) as string[]).includes(stage)) {
      return NextResponse.json({ error: `That step is not part of the ${service.name} route` }, { status: 400 });
    }

    const toStage = stage as WorkflowStage;
    const status = isTerminalStage(toStage, route) ? "COMPLETED" : toStage === firstStage(route) ? "NOT_STARTED" : "IN_PROGRESS";
    const decisionStatus = route.steps.find((s) => s.stage === toStage)?.branch === "APPROVED"
      ? "APPROVED"
      : route.steps.find((s) => s.stage === toStage)?.branch === "REFUSED"
        ? "REFUSED"
        : null;

    const [updatedApplication] = await prisma.$transaction([
      prisma.application.update({
        where: { id: application.id },
        data: {
          serviceType: service.name,
          serviceTypeId: service.id,
          workflowRoute: route as any,
          currentStage: toStage,
          status,
          decisionStatus,
        },
        include: {
          client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
          assignedStaff: { select: { id: true, name: true, email: true } },
        },
      }),
      // A history entry with no fromStage marks the start of the new route
      prisma.applicationStageHistory.create({
        data: {
          applicationId: application.id,
          fromStage: null,
          toStage,
          phase: application.phase,
          changedById: currentUser.id,
          note: `Moved from the old 15-stage route (${application.serviceType}) to ${service.name}`,
        },
      }),
    ]);

    await logActivity({
      clientId: application.clientId,
      entityType: "APPLICATION",
      entityId: application.id,
      action: "SERVICE_SWITCHED",
      description: `Application moved from the old route (${application.serviceType}) to ${service.name} at "${stageLabel(toStage, route)}"`,
      actorId: currentUser.id,
    });

    return NextResponse.json({ application: updatedApplication });
  } catch (error: any) {
    console.error("Switch service error:", error);
    return NextResponse.json({ error: "Failed to move application to the service" }, { status: 500 });
  }
}
