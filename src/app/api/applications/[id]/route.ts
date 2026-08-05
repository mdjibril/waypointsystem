import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { canAccessClient, isAdmin } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";

// GET /api/applications/[id] - Fetch a single application (ADMIN: any, non-ADMIN: assigned clients only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id: Number(id) },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true, assignedStaffId: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (!canAccessClient(currentUser.role, application.client.assignedStaffId, currentUser.id)) {
      return NextResponse.json(
        { error: "You do not have access to this application" },
        { status: 403 }
      );
    }

    return NextResponse.json({ application });
  } catch (error: any) {
    console.error("Fetch application error:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

// PATCH /api/applications/[id] — Update stage-specific data
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromCookies();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const application = await prisma.application.findUnique({
      where: { id: Number(id) },
      select: { client: { select: { assignedStaffId: true } } },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (!canAccessClient(currentUser.role, application.client.assignedStaffId, currentUser.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { stageData } = await request.json();

    const updated = await prisma.application.update({
      where: { id: Number(id) },
      data: { stageData },
      include: {
        client: { select: { id: true, fileNumber: true, firstName: true, lastName: true, assignedStaffId: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ application: updated });
  } catch (error: any) {
    console.error("Patch application error:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

// DELETE /api/applications/[id] — Admin only, cascade-deletes application
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!isAdmin(currentUser.role)) {
      return NextResponse.json({ error: "Only administrators can delete applications" }, { status: 403 });
    }

    const { id } = await params;
    const application = await prisma.application.findUnique({
      where: { id: Number(id) },
      select: { id: true, clientId: true, serviceType: true, destinationCountry: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    await prisma.application.delete({ where: { id: Number(id) } });

    await logActivity({
      clientId: application.clientId,
      entityType: "APPLICATION",
      entityId: application.id,
      action: "APPLICATION_DELETED",
      description: `Application for ${application.serviceType} to ${application.destinationCountry} was deleted`,
      actorId: currentUser.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete application error:", error);
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
