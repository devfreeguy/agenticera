import { z } from "zod";

export const createJobSchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
  agentId: z.string().min(1, "agentId is required"),
  taskDescription: z
    .string()
    .min(1, "taskDescription is required")
    .max(2000, "taskDescription must be 2000 characters or fewer"),
});
