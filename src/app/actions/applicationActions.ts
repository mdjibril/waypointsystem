"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getApplicationsAction() {
  try {
    const applications = await prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });
    return { applications };
  } catch (err: any) {
    console.error("Failed to fetch applications:", err);
    return { error: err.message || "Failed to fetch applications." };
  }
}

export async function getApplicationAction(id: number) {
  try {
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });
    return { application };
  } catch (err: any) {
    console.error("Failed to fetch application:", err);
    return { error: err.message || "Failed to fetch application." };
  }
}

export async function createApplicationAction(data: {
  clientId: number;
  serviceType: string;
  destinationCountry: string;
  travelPurpose: string;
  expectedTravelDate?: string;
  assignedStaffId?: number;
}) {
  try {
    const newApplication = await prisma.application.create({
      data: {
        clientId: data.clientId,
        serviceType: data.serviceType,
        destinationCountry: data.destinationCountry,
        travelPurpose: data.travelPurpose,
        expectedTravelDate: data.expectedTravelDate ? new Date(data.expectedTravelDate) : null,
        assignedStaffId: data.assignedStaffId || null,
      },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath("/");
    return { application: newApplication };
  } catch (err: any) {
    console.error("Failed to create application:", err);
    return { error: err.message || "Failed to create application." };
  }
}

export async function updateApplicationAction(
  id: number,
  data: {
    serviceType?: string;
    destinationCountry?: string;
    travelPurpose?: string;
    expectedTravelDate?: string;
    currentStage?: string;
    status?: string;
    decisionStatus?: string;
    assignedStaffId?: number;
  }
) {
  try {
    const updateData: any = { ...data };
    if (data.expectedTravelDate !== undefined) {
      updateData.expectedTravelDate = data.expectedTravelDate ? new Date(data.expectedTravelDate) : null;
    }
    if (data.decisionStatus !== undefined) {
      updateData.decisionStatus = data.decisionStatus || null;
    }
    if (data.assignedStaffId !== undefined) {
      updateData.assignedStaffId = data.assignedStaffId || null;
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath("/");
    return { application: updatedApplication };
  } catch (err: any) {
    console.error("Failed to update application:", err);
    return { error: err.message || "Failed to update application." };
  }
}
