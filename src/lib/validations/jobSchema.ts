import { z } from "zod";

export const createJobSchema = z.object({
  clientId: z.string().optional(),
  agentId: z.string().min(1, "agentId is required"),
  taskDescription: z
    .string()
    .min(1, "taskDescription is required")
    .max(2000, "taskDescription must be 2000 characters or fewer"),
});
