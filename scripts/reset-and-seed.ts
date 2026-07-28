import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 5,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const STAGE_ORDER = [
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

const DECISION_INDEX = STAGE_ORDER.indexOf("DECISION");

interface SeededClient {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  staffEmail: string;
  destinationCountry: string;
  outcome: "APPROVED" | "REFUSED" | "WITHDRAWN" | "PENDING_ACTION";
}

const clients: SeededClient[] = [
  { firstName: "Benjamin", lastName: "Bitrus", email: "benjamin@example.com", phone: "+2348010001001", source: "Walk-in", staffEmail: "staff@waypoint.com", destinationCountry: "United Kingdom", outcome: "APPROVED" },
  { firstName: "Musa", lastName: "Ahmad", email: "musa@example.com", phone: "+2348010001002", source: "Referral", staffEmail: "staff@waypoint.com", destinationCountry: "France", outcome: "APPROVED" },
  { firstName: "Bilkisu", lastName: "Yunus", email: "bilkisu@example.com", phone: "+2348010001003", source: "Website", staffEmail: "staff@waypoint.com", destinationCountry: "Saudi Arabia", outcome: "APPROVED" },
  { firstName: "Fatima", lastName: "Kabir", email: "fatima@example.com", phone: "+2348010001004", source: "Phone", staffEmail: "staff@waypoint.com", destinationCountry: "Australia", outcome: "APPROVED" },
  { firstName: "Keneth", lastName: "David", email: "keneth@example.com", phone: "+2348010001005", source: "Walk-in", staffEmail: "staff@waypoint.com", destinationCountry: "Canada", outcome: "REFUSED" },
  { firstName: "Joshua", lastName: "David", email: "joshua@example.com", phone: "+2348010001006", source: "Website", staffEmail: "user@waypoint.com", destinationCountry: "Saudi Arabia", outcome: "REFUSED" },
  { firstName: "Rechael", lastName: "Afolabi", email: "rechael@example.com", phone: "+2348010001007", source: "Referral", staffEmail: "user@waypoint.com", destinationCountry: "United Kingdom", outcome: "WITHDRAWN" },
  { firstName: "Okoro", lastName: "Prince", email: "okoro@example.com", phone: "+2348010001008", source: "Walk-in", staffEmail: "user@waypoint.com", destinationCountry: "France", outcome: "PENDING_ACTION" },
];

async function main() {
  console.log("Deleting existing client data...");

  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.trackingUpdate.deleteMany();
  await prisma.submissionRecord.deleteMany();
  await prisma.qualityReview.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.applicationStageHistory.deleteMany();
  await prisma.application.deleteMany();
  await prisma.client.deleteMany();
  console.log("✓ All client-related data deleted.\n");

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@waypoint.com" } });
  const staffUsers: Record<string, number> = {};

  for (const c of clients) {
    if (!staffUsers[c.staffEmail]) {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: c.staffEmail } });
      staffUsers[c.staffEmail] = user.id;
    }
  }

  const year = new Date().getFullYear();
  let counter = 0;

  for (const c of clients) {
    counter++;
    const fileNumber = `WP-${year}-${String(counter).padStart(4, "0")}`;

    const client = await prisma.client.create({
      data: {
        fileNumber,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        source: c.source,
        createdById: admin.id,
        assignedStaffId: staffUsers[c.staffEmail],
      },
    });

    // Determine the final stage and decisionStatus
    let finalStage: string;
    let decisionStatus: string | null;
    let appStatus: string;

    if (c.outcome === "APPROVED") {
      finalStage = "VISA_APPROVED_PATH";
      decisionStatus = "APPROVED";
      appStatus = "COMPLETED";
    } else if (c.outcome === "REFUSED") {
      finalStage = "VISA_REFUSED_PATH";
      decisionStatus = "REFUSED";
      appStatus = "COMPLETED";
    } else {
      finalStage = "DECISION";
      decisionStatus = c.outcome; // WITHDRAWN or PENDING_ACTION
      appStatus = "IN_PROGRESS";
    }

    const app = await prisma.application.create({
      data: {
        clientId: client.id,
        serviceType: "Tourist Visa",
        destinationCountry: c.destinationCountry,
        travelPurpose: "Tourism",
        expectedTravelDate: new Date("2026-09-01"),
        currentStage: finalStage,
        status: appStatus,
        decisionStatus,
        assignedStaffId: staffUsers[c.staffEmail],
      },
    });

    // Build stage history: CLIENT_INQUIRY → ... → DECISION → (terminal if applicable)
    // Walk from stage 0 to DECISION
    for (let i = 0; i <= DECISION_INDEX; i++) {
      const fromStage = i === 0 ? null : STAGE_ORDER[i - 1];
      const toStage = STAGE_ORDER[i];
      // Skip the last step if it's not actually a move from previous (first record)
      await prisma.applicationStageHistory.create({
        data: {
          applicationId: app.id,
          fromStage,
          toStage,
          changedById: admin.id,
          note: null,
        },
      });
    }

    // If terminal, add the DECISION → terminal record
    if (finalStage === "VISA_APPROVED_PATH" || finalStage === "VISA_REFUSED_PATH") {
      await prisma.applicationStageHistory.create({
        data: {
          applicationId: app.id,
          fromStage: "DECISION",
          toStage: finalStage,
          changedById: admin.id,
          note: `Decision: ${decisionStatus}`,
        },
      });
    }

    console.log(`  ✓ ${c.firstName} ${c.lastName} — ${c.destinationCountry} — ${finalStage} (${decisionStatus}) — assigned to ${c.staffEmail}`);
  }

  console.log(`\n✅ Done. ${clients.length} clients with full pipeline applications seeded.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
