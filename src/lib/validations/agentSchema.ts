import { z } from "zod";

export const createAgentSchema = z.object({
  ownerId: z.string().min(1, "ownerId is required"),
  name: z.string().min(1, "name is required").max(50, "name must be 50 characters or fewer"),
  systemPrompt: z
    .string()
    .min(1, "systemPrompt is required")
    .max(4000, "systemPrompt must be 4000 characters or fewer"),
  pricePerTask: z.coerce.number().positive("pricePerTask must be a positive number"),
  categories: z.array(z.string()).min(1, "at least one category is required"),
});

export const updateAgentStatusSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED"]),
});

export const updateAgentSettingsSchema = z
  .object({
    status: z.enum(["ACTIVE", "PAUSED"]).optional(),
    systemPrompt: z.string().min(1).max(4000).optional(),
    pricePerTask: z.coerce.number().positive().optional(),
  })
  .refine((obj) => Object.keys(obj).some((k) => obj[k as keyof typeof obj] !== undefined), {
    message: "At least one field is required",
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
