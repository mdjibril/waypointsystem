import { WorkflowStage } from "@/types";

// The original 15-stage visa route. Applications created before service-based
// workflows (no stored route) follow this, as do services without their own route.
export const STAGE_ORDER: WorkflowStage[] = [
  "CLIENT_INQUIRY",
  "CUSTOMER_SERVICE_REGISTRATION",
  "INITIAL_CONSULTATION",
  "PAYMENT_SERVICE_AGREEMENT",
  "DOCUMENT_COLLECTION_VERIFICATION",
  "VISA_PROCESSING",
  "QUALITY_REVIEW",
  "APPLICATION_SUBMISSION",
  "APPLICATION_TRACKING",
  "DECISION",
  "FLIGHT_BOOKING",
  "PRE_DEPARTURE_BRIEFING",
  "CLIENT_TRAVELS",
  "FOLLOW_UP",
  "VISA_REFUSED_PATH",
];

// Stages that only appear in some service routes
export const SERVICE_SPECIFIC_STAGES: WorkflowStage[] = [
  "DOCUMENT_ACCEPTED",
  "DOCUMENT_REVIEWED",
  "DOCUMENT_VERIFIED",
  "APPLICATION_INITIATED",
  "APPLICATION_PROCESSED",
  "APPLICATION_COMPLETED",
  "IMMIGRATION_PATHWAY_DETERMINED",
  "MEDICAL_DOCUMENT_SUBMITTED",
  "MEDICAL_DOCUMENT_REVIEWED",
  "SPECIALIST_REVIEW_INITIATED",
  "SPECIALIST_REVIEW_COMPLETED",
  "COST_QUOTATION_DETERMINED",
  "INITIAL_DEPOSIT_COMPLETED",
  "CONSULTATION_INITIATED",
  "QUOTATION_SENT",
  "AWAITING_ORGANIZATION_DECISION",
  "QUOTATION_APPROVED",
  "SERVICE_APPLICATION_INITIATED",
  "SERVICE_APPLICATION_COMPLETED",
  "OUTCOME_GRANTED",
  "OUTCOME_DENIED",
];

// Every stage a service route can be built from
export const ALL_STAGES: WorkflowStage[] = [...STAGE_ORDER, ...SERVICE_SPECIFIC_STAGES];

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  CLIENT_INQUIRY: "Client Inquiry",
  CUSTOMER_SERVICE_REGISTRATION: "Customer Service Registration",
  INITIAL_CONSULTATION: "Initial Consultation",
  PAYMENT_SERVICE_AGREEMENT: "Payment & Service Agreement",
  DOCUMENT_COLLECTION_VERIFICATION: "Document Collection & Verification",
  VISA_PROCESSING: "Application Initiated",
  QUALITY_REVIEW: "Application Review",
  APPLICATION_SUBMISSION: "Application Submitted",
  APPLICATION_TRACKING: "Application Tracking",
  DECISION: "Decision - Waiting",
  FLIGHT_BOOKING: "Flight Booking",
  PRE_DEPARTURE_BRIEFING: "Pre-Departure Briefing",
  CLIENT_TRAVELS: "Client Travels",
  FOLLOW_UP: "Follow-up & Testimonials",
  VISA_REFUSED_PATH: "Visa Refused Path",
  DOCUMENT_ACCEPTED: "Document Accepted",
  DOCUMENT_REVIEWED: "Document Reviewed",
  DOCUMENT_VERIFIED: "Document Verified",
  APPLICATION_INITIATED: "Application Initiated",
  APPLICATION_PROCESSED: "Application Processed",
  APPLICATION_COMPLETED: "Application Completed",
  IMMIGRATION_PATHWAY_DETERMINED: "Immigration Pathway Determined",
  MEDICAL_DOCUMENT_SUBMITTED: "Medical Document Submitted",
  MEDICAL_DOCUMENT_REVIEWED: "Medical Document Reviewed",
  SPECIALIST_REVIEW_INITIATED: "Specialist Review Initiated",
  SPECIALIST_REVIEW_COMPLETED: "Specialist Review Completed",
  COST_QUOTATION_DETERMINED: "Cost Quotation Determined",
  INITIAL_DEPOSIT_COMPLETED: "Initial Deposit Completed",
  CONSULTATION_INITIATED: "Consultation Initiated",
  QUOTATION_SENT: "Quotation Sent",
  AWAITING_ORGANIZATION_DECISION: "Awaiting Organization Decision",
  QUOTATION_APPROVED: "Quotation Approved",
  SERVICE_APPLICATION_INITIATED: "Service Application Initiated",
  SERVICE_APPLICATION_COMPLETED: "Service Application Completed",
  OUTCOME_GRANTED: "Granted",
  OUTCOME_DENIED: "Denied",
};

