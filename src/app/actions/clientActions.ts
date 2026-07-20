"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClientsAction() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });
    return { clients };
  } catch (err: any) {
    console.error("Failed to fetch clients:", err);
    return { error: err.message || "Failed to fetch clients." };
  }
}

export async function getClientAction(id: number) {
  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });
    return { client };
  } catch (err: any) {
    console.error("Failed to fetch client:", err);
    return { error: err.message || "Failed to fetch client." };
  }
}

export async function createClientAction(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  source: string;
  createdById: number;
  assignedStaffId?: number;
}) {
  try {
    const year = new Date().getFullYear();
    const count = await prisma.client.count();
    const fileNumber = `WP-${year}-${String(count + 1).padStart(4, "0")}`;

    const newClient = await prisma.client.create({
      data: {
        fileNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address || null,
        passportNumber: data.passportNumber || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        source: data.source,
        createdById: data.createdById,
        assignedStaffId: data.assignedStaffId || null,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath("/");
    return { client: newClient };
  } catch (err: any) {
    console.error("Failed to create client:", err);
    return { error: err.message || "Failed to create client." };
  }
}

export async function updateClientAction(
  id: number,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    passportNumber?: string;
    dateOfBirth?: string;
    source?: string;
    assignedStaffId?: number;
  }
) {
  try {
    const updateData: any = { ...data };
    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }
    if (data.address !== undefined) {
      updateData.address = data.address || null;
    }
    if (data.passportNumber !== undefined) {
      updateData.passportNumber = data.passportNumber || null;
    }
    if (data.assignedStaffId !== undefined) {
      updateData.assignedStaffId = data.assignedStaffId || null;
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath("/");
    return { client: updatedClient };
  } catch (err: any) {
    console.error("Failed to update client:", err);
    return { error: err.message || "Failed to update client." };
  }
}
