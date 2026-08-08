import { WorkflowStage } from "@/types";

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

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  CLIENT_INQUIRY: "Client Inquiry",
  CUSTOMER_SERVICE_REGISTRATION: "Customer Service Registration",
  INITIAL_CONSULTATION: "Initial Consultation",
  PAYMENT_SERVICE_AGREEMENT: "Payment & Service Agreement",
  DOCUMENT_COLLECTION_VERIFICATION: "Document Collection & Verification",
  VISA_PROCESSING: "Visa Processing",
  QUALITY_REVIEW: "Quality Review",
  APPLICATION_SUBMISSION: "Application Submission",
  APPLICATION_TRACKING: "Application Tracking",
  DECISION: "Decision",
  FLIGHT_BOOKING: "Flight Booking",
  PRE_DEPARTURE_BRIEFING: "Pre-Departure Briefing",
  CLIENT_TRAVELS: "Client Travels",
  FOLLOW_UP: "Follow-up & Testimonials",
  VISA_REFUSED_PATH: "Visa Refused Path",
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

const DECISION_INDEX = STAGE_ORDER.indexOf(DECISION_STAGE);

export function getAllowedNextStages(current: WorkflowStage): WorkflowStage[] {
  if (current === DECISION_STAGE) {
    return ["FLIGHT_BOOKING", "VISA_REFUSED_PATH", "APPLICATION_TRACKING"];
  }

  if (current === "FLIGHT_BOOKING") {
    return ["PRE_DEPARTURE_BRIEFING", DECISION_STAGE];
  }

  if (current === "PRE_DEPARTURE_BRIEFING") {
    return ["CLIENT_TRAVELS", "FLIGHT_BOOKING"];
  }

  if (current === "CLIENT_TRAVELS" || current === "FOLLOW_UP") {
    return ["FOLLOW_UP", DECISION_STAGE];
  }

  if (current === "VISA_REFUSED_PATH") {
    return [DECISION_STAGE];
  }

  if (TERMINAL_STAGES.includes(current)) {
    return [DECISION_STAGE];
  }

  const idx = STAGE_ORDER.indexOf(current);
  const next: WorkflowStage[] = [];

  if (idx < DECISION_INDEX) {
    next.push(STAGE_ORDER[idx + 1]);
  }
  if (idx > 0) {
    next.push(STAGE_ORDER[idx - 1]);
  }

  return next;
}

export function isValidTransition(from: WorkflowStage, to: WorkflowStage): boolean {
  return getAllowedNextStages(from).includes(to);
}

export type DecisionOutcome = "APPROVED" | "REFUSED" | "WITHDRAWN" | "PENDING_ACTION";

export function stageForDecision(decisionStatus: DecisionOutcome): WorkflowStage | null {
  if (decisionStatus === "APPROVED") return "FLIGHT_BOOKING";
  if (decisionStatus === "REFUSED") return "VISA_REFUSED_PATH";
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
