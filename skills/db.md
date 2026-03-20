# AgenticEra — Database Rules (Prisma 7 + NeonDB)

## Stack
- Prisma 7 with @prisma/adapter-pg + pg driver
- NeonDB (PostgreSQL serverless)
- Schema: prisma/schema.prisma
- Config: prisma.config.ts (project root)
- Generated client: src/generated/prisma/

---

## Prisma 7 config rules
- DATABASE_URL goes in prisma.config.ts, NOT in schema.prisma — putting url in the datasource block throws P1012 in v7
- prisma.config.ts datasource should use DIRECT_DATABASE_URL (unpooled) for migrations
- Runtime PrismaClient (src/lib/prisma.ts) uses DATABASE_URL (pooled) via pg Pool
- Always import PrismaClient and enums from ../generated/prisma — never from @prisma/client
- Always pass a PrismaPg adapter instance to the PrismaClient constructor — v7 requires it

## Schema rules
- Generator provider is "prisma-client" with output = "../src/generated/prisma"
- datasource block has provider only — no url field
- All IDs: @default(cuid())
- All monetary amounts: Decimal @db.Decimal(18, 6) for USDT precision
- All models have createdAt @default(now()) and updatedAt @updatedAt
- Never use @map() on enum values — there is an active bug in Prisma 7 that makes mapped enums generate unusable TypeScript types
- Add @@index on all foreign keys and frequently queried fields

## Query rules
- All DB queries live in src/lib/db/ — one file per model (users.ts, agents.ts, jobs.ts, transactions.ts, subJobs.ts)
- Never write Prisma queries directly in API route handlers — always call a src/lib/db/ function
- Always use select: {} to return only needed fields — never return the full model
- Never return encryptedSeedPhrase to the client under any circumstance
- Use prisma.$transaction() for operations that must be atomic

## Migration rules
- Run migrations with: npx prisma migrate dev --name description
- Run npx prisma generate after every schema change
- Never edit migration files after they are committed
- The --url and --from-url flags are removed in Prisma 7 — do not use them