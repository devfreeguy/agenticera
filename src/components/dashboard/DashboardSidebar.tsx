"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Briefcase, ArrowLeftRight, Settings, LogOut, Copy } from "lucide-react";
import { useDisconnect } from "wagmi";
import { LogoMark } from "@/components/shared/LogoMark";
import { cn } from "@/lib/utils";
import { formatAddress } from "@/utils/format";
import { useUser } from "@/hooks/useUser";
import { useAgentStore } from "@/store/agentStore";
import { useJobStore } from "@/store/jobStore";
import { useTransactionStore } from "@/store/transactionStore";
import { BRAND_NAME } from "@/constants/brand";

interface DashboardSidebarProps {
  walletAddress: string;
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/jobs", label: "Job Board", icon: Briefcase },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
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
    <aside className="hidden min-[900px]:flex w-58 min-h-screen bg-sidebar border-r border-border flex-col fixed left-0 top-0 bottom-0 z-50">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 px-5 h-[57px] border-b border-border font-head text-[15px] font-semibold text-foreground no-underline shrink-0"
      >
        <LogoMark size={26} />
        {BRAND_NAME}
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-2.5 px-3 py-2.25 rounded-[9px] text-[13px] transition-all duration-150 border no-underline select-none group",
                active
                  ? "text-foreground bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.1)]"
                  : "text-(--hint) border-transparent hover:text-muted-foreground hover:bg-[rgba(255,255,255,0.03)]"
              )}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-r-full bg-(--orange)" />
              )}
              <Icon
                size={14}
                strokeWidth={active ? 1.8 : 1.5}
                className={cn(active ? "text-(--orange)" : "text-(--hint) group-hover:text-muted-foreground")}
              />
              <span className={cn(active && "font-medium")}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2.5 pb-3 border-t border-border pt-3 flex flex-col gap-1">
        {/* Wallet pill */}
        <button
          onClick={copyAddress}
          className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-[10px] px-3 py-2.5 text-left cursor-pointer transition-all hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.05)] group"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-[10px] text-(--hint) uppercase tracking-[.06em]">
              <div className="w-1.5 h-1.5 rounded-full bg-(--green)" />
              Connected
            </div>
            <Copy size={10} className="text-(--hint) opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="font-mono text-[11px] text-foreground">
            {walletAddress ? formatAddress(walletAddress) : "—"}
          </div>
        </button>

        {/* Disconnect */}
        <button
          onClick={handleDisconnect}
          className="w-full flex items-center gap-2.5 px-3 py-2.25 rounded-[9px] text-[13px] text-(--hint) transition-all duration-150 hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.06)] cursor-pointer"
        >
          <LogOut size={14} strokeWidth={1.5} />
          Disconnect
        </button>
      </div>
    </aside>
  );
}
