import type { PrismaClient } from "@prisma/client";
import { DEFAULT_SERVICE_SLUGS, DEFAULT_SERVICE_WORKFLOWS, defaultRouteForService } from "@/lib/serviceWorkflows";
import { RouteStep, WorkflowRoute, parseRoute } from "@/lib/workflow";

// Services replaced by the current catalogue in DEFAULT_SERVICE_WORKFLOWS
const RETIRED_SERVICE_SLUGS = [
  "uk-tourist-visa",
  "uk-visit-visa",
  "uk-student-visa",
  "canada-visit-visa",
  "canada-tourist-visa",
  "canada-study-permit",
  "canada-express-entry-visa",
  "schengen-tourist-visa",
  "schengen-study-visa",
  "schengen-other-visa",
  "usa-b1-b2-visa",
  "australia-visitor-visa",
  "document-legalisation-authentication",
  "school-admission",
  "flight-ticket-booking",
  "hotel-reservation",
];

type ServiceWithSteps = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  sortOrder: number;
  isActive: boolean;
  workflowSteps: { stage: string; branch: string; label: string | null; order: number }[];
};

// A service's saved steps, or its starter route if none have been saved yet
export function routeFromService(service: ServiceWithSteps): WorkflowRoute {
  if (service.workflowSteps.length === 0) return defaultRouteForService(service.name);
  const ordered = [...service.workflowSteps].sort((a, b) => a.order - b.order);
  return parseRoute({ steps: ordered.map(({ stage, branch, label }) => ({ stage, branch, label })) });
}

export function serializeService(service: ServiceWithSteps) {
  return {
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    category: service.category,
    sortOrder: service.sortOrder,
    isActive: service.isActive,
    route: routeFromService(service),
    usesStarterRoute: service.workflowSteps.length === 0,
  };
}

export function stepsToRows(serviceTypeId: number, steps: RouteStep[]) {
  return steps.map((step, order) => ({
    serviceTypeId,
    stage: step.stage,
    branch: step.branch,
    label: step.label || null,
    order,
  }));
}

// Creates any starter services that are missing and gives services without steps their
// starter route. Services an admin has already configured are left untouched.
export async function syncDefaultServiceWorkflows(prisma: PrismaClient) {
  let createdServices = 0;
  let seededRoutes = 0;

  for (const [index, def] of DEFAULT_SERVICE_WORKFLOWS.entries()) {
    const existing = await prisma.serviceType.findFirst({
      where: { OR: [{ slug: def.slug }, { name: def.name }] },
      include: { _count: { select: { workflowSteps: true } } },
    });

    const service =
      existing ??
      (await prisma.serviceType.create({
        data: { name: def.name, slug: def.slug, description: def.description, category: def.category, sortOrder: index },
      }));
    if (!existing) createdServices++;

    if (!existing || existing._count.workflowSteps === 0) {
      if (existing) {
        await prisma.serviceType.update({ where: { id: service.id }, data: { category: def.category, sortOrder: index } });
      }
      await prisma.serviceWorkflowStep.createMany({ data: stepsToRows(service.id, def.route.steps) });
      seededRoutes++;
    }
  }

  // Older service types (the original visa list and the first draft routes) are no longer offered,
  // nor are other services that were never given a route. Services an admin created keep running.
  // Existing applications on retired services keep working; they just can't be chosen for new ones.
  const retired = await prisma.serviceType.updateMany({
    where: {
      slug: { notIn: DEFAULT_SERVICE_SLUGS },
      isActive: true,
      OR: [{ slug: { in: RETIRED_SERVICE_SLUGS } }, { workflowSteps: { none: {} } }],
    },
    data: { isActive: false },
  });

  return { createdServices, seededRoutes, retiredServices: retired.count };
}
