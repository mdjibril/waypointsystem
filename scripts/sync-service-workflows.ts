// Loads the starter service routes into the database without touching routes an admin
// has already edited. Safe to run more than once.
//   npx tsx scripts/sync-service-workflows.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { syncDefaultServiceWorkflows } from "../src/lib/serviceTypes";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 5,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

syncDefaultServiceWorkflows(prisma)
  .then(({ createdServices, seededRoutes, retiredServices }) => {
    console.log(`✓ ${createdServices} service types created, ${seededRoutes} routes seeded, ${retiredServices} old service types turned off`);
  })
  .catch((e) => {
    console.error("Sync failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
