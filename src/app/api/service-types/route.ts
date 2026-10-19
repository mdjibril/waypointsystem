import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { serializeService, stepsToRows } from "@/lib/serviceTypes";
import { slugify } from "@/lib/serviceWorkflows";
import { parseRoute, validateRoute } from "@/lib/workflow";

// GET /api/service-types - Services with their workflow routes (?all=1 includes inactive, admin only)
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const includeInactive = new URL(request.url).searchParams.get("all") === "1" && isAdmin(currentUser.role);

    const services = await prisma.serviceType.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { workflowSteps: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ serviceTypes: services.map(serializeService) });
  } catch (error: any) {
    console.error("Fetch service types error:", error);
    return NextResponse.json({ error: "Failed to fetch service types" }, { status: 500 });
  }
}

// POST /api/service-types - Create a service with its route (admin only)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!isAdmin(currentUser.role)) {
      return NextResponse.json({ error: "Only administrators can create services" }, { status: 403 });
    }

    const { name, description, category, route } = await request.json();
    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedName) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    const parsedRoute = parseRoute(route);
    const routeErrors = validateRoute(parsedRoute);
    if (routeErrors.length > 0) {
      return NextResponse.json({ error: routeErrors.join(" ") }, { status: 400 });
    }

    const slug = slugify(trimmedName);
    const duplicate = await prisma.serviceType.findFirst({ where: { OR: [{ name: trimmedName }, { slug }] } });
    if (duplicate) {
      return NextResponse.json({ error: "A service with this name already exists" }, { status: 409 });
    }

    const maxOrder = await prisma.serviceType.aggregate({ _max: { sortOrder: true } });

    const service = await prisma.$transaction(async (tx) => {
      const created = await tx.serviceType.create({
        data: {
          name: trimmedName,
          slug,
          description: description || null,
          category: category || "VISA",
          sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        },
      });
      await tx.serviceWorkflowStep.createMany({ data: stepsToRows(created.id, parsedRoute.steps) });
      return tx.serviceType.findUniqueOrThrow({
        where: { id: created.id },
        include: { workflowSteps: { orderBy: { order: "asc" } } },
      });
    });

    return NextResponse.json({ serviceType: serializeService(service) }, { status: 201 });
  } catch (error: any) {
    console.error("Create service type error:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}
