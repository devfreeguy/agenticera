"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import axiosClient from "@/lib/axiosClient";
import { startJobPoll, stopJobPoll, setJobCallbacks } from "@/lib/backgroundPolls";
import { useJobStore } from "@/store/jobStore";
import type { JobWithRelations } from "@/types/index";
import type { JobStatus } from "@/generated/prisma/enums";

interface JobCardProps {
  job: JobWithRelations;
  isNew?: boolean;
  onViewed?: () => void;
  onResumeFlow?: () => void;
}

const STATUS_STYLES: Record<JobStatus, string> = {
  PENDING:
    "bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] text-[#3b82f6]",
  PAID: "bg-[var(--orange-dim)] border border-[var(--orange-border)] text-[var(--orange)]",
  IN_PROGRESS:
    "bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.18)] text-[#fbbf24]",
  DELIVERED:
    "bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-[var(--green)]",
  FAILED:
    "bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.18)] text-[#ef4444]",
};

const STATUS_LABEL: Record<JobStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  IN_PROGRESS: "In progress",
  DELIVERED: "Delivered",
  FAILED: "Failed",
};

export function JobCard({ job, isNew, onViewed, onResumeFlow }: JobCardProps) {
  const [outputOpen, setOutputOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [pollingForRetry, setPollingForRetry] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const updateJob = useJobStore((s) => s.updateJob);
  const status = job.status as JobStatus;

  async function handleRetry() {
    setRetrying(true);
    setRetryError(null);
    try {
      await axiosClient.patch(`/api/jobs/${job.id}`, { status: "PAID" });
      await axiosClient.post(`/api/jobs/${job.id}/run`);
      // Immediately reflect IN_PROGRESS in the store so the card updates now
      updateJob(job.id, { status: "IN_PROGRESS" as JobStatus });
      // Stop any stale poll before starting fresh
      stopJobPoll(job.id);

      setJobCallbacks(job.id, {
        onDelivered: () => setPollingForRetry(false),
        onFailed: () => {
          setPollingForRetry(false);
          setRetryError("Task failed again. Please try again later.");
        },
      });
      startJobPoll(job.id);
      setPollingForRetry(true);
    } catch {
      toast.error("Could not reach server. Check your connection.");
    } finally {
      setRetrying(false);
    }
  }

  function handleViewOutput() {
    onViewed?.();
    setOutputOpen(true);
  }

  return (
    <>
      <div
        className={cn(
          "bg-sidebar border border-(--border-med) rounded-[12px] px-4 py-3.5 flex items-center gap-3 transition-colors hover:border-[rgba(255,255,255,0.17)]",
          status === "FAILED" && !retrying && !pollingForRetry && "opacity-70",
        )}
      >
        {/* Avatar */}
        <div className="relative w-8.5 h-8.5 shrink-0">
          <div className="w-full h-full rounded-[8px] bg-[rgba(99,102,241,0.12)] flex items-center justify-center text-[16px]">
            🤖
          </div>
          {status === "IN_PROGRESS" && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-(--orange) animate-pulse border-2 border-background" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-medium text-muted-foreground mb-0.75">
            {job.agent.name}
          </div>
          <div className="text-[13px] text-foreground truncate whitespace-break-spaces line-clamp-2">
            {job.taskDescription}
          </div>
          <div className="flex items-center gap-2 mt-1.25">
            <span
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full tracking-[.04em]",
                STATUS_STYLES[status],
              )}
            >
              {STATUS_LABEL[status]}
            </span>
            {isNew && status === "DELIVERED" && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full tracking-[.04em] bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] text-(--green)">
                New
              </span>
            )}
            <span className="text-[11px] text-(--hint)">
              {formatRelativeTime(job.createdAt)}
            </span>
          </div>
          {status === "FAILED" && (
            <div className="mt-1 text-[11px] text-muted-foreground font-light leading-[1.5]">
              {retryError ?? "This job failed due to a network error. Your agent will retry automatically, or you can retry manually."}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={cn(
              "font-mono text-[13px] font-medium",
              status === "FAILED" && "text-(--hint)",
            )}
          >
            {parseFloat(job.priceUsdt).toFixed(2)} USDT
          </span>

          {status === "DELIVERED" && (
            <button
              onClick={handleViewOutput}
              className="px-2.75 py-1.25 bg-(--orange-dim) border border-(--orange-border) rounded-[6px] text-[11px] text-(--orange) hover:bg-[rgba(232,121,58,0.18)] transition-colors cursor-pointer"
            >
              View output
            </button>
          )}
          {status === "PENDING" && (
            <button
              onClick={() => {
                if (onResumeFlow) {
                  onResumeFlow();
                } else {
                  setPayOpen(true);
                }
              }}
              className="px-2.75 py-1.25 bg-(--orange-dim) border border-(--orange-border) rounded-[6px] text-[11px] text-(--orange) hover:bg-[rgba(232,121,58,0.18)] transition-colors cursor-pointer"
            >
              Pay now
            </button>
          )}
          {status === "FAILED" && (
            retrying ? (
              <button
                disabled
                className="flex items-center gap-1.5 px-2.75 py-1.25 bg-card border border-(--border-med) rounded-[6px] text-[11px] text-muted-foreground opacity-60 cursor-not-allowed"
              >
                <Loader2 size={11} className="animate-spin" />
                Retrying…
              </button>
            ) : pollingForRetry ? (
              <button
                disabled
                className="flex items-center gap-1.5 px-2.75 py-1.25 bg-card border border-(--border-med) rounded-[6px] text-[11px] text-muted-foreground cursor-not-allowed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-(--orange) animate-pulse shrink-0" />
                Running…
              </button>
            ) : (
              <button
                onClick={handleRetry}
                className="px-2.75 py-1.25 bg-card border border-(--border-med) rounded-[6px] text-[11px] text-muted-foreground hover:text-foreground hover:border-[rgba(255,255,255,0.17)] transition-colors cursor-pointer"
              >
                Retry
              </button>
            )
          )}
          {(status === "IN_PROGRESS" || status === "PAID") && (
            <button
              onClick={handleViewOutput}
              className="px-2.75 py-1.25 bg-card border border-(--border-med) rounded-[6px] text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
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
            <DialogDescription className="line-clamp-2">{job.taskDescription}</DialogDescription>
          </DialogHeader>
          <div className="bg-card border border-border rounded-[10px] p-4 max-h-90 overflow-y-auto">
            {job.output ? (
              job.output.trimStart().startsWith("{") || job.output.trimStart().startsWith("[") ? (
                <pre className="font-mono text-[12px] text-muted-foreground leading-[1.6] whitespace-pre-wrap break-all">
                  {job.output}
                </pre>
              ) : (
                <div className="prose prose-sm prose-invert max-w-none text-[13px] leading-[1.7] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_code]:bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_pre]:bg-secondary [&_pre]:p-3 [&_pre]:rounded-[8px] [&_pre]:overflow-x-auto">
                  <ReactMarkdown>{job.output}</ReactMarkdown>
                </div>
              )
            ) : (
              <p className="text-[13px] text-muted-foreground">No output recorded.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay now dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay agent</DialogTitle>
            <DialogDescription>
              Send exactly{" "}
              <strong>{parseFloat(job.priceUsdt).toFixed(2)} USDT</strong> to
              the agent wallet to start your job.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-card border border-border rounded-[10px] p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-[.06em] mb-2">
              Agent wallet address
            </div>
            <div className="font-mono text-[13px] text-foreground break-all">
              {job.agent.walletAddress}
            </div>
            <button
              onClick={() =>
                navigator.clipboard.writeText(job.agent.walletAddress)
              }
              className="mt-2 text-[11px] text-(--orange) hover:underline cursor-pointer"
            >
              Copy address
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
