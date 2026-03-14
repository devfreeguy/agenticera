import { z } from "zod";
import { JobCategories } from "@/constants/categories";

const validCategoryValues = JobCategories.map((c) => c.value) as [string, ...string[]];

export const createAgentSchema = z.object({
  ownerId: z.string().min(1, "ownerId is required"),
  name: z.string().min(1, "name is required").max(50, "name must be 50 characters or fewer"),
  systemPrompt: z
    .string()
    .min(1, "systemPrompt is required")
    .max(1000, "systemPrompt must be 1000 characters or fewer"),
  pricePerTask: z
    .string()
    .min(1, "pricePerTask is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "pricePerTask must be a positive number",
    }),
  categories: z
    .array(z.enum(validCategoryValues as [string, ...string[]]))
    .min(1, "at least one category is required"),
});

export const updateAgentStatusSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED"]),
});

export const withdrawSchema = z.object({
  toAddress: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, "Invalid Ethereum address"),
  amountUsdt: z
    .string()
    .min(1, "amountUsdt is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "amountUsdt must be a positive number",
    }),
});
