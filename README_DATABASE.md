# Database setup for Supabase

## What was implemented
- Prisma installed and configured for PostgreSQL
- Initial schema created for users, workflow stages, service types, and document templates
- Prisma client helper added at src/lib/prisma.ts
- Initial migration file created at prisma/migrations/20260709120000_init/migration.sql

## Next step for a real Supabase database
1. Create a Supabase project
2. Copy the pooled connection string from Project Settings > Database
3. Set it in the environment as DATABASE_URL
4. Run:
   - npm run db:deploy

## Local development
- Use the Supabase connection string in .env
- Run npm run db:studio to inspect the database
