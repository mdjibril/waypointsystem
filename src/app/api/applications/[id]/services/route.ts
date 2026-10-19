import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { canManageApplications } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";
import { routeFromService } from "@/lib/serviceTypes";
import { routeForApplication } from "@/lib/serviceWorkflows";
import { firstStage, isTerminalStage } from "@/lib/workflow";
import { WorkflowStage } from "@/types";

// POST /api/applications/[id]/services - Add the next service to an application (admin only).
// Only allowed once the current service's route is finished; the finished route is archived
// as a completed stage and the application starts at the beginning of the new service's route.
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
      return NextResponse.json({ error: "Only administrators can add services" }, { status: 403 });
    }

    const { id } = await params;
    const { serviceTypeId } = await request.json();

    if (!serviceTypeId) {
      return NextResponse.json({ error: "Service is required" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({ where: { id: Number(id) } });
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const currentRoute = routeForApplication(application);
    const finished =
      application.status === "COMPLETED" || isTerminalStage(application.currentStage as WorkflowStage, currentRoute);
    if (!finished) {
      return NextResponse.json(
        { error: `Finish the ${application.serviceType} route before adding another service` },
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
    const startStage = firstStage(route);
    const nextPhase = application.phase + 1;

    // When the finished stage started: its first history entry, or the application's creation
    const phaseStart = await prisma.applicationStageHistory.findFirst({
      where: { applicationId: application.id, phase: application.phase },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    const [updatedApplication] = await prisma.$transaction([
      prisma.application.update({
        where: { id: application.id },
        data: {
          serviceType: service.name,
          serviceTypeId: service.id,
          workflowRoute: route as any,
          currentStage: startStage,
          status: "NOT_STARTED",
          decisionStatus: null,
          phase: nextPhase,
        },
        include: {
          client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
          assignedStaff: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.applicationPhase.create({
        data: {
          applicationId: application.id,
          phase: application.phase,
          serviceType: application.serviceType,
          serviceTypeId: application.serviceTypeId,
          workflowRoute: (application.workflowRoute ?? undefined) as any,
          finalStage: application.currentStage,
          status: "COMPLETED",
          decisionStatus: application.decisionStatus,
          startedAt: phaseStart?.createdAt ?? application.createdAt,
        },
      }),
      prisma.applicationStageHistory.create({
        data: {
          applicationId: application.id,
          fromStage: null,
          toStage: startStage,
          phase: nextPhase,
          changedById: currentUser.id,
          note: `Stage ${nextPhase}: ${service.name} started`,
        },
      }),
    ]);

    // Add the new service's document checklist (global templates are already on the application)
    const serviceTemplates = await prisma.documentTemplate.findMany({ where: { serviceType: service.name } });
    if (serviceTemplates.length > 0) {
      await prisma.applicationDocumentRequirement.createMany({
        data: serviceTemplates.map((tpl) => ({
          applicationId: application.id,
          documentTemplateId: tpl.id,
          isRequired: tpl.isRequired,
        })),
        skipDuplicates: true,
      });
    }

    await logActivity({
      clientId: application.clientId,
      entityType: "APPLICATION",
      entityId: application.id,
      action: "SERVICE_ADDED",
      description: `Stage ${nextPhase}: ${service.name} added after ${application.serviceType} was completed`,
      actorId: currentUser.id,
    });

    return NextResponse.json({ application: updatedApplication }, { status: 201 });
  } catch (error: any) {
    console.error("Add service error:", error);
    return NextResponse.json({ error: "Failed to add service" }, { status: 500 });
  }
}