export const DECISION_STAGE: WorkflowStage = "DECISION";

export const TERMINAL_STAGES: WorkflowStage[] = ["CLIENT_TRAVELS", "FOLLOW_UP", "VISA_REFUSED_PATH"];

export const SENSITIVE_STAGES: WorkflowStage[] = [
  "DECISION",
  "APPLICATION_SUBMISSION",
  "QUALITY_REVIEW",
];

export const APPROVED_PATH_STAGES: WorkflowStage[] = [
  "FLIGHT_BOOKING",
  "PRE_DEPARTURE_BRIEFING",
  "CLIENT_TRAVELS",
  "FOLLOW_UP",
];

// ---------------------------------------------------------------------------
// Service routes
//
// A route is an ordered list of steps. MAIN steps run in order; if the route
// contains DECISION it must be the last MAIN step, and the route then splits
// into an APPROVED branch and a REFUSED branch. Routes without DECISION are a
// single straight line (e.g. document legalisation, flight booking).
// ---------------------------------------------------------------------------

export type RouteBranch = "MAIN" | "APPROVED" | "REFUSED";

export interface RouteStep {
  stage: WorkflowStage;
  branch: RouteBranch;
  label?: string | null;
}

export interface WorkflowRoute {
  steps: RouteStep[];
}

export const STANDARD_VISA_ROUTE: WorkflowRoute = {
  steps: [
    ...STAGE_ORDER.slice(0, STAGE_ORDER.indexOf(DECISION_STAGE) + 1).map((stage) => ({ stage, branch: "MAIN" as const })),
    ...APPROVED_PATH_STAGES.map((stage) => ({ stage, branch: "APPROVED" as const })),
    { stage: "VISA_REFUSED_PATH", branch: "REFUSED" },
  ],
};

export function isWorkflowStage(value: unknown): value is WorkflowStage {
  return typeof value === "string" && (ALL_STAGES as string[]).includes(value);
}

// Reads a stored route (Application.workflowRoute JSON); anything missing or malformed
// falls back to the standard visa route so older applications keep working.
export function parseRoute(raw: unknown): WorkflowRoute {
  const steps = (raw as { steps?: unknown } | null | undefined)?.steps;
  if (!Array.isArray(steps) || steps.length === 0) return STANDARD_VISA_ROUTE;
  const parsed: RouteStep[] = (steps as { stage?: unknown; branch?: unknown; label?: unknown }[])
    .filter((s): s is { stage: WorkflowStage; branch?: unknown; label?: unknown } => isWorkflowStage(s?.stage))
    .map((s) => ({
      stage: s.stage,
      branch: s.branch === "APPROVED" || s.branch === "REFUSED" ? s.branch : "MAIN",
      label: typeof s.label === "string" && s.label.trim() ? s.label.trim() : null,
    }));
  return parsed.length > 0 ? { steps: parsed } : STANDARD_VISA_ROUTE;
}

export function branchSteps(route: WorkflowRoute, branch: RouteBranch): WorkflowStage[] {
  return route.steps.filter((s) => s.branch === branch).map((s) => s.stage);
}

export function routeStages(route: WorkflowRoute): WorkflowStage[] {
  return route.steps.map((s) => s.stage);
}

export function routeHasDecision(route: WorkflowRoute): boolean {
  return branchSteps(route, "MAIN").includes(DECISION_STAGE);
}

export function firstStage(route: WorkflowRoute): WorkflowStage {
  return branchSteps(route, "MAIN")[0] ?? "CLIENT_INQUIRY";
}

export function stageLabel(stage: string, route?: WorkflowRoute): string {
  const custom = route?.steps.find((s) => s.stage === stage)?.label;
  return custom || STAGE_LABELS[stage as WorkflowStage] || stage;
}

// Returns a list of problems with a route definition; empty means it is valid.
export function validateRoute(route: WorkflowRoute): string[] {
  const errors: string[] = [];
  const stages = routeStages(route);
  const main = branchSteps(route, "MAIN");
  const approved = branchSteps(route, "APPROVED");
  const refused = branchSteps(route, "REFUSED");

  if (main.length === 0) errors.push("The route needs at least one main step.");
  if (new Set(stages).size !== stages.length) errors.push("A stage can only appear once in a route.");
  if (stages.some((s) => !isWorkflowStage(s))) errors.push("The route contains an unknown stage.");
  if (approved.includes(DECISION_STAGE) || refused.includes(DECISION_STAGE)) {
    errors.push("Decision must be a main step.");
  }

  if (main.includes(DECISION_STAGE)) {
    if (main[main.length - 1] !== DECISION_STAGE) errors.push("Decision must be the last main step.");
    if (approved.length === 0) errors.push("A route with a decision needs at least one approved step.");
    if (refused.length === 0) errors.push("A route with a decision needs at least one refused step.");
  } else if (approved.length > 0 || refused.length > 0) {
    errors.push("Approved and refused steps are only allowed when the route has a Decision step.");
  }

  return errors;
}

