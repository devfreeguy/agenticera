"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Plus, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { DeployAgentCard } from "@/components/dashboard/DeployAgentCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { useAgents } from "@/hooks/useAgents";

interface AgentsPanelProps {
  ownerId: string;
}

export function AgentsPanel({ ownerId }: AgentsPanelProps) {
  const { myAgents, isLoadingMyAgents, fetchMyAgents } = useAgents();

  useEffect(() => {
    if (ownerId) fetchMyAgents(ownerId);
  }, [ownerId, fetchMyAgents]);

  // Aggregate stats from agents
  const totalEarned = myAgents.reduce(
    (s, a) => s + parseFloat(a.totalEarned),
    0,
  );
  const totalSpent = myAgents.reduce((s, a) => s + parseFloat(a.totalSpent), 0);
  const netProfit = totalEarned - totalSpent;
  const totalJobs = myAgents.reduce((s, a) => s + a.jobsCompleted, 0);
  const margin =
    totalEarned > 0 ? ((netProfit / totalEarned) * 100).toFixed(1) : "0";
  const activeCount = myAgents.filter((a) => a.status === "ACTIVE").length;

  // --- Loading ---
  if (isLoadingMyAgents) {
    return (
      <div>
        <div className="grid grid-cols-4 max-[900px]:grid-cols-2 gap-2.5 mb-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-22 rounded-[14px]" />
          ))}
        </div>
        <div className="grid grid-cols-2 max-[900px]:grid-cols-1 gap-2.75 mb-5.5">
          <Skeleton className="h-55 rounded-[14px]" />
          <Skeleton className="h-55 rounded-[14px]" />
        </div>
      </div>
    );
  }

  // --- Empty ---
  if (!isLoadingMyAgents && myAgents.length === 0) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center py-13 px-6 text-center border border-dashed border-(--border-med) rounded-[14px] mb-5.5">
          <div className="text-[30px] mb-3.5 opacity-45">🤖</div>
          <h3 className="font-head text-[15px] font-semibold mb-1.75">
            No agents deployed yet
          </h3>
          <p className="text-[13px] text-muted-foreground leading-[1.65] max-w-65 mb-5 font-light">
            Deploy your first agent and give it a self-custodial USDT wallet. It
            will start earning from the job board within minutes.
          </p>
          <Link
            href="/agents/new"
            className="inline-flex items-center gap-1.5 bg-(--orange) text-white text-[13px] font-medium px-4 py-2.25 rounded-[8px] hover:opacity-90 transition-opacity no-underline"
          >
            <Plus size={13} strokeWidth={1.5} />
            Deploy your first agent
          </Link>
        </div>
        <ActivityFeed agents={[]} />
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="w-full grid grid-cols-4 max-[900px]:grid-cols-2 gap-2.5 mb-5">
        <StatCard
          label="Total earned"
          value={totalEarned.toFixed(2)}
          unit="USDT"
          variant="green"
        />
        <StatCard
          label="Total spent"
          value={totalSpent.toFixed(2)}
          unit="USDT"
          variant="orange"
        />
        <StatCard
          label="Net profit"
          value={netProfit.toFixed(2)}
          unit="USDT"
          sub={<span>{margin}% margin</span>}
          variant="neutral"
        />
        <StatCard
          label="Jobs completed"
          value={totalJobs.toLocaleString()}
          unit="tasks"
          variant="blue"
        />
      </div>

      {/* Section header */}
      <div className="w-full flex items-center justify-between mb-3">
        <h2 className="font-head text-[14px] font-semibold flex items-center gap-1">
          My agents
          <span className="font-mono text-[11px] text-(--hint) ml-1">
            {activeCount} active
          </span>
        </h2>
      </div>

      {/* Agent grid */}
      <div className="w-full grid grid-cols-2 max-[900px]:grid-cols-1 xl:grid-cols-3 2xl:grid-cols-4  gap-2.75 mb-5.5">
        {myAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
        <DeployAgentCard />
      </div>

      <ActivityFeed agents={myAgents} />
    </div>
  );
}
