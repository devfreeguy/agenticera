"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Share2, FileText, Settings } from "lucide-react";
import { LogoMark } from "@/components/shared/LogoMark";
import { cn } from "@/lib/utils";
import { formatAddress } from "@/utils/format";

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

  function copyAddress() {
    if (walletAddress) navigator.clipboard.writeText(walletAddress);
  }

  return (
    <aside className="hidden min-[900px]:flex w-60 min-h-screen bg-sidebar border-r border-[0.5px] border-border flex-col fixed left-0 top-0 bottom-0 z-50">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-[9px] px-5 py-[22px] pb-5 border-b border-border font-head text-[16px] font-semibold text-foreground no-underline"
      >
        <LogoMark size={28} />
        AgentBank
      </Link>

      {/* Nav */}
      <nav className="flex-1 p-[10px] flex flex-col gap-px">
        <div className="text-[10px] text-[var(--hint)] uppercase tracking-[.08em] px-2 py-[10px] pb-[5px] font-medium">
          Menu
        </div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-[10px] px-[10px] py-[9px] rounded-[8px] text-[13px] transition-all duration-150 border border-transparent no-underline select-none",
                active
                  ? "text-[var(--orange)] bg-[var(--orange-dim)] border-[var(--orange-border)]"
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
      <div className="px-[10px] py-3 border-t border-border">
        <button
          onClick={copyAddress}
          className="w-full bg-card border border-border rounded-[10px] px-3 py-[11px] text-left cursor-pointer transition-colors hover:border-[var(--border-med)] group"
        >
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
            <div className="w-[5px] h-[5px] rounded-full bg-[var(--green)]" />
            Connected
          </div>
          <div className="font-mono text-[11px] text-foreground">
            {walletAddress ? formatAddress(walletAddress) : "—"}
          </div>
          <div className="text-[10px] text-[var(--hint)] mt-[3px]">Click to copy</div>
        </button>
      </div>
    </aside>
  );
}