export function getAllowedNextStages(current: WorkflowStage, route: WorkflowRoute = STANDARD_VISA_ROUTE): WorkflowStage[] {
  const step = route.steps.find((s) => s.stage === current);
  if (!step) {
    // Stage is not on this route (e.g. route changed); allow re-entering the route at its start
    return [firstStage(route)];
  }

  const main = branchSteps(route, "MAIN");

  if (current === DECISION_STAGE) {
    const idx = main.indexOf(current);
    return [
      branchSteps(route, "APPROVED")[0],
      branchSteps(route, "REFUSED")[0],
      main[idx - 1],
    ].filter(Boolean) as WorkflowStage[];
  }

  const next: WorkflowStage[] = [];

  if (step.branch === "MAIN") {
    const idx = main.indexOf(current);
    if (idx < main.length - 1) next.push(main[idx + 1]);
    if (idx > 0) next.push(main[idx - 1]);
    return next;
  }

  // Approved or refused branch: step along the branch; the decision can always be revisited
  const branch = branchSteps(route, step.branch);
  const idx = branch.indexOf(current);
  if (idx < branch.length - 1) next.push(branch[idx + 1]);
  next.push(idx > 0 ? branch[idx - 1] : DECISION_STAGE);
  if (!next.includes(DECISION_STAGE)) next.push(DECISION_STAGE);
  return next;
}

export function isValidTransition(from: WorkflowStage, to: WorkflowStage, route: WorkflowRoute = STANDARD_VISA_ROUTE): boolean {
  return getAllowedNextStages(from, route).includes(to);
}

// True when reaching this stage means the service is finished
export function isTerminalStage(stage: WorkflowStage, route: WorkflowRoute = STANDARD_VISA_ROUTE): boolean {
  const step = route.steps.find((s) => s.stage === stage);
  if (!step) return false;
  if (step.branch === "MAIN") {
    const main = branchSteps(route, "MAIN");
    return !routeHasDecision(route) && main[main.length - 1] === stage;
  }
  const branch = branchSteps(route, step.branch);
  return branch[branch.length - 1] === stage || TERMINAL_STAGES.includes(stage);
}

// The steps to show a client on their roadmap: the main steps, then the outcome branch they
// are on. Before a decision the approved branch is shown as the expected path.
export function roadmapPath(route: WorkflowRoute, currentStage: string): { steps: RouteStep[]; awaitingDecision: boolean } {
  const main = route.steps.filter((s) => s.branch === "MAIN");
  const current = route.steps.find((s) => s.stage === currentStage);
  if (current?.branch === "REFUSED") {
    return { steps: [...main, ...route.steps.filter((s) => s.branch === "REFUSED")], awaitingDecision: false };
  }
  const approved = route.steps.filter((s) => s.branch === "APPROVED");
  const refused = route.steps.filter((s) => s.branch === "REFUSED");
  const awaitingDecision = routeHasDecision(route) && current?.branch !== "APPROVED";
  // A single-step outcome ("Visa Granted" / "Visa Denied") shows as one pending step until decided
  if (awaitingDecision && approved.length === 1 && refused.length === 1) {
    return { steps: [...main, { ...approved[0], label: combinedOutcomeLabel(route) }], awaitingDecision };
  }
  return { steps: [...main, ...approved], awaitingDecision };
}

// Button text for recording a decision: the outcome step's name ("Visa Granted") when the outcome
// is a single step, otherwise a generic Approve / Refuse (e.g. the standard visa route)
export function decisionActionLabel(route: WorkflowRoute, outcome: "APPROVED" | "REFUSED"): string {
  if (branchSteps(route, "APPROVED").length === 1 && branchSteps(route, "REFUSED").length === 1) {
    return stageLabel(branchSteps(route, outcome)[0], route);
  }
  return outcome === "APPROVED" ? "Approve" : "Refuse";
}

