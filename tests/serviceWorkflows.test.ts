import { describe, it, expect } from "vitest";
import {
  ALL_STAGES,
  STAGE_LABELS,
  STANDARD_VISA_ROUTE,
  branchSteps,
  combinedOutcomeLabel,
  decisionActionLabel,
  firstStage,
  getAllowedNextStages,
  isTerminalStage,
  isValidTransition,
  parseRoute,
  roadmapPath,
  currentRouteHistory,
  stageForDecision,
  stageLabel,
  validateRoute,
  WorkflowRoute,
} from "@/lib/workflow";
import { DEFAULT_SERVICE_WORKFLOWS, defaultRouteForService, routeForApplication } from "@/lib/serviceWorkflows";

const route = (name: string) => defaultRouteForService(name);
const labels = (r: WorkflowRoute, branch: "MAIN" | "APPROVED" | "REFUSED" = "MAIN") =>
  branchSteps(r, branch).map((s) => stageLabel(s, r));

describe("service catalogue", () => {
  it("has the six company services", () => {
    expect(DEFAULT_SERVICE_WORKFLOWS.map((s) => s.name)).toEqual([
      "Visa Services",
      "Consultation",
      "International Relocation",
      "Childbirth Abroad / Medical Tourism",
      "Corporate Travel",
      "Admission Assistance",
    ]);
  });

  it("has only valid routes", () => {
    for (const service of DEFAULT_SERVICE_WORKFLOWS) {
      expect(validateRoute(service.route), service.name).toEqual([]);
    }
  });

  it("has unique slugs and labels every stage", () => {
    expect(new Set(DEFAULT_SERVICE_WORKFLOWS.map((s) => s.slug)).size).toBe(DEFAULT_SERVICE_WORKFLOWS.length);
    for (const stage of ALL_STAGES) expect(STAGE_LABELS[stage]).toBeTruthy();
  });

  it("falls back to the standard visa route for unknown services", () => {
    expect(route("UK Tourist Visa")).toBe(STANDARD_VISA_ROUTE);
  });
});

describe("routes match the agreed steps", () => {
  it("Visa Services", () => {
    const r = route("Visa Services");
    expect(labels(r)).toEqual([
      "Visa Application Initiated",
      "Visa Application Processed",
      "Visa Application Submitted",
      "Awaiting Embassy Decision",
    ]);
    expect(combinedOutcomeLabel(r)).toBe("Visa Granted or Denied");
  });

  it("Consultation", () => {
    expect(labels(route("Consultation"))).toEqual([
      "Document Accepted",
      "Document Reviewed",
      "Application Processed",
      "Application Submitted",
    ]);
  });

  it("International Relocation", () => {
    const r = route("International Relocation");
    expect(labels(r)).toEqual([
      "Document Accepted",
      "Document Reviewed",
      "Immigration Pathway Determined",
      "Application Initiated",
      "Document Verified",
      "Application Submitted",
      "Awaiting Immigration Decision",
    ]);
    expect(combinedOutcomeLabel(r)).toBe("Granted or Denied");
  });

  it("Childbirth Abroad / Medical Tourism", () => {
    expect(labels(route("Childbirth Abroad / Medical Tourism"))).toEqual([
      "Medical Document Submitted",
      "Medical Document Reviewed",
      "Specialist Review Initiated",
      "Specialist Review Completed",
      "Cost Quotation Determined",
      "Initial Deposit Completed",
    ]);
  });

  it("Corporate Travel", () => {
    expect(labels(route("Corporate Travel"))).toEqual([
      "Consultation Initiated",
      "Quotation Sent",
      "Awaiting Organization Decision",
      "Quotation Approved",
      "Service Application Initiated",
      "Service Application Completed",
    ]);
  });

  it("Admission Assistance", () => {
    const r = route("Admission Assistance");
    expect(labels(r)).toEqual([
      "Document Accepted",
      "Document Reviewed",
      "Application Initiated",
      "Application Completed",
      "Awaiting School Decision",
    ]);
    expect(combinedOutcomeLabel(r)).toBe("Admission Offered or Denied");
  });
});

describe("moving along a route", () => {
  it("starts at the first step of the service", () => {
    expect(firstStage(route("Visa Services"))).toBe("APPLICATION_INITIATED");
    expect(firstStage(route("Corporate Travel"))).toBe("CONSULTATION_INITIATED");
  });

  it("only allows the next or previous step", () => {
    const r = route("Consultation");
    expect(getAllowedNextStages("DOCUMENT_REVIEWED", r)).toEqual(["APPLICATION_PROCESSED", "DOCUMENT_ACCEPTED"]);
    expect(isValidTransition("DOCUMENT_ACCEPTED", "APPLICATION_SUBMISSION", r)).toBe(false);
  });

  it("records granted or denied at the decision step", () => {
    const r = route("Visa Services");
    expect(getAllowedNextStages("DECISION", r)).toEqual(["OUTCOME_GRANTED", "OUTCOME_DENIED", "APPLICATION_SUBMISSION"]);
    expect(stageForDecision("APPROVED", r)).toBe("OUTCOME_GRANTED");
    expect(stageForDecision("REFUSED", r)).toBe("OUTCOME_DENIED");
    expect(decisionActionLabel(r, "APPROVED")).toBe("Visa Granted");
    expect(decisionActionLabel(r, "REFUSED")).toBe("Visa Denied");
  });

  it("keeps Approve / Refuse wording on the standard visa route", () => {
    expect(decisionActionLabel(STANDARD_VISA_ROUTE, "APPROVED")).toBe("Approve");
    expect(decisionActionLabel(STANDARD_VISA_ROUTE, "REFUSED")).toBe("Refuse");
  });

  it("is finished at the outcome, or at the last step for routes without a decision", () => {
    expect(isTerminalStage("OUTCOME_GRANTED", route("Admission Assistance"))).toBe(true);
    expect(isTerminalStage("OUTCOME_DENIED", route("Admission Assistance"))).toBe(true);
    expect(isTerminalStage("DECISION", route("Admission Assistance"))).toBe(false);
    expect(isTerminalStage("INITIAL_DEPOSIT_COMPLETED", route("Childbirth Abroad / Medical Tourism"))).toBe(true);
    expect(isTerminalStage("QUOTATION_APPROVED", route("Corporate Travel"))).toBe(false);
  });

  it("treats Corporate Travel's organization decision as an ordinary step", () => {
    expect(getAllowedNextStages("AWAITING_ORGANIZATION_DECISION", route("Corporate Travel"))).toEqual([
      "QUOTATION_APPROVED",
      "QUOTATION_SENT",
    ]);
  });
});

