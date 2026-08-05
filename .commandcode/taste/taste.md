# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# workflow
- Work on feature branches, verify everything works, then merge to main before proceeding to the next task sequentially. Confidence: 0.75

# documentation
- In test plans, include the full, copy-pasteable CLI commands (e.g., curl, npm run) for every test step instead of just describing what to verify. Confidence: 0.65
- Consult plan.md for development guidelines when working on features. Confidence: 0.65
- After completing each task, write the test flow in test.md. Confidence: 0.75
- Test plan sections should map 1:1 to the tasks listed in tasks.md — do not combine multiple tasks into a single test section. Confidence: 0.65

# testing
- Prefer UI-based test steps over CLI/curl-based test steps in test plans. Confidence: 0.60
- In test.md, include a manual step-by-step walkthrough from inquiry to decision (register client, create application, move through all pipeline stages) that a tester can follow hands-on, even when seeded data verification steps also exist. Confidence: 0.70

# database
- Use a shared pg.Pool (max 5) with the PrismaPg adapter instead of passing a raw connection string, to avoid exhausting Supabase's 15-connection session pool limit. Confidence: 0.70
- When connecting to the Supabase transaction pooler (port 6543), set ssl: { rejectUnauthorized: false } in the pg.Pool config — the pooler uses self-signed certs and sslmode=no-verify in the connection string doesn't reliably pass through to pg.Pool. Confidence: 0.70
- For Prisma migrations and DDL operations, use the Supabase session pooler (port 5432) with sslmode=require — the transaction pooler (port 6543) breaks DDL and sslmode=no-verify causes connection hangs. Confidence: 0.70

# debugging
- When making multiple code changes, verify incrementally with typecheck/build after each change instead of batch-applying many edits at once, to avoid cascading errors that are hard to trace. Confidence: 0.70
- Before wiring a new frontend feature to an API endpoint, verify the endpoint supports the required HTTP method (e.g., check that a POST handler exists before calling fetch with method: "POST"). Confidence: 0.70

# document-templates
- Support global document templates that apply to ALL service types (e.g., "Valid Passport") so they don't need to be duplicated across individual service types. Confidence: 0.75

