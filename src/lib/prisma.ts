import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaVersion?: number };

const PRISMA_CLIENT_VERSION = 4; // Bumped to bust stale in-memory globalThis client

function createPrismaClient() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
  });
  pool.on("error", (err) => {
    console.error("Unexpected pool error:", err);
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma && globalForPrisma.prismaVersion === PRISMA_CLIENT_VERSION
    ? globalForPrisma.prisma
    : (() => {
        const client = createPrismaClient();
        globalForPrisma.prisma = client;
        globalForPrisma.prismaVersion = PRISMA_CLIENT_VERSION;
        return client;
      })();
