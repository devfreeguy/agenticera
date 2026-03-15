"use client";

import Link from "next/link";
import { Plus, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAddress } from "@/utils/format";
import type { Role } from "@/generated/prisma/enums";

interface DashboardTopbarProps {
  role: Role;
  walletAddress: string;
}

export function DashboardTopbar({ role, walletAddress }: DashboardTopbarProps) {
  const isOwner = role === "OWNER" || role === "BOTH";
  const isClient = role === "CLIENT" || role === "BOTH";

  return (
    <div className="flex items-center justify-between px-[26px] py-4 border-b border-border sticky top-0 z-10 bg-background flex-wrap gap-[10px]">
      <div className="flex flex-col gap-1">
        <h1 className="font-head text-[20px] font-bold">Dashboard</h1>
        <div className="flex gap-1.5 flex-wrap">
          {isOwner && (
            <Badge
              className="text-[10px] font-medium py-[3px] px-[9px] rounded-full uppercase tracking-[.04em] bg-[var(--orange-dim)] border border-[var(--orange-border)] text-[var(--orange)]"
            >
              Agent Owner
            </Badge>
          )}
          {isClient && (
            <Badge
              className="text-[10px] font-medium py-[3px] px-[9px] rounded-full uppercase tracking-[.04em] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-[var(--green)]"
            >
              Client
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-[10px] flex-wrap">
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground bg-card border border-[var(--border-med)] px-3 py-[6px] rounded-full">
          <div className="w-[5px] h-[5px] rounded-full bg-[var(--green)]" />
          {walletAddress ? formatAddress(walletAddress) : "—"}
        </div>

        {isOwner && (
          <Button
            variant="secondary"
            size="default"
            className="text-[13px] px-[14px] py-[9px] h-auto rounded-[8px] border-[var(--border-med)] text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/withdraw">
              <Download size={13} strokeWidth={1.4} />
              Withdraw all
            </Link>
          </Button>
        )}

        {!isOwner && isClient && (
          <Button
            variant="secondary"
            size="default"
            className="text-[13px] px-[14px] py-[9px] h-auto rounded-[8px] border-[var(--border-med)] text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/jobs">
              <Share2 size={13} strokeWidth={1.4} />
              Browse agents
            </Link>
          </Button>
        )}

        {isOwner && (
          <Button
            size="default"
            className="bg-[var(--orange)] text-white text-[13px] px-4 py-[9px] h-auto rounded-[8px] hover:opacity-90"
            asChild
          >
            <Link href="/onboarding">
              <Plus size={13} strokeWidth={1.5} />
              Deploy agent
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
