import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { serializeService, stepsToRows } from "@/lib/serviceTypes";
import { parseRoute, validateRoute } from "@/lib/workflow";

// PATCH /api/service-types/[id] - Update a service's details and/or route (admin only).
// Applications already on this service keep the route they started with.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!isAdmin(currentUser.role)) {
      return NextResponse.json({ error: "Only administrators can edit services" }, { status: 403 });
    }

    const { id } = await params;
    const { description, category, isActive, route } = await request.json();

    const existing = await prisma.serviceType.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const parsedRoute = route !== undefined ? parseRoute(route) : null;
    if (parsedRoute) {
      const routeErrors = validateRoute(parsedRoute);
      if (routeErrors.length > 0) {
        return NextResponse.json({ error: routeErrors.join(" ") }, { status: 400 });
      }
    }

    const service = await prisma.$transaction(async (tx) => {
      await tx.serviceType.update({
        where: { id: existing.id },
        data: {
          ...(description !== undefined ? { description: description || null } : {}),
          ...(category !== undefined ? { category } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        },
      });
      if (parsedRoute) {
        await tx.serviceWorkflowStep.deleteMany({ where: { serviceTypeId: existing.id } });
        await tx.serviceWorkflowStep.createMany({ data: stepsToRows(existing.id, parsedRoute.steps) });
      }
      return tx.serviceType.findUniqueOrThrow({
        where: { id: existing.id },
        include: { workflowSteps: { orderBy: { order: "asc" } } },
      });
    });

    return NextResponse.json({ serviceType: serializeService(service) });
  } catch (error: any) {
    console.error("Update service type error:", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}
