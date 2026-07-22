"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTasksAction() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        assignee: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return { tasks };
  } catch (err: any) {
    console.error("Failed to fetch tasks:", err);
    return { error: err.message || "Failed to fetch tasks." };
  }
}

export async function createTaskAction(data: {
  title: string;
  description?: string;
  clientId: number;
  applicationId?: number;
  stage?: string;
  assigneeId?: number;
  priority: string;
  dueDate?: string;
  assignedById: number;
}) {
  try {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        clientId: data.clientId,
        applicationId: data.applicationId || null,
        stage: data.stage || null,
        assigneeId: data.assigneeId || null,
        assignedById: data.assignedById,
        priority: data.priority || "MEDIUM",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        assignee: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath("/");
    return { task };
  } catch (err: any) {
    console.error("Failed to create task:", err);
    return { error: err.message || "Failed to create task." };
  }
}

export async function updateTaskAction(
  id: number,
  data: {
    title?: string;
    description?: string;
    stage?: string;
    assigneeId?: number;
    priority?: string;
    dueDate?: string;
    status?: string;
  }
) {
  try {
    const updateData: any = { ...data };
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.description !== undefined) {
      updateData.description = data.description || null;
    }
    if (data.stage !== undefined) {
      updateData.stage = data.stage || null;
    }
    if (data.assigneeId !== undefined) {
      updateData.assigneeId = data.assigneeId || null;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "DONE") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        assignee: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
      },
    });

    revalidatePath("/");
    return { task };
  } catch (err: any) {
    console.error("Failed to update task:", err);
    return { error: err.message || "Failed to update task." };
  }
}
