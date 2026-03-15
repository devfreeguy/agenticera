"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { AgentsPanel } from "@/components/dashboard/AgentsPanel";
import { JobsPanel } from "@/components/dashboard/JobsPanel";
import { MobileNav } from "@/components/dashboard/MobileNav";

type Tab = "agents" | "jobs";

export default function DashboardPage() {
  const { user, address, isConnected, isHydrated, hydrated } = useUser();
  const router = useRouter();
  const role = user?.role;

  // Default tab based on role
  const defaultTab: Tab =
    role === "CLIENT" ? "jobs" : "agents";
  const [tab, setTab] = useState<Tab>(defaultTab);

  // Sync tab when role loads
  useEffect(() => {
    if (role === "CLIENT") setTab("jobs");
    else if (role === "OWNER" || role === "BOTH") setTab("agents");
  }, [role]);

  // Wait for wagmi to rehydrate before acting on isConnected
  useEffect(() => {
    if (isHydrated && !isConnected) router.replace("/connect");
  }, [isHydrated, isConnected, router]);

  // Show full-page skeleton while wagmi is still reconnecting
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="hidden min-[900px]:flex w-60 shrink-0 border-r border-border flex-col p-4 gap-3">
          <div className="h-8 w-32 rounded-lg bg-secondary animate-pulse" />
          <div className="flex-1 space-y-2 mt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-9 rounded-[8px] bg-secondary animate-pulse" />
            ))}
          </div>
          <div className="h-10 rounded-full bg-secondary animate-pulse" />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-14 border-b border-border px-6.5 flex items-center gap-3">
            <div className="h-6 w-40 rounded-md bg-secondary animate-pulse" />
            <div className="ml-auto h-8 w-28 rounded-lg bg-secondary animate-pulse" />
          </div>
          <div className="px-6.5 py-5.5 space-y-5">
            <div className="grid grid-cols-4 max-[900px]:grid-cols-2 gap-2.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-22 rounded-[14px] bg-secondary animate-pulse" />
              ))}
            </div>
            <div className="h-50 rounded-[14px] bg-secondary animate-pulse" />
            <div className="h-35 rounded-[14px] bg-secondary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) return null;

  const showAgentsTab = role === "OWNER" || role === "BOTH";
  const showJobsTab = role === "CLIENT" || role === "BOTH";
  const showBothTabs = role === "BOTH";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — desktop only */}
      <DashboardSidebar walletAddress={address ?? ""} />

      {/* Main content */}
      <div className="ml-[240px] max-[900px]:ml-0 flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        {user && (
          <DashboardTopbar role={user.role} walletAddress={address ?? ""} />
        )}

        {/* Content */}
        <main className="px-[26px] py-[22px] pb-20 max-[560px]:px-[14px] max-[560px]:py-[14px] flex-1">

          {/* Tab bar row — only shown when both tabs visible */}
          {showBothTabs && (
            <div className="flex items-center mb-[18px] flex-wrap gap-[10px]">
              <div className="flex bg-sidebar border border-border rounded-[9px] p-[3px] gap-[2px] flex-shrink-0">
                <button
                  onClick={() => setTab("agents")}
                  className={cn(
                    "px-[14px] py-[6px] rounded-[7px] text-[13px] font-medium cursor-pointer transition-all duration-200 border-none font-body whitespace-nowrap",
                    tab === "agents" ? "bg-secondary text-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  My Agents
                </button>
                <button
                  onClick={() => setTab("jobs")}
                  className={cn(
                    "px-[14px] py-[6px] rounded-[7px] text-[13px] font-medium cursor-pointer transition-all duration-200 border-none font-body whitespace-nowrap",
                    tab === "jobs" ? "bg-secondary text-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  My Jobs
                </button>
              </div>
            </div>
          )}

          {/* Panels */}
          {user && showAgentsTab && tab === "agents" && (
            <AgentsPanel ownerId={user.id} />
          )}
          {user && showJobsTab && tab === "jobs" && (
            <JobsPanel walletAddress={address ?? ""} />
          )}

          {/* Skeleton while user loads */}
          {!user && hydrated === false && (
            <div className="grid grid-cols-4 max-[900px]:grid-cols-2 gap-[10px] mb-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[88px] rounded-[14px] bg-secondary animate-pulse" />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
