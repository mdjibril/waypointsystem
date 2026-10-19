import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { routeForApplication } from "@/lib/serviceWorkflows";
import { currentRouteHistory } from "@/lib/workflow";

// When each step was first reached, so later back-and-forth moves don't change the dates clients see
function firstReachedDates(history: { toStage: string; createdAt: Date }[]): Record<string, Date> {
  const dates: Record<string, Date> = {};
  for (const h of history) {
    if (!dates[h.toStage]) dates[h.toStage] = h.createdAt;
  }
  return dates;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json({ error: "Please enter a file number or email" }, { status: 400 });
    }

    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { fileNumber: { equals: q, mode: "insensitive" } },
          { email: { equals: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        fileNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        applications: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            serviceType: true,
            workflowRoute: true,
            destinationCountry: true,
            currentStage: true,
            status: true,
            decisionStatus: true,
            createdAt: true,
            phase: true,
            stageHistory: {
              orderBy: { createdAt: "asc" },
              select: {
                toStage: true,
                fromStage: true,
                phase: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "No client found matching that file number or email." }, { status: 404 });
    }

    // Clients only see the route they are currently on: earlier service stages and the
    // back-and-forth of staff moves stay internal (and staff notes are never sent)
    return NextResponse.json({
      client: {
        ...client,
        applications: client.applications.map(({ stageHistory, ...app }) => ({
          ...app,
          workflowRoute: routeForApplication(app),
          stageReachedAt: firstReachedDates(currentRouteHistory(stageHistory.filter((h) => h.phase === app.phase))),
        })),
      },
    });
  } catch (error: any) {
    console.error("Client portal lookup error:", error);
    return NextResponse.json({ error: "Failed to look up client" }, { status: 500 });
  }
}
