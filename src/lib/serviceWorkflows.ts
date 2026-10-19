import { WorkflowStage } from "@/types";
import { RouteStep, WorkflowRoute, STANDARD_VISA_ROUTE, parseRoute } from "@/lib/workflow";

// The company's services and their routes. Admins can change these in Settings → Service Workflows;
// these definitions seed the database and are the fallback when a service has no saved steps.

export interface ServiceWorkflowDefinition {
  name: string;
  slug: string;
  category: string;
  description: string;
  route: WorkflowRoute;
}

type StepSpec = WorkflowStage | [WorkflowStage, string];

const toStep = (branch: RouteStep["branch"]) => (spec: StepSpec): RouteStep =>
  Array.isArray(spec) ? { stage: spec[0], branch, label: spec[1] } : { stage: spec, branch, label: null };
const main = (...specs: StepSpec[]) => specs.map(toStep("MAIN"));
const granted = (label: string) => [toStep("APPROVED")(["OUTCOME_GRANTED", label])];
const denied = (label: string) => [toStep("REFUSED")(["OUTCOME_DENIED", label])];

export const DEFAULT_SERVICE_WORKFLOWS: ServiceWorkflowDefinition[] = [
  {
    name: "Visa Services",
    slug: "visa-services",
    category: "VISA",
    description: "Visa application from initiation to the embassy's decision.",
    route: {
      steps: [
        ...main(
          ["APPLICATION_INITIATED", "Visa Application Initiated"],
          ["APPLICATION_PROCESSED", "Visa Application Processed"],
          ["APPLICATION_SUBMISSION", "Visa Application Submitted"],
          ["DECISION", "Awaiting Embassy Decision"],
        ),
        ...granted("Visa Granted"),
        ...denied("Visa Denied"),
      ],
    },
  },
  {
    name: "Consultation",
    slug: "consultation",
    category: "CONSULTATION",
    description: "Document review and application handling for consultation clients.",
    route: {
      steps: main("DOCUMENT_ACCEPTED", "DOCUMENT_REVIEWED", "APPLICATION_PROCESSED", "APPLICATION_SUBMISSION"),
    },
  },
  {
    name: "International Relocation",
    slug: "international-relocation",
    category: "RELOCATION",
    description: "Immigration pathway, application and decision for relocating abroad.",
    route: {
      steps: [
        ...main(
          "DOCUMENT_ACCEPTED",
          "DOCUMENT_REVIEWED",
          "IMMIGRATION_PATHWAY_DETERMINED",
          "APPLICATION_INITIATED",
          "DOCUMENT_VERIFIED",
          "APPLICATION_SUBMISSION",
          ["DECISION", "Awaiting Immigration Decision"],
        ),
        ...granted("Granted"),
        ...denied("Denied"),
      ],
    },
  },
  {
    name: "Childbirth Abroad / Medical Tourism",
    slug: "childbirth-abroad-medical-tourism",
    category: "MEDICAL",
    description: "Medical review, specialist assessment, quotation and deposit.",
    route: {
      steps: main(
        "MEDICAL_DOCUMENT_SUBMITTED",
        "MEDICAL_DOCUMENT_REVIEWED",
        "SPECIALIST_REVIEW_INITIATED",
        "SPECIALIST_REVIEW_COMPLETED",
        "COST_QUOTATION_DETERMINED",
        "INITIAL_DEPOSIT_COMPLETED",
      ),
    },
  },
  {
    name: "Corporate Travel",
    slug: "corporate-travel",
    category: "TRAVEL",
    description: "Quotation and service arrangement for organisations.",
    route: {
      steps: main(
        "CONSULTATION_INITIATED",
        "QUOTATION_SENT",
        "AWAITING_ORGANIZATION_DECISION",
        "QUOTATION_APPROVED",
        "SERVICE_APPLICATION_INITIATED",
        "SERVICE_APPLICATION_COMPLETED",
      ),
    },
  },
  {
    name: "Admission Assistance",
    slug: "admission-assistance",
    category: "STUDY",
    description: "School application through to the admission decision.",
    route: {
      steps: [
        ...main(
          "DOCUMENT_ACCEPTED",
          "DOCUMENT_REVIEWED",
          "APPLICATION_INITIATED",
          "APPLICATION_COMPLETED",
          ["DECISION", "Awaiting School Decision"],
        ),
        ...granted("Admission Offered"),
        ...denied("Admission Denied"),
      ],
    },
  },
];

export const DEFAULT_SERVICE_SLUGS = DEFAULT_SERVICE_WORKFLOWS.map((s) => s.slug);

export function defaultRouteForService(serviceName: string): WorkflowRoute {
  return DEFAULT_SERVICE_WORKFLOWS.find((s) => s.name === serviceName)?.route ?? STANDARD_VISA_ROUTE;
}

// The route an application is on. Applications created before routes were
// stored have none and stay on the standard visa route they started on.
export function routeForApplication(app: { workflowRoute?: unknown }): WorkflowRoute {
  return parseRoute(app.workflowRoute);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
