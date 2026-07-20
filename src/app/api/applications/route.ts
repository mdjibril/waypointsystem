import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";

// GET /api/applications - List applications (admin: all, staff: assigned clients only)
export async function GET() {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ applications: [] });
    }

    const where: any = {};

    if (currentUser.role === "staff") {
      where.client = {
        assignedStaffId: currentUser.id,
      };
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
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

// POST /api/applications - Create a new application (admin only)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can create applications" },
        { status: 403 }
      );
    }

    const {
      clientId,
      serviceType,
      destinationCountry,
      travelPurpose,
      expectedTravelDate,
      assignedStaffId,
    } = await request.json();

    if (!clientId || !serviceType || !destinationCountry || !travelPurpose) {
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

    const newApplication = await prisma.application.create({
      data: {
        clientId: Number(clientId),
        serviceType,
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

    if (currentUser.role !== "admin") {
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

    const updateData: any = {};
    if (serviceType !== undefined) updateData.serviceType = serviceType;
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

    return NextResponse.json({ application: updatedApplication });
  } catch (error: any) {
    console.error("Update application error:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
