"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import { JobCard } from "@/components/dashboard/JobCard";
import { AgentSlideOver } from "@/components/jobs/AgentSlideOver";
import { useJobs } from "@/hooks/useJobs";
import { useJobStore } from "@/store/jobStore";
import { useUser } from "@/hooks/useUser";
import type { JobWithRelations } from "@/types/index";

interface JobsPanelProps {
  walletAddress: string;
}

export function JobsPanel({ walletAddress }: JobsPanelProps) {
  const { myJobs, isLoadingJobs, fetchMyJobs } = useJobs();
  const { newlyDeliveredIds, markJobViewed } = useJobStore();
  const { user } = useUser();
  const [resumeJob, setResumeJob] = useState<JobWithRelations | null>(null);

  useEffect(() => {
    if (walletAddress) fetchMyJobs(walletAddress);
  }, [walletAddress, fetchMyJobs]);

  const totalJobs = myJobs.length;
  const active = myJobs.filter((j) => j.status === "IN_PROGRESS" || j.status === "PAID").length;
  const completed = myJobs.filter((j) => j.status === "DELIVERED").length;
  const totalSpent = myJobs
    .filter((j) => j.status === "DELIVERED" || j.status === "IN_PROGRESS" || j.status === "PAID")
    .reduce((s, j) => s + parseFloat(j.priceUsdt), 0);
  const completionRate = totalJobs > 0 ? ((completed / totalJobs) * 100).toFixed(0) : "0";

  // --- Loading ---
  if (isLoadingJobs) {
    return (
      <div>
        <div className="grid grid-cols-4 max-[900px]:grid-cols-2 gap-2.5 mb-5">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-22 rounded-[14px]" />)}
        </div>
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className={`h-19 rounded-[12px] ${i === 3 ? "w-4/5" : ""}`} />
          ))}
        </div>
      </div>
    );
  }

  // --- Empty ---
  if (!isLoadingJobs && myJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-13 px-6 text-center border border-dashed border-(--border-med) rounded-[14px] mb-5.5">
        <div className="text-[30px] mb-3.5 opacity-45">💼</div>
        <h3 className="font-head text-[15px] font-semibold mb-1.75">No jobs yet</h3>
        <p className="text-[13px] text-muted-foreground leading-[1.65] max-w-65 mb-5 font-light">
          Browse the job board and hire an agent for your first task. Pay in USDT and receive completed work in minutes.
        </p>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 bg-(--orange) text-white text-[13px] font-medium px-4 py-2.25 rounded-[8px] hover:opacity-90 transition-opacity no-underline"
        >
          <Share2 size={13} strokeWidth={1.4} />
          Browse the job board
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* Stats */}
      <div className="w-full grid grid-cols-4 max-[900px]:grid-cols-2 gap-2.5 mb-5">
        <StatCard label="Total jobs" value={String(totalJobs)} unit="all time" variant="neutral" />
        <StatCard label="Active" value={String(active)} unit="in progress" variant="orange" />
        <StatCard
          label="Completed"
          value={String(completed)}
          unit="delivered"
          sub={<span>{completionRate}% rate</span>}
          variant="green"
        />
        <StatCard label="Total spent" value={totalSpent.toFixed(2)} unit="USDT" variant="orange" />
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-head text-[14px] font-semibold">My jobs</h2>
      </div>

      {/* Jobs list */}
      <div className="flex flex-col gap-2 mb-5.5">
        {myJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isNew={newlyDeliveredIds.includes(job.id)}
            onViewed={() => markJobViewed(job.id)}
            onResumeFlow={() => setResumeJob(job)}
          />
        ))}
      </div>

      <AgentSlideOver
        agent={resumeJob?.agent || null}
        open={!!resumeJob}
        onClose={() => setResumeJob(null)}
        user={user}
        onJobAdded={() => {}}
        showToast={(msg) => console.log(msg)}
        initialStep="review"
        initialJobId={resumeJob?.id}
        initialTaskDescription={resumeJob?.taskDescription}
      />
    </div>
  );
}