// "Visa Granted" + "Visa Denied" → "Visa Granted or Denied"
export function combinedOutcomeLabel(route: WorkflowRoute): string {
  const approved = branchSteps(route, "APPROVED")[0];
  const refused = branchSteps(route, "REFUSED")[0];
  const a = approved ? stageLabel(approved, route).split(" ") : [];
  const r = refused ? stageLabel(refused, route).split(" ") : [];
  let shared = 0;
  while (shared < a.length - 1 && shared < r.length - 1 && a[shared].toLowerCase() === r[shared].toLowerCase()) shared++;
  return [...a.slice(0, shared), a.slice(shared).join(" "), "or", r.slice(shared).join(" ")].filter(Boolean).join(" ");
}

export type DecisionOutcome = "APPROVED" | "REFUSED" | "WITHDRAWN" | "PENDING_ACTION";

export function stageForDecision(decisionStatus: DecisionOutcome, route: WorkflowRoute = STANDARD_VISA_ROUTE): WorkflowStage | null {
  if (decisionStatus === "APPROVED") return branchSteps(route, "APPROVED")[0] ?? null;
  if (decisionStatus === "REFUSED") return branchSteps(route, "REFUSED")[0] ?? null;
  return null;
}

export interface SubstageTaskTemplate {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  stage: WorkflowStage;
}

export const SUBSTAGE_TASK_TEMPLATES: SubstageTaskTemplate[] = [
  // Flight Booking
  { title: "Search and compare flight options", description: "Research available flights matching client's travel dates and budget", priority: "MEDIUM", stage: "FLIGHT_BOOKING" },
  { title: "Book confirmed flight ticket", description: "Complete flight booking and obtain confirmed ticket/e-ticket", priority: "HIGH", stage: "FLIGHT_BOOKING" },
  { title: "Book hotel accommodation", description: "Reserve hotel for client's stay at destination", priority: "MEDIUM", stage: "FLIGHT_BOOKING" },
  { title: "Arrange travel insurance", description: "Purchase comprehensive travel insurance coverage for the trip duration", priority: "HIGH", stage: "FLIGHT_BOOKING" },

  // Pre-Departure Briefing
  { title: "Prepare pre-departure briefing pack", description: "Compile travel guide, destination info, embassy contacts, and emergency numbers", priority: "MEDIUM", stage: "PRE_DEPARTURE_BRIEFING" },
  { title: "Conduct pre-departure briefing session", description: "Walk client through travel itinerary, visa conditions, cultural tips, and what to expect", priority: "HIGH", stage: "PRE_DEPARTURE_BRIEFING" },
  { title: "Confirm all travel documents ready", description: "Verify passport, visa, flight tickets, insurance, and hotel bookings are printed and accessible", priority: "URGENT", stage: "PRE_DEPARTURE_BRIEFING" },

  // Client Travels
  { title: "Confirm client departure", description: "Verify client has departed and arrived at destination safely", priority: "MEDIUM", stage: "CLIENT_TRAVELS" },
  { title: "Send post-arrival check-in message", description: "Reach out to client after arrival to ensure smooth landing and address any issues", priority: "LOW", stage: "CLIENT_TRAVELS" },

  // Follow-up
  { title: "Send client feedback survey", description: "Email satisfaction survey or feedback form to client", priority: "LOW", stage: "FOLLOW_UP" },
  { title: "Request testimonial", description: "Ask client for a written review or video testimonial", priority: "LOW", stage: "FOLLOW_UP" },
  { title: "Request referrals", description: "Ask satisfied client to refer friends, family, or colleagues", priority: "LOW", stage: "FOLLOW_UP" },
  { title: "Close client file", description: "Archive client file with all completed documentation and final notes", priority: "MEDIUM", stage: "FOLLOW_UP" },

  // Visa Refused
  { title: "Review refusal reasons", description: "Analyze embassy refusal letter and identify specific grounds for refusal", priority: "URGENT", stage: "VISA_REFUSED_PATH" },
  { title: "Prepare reapplication strategy", description: "Document what needs to change for a new application and estimated timeline", priority: "HIGH", stage: "VISA_REFUSED_PATH" },
  { title: "Discuss options with client", description: "Meet with client to explain refusal reasons and present reapplication or alternative options", priority: "HIGH", stage: "VISA_REFUSED_PATH" },
];

export function getTaskTemplatesForStage(stage: WorkflowStage): SubstageTaskTemplate[] {
  return SUBSTAGE_TASK_TEMPLATES.filter((t) => t.stage === stage);
}

// History of the route the application is on now: everything from the most recent entry that
// started a route (no fromStage) — creation, a new service stage, or a move off the old route.
export function currentRouteHistory<T extends { fromStage: string | null }>(history: T[]): T[] {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].fromStage === null) return history.slice(i);
  }
  return history;
}