describe("roadmapPath", () => {
  it("shows a single pending outcome step until the decision is made", () => {
    const r = route("Visa Services");
    const path = roadmapPath(r, "APPLICATION_PROCESSED");
    expect(path.awaitingDecision).toBe(true);
    expect(path.steps).toHaveLength(5);
    expect(path.steps[4].label).toBe("Visa Granted or Denied");
  });

  it("shows the actual outcome once decided", () => {
    const r = route("Visa Services");
    expect(roadmapPath(r, "OUTCOME_GRANTED").steps.map((s) => s.stage).at(-1)).toBe("OUTCOME_GRANTED");
    const denied = roadmapPath(r, "OUTCOME_DENIED");
    expect(denied.steps.map((s) => s.stage).at(-1)).toBe("OUTCOME_DENIED");
    expect(denied.steps).toHaveLength(5);
  });

  it("keeps the full approved path as the expectation on the standard route", () => {
    const path = roadmapPath(STANDARD_VISA_ROUTE, "VISA_PROCESSING");
    expect(path.awaitingDecision).toBe(true);
    expect(path.steps.map((s) => s.stage)).toContain("FLIGHT_BOOKING");
    expect(path.steps.map((s) => s.stage)).not.toContain("VISA_REFUSED_PATH");
  });

  it("is the whole route for services without a decision", () => {
    const r = route("Consultation");
    expect(roadmapPath(r, "DOCUMENT_REVIEWED")).toEqual({ steps: r.steps, awaitingDecision: false });
  });
});

describe("validateRoute", () => {
  const steps = (...s: [string, string][]) => ({ steps: s.map(([stage, branch]) => ({ stage, branch })) }) as WorkflowRoute;

  it("rejects an empty route and duplicate stages", () => {
    expect(validateRoute({ steps: [] })).not.toEqual([]);
    expect(validateRoute(steps(["DOCUMENT_ACCEPTED", "MAIN"], ["DOCUMENT_ACCEPTED", "MAIN"]))).toContain("A stage can only appear once in a route.");
  });

  it("requires decision to be the last main step with both outcomes", () => {
    expect(validateRoute(steps(["DECISION", "MAIN"], ["DOCUMENT_ACCEPTED", "MAIN"], ["OUTCOME_GRANTED", "APPROVED"], ["OUTCOME_DENIED", "REFUSED"])))
      .toContain("Decision must be the last main step.");
    expect(validateRoute(steps(["DOCUMENT_ACCEPTED", "MAIN"], ["DECISION", "MAIN"], ["OUTCOME_GRANTED", "APPROVED"])))
      .toContain("A route with a decision needs at least one refused step.");
  });

  it("rejects outcome steps without a decision", () => {
    expect(validateRoute(steps(["DOCUMENT_ACCEPTED", "MAIN"], ["OUTCOME_GRANTED", "APPROVED"]))).not.toEqual([]);
  });
});

describe("stored routes", () => {
  it("applications without a stored route follow the standard visa route", () => {
    expect(routeForApplication({ workflowRoute: null })).toBe(STANDARD_VISA_ROUTE);
  });

  it("parses a stored route, keeps custom labels and drops unknown stages", () => {
    const parsed = parseRoute({ steps: [{ stage: "DOCUMENT_ACCEPTED" }, { stage: "NOT_A_STAGE" }, { stage: "QUOTATION_SENT", label: "Quote emailed" }] });
    expect(parsed.steps).toEqual([
      { stage: "DOCUMENT_ACCEPTED", branch: "MAIN", label: null },
      { stage: "QUOTATION_SENT", branch: "MAIN", label: "Quote emailed" },
    ]);
    expect(stageLabel("QUOTATION_SENT", parsed)).toBe("Quote emailed");
  });

  it("lets an application whose stage is off its route re-enter at the start", () => {
    expect(getAllowedNextStages("VISA_PROCESSING", route("Consultation"))).toEqual(["DOCUMENT_ACCEPTED"]);
  });
});

describe("currentRouteHistory", () => {
  it("starts at the latest entry that began a route", () => {
    const history = [
      { fromStage: null, toStage: "CLIENT_INQUIRY" },
      { fromStage: "CLIENT_INQUIRY", toStage: "DECISION" },
      { fromStage: null, toStage: "APPLICATION_INITIATED" },
      { fromStage: "APPLICATION_INITIATED", toStage: "APPLICATION_PROCESSED" },
    ];
    expect(currentRouteHistory(history).map((h) => h.toStage)).toEqual(["APPLICATION_INITIATED", "APPLICATION_PROCESSED"]);
  });
});
