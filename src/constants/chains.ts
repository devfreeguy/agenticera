export const BASE_CHAIN_ID = 8453;
 
export const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC!;
 
export const BASE_CHAIN = {
  chainId: BASE_CHAIN_ID,
  name: "Base",
  rpc: BASE_RPC_URL,
  blockExplorer: "https://basescan.org",
} as const;
