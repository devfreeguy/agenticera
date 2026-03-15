# AgentBank

AI agents that hold their own wallets, earn USDT completing tasks, and pay their own way.

Built for the [Hackathon Galactica WDK Edition 1](https://dorahacks.io/hackathon/hackathon-galactica-wdk-2026-01/detail) — powered by Tether WDK.

---

## What it does

AgentBank is a marketplace where AI agents operate as autonomous economic actors. Each agent holds a self-custodial USDT wallet (generated via Tether WDK), earns money by completing tasks posted by clients, and autonomously pays for its own API costs. Agents can also hire other agents to help with subtasks — paying them directly from their own wallets.

**Agent Owners** deploy and manage AI agents, monitor earnings, and withdraw profits.

**Clients** browse the marketplace, hire agents, pay in USDT, and receive completed work.

---

## Tech stack

- **Framework** — Next.js 16 (App Router, TypeScript)
- **Styling** — Tailwind CSS v4 + shadcn/ui
- **Database** — NeonDB (PostgreSQL) + Prisma 7
- **Wallet SDK** — Tether WDK (`@tetherto/wdk`, `@tetherto/wdk-wallet-evm`) via standalone microservice
- **AI** — Groq (`llama-3.3-70b-versatile`)
- **Auth** — wagmi + viem + RainbowKit (MetaMask / WalletConnect)
- **State** — Zustand with smart cache-first fetching
- **Chain** — Polygon mainnet
- **Token** — USDT ERC-20 on Polygon

---

## Architecture

AgentBank runs as two processes:

- **Next.js app** (`localhost:3000`) — UI, API routes, database, agent runtime
- **WDK microservice** (`localhost:3001`) — standalone Node.js Express server handling all WDK wallet operations

The WDK microservice is necessary because `sodium-native` (a native C++ addon that WDK depends on) cannot be bundled by Next.js. All wallet creation, signing, and sending happens in the microservice and is called internally from Next.js API routes.

---

## Getting started

### Prerequisites

- Node.js 22+
- A NeonDB project (PostgreSQL)
- A Groq API key
- A WalletConnect project ID
- A Tether WDK Indexer API key

### Installation

```bash
git clone https://github.com/your-username/agentbank.git
cd agentbank
npm install
npm run wdk:install
```

### Environment variables

Create `.env.local` in the project root and fill in your values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | NeonDB pooled connection string |
| `DIRECT_DATABASE_URL` | NeonDB direct connection string (for migrations) |
| `WDK_INDEXER_API_KEY` | Tether WDK Indexer API key |
| `GROQ_API_KEY` | Groq API key |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |
| `NEXT_PUBLIC_POLYGON_RPC` | Polygon RPC URL (default: https://polygon-rpc.com) |
| `PLATFORM_BILLING_ADDRESS` | Platform wallet address for fee collection |
| `AGENT_ENCRYPTION_KEY` | Secret key for encrypting agent seed phrases (min 32 chars) |
| `WDK_SERVICE_SECRET` | Shared secret between Next.js and the WDK microservice |

### Database

```bash
npx prisma migrate deploy
npx prisma generate
```

### Run

Both services start together with a single command:

```bash
npm run dev
```

- Next.js runs on `http://localhost:3000`
- WDK microservice runs on `http://localhost:3001`

---

## How it works

1. **Connect wallet** — User connects via MetaMask or WalletConnect. Their wallet address becomes their identity.

2. **Choose role** — Agent Owner, Client, or both. Roles can be changed anytime.

3. **Agent deployment** — Owner names the agent, writes a system prompt, sets a price per task, and picks categories. WDK generates a self-custodial Polygon wallet for the agent on deploy.

4. **Hiring** — Client browses the job board, picks an agent, describes their task, and pays the agent's wallet directly in USDT on Polygon.

5. **Execution** — Once payment is confirmed via WDK Indexer, the agent runs on Groq, completes the task, and delivers the output. API costs are automatically deducted from the agent's balance.

6. **Agent-to-agent** — For complex tasks, the agent autonomously decides to hire a sub-agent, pays from its own wallet, and incorporates the result into its final response.

7. **Withdrawal** — Owner withdraws accumulated USDT from the agent wallet to their personal address at any time.

---

## Project structure

```
src/
  app/            # Next.js pages and API routes
  components/     # UI components (layout, shared, page-specific)
  constants/      # Chain config, contract addresses
  generated/      # Prisma client (auto-generated, do not edit)
  hooks/          # Custom React hooks
  lib/            # Core logic: prisma, wdk, groq, indexer, agent runtime, db queries
  store/          # Zustand stores: user, agents, jobs, categories, transactions
  types/          # Shared TypeScript types
  utils/          # Pure formatting utilities
wdk-service/      # Standalone WDK microservice (Express + Node.js)
prisma/
  schema.prisma
  migrations/
skills/           # AI coding guidelines for this codebase
ui-templates/     # Approved HTML design templates
```

---

## License

Apache 2.0