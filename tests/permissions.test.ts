import { describe, it, expect } from "vitest";
import {
  isAdmin,
  canAccessClient,
  canManageClients,
  canManageApplications,
  canTransitionApplication,
  canCreateTask,
  canUpdateTask,
  canVerifyDocument,
  canRecordPayment,
  canConfirmPayment,
  canDecideQualityReview,
} from "@/lib/permissions";

describe("isAdmin", () => {
  it("is true only for the ADMIN role", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("STAFF")).toBe(false);
    expect(isAdmin("")).toBe(false);
  });
});

describe("canAccessClient", () => {
  it("lets an admin access any client regardless of assignment", () => {
    expect(canAccessClient("ADMIN", 42, 1)).toBe(true);
    expect(canAccessClient("ADMIN", null, 1)).toBe(true);
  });

  it("lets the assigned staff member access their own client", () => {
    expect(canAccessClient("STAFF", 5, 5)).toBe(true);
  });

  it("blocks a staff member from a client assigned to someone else", () => {
    expect(canAccessClient("STAFF", 5, 6)).toBe(false);
  });

  it("blocks a staff member from an unassigned client", () => {
    expect(canAccessClient("STAFF", null, 5)).toBe(false);
  });
});

describe("canManageClients / canManageApplications", () => {
  it("are admin-only", () => {
    expect(canManageClients("ADMIN")).toBe(true);
    expect(canManageClients("STAFF")).toBe(false);
    expect(canManageApplications("ADMIN")).toBe(true);
    expect(canManageApplications("STAFF")).toBe(false);
  });
});

describe("canTransitionApplication", () => {
  it("lets admin move any application through any stage", () => {
    expect(canTransitionApplication("ADMIN", null, 1, "CLIENT_INQUIRY", "CUSTOMER_SERVICE_REGISTRATION")).toBe(true);
    expect(canTransitionApplication("ADMIN", 5, 5, "DOCUMENT_COLLECTION_VERIFICATION", "VISA_PROCESSING")).toBe(true);
    expect(canTransitionApplication("ADMIN", null, 1, "DECISION", "FLIGHT_BOOKING")).toBe(true);
    expect(canTransitionApplication("ADMIN", null, 1, undefined, undefined)).toBe(true);
  });

  it("lets assigned staff move their client through non-sensitive stages", () => {
    expect(canTransitionApplication("STAFF", 5, 5, "CLIENT_INQUIRY", "CUSTOMER_SERVICE_REGISTRATION")).toBe(true);
    expect(canTransitionApplication("STAFF", 5, 5, "DOCUMENT_COLLECTION_VERIFICATION", "VISA_PROCESSING")).toBe(true);
    expect(canTransitionApplication("STAFF", 5, 5, "FLIGHT_BOOKING", "PRE_DEPARTURE_BRIEFING")).toBe(true);
  });

  it("blocks assigned staff from moving to a sensitive stage", () => {
    expect(canTransitionApplication("STAFF", 5, 5, "VISA_PROCESSING", "QUALITY_REVIEW")).toBe(false);
    expect(canTransitionApplication("STAFF", 5, 5, "PAYMENT_SERVICE_AGREEMENT", "APPLICATION_SUBMISSION")).toBe(false);
  });

  it("blocks assigned staff from moving out of a sensitive stage", () => {
    expect(canTransitionApplication("STAFF", 5, 5, "DECISION", "FLIGHT_BOOKING")).toBe(false);
    expect(canTransitionApplication("STAFF", 5, 5, "QUALITY_REVIEW", "APPLICATION_SUBMISSION")).toBe(false);
  });

  it("blocks staff from moving a client assigned to someone else", () => {
    expect(canTransitionApplication("STAFF", 5, 6, "CLIENT_INQUIRY", "CUSTOMER_SERVICE_REGISTRATION")).toBe(false);
  });

  it("blocks staff from unassigned clients", () => {
    expect(canTransitionApplication("STAFF", null, 5, "CLIENT_INQUIRY", "CUSTOMER_SERVICE_REGISTRATION")).toBe(false);
  });

  it("allows staff same-stage note updates even on sensitive stages", () => {
    expect(canTransitionApplication("STAFF", 5, 5, "DECISION", "DECISION")).toBe(true);
  });

  it("allows staff to pass no stage info (backward-compatible, staff-owned)", () => {
    expect(canTransitionApplication("STAFF", 5, 5)).toBe(true);
  });
});

describe("canCreateTask", () => {
  it("is admin-only", () => {
    expect(canCreateTask("ADMIN")).toBe(true);
    expect(canCreateTask("STAFF")).toBe(false);
  });
});

describe("canUpdateTask", () => {
  it("lets an admin update any task", () => {
    expect(canUpdateTask("ADMIN", 99, 1)).toBe(true);
  });

  it("lets the assignee update their own task", () => {
    expect(canUpdateTask("STAFF", 7, 7)).toBe(true);
  });

  it("blocks a non-admin, non-assignee from updating a task", () => {
    expect(canUpdateTask("STAFF", 7, 8)).toBe(false);
  });

  it("blocks a non-admin from updating an unassigned task", () => {
    expect(canUpdateTask("STAFF", null, 7)).toBe(false);
  });
});

describe("canVerifyDocument / canConfirmPayment / canDecideQualityReview", () => {
  it("are all admin-only", () => {
    expect(canVerifyDocument("ADMIN")).toBe(true);
    expect(canVerifyDocument("STAFF")).toBe(false);
    expect(canConfirmPayment("ADMIN")).toBe(true);
    expect(canConfirmPayment("STAFF")).toBe(false);
    expect(canDecideQualityReview("ADMIN")).toBe(true);
    expect(canDecideQualityReview("STAFF")).toBe(false);
  });
});

describe("canRecordPayment", () => {
  it("lets an admin record a payment for any client", () => {
    expect(canRecordPayment("ADMIN", null, 1)).toBe(true);
  });

  it("lets the assigned staff member record a payment for their own client", () => {
    expect(canRecordPayment("STAFF", 3, 3)).toBe(true);
  });

  it("blocks a staff member from recording a payment for someone else's client", () => {
    expect(canRecordPayment("STAFF", 3, 4)).toBe(false);
  });
});
