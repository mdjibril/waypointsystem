import { prisma } from "@/lib/prisma";

export type ActivityEntityType = "CLIENT" | "APPLICATION" | "TASK" | "DOCUMENT" | "PAYMENT";

// Activity logging is best-effort: a logging failure should never break the
// mutation that triggered it, so errors are swallowed here rather than thrown.
export async function logActivity(params: {
  clientId: number;
  entityType: ActivityEntityType;
  entityId: number;
  action: string;
  description: string;
  actorId: number;
}) {
  try {
    await prisma.activityLog.create({ data: params });
  } catch (err) {
    console.error("Failed to record activity log:", err);
  }
}
