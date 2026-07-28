import { prisma } from "@/lib/prisma";

// Notifications are best-effort, same reasoning as activity logging: never let
// a notification failure break the mutation that triggered it.
export async function createNotification(params: {
  userId: number;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({ data: params });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

// There is no background job scheduler in this project, so overdue tasks are
// detected lazily: every time a user's notification list is fetched, we scan
// their own tasks for ones that just went overdue and haven't been flagged
// yet. The link encodes both the client (for navigation) and the task (so a
// second overdue task for the same client doesn't get skipped as a dupe).
export async function notifyOverdueTasksForUser(userId: number) {
  const overdueTasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { not: "DONE" },
      dueDate: { lt: new Date() },
    },
    select: { id: true, title: true, dueDate: true, clientId: true },
  });

  for (const task of overdueTasks) {
    const link = `clients:${task.clientId}:task:${task.id}`;

    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: "TASK_OVERDUE",
        link,
        createdAt: { gte: task.dueDate! },
      },
    });

    if (!existing) {
      await createNotification({
        userId,
        type: "TASK_OVERDUE",
        title: "Task overdue",
        message: `"${task.title}" was due on ${task.dueDate!.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.`,
        link,
      });
    }
  }
}
