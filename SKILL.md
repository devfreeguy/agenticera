# AgenticEra — Master Project Rules

## What this project is
AgenticEra is a Next.js 14 App Router web app where AI agents hold self-custodial USDT wallets powered by Tether's WDK. Agents earn USDT by completing tasks, pay their own operational costs, and hire other agents autonomously on Polygon mainnet.

## Supplementary skill files
Always read the relevant skill file before working on a specific area:
- skills/ui.md — UI, components, shadcn/ui rules
- skills/functions.md — function modularity and utility rules
- skills/wdk.md — WDK wallet integration rules
- skills/db.md — Prisma + NeonDB rules
- skills/agent.md — agent runtime and execution rules

---

## Tech stack — use EXACTLY these, never substitute
- Framework: Next.js 14 App Router (not Pages Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS + shadcn/ui components
- Database: NeonDB (PostgreSQL) via Prisma ORM
- Wallet SDK: @tetherto/wdk, @tetherto/wdk-wallet-evm, @tetherto/wdk-secret-manager
- AI: Groq SDK (groq-sdk) — model: llama-3.3-70b-versatile
- Auth: MetaMask / WalletConnect (wagmi + viem)
- Chain: Polygon mainnet only
- Token: USDT ERC-20 on Polygon
- IDs: nanoid for all user-generated IDs
- Payment detection: WDK Indexer API (https://wdk-api.tether.io)

---

## Project folder structure — follow exactly
src/
  app/
    api/              — all API route handlers
    (auth)/           — auth pages
    (dashboard)/      — owner dashboard pages
    (client)/         — client-facing pages
    onboarding/       — agent deployment flow
  components/
    ui/               — shadcn/ui components only
    shared/           — reusable custom components
    dashboard/        — dashboard-specific components
    jobboard/         — job board components
  lib/
    prisma.ts         — Prisma client singleton
    wdk.ts            — WDK wallet helpers
    agent-runtime.ts  — agent execution loop
    indexer.ts        — WDK Indexer API calls
    groq.ts           — Groq AI client
  types/
    index.ts          — all shared TypeScript types
  constants/
    index.ts          — all app-wide constants
  hooks/              — custom React hooks
  utils/              — pure utility functions

---

## Environment variables — always use these exact names
DATABASE_URL=
WDK_INDEXER_API_KEY=
GROQ_API_KEY=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_POLYGON_RPC=https://polygon-rpc.com
PLATFORM_BILLING_ADDRESS=
AGENT_ENCRYPTION_KEY=

---

## Hard rules — never violate these
- Never use Supabase — we use NeonDB + Prisma
- Never use the Pages Router
- Never use ethers.js or web3.js directly
- Never use any blockchain other than Polygon
- Never use any token other than USDT for payments
- Never install new packages without being explicitly asked
- Never use console.log — use proper error handling
- Never skip TypeScript types — everything must be typed
- Never use `any` or `unknown` without explicit justification
- Never modify the Prisma schema without being asked
- Never store wallet seed phrases in plaintext anywhere
- Never put wallet private keys in environment variables
- Never hallucinate WDK method names — always read wdk-docs.txt first

---

## WDK documentation files in this project
Always read these before writing any WDK-related code:
- wdk-docs.txt — full WDK documentation
- wdk-index.txt — index of all WDK pages
- wdk-agents-evm.md — EVM wallet module reference
- wdk-agents-btc.md — BTC wallet module reference
- wdk-get-started.md — WDK setup and quickstart