import { describe, it, expect } from "vitest";
import {
  STAGE_ORDER,
  TERMINAL_STAGES,
  DECISION_STAGE,
  getAllowedNextStages,
  isValidTransition,
  stageForDecision,
} from "@/lib/workflow";

describe("STAGE_ORDER", () => {
  it("has no duplicate stages", () => {
    expect(new Set(STAGE_ORDER).size).toBe(STAGE_ORDER.length);
  });

  it("starts with CLIENT_INQUIRY", () => {
    expect(STAGE_ORDER[0]).toBe("CLIENT_INQUIRY");
  });

  it("includes DECISION and both terminal stages", () => {
    expect(STAGE_ORDER).toContain(DECISION_STAGE);
    for (const stage of TERMINAL_STAGES) {
      expect(STAGE_ORDER).toContain(stage);
    }
  });

  it("has all 15 workflow stages", () => {
    expect(STAGE_ORDER.length).toBe(15);
  });
});

describe("getAllowedNextStages", () => {
  it("only allows moving forward from the first stage (no backward step)", () => {
    expect(getAllowedNextStages("CLIENT_INQUIRY")).toEqual(["CUSTOMER_SERVICE_REGISTRATION"]);
  });

  it("allows moving forward or backward from a middle stage", () => {
    expect(getAllowedNextStages("QUALITY_REVIEW")).toEqual([
      "APPLICATION_SUBMISSION",
      "VISA_PROCESSING",
    ]);
  });

  it("allows moving forward to DECISION or backward from the last pre-decision stage", () => {
    expect(getAllowedNextStages("APPLICATION_TRACKING")).toEqual([
      "DECISION",
      "APPLICATION_SUBMISSION",
    ]);
  });

  it("special-cases DECISION to offer approved path, refused path, and a way back", () => {
    expect(getAllowedNextStages("DECISION")).toEqual([
      "FLIGHT_BOOKING",
      "VISA_REFUSED_PATH",
      "APPLICATION_TRACKING",
    ]);
  });

  it("only allows returning to DECISION from the refused path", () => {
    expect(getAllowedNextStages("VISA_REFUSED_PATH")).toEqual(["DECISION"]);
  });

  it("moves forward through approved path stages and allows backward steps", () => {
    expect(getAllowedNextStages("FLIGHT_BOOKING")).toEqual(["PRE_DEPARTURE_BRIEFING", "DECISION"]);
  });

  it("moves forward from pre-departure to client travels", () => {
    expect(getAllowedNextStages("PRE_DEPARTURE_BRIEFING")).toEqual(["CLIENT_TRAVELS", "FLIGHT_BOOKING"]);
  });

  it("allows follow-up to be accessible from both terminal approved stages", () => {
    expect(getAllowedNextStages("CLIENT_TRAVELS")).toEqual(["FOLLOW_UP", "DECISION"]);
    expect(getAllowedNextStages("FOLLOW_UP")).toEqual(["FOLLOW_UP", "DECISION"]);
  });
});

describe("isValidTransition", () => {
  it("allows the standard forward path up to DECISION", () => {
    const decisionIndex = STAGE_ORDER.indexOf(DECISION_STAGE);
    for (let i = 0; i < decisionIndex; i++) {
      const from = STAGE_ORDER[i];
      const to = STAGE_ORDER[i + 1];
      expect(isValidTransition(from, to)).toBe(true);
    }
  });

  it("rejects skipping a stage", () => {
    expect(isValidTransition("CLIENT_INQUIRY", "INITIAL_CONSULTATION")).toBe(false);
    expect(isValidTransition("CLIENT_INQUIRY", "DECISION")).toBe(false);
  });

  it("rejects moving backward from the first stage", () => {
    expect(isValidTransition("CLIENT_INQUIRY", "CUSTOMER_SERVICE_REGISTRATION")).toBe(true);
    expect(isValidTransition("CUSTOMER_SERVICE_REGISTRATION", "CLIENT_INQUIRY")).toBe(true);
  });

  it("rejects moving from a terminal stage to anything but DECISION or follow-up", () => {
    expect(isValidTransition("FLIGHT_BOOKING", "DECISION")).toBe(true);
    expect(isValidTransition("FLIGHT_BOOKING", "VISA_REFUSED_PATH")).toBe(false);
  });

  it("allows the full approved path sequence", () => {
    expect(isValidTransition("FLIGHT_BOOKING", "PRE_DEPARTURE_BRIEFING")).toBe(true);
    expect(isValidTransition("PRE_DEPARTURE_BRIEFING", "CLIENT_TRAVELS")).toBe(true);
    expect(isValidTransition("CLIENT_TRAVELS", "FOLLOW_UP")).toBe(true);
  });
});

describe("stageForDecision", () => {
  it("maps APPROVED to flight booking", () => {
    expect(stageForDecision("APPROVED")).toBe("FLIGHT_BOOKING");
  });

  it("maps REFUSED to the refused path", () => {
    expect(stageForDecision("REFUSED")).toBe("VISA_REFUSED_PATH");
  });

  it("has no target stage for WITHDRAWN or PENDING_ACTION", () => {
    expect(stageForDecision("WITHDRAWN")).toBeNull();
    expect(stageForDecision("PENDING_ACTION")).toBeNull();
  });
});
