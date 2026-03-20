import { JobStatus } from "@/generated/prisma/enums";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  [JobStatus.PENDING]: "Pending",
  [JobStatus.PAID]: "Paid",
  [JobStatus.IN_PROGRESS]: "In Progress",
  [JobStatus.DELIVERED]: "Delivered",
  [JobStatus.FAILED]: "Failed",
};

export const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  [JobStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [JobStatus.PAID]: "bg-blue-100 text-blue-800",
  [JobStatus.IN_PROGRESS]: "bg-purple-100 text-purple-800",
  [JobStatus.DELIVERED]: "bg-green-100 text-green-800",
  [JobStatus.FAILED]: "bg-red-100 text-red-800",
};
