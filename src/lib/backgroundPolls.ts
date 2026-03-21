/**
 * Module-level background polling for job completion.
 * Lives outside React so intervals persist across component unmounts.
 */
import axiosClient from "@/lib/axiosClient";
import { useJobStore } from "@/store/jobStore";
import { toast } from "sonner";
import type { JobWithRelations } from "@/types/index";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

interface PollEntry {
  interval: ReturnType<typeof setInterval>;
  startedAt: number;
  isProcessing: boolean;
}

interface PollCallbacks {
  onDelivered?: (job: JobWithRelations) => void;
  onFailed?: (job: JobWithRelations) => void;
}

const polls = new Map<string, PollEntry>();
const callbacks = new Map<string, PollCallbacks>();

async function tick(jobId: string) {
  const entry = polls.get(jobId);
  if (!entry || entry.isProcessing) return;

  if (Date.now() - entry.startedAt > POLL_TIMEOUT_MS) {
    stopJobPoll(jobId);
    return;
  }

  entry.isProcessing = true;
  try {
    const res = await axiosClient.get<{ data: JobWithRelations }>(`/api/jobs/${jobId}`);
    const job = res.data?.data;
    if (!job) return;

    const store = useJobStore.getState();

    if (job.status === "DELIVERED") {
      // Capture callbacks BEFORE stopJobPoll, which deletes them
      const cbs = callbacks.get(jobId);
      stopJobPoll(jobId);
      store.updateJob(jobId, job);
      store.addNewlyDelivered(jobId);
      store.setActiveJobId(null);
      cbs?.onDelivered?.(job);
      // Only show toast if no onDelivered callback (e.g. card not in view)
      if (!cbs?.onDelivered) {
        toast("Task delivered!", {
          description: `${job.agent.name} completed your task.`,
          action: {
            label: "View",
            onClick: () => { window.location.href = "/dashboard"; },
          },
          duration: 8000,
        });
      }
    } else if (job.status === "FAILED") {
      // Capture callbacks BEFORE stopJobPoll, which deletes them
      const cbs = callbacks.get(jobId);
      stopJobPoll(jobId);
      store.updateJob(jobId, job);
      store.setActiveJobId(null);
      cbs?.onFailed?.(job);
      if (!cbs?.onFailed) {
        toast.error("Task failed", {
          description: `${job.agent.name} could not complete your task.`,
          duration: 8000,
        });
      }
    } else {
      store.updateJob(jobId, { status: job.status });
    }
  } catch {
    // transient network error — keep polling
  } finally {
    // Only reset if poll wasn't stopped during processing
    const current = polls.get(jobId);
    if (current) current.isProcessing = false;
  }
}

export function startJobPoll(jobId: string) {
  if (polls.has(jobId)) return; // already running
  // Register entry first so tick() doesn't bail on the immediate call
  const interval = setInterval(() => tick(jobId), POLL_INTERVAL_MS);
  polls.set(jobId, { interval, startedAt: Date.now(), isProcessing: false });
  tick(jobId);
}

export function stopJobPoll(jobId: string) {
  const entry = polls.get(jobId);
  if (entry) {
    clearInterval(entry.interval);
    polls.delete(jobId);
  }
  callbacks.delete(jobId);
}

export function isPolling(jobId: string) {
  return polls.has(jobId);
}

export function setJobCallbacks(jobId: string, cbs: PollCallbacks) {
  callbacks.set(jobId, cbs);
}

export function clearJobCallbacks(jobId: string) {
  callbacks.delete(jobId);
}
