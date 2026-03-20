# AgentEra — Function & Utility Rules

## Core principle
Business logic lives in src/lib/. Pure utilities live in src/utils/. Components and API routes stay thin.

## Naming
- Functions: camelCase, verb-first — formatUsdt, getAgentBalance, sendUsdtPayment
- Boolean functions: is/has/can prefix — isValidAddress, hasEnoughBalance
- Event handlers in components: handle prefix — handleSubmit, handleHire
- Always mark async functions explicitly with async

## Modularity
- One function per file if it is complex or used in 3+ places
- Related simple utilities may be grouped in one file (e.g. all formatting in format.ts)
- Never define business logic inside a React component — extract to a hook or utility
- Never duplicate logic — if the same operation appears twice, extract it

## Types
- Every function has explicit parameter types and return types — no implicit any
- Never use any — use unknown with type guards if the type is genuinely unknown
- All shared types live in src/types/index.ts
- API response types must be defined and exported from src/types/

## Pure utilities (src/utils/)
- No side effects, no API calls, no DB queries
- Covers: formatting USDT amounts, truncating addresses, formatting dates, formatting tx hashes, calculating costs

## Library functions (src/lib/)
- prisma.ts — Prisma client singleton
- wdk.ts — WDK wallet operations
- groq.ts — Groq AI client
- indexer.ts — WDK Indexer API calls
- agent-runtime.ts — agent execution loop
- db/ — one file per Prisma model

## Custom hooks (src/hooks/)
- One hook per file
- Hooks orchestrate state and call lib/ functions — they do not contain business logic
- Never fetch data directly inside a component — use a custom hook or server component

## Constants (src/constants/)
- Never hardcode chain IDs, contract addresses, RPC URLs, category lists, or status labels inline
- Primitive constants: SCREAMING_SNAKE_CASE
- Constant objects/arrays: PascalCase

## API routes
- Each route handler: validate input with zod → call src/lib/db/ or src/lib/wdk/ function → return typed NextResponse
- Authentication check is always the first operation in protected routes
- All async functions use try/catch — never swallow errors silently
- Consistent error response shape across all routes: { error: string, code?: string }