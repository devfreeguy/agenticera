export const USDT_CONTRACT_ADDRESS = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
export const USDT_DECIMALS = 6;
export const USDT_SYMBOL = "USDT";

// AgentEscrow — Base mainnet
export const AGENT_ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "") as `0x${string}`;

export const AGENT_ESCROW_ABI = [
  // createJob — pulls USDT into escrow, returns jobId (NOT payable — no ETH forwarding)
  {
    inputs: [
      { internalType: "address", name: "agent", type: "address" },
      { internalType: "address", name: "usdt",  type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "createJob",
    outputs: [{ internalType: "uint256", name: "jobId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // completeJob — releases escrowed USDT to agent (onlyServer)
  {
    inputs: [{ internalType: "uint256", name: "jobId", type: "uint256" }],
    name: "completeJob",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // refundJob — returns escrowed USDT to client (onlyServer)
  {
    inputs: [{ internalType: "uint256", name: "jobId", type: "uint256" }],
    name: "refundJob",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // forceRefund — emergency escape, callable by anyone after 1-day timeout
  {
    inputs: [{ internalType: "uint256", name: "jobId", type: "uint256" }],
    name: "forceRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // setServerAdmin — set the backend wallet allowed to complete/refund jobs (onlyOwner)
  {
    inputs: [{ internalType: "address", name: "_adminAddress", type: "address" }],
    name: "setServerAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // jobs mapping getter
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "jobs",
    outputs: [
      { internalType: "address",  name: "client",    type: "address"  },
      { internalType: "address",  name: "agent",     type: "address"  },
      { internalType: "address",  name: "usdt",      type: "address"  },
      { internalType: "uint256",  name: "amount",    type: "uint256"  },
      { internalType: "uint256",  name: "createdAt", type: "uint256"  },
      { internalType: "uint8",    name: "status",    type: "uint8"    }, // 0=PENDING, 1=COMPLETED, 2=REFUNDED
    ],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "jobId",  type: "uint256" },
      { indexed: false, internalType: "address", name: "client", type: "address" },
      { indexed: false, internalType: "address", name: "agent",  type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "JobCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "jobId", type: "uint256" }],
    name: "JobCompleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "jobId", type: "uint256" }],
    name: "JobRefunded",
    type: "event",
  },
] as const;
