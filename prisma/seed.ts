import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

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
    { name: "Visa Approved Path", slug: "visa-approved-path", order: 11, description: "Flight, hotel, insurance, pre-departure, travel, and follow-up." },
    { name: "Visa Refused Path", slug: "visa-refused-path", order: 12, description: "Refusal review, reapply strategy, and optional new application." },
  ];

  for (const stage of stages) {
    await prisma.workflowStage.upsert({
      where: { slug: stage.slug },
      update: {},
      create: stage,
    });
  }
  console.log(`  ✓ ${stages.length} workflow stages`);

  // Seed service types
  const serviceTypes = [
    { name: "UK Tourist Visa", slug: "uk-tourist-visa", description: "Standard Visitor visa for tourism, family visits, or business." },
    { name: "Canada Study Permit", slug: "canada-study-permit", description: "Study permit for post-secondary education in Canada." },
    { name: "Schengen Tourist Visa", slug: "schengen-tourist-visa", description: "Short-stay visa for tourism in the Schengen Area." },
    { name: "USA B1/B2 Visa", slug: "usa-b1-b2-visa", description: "Business/tourism visa for the United States." },
    { name: "Australia Visitor Visa", slug: "australia-visitor-visa", description: "Visitor visa for tourism or business visits to Australia." },
    { name: "UK Student Visa", slug: "uk-student-visa", description: "Student visa for academic studies in the UK." },
  ];

  for (const service of serviceTypes) {
    await prisma.serviceType.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    });
  }
  console.log(`  ✓ ${serviceTypes.length} service types`);

  // Seed document templates (basic set for UK Tourist Visa)
  const ukTouristDocs = [
    { name: "Valid Passport", serviceType: "UK Tourist Visa", isRequired: true, sortOrder: 1 },
    { name: "Passport-size Photographs", serviceType: "UK Tourist Visa", isRequired: true, sortOrder: 2 },
    { name: "Bank Statements (Last 6 Months)", serviceType: "UK Tourist Visa", isRequired: true, sortOrder: 3 },
    { name: "Employment Letter", serviceType: "UK Tourist Visa", isRequired: true, sortOrder: 4 },
    { name: "Travel Itinerary", serviceType: "UK Tourist Visa", isRequired: true, sortOrder: 5 },
    { name: "Accommodation Booking", serviceType: "UK Tourist Visa", isRequired: true, sortOrder: 6 },
    { name: "Travel Insurance", serviceType: "UK Tourist Visa", isRequired: true, sortOrder: 7 },
    { name: "Proof of Residence", serviceType: "UK Tourist Visa", isRequired: true, sortOrder: 8 },
  ];

  for (const doc of ukTouristDocs) {
    await prisma.documentTemplate.create({
      data: doc,
    });
  }
  console.log(`  ✓ ${ukTouristDocs.length} document templates`);

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
