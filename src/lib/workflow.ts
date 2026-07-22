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
  "VISA_APPROVED_PATH",
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
  VISA_APPROVED_PATH: "Visa Approved Path",
  VISA_REFUSED_PATH: "Visa Refused Path",
};

export const DECISION_STAGE: WorkflowStage = "DECISION";

export const TERMINAL_STAGES: WorkflowStage[] = ["VISA_APPROVED_PATH", "VISA_REFUSED_PATH"];

const DECISION_INDEX = STAGE_ORDER.indexOf(DECISION_STAGE);

export function getAllowedNextStages(current: WorkflowStage): WorkflowStage[] {
  if (current === DECISION_STAGE) {
    return ["VISA_APPROVED_PATH", "VISA_REFUSED_PATH", "APPLICATION_TRACKING"];
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
  if (decisionStatus === "APPROVED") return "VISA_APPROVED_PATH";
  if (decisionStatus === "REFUSED") return "VISA_REFUSED_PATH";
  return null;
}
