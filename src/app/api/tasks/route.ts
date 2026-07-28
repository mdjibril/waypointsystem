import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { createNotification } from "@/lib/notifications";
import { canCreateTask, canUpdateTask, isAdmin } from "@/lib/permissions";

// GET /api/tasks - List tasks (ADMIN: all, STAFF: assigned only)
export async function GET() {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ tasks: [] });
    }

    const where: any = {};

    if (!isAdmin(currentUser.role)) {
      where.assigneeId = currentUser.id;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        assignee: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Fetch tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task (admin only)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!canCreateTask(currentUser.role)) {
      return NextResponse.json(
        { error: "Only administrators can create tasks" },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      clientId,
      applicationId,
      stage,
      assigneeId,
      priority,
      dueDate,
    } = await request.json();

    if (!title || !clientId) {
      return NextResponse.json(
        { error: "Title and client ID are required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        clientId: Number(clientId),
        applicationId: applicationId ? Number(applicationId) : null,
        stage: stage || null,
        assigneeId: assigneeId ? Number(assigneeId) : null,
        assignedById: currentUser.id,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        assignee: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      clientId: task.clientId,
      entityType: "TASK",
      entityId: task.id,
      action: "TASK_CREATED",
      description: `Task "${task.title}" was created${task.assignee ? ` and assigned to ${task.assignee.name}` : ""}`,
      actorId: currentUser.id,
    });

    if (task.assigneeId && task.assigneeId !== currentUser.id) {
      await createNotification({
        userId: task.assigneeId,
        type: "TASK_ASSIGNED",
        title: "New task assigned",
        message: `"${task.title}" was assigned to you by ${currentUser.name}.`,
        link: `clients:${task.clientId}:task:${task.id}`,
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks - Update a task (admin or assignee)
export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id, title, description, stage, assigneeId, priority, dueDate, status } =
      await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findUnique({
      where: { id: Number(id) },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    if (!canUpdateTask(currentUser.role, existingTask.assigneeId, currentUser.id)) {
      return NextResponse.json(
        { error: "You do not have permission to update this task" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (stage !== undefined) updateData.stage = stage || null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId ? Number(assigneeId) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "DONE") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true } },
        application: { select: { id: true, serviceType: true, currentStage: true } },
        assignee: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const assigneeChanged = assigneeId !== undefined && updatedTask.assigneeId !== existingTask.assigneeId;

    if (assigneeChanged && updatedTask.assigneeId) {
      await logActivity({
        clientId: updatedTask.clientId,
        entityType: "TASK",
        entityId: updatedTask.id,
        action: "TASK_ASSIGNED",
        description: `Task "${updatedTask.title}" was assigned to ${updatedTask.assignee?.name}`,
        actorId: currentUser.id,
      });

      if (updatedTask.assigneeId !== currentUser.id) {
        await createNotification({
          userId: updatedTask.assigneeId,
          type: "TASK_ASSIGNED",
          title: "New task assigned",
          message: `"${updatedTask.title}" was assigned to you by ${currentUser.name}.`,
          link: `clients:${updatedTask.clientId}:task:${updatedTask.id}`,
        });
      }
    } else if (status === "DONE" && existingTask.status !== "DONE") {
      await logActivity({
        clientId: updatedTask.clientId,
        entityType: "TASK",
        entityId: updatedTask.id,
        action: "TASK_COMPLETED",
        description: `Task "${updatedTask.title}" was marked complete`,
        actorId: currentUser.id,
      });
    } else {
      await logActivity({
        clientId: updatedTask.clientId,
        entityType: "TASK",
        entityId: updatedTask.id,
        action: "TASK_UPDATED",
        description: `Task "${updatedTask.title}" was updated`,
        actorId: currentUser.id,
      });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error("Update task error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
