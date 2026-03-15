"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatAddress } from "@/utils/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { JobWithRelations } from "@/types/index";
import type { JobStatus } from "@/generated/prisma/enums";

interface JobCardProps {
  job: JobWithRelations;
}

const STATUS_STYLES: Record<JobStatus, string> = {
  PENDING_PAYMENT: "bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] text-[#3b82f6]",
  PAID: "bg-[var(--orange-dim)] border border-[var(--orange-border)] text-[var(--orange)]",
  IN_PROGRESS: "bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.18)] text-[#fbbf24]",
  DELIVERED: "bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-[var(--green)]",
  FAILED: "bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.18)] text-[#ef4444]",
};

const STATUS_LABEL: Record<JobStatus, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  IN_PROGRESS: "In progress",
  DELIVERED: "Delivered",
  FAILED: "Failed",
};

export function JobCard({ job }: JobCardProps) {
  const router = useRouter();
  const [outputOpen, setOutputOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const status = job.status as JobStatus;

  return (
    <>
      <div
        className={cn(
          "bg-sidebar border border-[var(--border-med)] rounded-[12px] px-4 py-3.5 flex items-center gap-3 transition-colors hover:border-[rgba(255,255,255,0.17)]",
          status === "FAILED" && "opacity-70"
        )}
      >
        {/* Avatar */}
        <div className="w-[34px] h-[34px] rounded-[8px] bg-[rgba(99,102,241,0.12)] flex items-center justify-center text-[16px] flex-shrink-0">
          🤖
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-medium text-muted-foreground mb-[3px]">
            {job.agent.name}
          </div>
          <div className="text-[13px] text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
            {job.taskDescription}
          </div>
          <div className="flex items-center gap-2 mt-[5px]">
            <span className={cn("text-[10px] font-medium px-2 py-[2px] rounded-full tracking-[.04em]", STATUS_STYLES[status])}>
              {STATUS_LABEL[status]}
            </span>
            <span className="text-[11px] text-[var(--hint)]">
              {formatRelativeTime(job.createdAt)}
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={cn("font-mono text-[13px] font-medium", status === "FAILED" && "text-[var(--hint)]")}>
            {parseFloat(job.priceUsdt).toFixed(2)} USDT
          </span>

          {status === "DELIVERED" && (
            <button
              onClick={() => setOutputOpen(true)}
              className="px-[11px] py-[5px] bg-[var(--orange-dim)] border border-[var(--orange-border)] rounded-[6px] text-[11px] text-[var(--orange)] hover:bg-[rgba(232,121,58,0.18)] transition-colors cursor-pointer"
            >
              View output
            </button>
          )}
          {status === "PENDING_PAYMENT" && (
            <button
              onClick={() => setPayOpen(true)}
              className="px-[11px] py-[5px] bg-[var(--orange-dim)] border border-[var(--orange-border)] rounded-[6px] text-[11px] text-[var(--orange)] hover:bg-[rgba(232,121,58,0.18)] transition-colors cursor-pointer"
            >
              Pay now
            </button>
          )}
          {status === "FAILED" && (
            <button
              onClick={() => router.push("/jobs")}
              className="px-[11px] py-[5px] bg-card border border-[var(--border-med)] rounded-[6px] text-[11px] text-muted-foreground hover:text-foreground hover:border-[rgba(255,255,255,0.17)] transition-colors cursor-pointer"
            >
              Retry
            </button>
          )}
          {(status === "IN_PROGRESS" || status === "PAID") && (
            <button className="px-[11px] py-[5px] bg-card border border-[var(--border-med)] rounded-[6px] text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              View task
            </button>
          )}
        </div>
      </div>

      {/* Output dialog */}
      <Dialog open={outputOpen} onOpenChange={setOutputOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Job output</DialogTitle>
            <DialogDescription>{job.taskDescription}</DialogDescription>
          </DialogHeader>
          <div className="bg-card border border-border rounded-[10px] p-4 text-[13px] text-foreground leading-[1.7] max-h-[360px] overflow-y-auto whitespace-pre-wrap font-mono">
            {job.output ?? "No output recorded."}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay now dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay agent</DialogTitle>
            <DialogDescription>
              Send exactly <strong>{parseFloat(job.priceUsdt).toFixed(2)} USDT</strong> to the agent wallet to start your job.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-card border border-border rounded-[10px] p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-[.06em] mb-2">Agent wallet address</div>
            <div className="font-mono text-[13px] text-foreground break-all">{job.agent.walletAddress}</div>
            <button
              onClick={() => navigator.clipboard.writeText(job.agent.walletAddress)}
              className="mt-2 text-[11px] text-[var(--orange)] hover:underline cursor-pointer"
            >
              Copy address
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
