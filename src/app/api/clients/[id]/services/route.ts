import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { canAccessClient } from "@/lib/permissions";
import { routeForApplication } from "@/lib/serviceWorkflows";
import { currentRouteHistory } from "@/lib/workflow";

// GET /api/clients/[id]/services - A client's applications, each with its current service route,
// finished service stages, and stage history (for the roadmap)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id: Number(id) },
      select: { id: true, assignedStaffId: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!canAccessClient(currentUser.role, client.assignedStaffId, currentUser.id)) {
      return NextResponse.json({ error: "You do not have access to this client" }, { status: 403 });
    }

    const applications = await prisma.application.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      include: {
        assignedStaff: { select: { id: true, name: true } },
        stageHistory: {
          orderBy: { createdAt: "asc" },
          select: { id: true, fromStage: true, toStage: true, phase: true, createdAt: true },
        },
        completedPhases: { orderBy: { phase: "asc" } },
      },
    });

    return NextResponse.json({
      services: applications.map((app) => ({
        ...app,
        workflowRoute: routeForApplication(app),
        // Each finished stage with its own route and history, for the "Stage 1, Stage 2…" view
        completedPhases: app.completedPhases.map((p) => ({
          ...p,
          workflowRoute: routeForApplication(p),
          stageHistory: currentRouteHistory(app.stageHistory.filter((h) => h.phase === p.phase)),
        })),
        stageHistory: currentRouteHistory(app.stageHistory.filter((h) => h.phase === app.phase)),
        isLegacyRoute: !app.workflowRoute,
      })),
    });
  } catch (error: any) {
    console.error("Fetch client services error:", error);
    return NextResponse.json({ error: "Failed to fetch client services" }, { status: 500 });
  }
}
