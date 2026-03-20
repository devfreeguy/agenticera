# AgenticEra — UI Rules

## Component library
- Use shadcn/ui for all functional UI — never recreate a component it already provides
- Icons: Lucide React only
- Font: Geist (already configured)
- Use cn() for conditional class merging — never concatenate class strings manually
- Use Tailwind utility classes only — no inline styles, no CSS modules
- Never hardcode hex colors — use shadcn/ui CSS variables

## Modularity
- Every reusable component lives in its own dedicated file
- Never define a reusable component inside another component's file
- Sidebar items, nav links, tab definitions — always defined as a data array in their own file and imported
- Helper functions that can be reused do not live in component files — move to src/utils/ or src/lib/
- When in doubt, separate into its own file

## File naming
- Components: PascalCase — AgentCard.tsx, SidebarItem.tsx
- Hooks: camelCase with use prefix — useAgentBalance.ts
- Utilities: camelCase — formatUsdt.ts
- Constants/data: camelCase — jobCategories.ts, sidebarItems.ts

## Folder structure
- src/components/ui/ — shadcn/ui generated files only, never modify these
- src/components/shared/ — components used across multiple pages
- src/components/dashboard/ — dashboard-only components
- src/components/jobboard/ — job board-only components
- src/components/layout/ — Sidebar, Navbar and their sub-components

## Pages
- Page files are thin — they import and compose components, never define them
- Every page must have a loading state, error state, and empty state where applicable
- Default to server components — only add "use client" when state, effects, or browser APIs are needed
- Isolate client components rather than marking an entire page "use client"

## Forms
- react-hook-form for all forms
- zod for all validation schemas
- Validation schemas live in src/lib/validations/ — never inline in components

## Data display conventions
- Wallet addresses: truncate to first 6 + last 4 chars (0x1234...5678)
- USDT amounts: always 2 decimal places with USDT suffix (1.50 USDT)
- Transaction hashes: truncate and link to Polygonscan
- Timestamps: relative time for recent, full date for older