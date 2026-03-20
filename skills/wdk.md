# AgenticEra — WDK Rules

## Reference docs
Before writing any WDK-related code, read these files in the project root:
- wdk-docs.txt — full WDK API reference
- wdk-index.txt — module index and overview
- wdk-agents-evm.md — EVM wallet creation, signing, sending
- wdk-get-started.md — initialization and setup

Never guess WDK method names or signatures — always look them up in these files first.

## Packages
- @tetherto/wdk — core
- @tetherto/wdk-wallet-evm — EVM wallet operations
- @tetherto/wdk-secret-manager — encrypted seed phrase storage

## Wallet rules
- Every agent gets its own self-custodial EVM wallet generated at deploy time
- Wallet creation, signing, and sending happen server-side only — never in browser/client code
- After wallet creation: store walletAddress in DB, store encrypted seed phrase in DB
- Use @tetherto/wdk-secret-manager with AGENT_ENCRYPTION_KEY for encryption
- Never log, expose, or transmit the raw seed phrase — only the encrypted form is ever stored
- Never expose seed phrases or private keys to the client under any circumstance

## Chain and token
- Chain: Polygon mainnet only (chainId 137)
- RPC: NEXT_PUBLIC_POLYGON_RPC env var
- Token: USDT ERC-20 on Polygon — decimals are 6
- Never hardcode chain ID, RPC URL, or contract address — always import from src/constants/

## WDK Indexer
- Base URL: https://wdk-api.tether.io
- Auth via WDK_INDEXER_API_KEY — server-side only, never expose to client
- All Indexer calls live in src/lib/indexer.ts — never call Indexer directly from routes or components
- Poll for payment confirmation at max 5-second intervals with a 10-minute timeout
- Always handle Indexer errors gracefully — transient failures must not crash the job flow

## Payment flow rules
- Client pays directly to the agent's WDK wallet address on-chain
- Payment detection via WDK Indexer polling — never trust client-reported amounts or tx hashes
- Always verify payment on-chain before updating job status to PAID
- Agent-to-agent payments: parent agent signs and sends USDT from its own WDK wallet to sub-agent wallet
- Withdrawals: agent owner withdraws USDT from agent wallet to their own MetaMask address via WDK send

## Security
- WDK_INDEXER_API_KEY and AGENT_ENCRYPTION_KEY are server-side only — no NEXT_PUBLIC_ prefix
- Rate limit all routes that trigger wallet operations
- Never allow the client to specify payment amount — always verify the on-chain amount via Indexer

## src/lib/wdk.ts responsibilities
- createAgentWallet — generate wallet, return address and encrypted seed
- getAgentBalance — return current USDT balance as string
- sendUsdt — send USDT from agent wallet to an address, return tx hash
- verifyPayment — confirm a payment arrived at a wallet for an expected amount
- decryptAgentSeed — decrypt stored seed phrase for signing operations

## src/lib/indexer.ts responsibilities
- pollForPayment — poll until expected USDT arrives or timeout
- getUsdtBalance — get current USDT balance of a wallet address
- getTransaction — fetch details of a specific tx hash