// Pure, DB-free permission rules shared by the API routes. Keeping these as
// plain functions (role/ownership in, boolean out) makes them unit-testable
// without needing a database or a mocked request.

import { WorkflowStage } from "@/types";
import { SENSITIVE_STAGES } from "@/lib/workflow";

export function isAdmin(role: string): boolean {
  return role === "ADMIN";
}

// ADMIN, or the staff member a client is assigned to, can act on that client
// (and by extension, anything scoped to that client: their applications,
// stage transitions, payments).
export function canAccessClient(
  role: string,
  clientAssignedStaffId: number | null,
  userId: number
): boolean {
  return isAdmin(role) || clientAssignedStaffId === userId;
}

// Only ADMIN can create/update client records or application records directly.
export function canManageClients(role: string): boolean {
  return isAdmin(role);
}

export function canManageApplications(role: string): boolean {
  return isAdmin(role);
}

// ADMIN can move any application. Assigned staff can move their own clients'
// applications, but are blocked from transitioning into or out of sensitive
// stages (DECISION, APPLICATION_SUBMISSION, QUALITY_REVIEW).
export function canTransitionApplication(
  role: string,
  clientAssignedStaffId: number | null,
  userId: number,
  fromStage?: WorkflowStage,
  toStage?: WorkflowStage,
): boolean {
  if (isAdmin(role)) return true;

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

// ADMIN, or the staff member assigned to the client, can record a payment.
export function canRecordPayment(
  role: string,
  clientAssignedStaffId: number | null,
  userId: number
): boolean {
  return canAccessClient(role, clientAssignedStaffId, userId);
}

// Only ADMIN can confirm/reject a recorded payment.
export function canConfirmPayment(role: string): boolean {
  return isAdmin(role);
}

// Only ADMIN can decide (approve/reject/request corrections on) a quality review.
export function canDecideQualityReview(role: string): boolean {
  return isAdmin(role);
}
