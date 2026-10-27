// Pure, DB-free permission rules shared by the API routes. Keeping these as
// plain functions (role/ownership in, boolean out) makes them unit-testable
// without needing a database or a mocked request.

import { WorkflowStage } from "@/types";
import { SENSITIVE_STAGES } from "@/lib/workflow";

// Roles, highest first: ADMIN > MANAGER > STAFF. Stored lowercase in the database;
// getCurrentUserFromCookies upper-cases them.
export const ROLES = ["ADMIN", "MANAGER", "STAFF"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
};

export function isValidRole(role: unknown): role is Role {
  return typeof role === "string" && (ROLES as readonly string[]).includes(role.toUpperCase());
}

export function isAdmin(role: string): boolean {
  return role?.toUpperCase() === "ADMIN";
}

export function isManager(role: string): boolean {
  return role?.toUpperCase() === "MANAGER";
}

// ADMIN and MANAGER work across every client; STAFF only on clients assigned to them.
export function hasAllClientAccess(role: string): boolean {
  return isAdmin(role) || isManager(role);
}

// ADMIN, MANAGER, or the staff member a client is assigned to, can act on that client
// (and by extension, anything scoped to that client: their applications,
// stage transitions, payments).
export function canAccessClient(
  role: string,
  clientAssignedStaffId: number | null,
  userId: number
): boolean {
  return hasAllClientAccess(role) || clientAssignedStaffId === userId;
}

// Only ADMIN can create/update client records or application records directly.
export function canManageClients(role: string): boolean {
  return isAdmin(role);
}

export function canManageApplications(role: string): boolean {
  return isAdmin(role);
}

// ADMIN and MANAGER can move any application. Assigned staff can move their own clients'
// applications, but are blocked from transitioning into or out of sensitive
// stages (DECISION, APPLICATION_SUBMISSION, QUALITY_REVIEW).
export function canTransitionApplication(
  role: string,
  clientAssignedStaffId: number | null,
  userId: number,
  fromStage?: WorkflowStage,
  toStage?: WorkflowStage,
): boolean {
  if (hasAllClientAccess(role)) return true;

  if (!canAccessClient(role, clientAssignedStaffId, userId)) return false;

  const isActualStageChange = fromStage && toStage && fromStage !== toStage;

  if (isActualStageChange) {
    const isSensitiveTransition =
      SENSITIVE_STAGES.includes(fromStage) ||
      SENSITIVE_STAGES.includes(toStage);

    if (isSensitiveTransition) return false;
  }

  return true;
}

// Only ADMIN can create tasks.
export function canCreateTask(role: string): boolean {
  return isAdmin(role);
}

// ADMIN, or the assignee themself, can update a task.
export function canUpdateTask(
  role: string,
  taskAssigneeId: number | null,
  userId: number
): boolean {
  return isAdmin(role) || taskAssigneeId === userId;
}

// Only ADMIN can verify/reject documents.
export function canVerifyDocument(role: string): boolean {
  return isAdmin(role);
}

// ADMIN, MANAGER, or the staff member assigned to the client, can record a payment.
export function canRecordPayment(
  role: string,
  clientAssignedStaffId: number | null,
  userId: number
): boolean {
  return canAccessClient(role, clientAssignedStaffId, userId);
}

// ADMIN and MANAGER handle everything about payments: confirming/rejecting, editing
// outstanding balances and deleting records.
export function canConfirmPayment(role: string): boolean {
  return hasAllClientAccess(role);
}

export function canManagePayments(role: string): boolean {
  return hasAllClientAccess(role);
}

// ADMIN and MANAGER see every staff member's daily reports and can comment on (review) them.
// Managers also submit their own reports, which they cannot review themselves.
export function canReviewDailyReports(role: string): boolean {
  return hasAllClientAccess(role);
}

// Only ADMIN manages user accounts: creating, deleting, and changing roles or status.
export function canManageUsers(role: string): boolean {
  return isAdmin(role);
}

// Only ADMIN can decide (approve/reject/request corrections on) a quality review.
export function canDecideQualityReview(role: string): boolean {
  return isAdmin(role);
}
