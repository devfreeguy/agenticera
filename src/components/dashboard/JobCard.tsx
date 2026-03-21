"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

function JsonOutput({ raw }: { raw: string }) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return (
      <pre className="font-mono text-[12px] leading-[1.6] whitespace-pre-wrap break-all text-muted-foreground">
        {raw}
      </pre>
    );
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return (
      <dl className="space-y-3">
        {Object.entries(parsed as Record<string, unknown>).map(([key, val]) => (
          <div key={key}>
            <dt className="text-[10px] text-(--hint) uppercase tracking-[.06em] font-medium mb-0.5">{key}</dt>
            <dd className="text-[13px] text-foreground leading-[1.65]">{String(val)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (Array.isArray(parsed)) {
    return (
      <ul className="space-y-1.5 list-disc list-inside">
        {(parsed as unknown[]).map((item, i) => (
          <li key={i} className="text-[13px] text-muted-foreground leading-[1.65]">
            {typeof item === "object" ? JSON.stringify(item, null, 2) : String(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <pre className="font-mono text-[12px] leading-[1.6] whitespace-pre-wrap break-all text-muted-foreground">
      {raw}
    </pre>
  );
}
import { Loader2, ExternalLink, RotateCcw, Banknote, Eye, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/format";
import { getAvatarColor } from "@/utils/avatarColor";
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
import { StarRating } from "@/components/shared/StarRating";
import type { JobWithRelations } from "@/types/index";
import type { JobStatus } from "@/generated/prisma/enums";

interface JobCardProps {
  job: JobWithRelations;
  isNew?: boolean;
  onViewed?: () => void;
  onResumeFlow?: () => void;
}

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; dot: string; badge: string }
> = {
  PENDING: {
    label: "Pending",
    dot: "bg-[#3b82f6]",
    badge: "bg-[rgba(59,130,246,0.1)] border-[rgba(59,130,246,0.2)] text-[#3b82f6]",
  },
  PAID: {
    label: "Paid",
    dot: "bg-(--orange)",
    badge: "bg-(--orange-dim) border-(--orange-border) text-(--orange)",
  },
  IN_PROGRESS: {
    label: "In progress",
    dot: "bg-[#fbbf24] animate-pulse",
    badge: "bg-[rgba(251,191,36,0.08)] border-[rgba(251,191,36,0.2)] text-[#fbbf24]",
  },
  DELIVERED: {
    label: "Delivered",
    dot: "bg-(--green)",
    badge: "bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.2)] text-(--green)",
  },
  FAILED: {
    label: "Failed",
    dot: "bg-[#ef4444]",
    badge: "bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.18)] text-[#ef4444]",
  },
};

export function JobCard({ job, isNew, onViewed, onResumeFlow }: JobCardProps) {
  const [outputOpen, setOutputOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [pollingForRetry, setPollingForRetry] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [refunded, setRefunded] = useState(
    () => job.output === "Refunded by client request.",
  );

  const updateJob = useJobStore((s) => s.updateJob);
  const status = job.status as JobStatus;
  const { label, dot, badge } = STATUS_CONFIG[status];
  const avatarBg = getAvatarColor(job.agentId);
  const initial = job.agent.name.charAt(0).toUpperCase();

  async function handleRetry() {
    setRetrying(true);
    setRetryError(null);
    try {
      await axiosClient.patch(`/api/jobs/${job.id}`, { status: "PAID" });
      await axiosClient.post(`/api/jobs/${job.id}/run`);
      updateJob(job.id, { status: "IN_PROGRESS" as JobStatus });
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

  async function handleRefund() {
    setRefunding(true);
    try {
      await axiosClient.post(`/api/jobs/${job.id}/refund`);
      setRefunded(true);
      toast.success("Refund requested. Funds will be returned to your wallet.");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Refund failed. Please try again.";
      toast.error(msg);
    } finally {
      setRefunding(false);
    }
  }

  function handleViewOutput() {
    onViewed?.();
    setOutputOpen(true);
  }

  const isFailed = status === "FAILED" && !retrying && !pollingForRetry;
  const isInProgress = status === "IN_PROGRESS" || pollingForRetry;

  return (
    <>
      <div
        className={cn(
          "group relative bg-sidebar rounded-[14px] border overflow-hidden transition-all duration-200",
          status === "DELIVERED"
            ? "border-[rgba(34,197,94,0.15)] hover:border-[rgba(34,197,94,0.25)]"
            : isFailed
            ? "border-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.2)] opacity-80"
            : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]"
        )}
      >
        {/* Status left accent */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-[2.5px] transition-opacity duration-200",
            status === "DELIVERED" && "bg-(--green) opacity-60",
            status === "IN_PROGRESS" && "bg-[#fbbf24] opacity-50",
            status === "FAILED" && "bg-[#ef4444] opacity-40",
            status === "PENDING" && "bg-[#3b82f6] opacity-30",
            status === "PAID" && "bg-(--orange) opacity-40",
          )}
        />

        <div className="pl-5 pr-4 py-3.5 flex items-center gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[14px] font-bold font-head text-white"
              style={{ background: avatarBg }}
            >
              {initial}
            </div>
            {isInProgress && (
              <span className="absolute -top-0.75 -right-0.75 w-2.5 h-2.5 rounded-full bg-[#fbbf24] border-2 border-sidebar animate-pulse" />
            )}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-medium text-muted-foreground truncate">
                {job.agent.name}
              </span>
              <span className="text-[rgba(255,255,255,0.15)]">·</span>
              <span className="text-[11px] text-(--hint) shrink-0">
                {formatRelativeTime(job.createdAt)}
              </span>
            </div>
            <div className="text-[13px] text-foreground leading-[1.4] line-clamp-1 mb-1.5">
              {job.taskDescription}
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-[3px] rounded-full border tracking-[.03em]",
                  badge
                )}
              >
                <span className={cn("w-1.25 h-1.25 rounded-full shrink-0", dot)} />
                {label}
              </span>
              {isNew && status === "DELIVERED" && (
                <span className="text-[10px] font-medium px-2 py-[3px] rounded-full bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] text-(--green)">
                  New
                </span>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span
              className={cn(
                "font-mono text-[12px] font-semibold",
                isFailed ? "text-(--hint)" : "text-foreground"
              )}
            >
              {parseFloat(job.priceUsdt).toFixed(2)}{" "}
              <span className="text-[10px] font-normal text-muted-foreground">USDT</span>
            </span>

            {/* Action buttons */}
            {status === "DELIVERED" && (
              <button
                onClick={handleViewOutput}
                className="flex items-center gap-1 px-2.5 py-1.25 bg-(--orange-dim) border border-(--orange-border) rounded-[7px] text-[11px] text-(--orange) hover:bg-[rgba(232,121,58,0.18)] transition-colors cursor-pointer"
              >
                <Eye size={10} strokeWidth={1.8} />
                View
              </button>
            )}

            {status === "PENDING" && (
              <button
                onClick={() => onResumeFlow ? onResumeFlow() : setPayOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.25 bg-(--orange-dim) border border-(--orange-border) rounded-[7px] text-[11px] text-(--orange) hover:bg-[rgba(232,121,58,0.18)] transition-colors cursor-pointer"
              >
                <CreditCard size={10} strokeWidth={1.8} />
                Pay now
              </button>
            )}

            {(status === "IN_PROGRESS" || status === "PAID") && (
              <button
                onClick={handleViewOutput}
                className="flex items-center gap-1 px-2.5 py-1.25 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[7px] text-[11px] text-muted-foreground hover:text-foreground hover:border-[rgba(255,255,255,0.14)] transition-colors cursor-pointer"
              >
                <ExternalLink size={10} strokeWidth={1.8} />
                View task
              </button>
            )}

            {status === "FAILED" && (
              refunded ? (
                <span className="text-[11px] text-(--hint) font-medium">Refunded</span>
              ) : retrying || refunding ? (
                <div className="flex items-center gap-1.25 text-[11px] text-muted-foreground">
                  <Loader2 size={10} className="animate-spin" />
                  {retrying ? "Retrying…" : "Refunding…"}
                </div>
              ) : pollingForRetry ? (
                <div className="flex items-center gap-1.25 text-[11px] text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-(--orange) animate-pulse shrink-0" />
                  Running…
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-1 px-2.5 py-1.25 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[7px] text-[11px] text-muted-foreground hover:text-foreground hover:border-[rgba(255,255,255,0.14)] transition-colors cursor-pointer"
                  >
                    <RotateCcw size={9} strokeWidth={1.8} />
                    Retry
                  </button>
                  <button
                    onClick={handleRefund}
                    className="flex items-center gap-1 px-2.5 py-1.25 bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.18)] rounded-[7px] text-[11px] text-[#ef4444] hover:bg-[rgba(239,68,68,0.12)] transition-colors cursor-pointer"
                  >
                    <Banknote size={9} strokeWidth={1.8} />
                    Refund
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Failed error row */}
        {status === "FAILED" && !refunded && retryError && (
          <div className="mx-5 mb-3 px-3 py-2 rounded-[8px] bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.12)] text-[11px] text-[rgba(239,68,68,0.8)] leading-[1.5]">
            {retryError}
          </div>
        )}
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
                <JsonOutput raw={job.output} />
              ) : (
                <div className="prose prose-sm prose-invert max-w-none text-[13px] leading-[1.7] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_code]:bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_pre]:bg-secondary [&_pre]:p-3 [&_pre]:rounded-[8px] [&_pre]:overflow-x-auto">
                  <ReactMarkdown>{job.output}</ReactMarkdown>
                </div>
              )
            ) : (
              <p className="text-[13px] text-muted-foreground">No output recorded.</p>
            )}
          </div>
          {status === "DELIVERED" && (
            <div className="flex justify-center pt-1">
              <StarRating jobId={job.id} initialRating={job.clientRating} />
            </div>
          )}
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
              onClick={() => navigator.clipboard.writeText(job.agent.walletAddress)}
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
