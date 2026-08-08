# Way Point Travel — Visa & Workflow Management System

Internal platform for managing client inquiries, visa applications, document checklists, payments, quality reviews, and submission tracking through a stage-based workflow pipeline.

## Prerequisites

- Node.js 20+
- PostgreSQL (Supabase recommended)
- npm

## Quick Start (Development)

```bash
npm install
cp .env.example .env   # then fill in your Supabase connection strings
npx prisma generate
npx prisma migrate dev
npm run dev             # starts at http://localhost:3000
```

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | Supabase transaction pooler (port 6543) — used at runtime | Yes |
| `MIGRATION_DATABASE_URL` | Supabase session pooler (port 5432) — used by `prisma migrate` | For migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key | Yes |
| `NODE_ENV` | Set to `production` in deployed environments | For prod |

### Why two database URLs?

Supabase provides two poolers:

- **Transaction pooler (port 6543):** Used at runtime. Handles high-concurrency short-lived queries. Set as `DATABASE_URL`.
- **Session pooler (port 5432):** Required for Prisma migrations and DDL operations. Set as `MIGRATION_DATABASE_URL`.

The `prisma.config.ts` file picks `MIGRATION_DATABASE_URL` first, falling back to `DATABASE_URL`, so you don't need to swap URLs manually when running migrations.

### Connection pools

The app uses a shared `pg.Pool` (max 5 connections) with the `PrismaPg` adapter to avoid exhausting Supabase's connection limits. SSL is enforced (`rejectUnauthorized: false` for the transaction pooler's self-signed certs).

## Database Setup

```bash
# Generate Prisma client (also runs on postinstall)
npm run db:generate

# Apply migrations (uses MIGRATION_DATABASE_URL if set)
npm run db:migrate

# Seed reference data (admin user, workflow stages, templates)
npm run db:seed

# Open Prisma Studio for visual inspection
npm run db:studio
```

## Production Build

```bash
npm run build    # creates .next/ production build
npm run start    # starts the production server on port 3000
```

The build output is a standalone Next.js application — no special infrastructure needed beyond a Node.js runtime and access to your Supabase database.

## Deployment

### Vercel (Recommended)

1. Push this repo to GitHub
2. Import the project in Vercel
3. Set the environment variables listed above in Vercel's project settings
4. Deploy — Vercel auto-detects Next.js

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY .next ./.next
COPY public ./public
COPY next.config.ts ./
EXPOSE 3000
CMD ["npm", "start"]
```

Build the image after running `npm run build` locally:

```bash
npm run build
docker build -t waypoint .
docker run -p 3000:3000 --env-file .env waypoint
```

### Bare Metal / VPS

```bash
npm ci --omit=dev
npm run build
npx prisma generate
npx prisma migrate deploy
npm run start
```

Use a process manager (PM2, systemd) to keep the server running:

```bash
npm install -g pm2
pm2 start npm --name "waypoint" -- start
pm2 save
pm2 startup
```

## Auth

Authentication uses a mock cookie-based system (`mock-auth-user` cookie → DB lookup). In production, replace `src/lib/auth.ts` with a real auth provider (NextAuth.js, Supabase Auth, Clerk, etc.). The current implementation is designed to be swapped without touching any route handlers.

## Permissions

All permission checks live in `src/lib/permissions.ts` as pure functions (role/ID in, boolean out). No DB calls — fully unit-tested. Key rules:

- **ADMIN** can do everything
- **STAFF** can only access/view assigned clients and their own tasks
- **Pipeline transitions** — assigned STAFF can move their own clients through the pipeline, except for **sensitive stages** (`DECISION`, `APPLICATION_SUBMISSION`, `QUALITY_REVIEW`) which remain ADMIN-only. Staff can still add same-stage notes on sensitive stages.
- Document verification, payment confirmation, and quality review decisions are admin-only

## Testing

```bash
npm test                # run all tests (vitest)
npm run test:watch      # watch mode
```

Test suites:

| File | Type | Count |
|------|------|-------|
| `tests/permissions.test.ts` | Unit | 23 |
| `tests/workflow.test.ts` | Unit | 20 |
| `tests/integration.test.ts` | Integration | 17 |

## Project Structure

```
src/
  app/
    api/            # Route handlers (clients, tasks, applications, documents, payments, auth, staff)
    page.tsx         # Single-page app shell with tab navigation
  lib/
    auth.ts          # Cookie-based auth helper
    permissions.ts   # Pure permission functions
    workflow.ts      # Stage order, transition rules, decision mapping
    prisma.ts        # Singleton Prisma client with pg.Pool
    activityLog.ts   # Activity log helper
    notifications.ts # In-app notification helper
  types/             # TypeScript type definitions
prisma/
  schema.prisma      # Database schema
  migrations/        # Migration history
  seed.ts            # Seed script
tests/               # Vitest test files
```

## Maintenance

- **Database migrations:** Create with `npx prisma migrate dev --name <name>`, apply in prod with `npm run db:deploy`
- **Type checking:** `npx tsc --noEmit`
- **Linting:** `npm run lint`
