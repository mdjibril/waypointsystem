// Report fields a sample may carry. Anything date-, status- or review-specific is excluded.
export const SAMPLE_FIELDS = [
  "department",
  "position",
  "tasks",
  "clientsAttended",
  "visaApplications",
  "flightBookings",
  "hotelReservations",
  "admissionApplications",
  "customerCalls",
  "newLeads",
  "paymentsReceived",
  "dailyTarget",
  "actualAchievement",
  "clientFeedback1",
  "clientFeedback2",
  "clientFeedback3",
  "clientRating",
  "challenges",
  "supportNeeded",
  "supportPriority",
  "tasksOverdue",
  "reasonForOverdue",
  "clientFollowUps",
  "complaintsEscalations",
  "nextDayPlans",
  "selfRating",
] as const;

export function pickSampleData(input: unknown): Record<string, unknown> {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of SAMPLE_FIELDS) {
    if (src[key] !== undefined) out[key] = src[key];
  }
  return out;
}
