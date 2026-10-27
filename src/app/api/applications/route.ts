import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { canManageApplications, hasAllClientAccess } from "@/lib/permissions";
import { routeFromService } from "@/lib/serviceTypes";
import { defaultRouteForService, routeForApplication } from "@/lib/serviceWorkflows";
import { firstStage, routeStages } from "@/lib/workflow";

// GET /api/applications - List applications (ADMIN: all, non-ADMIN: assigned clients only)
export async function GET() {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ applications: [] });
    }

    const where: any = {};

    if (!hasAllClientAccess(currentUser.role)) {
      where.client = {
        assignedStaffId: currentUser.id,
      };
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true, assignedStaffId: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ applications });
  } catch (error: any) {
    console.error("Fetch applications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

// POST /api/applications - Add a service to a client (admin only). The application is put on
// that service's route, which is stored with it so later route edits don't affect it.
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!canManageApplications(currentUser.role)) {
      return NextResponse.json(
        { error: "Only administrators can create applications" },
        { status: 403 }
      );
    }

    const {
      clientId,
      serviceTypeId,
      serviceType: serviceTypeName,
      destinationCountry,
      travelPurpose,
      expectedTravelDate,
      assignedStaffId,
    } = await request.json();

    if (!clientId || (!serviceTypeId && !serviceTypeName) || !destinationCountry || !travelPurpose) {
      return NextResponse.json(
        { error: "Client ID, service type, destination country, and travel purpose are required" },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await prisma.client.findUnique({ where: { id: Number(clientId) } });
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    const service = await prisma.serviceType.findFirst({
      where: serviceTypeId ? { id: Number(serviceTypeId) } : { name: serviceTypeName },
      include: { workflowSteps: { orderBy: { order: "asc" } } },
    });

    if (serviceTypeId && !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    if (service && !service.isActive) {
      return NextResponse.json({ error: "This service is no longer offered" }, { status: 400 });
    }

    const serviceType: string = service?.name ?? serviceTypeName;
    const route = service ? routeFromService(service) : defaultRouteForService(serviceType);
    const startStage = firstStage(route);

    const newApplication = await prisma.application.create({
      data: {
        clientId: Number(clientId),
        serviceType,
        serviceTypeId: service?.id ?? null,
        workflowRoute: route as any,
        currentStage: startStage,
        destinationCountry,
        travelPurpose,
        expectedTravelDate: expectedTravelDate ? new Date(expectedTravelDate) : null,
        assignedStaffId: assignedStaffId ? Number(assignedStaffId) : null,
      },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      clientId: newApplication.clientId,
      entityType: "APPLICATION",
      entityId: newApplication.id,
      action: "APPLICATION_CREATED",
      description: `Application for ${newApplication.serviceType} to ${newApplication.destinationCountry} was created`,
      actorId: currentUser.id,
    });

    // Create initial stage history entry
    await prisma.applicationStageHistory.create({
      data: {
        applicationId: newApplication.id,
        fromStage: null,
        toStage: startStage,
        changedById: currentUser.id,
      },
    });

    // Auto-copy matching document templates into per-application checklist
    const matchingTemplates = await prisma.documentTemplate.findMany({
      where: {
        OR: [
          { serviceType: null },
          { serviceType },
        ],
      },
    });

    if (matchingTemplates.length > 0) {
      await prisma.applicationDocumentRequirement.createMany({
        data: matchingTemplates.map((tpl) => ({
          applicationId: newApplication.id,
          documentTemplateId: tpl.id,
          isRequired: tpl.isRequired,
        })),
      });
    }

    return NextResponse.json({ application: newApplication }, { status: 201 });
  } catch (error: any) {
    console.error("Create application error:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}

// PATCH /api/applications - Update an application (admin only)
export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!canManageApplications(currentUser.role)) {
      return NextResponse.json(
        { error: "Only administrators can update applications" },
        { status: 403 }
      );
    }

    const {
      id,
      serviceType,
      destinationCountry,
      travelPurpose,
      expectedTravelDate,
      currentStage,
      status,
      decisionStatus,
      assignedStaffId,
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    const existingApplication = await prisma.application.findUnique({ where: { id: Number(id) } });
    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // The route is fixed by the service chosen at creation; switching service means adding a new one
    if (serviceType !== undefined && serviceType !== existingApplication.serviceType) {
      return NextResponse.json(
        { error: "The service of an application cannot be changed. Add a new service to the client instead." },
        { status: 400 }
      );
    }

    if (currentStage !== undefined && !(routeStages(routeForApplication(existingApplication)) as string[]).includes(currentStage)) {
      return NextResponse.json(
        { error: `${currentStage} is not a step on this application's route` },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (destinationCountry !== undefined) updateData.destinationCountry = destinationCountry;
    if (travelPurpose !== undefined) updateData.travelPurpose = travelPurpose;
    if (expectedTravelDate !== undefined) updateData.expectedTravelDate = expectedTravelDate ? new Date(expectedTravelDate) : null;
    if (currentStage !== undefined) updateData.currentStage = currentStage;
    if (status !== undefined) updateData.status = status;
    if (decisionStatus !== undefined) updateData.decisionStatus = decisionStatus || null;
    if (assignedStaffId !== undefined) updateData.assignedStaffId = assignedStaffId ? Number(assignedStaffId) : null;

    const updatedApplication = await prisma.application.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      clientId: updatedApplication.clientId,
      entityType: "APPLICATION",
      entityId: updatedApplication.id,
      action: currentStage !== undefined && currentStage !== existingApplication.currentStage ? "STAGE_CHANGED" : "APPLICATION_UPDATED",
      description: currentStage !== undefined && currentStage !== existingApplication.currentStage
        ? `Application moved to ${currentStage}`
        : "Application details were updated",
      actorId: currentUser.id,
    });

    return NextResponse.json({ application: updatedApplication });
  } catch (error: any) {
    console.error("Update application error:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
