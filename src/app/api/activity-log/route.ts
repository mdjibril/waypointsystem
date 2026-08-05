import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { canAccessClient } from "@/lib/permissions";

// GET /api/activity-log?clientId=NN - Activity timeline for a client (ADMIN, or assigned staff)
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: Number(clientId) },
      select: { assignedStaffId: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    if (!canAccessClient(currentUser.role, client.assignedStaffId, currentUser.id)) {
      return NextResponse.json(
        { error: "You do not have access to this client" },
        { status: 403 }
      );
    }

    const activity = await prisma.activityLog.findMany({
      where: { clientId: Number(clientId) },
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ activity });
  } catch (error: any) {
    console.error("Fetch activity log error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity log" },
      { status: 500 }
    );
  }
}

// POST /api/activity-log - Create a custom activity log entry (stage notes, etc.)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { clientId, entityType, entityId, action, description } = await request.json();

    if (!clientId || !entityType || !entityId || !action) {
      return NextResponse.json(
        { error: "clientId, entityType, entityId, and action are required" },
        { status: 400 }
      );
    }

    const entry = await prisma.activityLog.create({
      data: {
        clientId: Number(clientId),
        entityType,
        entityId: Number(entityId),
        action,
        description: description || "",
        actorId: currentUser.id,
      },
      include: { actor: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error: any) {
    console.error("Create activity log error:", error);
    return NextResponse.json(
      { error: "Failed to create activity log entry" },
      { status: 500 }
    );
  }
}
