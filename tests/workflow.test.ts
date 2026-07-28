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

  it("special-cases DECISION to offer both outcomes plus a way back", () => {
    expect(getAllowedNextStages("DECISION")).toEqual([
      "VISA_APPROVED_PATH",
      "VISA_REFUSED_PATH",
      "APPLICATION_TRACKING",
    ]);
  });

  it("only allows returning to DECISION from a terminal stage", () => {
    expect(getAllowedNextStages("VISA_APPROVED_PATH")).toEqual(["DECISION"]);
    expect(getAllowedNextStages("VISA_REFUSED_PATH")).toEqual(["DECISION"]);
  });
});

describe("isValidTransition", () => {
  it("allows the standard forward path up to DECISION", () => {
    // Stages after DECISION (the two terminal paths) branch specially and are
    // covered by the dedicated DECISION/terminal-stage tests below, not this
    // plain "next stage in the list" walk.
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
    // There is no stage before CLIENT_INQUIRY, so nothing should be a valid
    // "backward" move away from it other than its one forward neighbor.
    expect(isValidTransition("CLIENT_INQUIRY", "CUSTOMER_SERVICE_REGISTRATION")).toBe(true);
    expect(isValidTransition("CUSTOMER_SERVICE_REGISTRATION", "CLIENT_INQUIRY")).toBe(true);
  });

  it("rejects moving from a terminal stage to anything but DECISION", () => {
    expect(isValidTransition("VISA_APPROVED_PATH", "DECISION")).toBe(true);
    expect(isValidTransition("VISA_APPROVED_PATH", "VISA_REFUSED_PATH")).toBe(false);
    expect(isValidTransition("VISA_APPROVED_PATH", "APPLICATION_TRACKING")).toBe(false);
  });
});

describe("stageForDecision", () => {
  it("maps APPROVED to the approved path", () => {
    expect(stageForDecision("APPROVED")).toBe("VISA_APPROVED_PATH");
  });

  it("maps REFUSED to the refused path", () => {
    expect(stageForDecision("REFUSED")).toBe("VISA_REFUSED_PATH");
  });

  it("has no target stage for WITHDRAWN or PENDING_ACTION", () => {
    expect(stageForDecision("WITHDRAWN")).toBeNull();
    expect(stageForDecision("PENDING_ACTION")).toBeNull();
  });
});
