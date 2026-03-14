import { z } from "zod";

const ethereumAddressRegex = /^0x[0-9a-fA-F]{40}$/;

export const connectSchema = z.object({
  walletAddress: z
    .string()
    .min(1, "walletAddress is required")
    .regex(ethereumAddressRegex, "Invalid Ethereum address"),
});

export const updateRoleSchema = z.object({
  role: z.enum(["OWNER", "CLIENT", "BOTH"]),
});
