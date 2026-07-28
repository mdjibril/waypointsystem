import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { notifyOverdueTasksForUser } from "@/lib/notifications";

// GET /api/notifications - The current user's notifications (also lazily flags newly overdue tasks)
export async function GET() {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    await notifyOverdueTasksForUser(currentUser.id);

    const notifications = await prisma.notification.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark one notification (by id) or all of the current user's notifications as read
export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id, all } = await request.json();

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: currentUser.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Notification id is required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.findUnique({ where: { id: Number(id) } });

    if (!notification || notification.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id: Number(id) },
      data: { isRead: true },
    });

    return NextResponse.json({ notification: updated });
  } catch (error: any) {
    console.error("Update notification error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
