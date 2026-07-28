# Database Migration & Deployment Checklist

## Pre-Deployment

### 1. Verify migrations are applied to staging

```bash
# On staging server, pull latest code:
git checkout main
git pull origin main

# Check migration status without applying:
npx prisma migrate status

# Apply pending migrations:
npm run db:migrate
```

### 2. Verify environment variables

```bash
# Production/staging .env must have:
DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=no-verify&pgbouncer=true"
MIGRATION_DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

**Do NOT** use the transaction pooler (port 6543) for `MIGRATION_DATABASE_URL` — DDL operations fail on the transaction pooler.

### 3. Verify Prisma client is regenerated

```bash
npm run db:generate    # also runs automatically on npm install via postinstall
```

### 4. Check migration history is clean

```bash
npx prisma migrate status    # should show "Database is up to date" with no pending migrations
npx prisma migrate diff --from-migrations --to-schema-datamodel prisma/schema.prisma
```

This last command should show **no differences**. If it shows changes, run `npx prisma migrate dev --name <name>` first in development.

### 5. Build passes with database models

```bash
npm run build              # ensures Prisma types are generated and compatible
npx tsc --noEmit           # separate type check
npm run lint               # no lint errors
npm test                   # all tests pass (48 total)
```

## Migration Steps (Production)

### 1. Trigger migration on Supabase dashboard (if using Supabase-managed migrations)

Not applicable — we use Prisma Migrate directly.

### 2. Apply migrations manually

```bash
# Option A: deploy (recommended for production — no drift detection, just applies pending)
npm run db:deploy

# Option B: migrate dev (creates a new migration if schema changed)
npm run db:migrate
```

### 3. After migration — verify data integrity

```sql
-- Check table row counts:
SELECT 'users' AS tbl, count(*) FROM users
UNION ALL SELECT 'clients', count(*) FROM clients
UNION ALL SELECT 'applications', count(*) FROM applications
UNION ALL SELECT 'tasks', count(*) FROM tasks
UNION ALL SELECT 'documents', count(*) FROM documents
UNION ALL SELECT 'payments', count(*) FROM payments
UNION ALL SELECT 'application_stage_history', count(*) FROM application_stage_history
UNION ALL SELECT 'activity_log', count(*) FROM activity_log
UNION ALL SELECT 'notifications', count(*) FROM notifications
UNION ALL SELECT 'quality_reviews', count(*) FROM quality_reviews
UNION ALL SELECT 'submission_records', count(*) FROM submission_records
UNION ALL SELECT 'tracking_updates', count(*) FROM tracking_updates;
```

## Rollback Plan

### Creating a rollback migration

If a migration causes issues:

1. Create a new migration that reverses the problematic changes:

```bash
npx prisma migrate dev --name revert-<issue>
```

2. This creates a new migration file in `prisma/migrations/` that undoes the change.

3. Alternatively, restore from a Supabase backup:

   - Go to Supabase Dashboard → Database → Backups
   - Restore to a point-in-time before the migration
   - Re-apply safe migrations on top

### Migration lock

If `migration_lock.toml` gets corrupted:

```bash
rm prisma/migrations/migration_lock.toml
npx prisma migrate resolve
```

## Current Migration History

| Migration | Date | Contents |
|-----------|------|----------|
| `20260709120000_init` | Jul 9 | Initial schema: User model |
| `20260720000000_add_clients` | Jul 20 | Client model with file number, source, status |
| `20260720000001_add_applications` | Jul 20 | Application model linked to client |
| `20260721000000_add_application_stage_history` | Jul 21 | Stage history tracking with changedBy |
| `20260722150245_add_task_model` | Jul 22 | Task model with assignee/assignedBy relations |
| `20260722213002_add_documents_model` | Jul 22 | Document and DocumentTemplate models |
| `20260723000000_add_payment_model` | Jul 23 | Payment model with recordedBy/confirmedBy |
| `20260728000000_add_activity_log_and_notifications` | Jul 28 | ActivityLog and Notification models |
| `20260728000001_add_quality_reviews_submission_records_tracking_updates` | Jul 28 | QualityReview, SubmissionRecord, TrackingUpdate |

## Post-Deployment Verification

- [ ] App loads without errors (`curl http://localhost:3000`)
- [ ] Login flow works with admin user
- [ ] All tabs render (Dashboard, Clients, Applications, Tasks, Documents, Payments)
- [ ] Creating a new client generates a valid file number
- [ ] Creating an application links to the correct client
- [ ] Stage transitions work through the pipeline
- [ ] Task creation and reassignment works
- [ ] Activity log shows on client profile
- [ ] Notifications appear in the bell dropdown
- [ ] Document templates load without 500 errors
- [ ] Payment recording works
- [ ] Quality review submission works

## Regular Maintenance

```bash
# Weekly: verify no migration drift
npx prisma migrate status

# Monthly: review Supabase connection pool usage
# Check Supabase Dashboard → Database → Settings → Connection Pooling

# When adding features: create migration BEFORE writing code that depends on it
npx prisma migrate dev --name <description>
```
