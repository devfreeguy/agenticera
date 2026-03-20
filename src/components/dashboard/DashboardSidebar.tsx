"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Share2, FileText, Settings, LogOut } from "lucide-react";
import { useDisconnect } from "wagmi";
import { LogoMark } from "@/components/shared/LogoMark";
import { cn } from "@/lib/utils";
import { formatAddress } from "@/utils/format";
import { useUser } from "@/hooks/useUser";
import { useAgentStore } from "@/store/agentStore";
import { useJobStore } from "@/store/jobStore";
import { useTransactionStore } from "@/store/transactionStore";

interface DashboardSidebarProps {
  walletAddress: string;
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/jobs", label: "Job Board", icon: Share2 },
  { href: "/transactions", label: "Transactions", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar({ walletAddress }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const { clearUser } = useUser();
  const clearAgents = useAgentStore((s) => s.clearAgents);
  const clearJobs = useJobStore((s) => s.clearJobs);
  const clearTransactions = useTransactionStore((s) => s.clearTransactions);

  function handleDisconnect() {
    disconnect();
    clearUser();
    clearAgents();
    clearJobs();
    clearTransactions();
    router.push("/");
  }

  function copyAddress() {
    if (walletAddress) navigator.clipboard.writeText(walletAddress);
  }

  return (
    <aside className="hidden min-[900px]:flex w-60 min-h-screen bg-sidebar border-r border-[0.5px] border-border flex-col fixed left-0 top-0 bottom-0 z-50">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.25 px-5 py-5.5 pb-5 border-b border-border font-head text-[16px] font-semibold text-foreground no-underline"
      >
        <LogoMark size={28} />
        AgentEra
      </Link>

      {/* Nav */}
      <nav className="flex-1 p-2.5 flex flex-col gap-px">
        <div className="text-[10px] text-(--hint) uppercase tracking-[.08em] px-2 py-2.5 pb-1.25 font-medium">
          Menu
        </div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2.25 rounded-[8px] text-[13px] transition-all duration-150 border border-transparent no-underline select-none",
                active
                  ? "text-(--orange) bg-(--orange-dim) border-(--orange-border)"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              )}
            >
              <Icon size={15} strokeWidth={1.4} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Wallet pill */}
      <div className="px-2.5 pt-3 pb-1 border-t border-border">
        <button
          onClick={copyAddress}
          className="w-full bg-card border border-border rounded-[10px] px-3 py-2.75 text-left cursor-pointer transition-colors hover:border-(--border-med) group"
        >
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
            <div className="w-1.25 h-1.25 rounded-full bg-(--green)" />
            Connected
          </div>
          <div className="font-mono text-[11px] text-foreground">
            {walletAddress ? formatAddress(walletAddress) : "—"}
          </div>
          <div className="text-[10px] text-(--hint) mt-0.75">Click to copy</div>
        </button>
      </div>

      {/* Disconnect */}
      <div className="px-2.5 pb-3">
        <button
          onClick={handleDisconnect}
          className="w-full flex items-center gap-2.5 px-2.5 py-2.25 rounded-[8px] text-[13px] text-(--hint) transition-all duration-150 hover:text-red-500 hover:bg-[rgba(239,68,68,0.06)] cursor-pointer"
        >
          <LogOut size={15} strokeWidth={1.4} />
          Disconnect
        </button>
      </div>
    </aside>
  );
}
