import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { syncDefaultServiceWorkflows } from "../src/lib/serviceTypes";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@waypoint.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@waypoint.com",
      role: "ADMIN",
      status: "active",
      passwordHash,
    },
  });
  console.log(`  ✓ Admin user: ${admin.email}`);

  // Create staff user
  const staff = await prisma.user.upsert({
    where: { email: "staff@waypoint.com" },
    update: {},
    create: {
      name: "Staff Officer",
      email: "staff@waypoint.com",
      role: "STAFF",
      status: "active",
      passwordHash,
    },
  });
  console.log(`  ✓ Staff user: ${staff.email}`);

  // Seed workflow stages
  const stages = [
    { name: "Client Inquiry", slug: "client-inquiry", order: 1, description: "Capture walk-in, phone, WhatsApp, or web inquiry." },
    { name: "Customer Service Registration", slug: "customer-service-registration", order: 2, description: "Create client profile and file reference number." },
    { name: "Initial Consultation", slug: "initial-consultation", order: 3, description: "Eligibility check, travel assessment, and service path recommendation." },
    { name: "Payment & Service Agreement", slug: "payment-service-agreement", order: 4, description: "Generate invoice, record payment, and upload signed agreement." },
    { name: "Document Collection & Verification", slug: "document-collection-verification", order: 5, description: "Checklist-based document collection and verification." },
    { name: "Visa Processing", slug: "visa-processing", order: 6, description: "Form completion, cover letter, itinerary, and application draft." },
    { name: "Quality Review", slug: "quality-review", order: 7, description: "Senior officer or admin final review before submission." },
    { name: "Application Submission", slug: "application-submission", order: 8, description: "Embassy/VFS/TLS submission, biometrics booking, and reference tracking." },
    { name: "Application Tracking", slug: "application-tracking", order: 9, description: "Track status, schedule follow-ups, and handle embassy requests." },
    { name: "Decision", slug: "decision", order: 10, description: "Record outcome: approved, refused, withdrawn, or pending action." },
    { name: "Flight Booking", slug: "flight-booking", order: 11, description: "Search, book flight, hotel, and arrange travel insurance." },
    { name: "Pre-Departure Briefing", slug: "pre-departure-briefing", order: 12, description: "Brief client on travel itinerary, visa conditions, and cultural tips." },
    { name: "Client Travels", slug: "client-travels", order: 13, description: "Verify departure and arrival, send post-arrival check-in." },
    { name: "Follow-up & Testimonials", slug: "follow-up-testimonials", order: 14, description: "Collect feedback, testimonials, referrals, and close client file." },
    { name: "Visa Refused Path", slug: "visa-refused-path", order: 15, description: "Refusal review, reapply strategy, and optional new application." },
  ];

  for (const stage of stages) {
    await prisma.workflowStage.upsert({
      where: { slug: stage.slug },
      update: {},
      create: stage,
    });
  }
  console.log(`  ✓ ${stages.length} workflow stages`);

  // Seed service types with their workflow routes
  const { createdServices, seededRoutes } = await syncDefaultServiceWorkflows(prisma);
  console.log(`  ✓ ${createdServices} service types, ${seededRoutes} workflow routes`);

  // Seed document templates (basic set for UK Tourist Visa)
  // Seed global document templates (apply to ALL service types)
  const globalDocs = [
    { name: "Valid Passport", serviceType: null, isRequired: true, sortOrder: 1 },
    { name: "Passport-size Photographs", serviceType: null, isRequired: true, sortOrder: 2 },
    { name: "Proof of Residence", serviceType: null, isRequired: true, sortOrder: 3 },
    { name: "Travel Insurance", serviceType: null, isRequired: false, sortOrder: 4 },
  ];

  for (const doc of globalDocs) {
    await prisma.documentTemplate.create({ data: doc });
  }

  // Service-specific templates
  const ukTouristDocs = [
    { name: "Bank Statements (Last 6 Months)", serviceType: "UK Tourist Visa", isRequired: true, sortOrder: 10 },
    { name: "Employment Letter", serviceType: "UK Tourist Visa", isRequired: true, sortOrder: 11 },
    { name: "Travel Itinerary", serviceType: "UK Tourist Visa", isRequired: true, sortOrder: 12 },
    { name: "Accommodation Booking", serviceType: "UK Tourist Visa", isRequired: true, sortOrder: 13 },
  ];

  for (const doc of ukTouristDocs) {
    await prisma.documentTemplate.create({ data: doc });
  }
  console.log(`  ✓ ${globalDocs.length + ukTouristDocs.length} document templates`);

  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
