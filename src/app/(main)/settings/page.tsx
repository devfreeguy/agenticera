"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDisconnect } from "wagmi";
import { MainTopbar } from "@/components/layout/MainTopbar";
import { SettingsSectionNav } from "@/components/settings/SettingsSectionNav";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { AgentsSection } from "@/components/settings/AgentsSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { DangerSection } from "@/components/settings/DangerSection";
import { useUser } from "@/hooks/useUser";
import { useAgents } from "@/hooks/useAgents";
import { useUserStore } from "@/store/userStore";
import { useAgentStore } from "@/store/agentStore";
import { useJobStore } from "@/store/jobStore";
import { useTransactionStore } from "@/store/transactionStore";
import { cn } from "@/lib/utils";
import type { Role } from "@/generated/prisma/enums";
import type { AgentPublic } from "@/types/index";

const SECTION_IDS = ["s-profile", "s-agents", "s-notifs", "s-danger"] as const;

export default function SettingsPage() {
  const router = useRouter();
  const { disconnect } = useDisconnect();

  const { user } = useUser();
  const { myAgents, fetchMyAgents, updateAgent } = useAgents();
  const updateRole = useUserStore((s) => s.updateRole);
  const clearUser = useUserStore((s) => s.clearUser);
  const clearAgents = useAgentStore((s) => s.clearAgents);
  const clearJobs = useJobStore((s) => s.clearJobs);
  const clearTransactions = useTransactionStore((s) => s.clearTransactions);

  const [activeSection, setActiveSection] = useState<string>("s-profile");
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch agents when user available
  useEffect(() => {
    if (user?.id) fetchMyAgents(user.id);
  }, [user?.id, fetchMyAgents]);

  // Scroll spy via IntersectionObserver
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const scrollEl = scrollAreaRef.current;
    if (!scrollEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { root: scrollEl, rootMargin: "-10% 0px -60% 0px", threshold: 0 }
    );

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  function showToast(message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2000);
  }

  function handleNavigate(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  }

  async function handleUpdateRole(role: Role) {
    if (!user?.walletAddress) return;
    await updateRole(user.walletAddress, role);
  }

  function handleUpdateAgent(id: string, updates: Partial<AgentPublic>) {
    updateAgent(id, updates);
  }

  function handleDisconnect() {
    disconnect();
    clearUser();
    clearAgents();
    clearJobs();
    clearTransactions();
    router.push("/");
  }

  return (
    <>
      <MainTopbar
        title="Settings"
        subtitle={
          <p className="text-[13px] text-muted-foreground">
            Manage your account, agents, and preferences
          </p>
        }
      />

      <main className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--bg4)_transparent]">
        <div
          ref={scrollAreaRef}
          className="px-6.5 py-7 pb-20 max-[560px]:px-3.5 max-[560px]:py-4 flex justify-center"
        >
        <div className="w-full max-w-[680px] flex flex-col gap-[10px]">
          <SettingsSectionNav activeSection={activeSection} onNavigate={handleNavigate} />

          <ProfileSection user={user} onUpdateRole={handleUpdateRole} onToast={showToast} />

          <AgentsSection
            agents={myAgents}
            onUpdateAgent={handleUpdateAgent}
            onToast={showToast}
          />

          <NotificationsSection />

          <DangerSection onDisconnect={handleDisconnect} />

          <div className="h-3" />
        </div>
        </div>
      </main>

      {/* Toast */}
      <div
        className={cn(
          "fixed bottom-20 left-1/2 -translate-x-1/2 bg-card border-[0.5px] border-(--border-med) rounded-[8px] px-4 py-[7px] text-[12px] z-[999] whitespace-nowrap pointer-events-none transition-all duration-200",
          toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
      >
        {toast.message}
      </div>
    </>
  );
}
