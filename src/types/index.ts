export type UserRole = "ADMIN" | "STAFF";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  fileNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  passportNumber?: string;
  dateOfBirth?: Date;
  source: string;
  createdBy: string;
  assignedStaffId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkflowStage =
  | "CLIENT_INQUIRY"
  | "CUSTOMER_SERVICE_REGISTRATION"
  | "INITIAL_CONSULTATION"
  | "PAYMENT_SERVICE_AGREEMENT"
  | "DOCUMENT_COLLECTION_VERIFICATION"
  | "VISA_PROCESSING"
  | "QUALITY_REVIEW"
  | "APPLICATION_SUBMISSION"
  | "APPLICATION_TRACKING"
  | "DECISION"
  | "VISA_APPROVED_PATH"
  | "VISA_REFUSED_PATH";

export interface Application {
  id: string;
  clientId: string;
  serviceType: string;
  destinationCountry: string;
  travelPurpose: string;
  expectedTravelDate?: Date;
  currentStage: WorkflowStage;
  status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "WAITING_FOR_CLIENT" | "COMPLETED";
  decisionStatus?: "APPROVED" | "REFUSED" | "WITHDRAWN" | "PENDING_ACTION";
  assignedStaffId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "WAITING" | "DONE" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  applicationId?: string;
  clientId?: string;
  stage?: WorkflowStage;
  title: string;
  description?: string;
  assigneeId?: string;
  assignedBy: string;
  priority: TaskPriority;
  dueDate?: Date;
  status: TaskStatus;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
