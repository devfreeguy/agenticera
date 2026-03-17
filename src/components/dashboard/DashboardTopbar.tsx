"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Download, Share2, Copy, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { formatAddress } from "@/utils/format";
import { useUser } from "@/hooks/useUser";
import type { Role } from "@/generated/prisma/enums";

interface DashboardTopbarProps {
  role: Role;
  walletAddress: string;
}

export function DashboardTopbar({ role, walletAddress }: DashboardTopbarProps) {
  const isOwner = role === "OWNER" || role === "BOTH";
  const isClient = role === "CLIENT" || role === "BOTH";

  const router = useRouter();
  const { disconnect } = useDisconnect();
  const { clearUser } = useUser();

  function handleDisconnect() {
    disconnect();
    clearUser();
    router.push("/");
  }

  function copyAddress() {
    if (walletAddress) navigator.clipboard.writeText(walletAddress);
  }

  const avatarLabel = walletAddress ? walletAddress.slice(2, 4).toUpperCase() : "?";

  return (
    <div className="flex items-center justify-between px-6.5 py-4 border-b border-border sticky top-0 z-10 bg-background flex-wrap gap-2.5">
      <div className="flex flex-col gap-1">
        <h1 className="font-head text-[20px] font-bold">Dashboard</h1>
        <div className="flex gap-1.5 flex-wrap">
          {isOwner && (
            <Badge
              className="text-[10px] font-medium py-0.75 px-2.25 rounded-full uppercase tracking-[.04em] bg-(--orange-dim) border border-(--orange-border) text-(--orange)"
            >
              Agent Owner
            </Badge>
          )}
          {isClient && (
            <Badge
              className="text-[10px] font-medium py-0.75 px-2.25 rounded-full uppercase tracking-[.04em] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-(--green)"
            >
              Client
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Address pill — hidden below 900px */}
        <div className="hidden min-[900px]:flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground bg-card border border-(--border-med) px-3 py-1.5 rounded-full">
          <div className="w-1.25 h-1.25 rounded-full bg-(--green)" />
          {walletAddress ? formatAddress(walletAddress) : "—"}
        </div>

        {isOwner && (
          <Button
            variant="secondary"
            size="default"
            className="text-[13px] px-3.5 py-2.25 h-auto rounded-[8px] border-(--border-med) text-muted-foreground hover:text-foreground"
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
            className="text-[13px] px-3.5 py-2.25 h-auto rounded-[8px] border-(--border-med) text-muted-foreground hover:text-foreground"
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
            className="bg-(--orange) text-white text-[13px] px-4 py-2.25 h-auto rounded-[8px] hover:opacity-90"
            asChild
          >
            <Link href="/onboarding">
              <Plus size={13} strokeWidth={1.5} />
              Deploy agent
            </Link>
          </Button>
        )}

        {/* Profile avatar with popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-8.5 h-8.5 rounded-full bg-(--bg3) border border-(--border-med) flex items-center justify-center font-mono text-[11px] text-muted-foreground cursor-pointer hover:border-[rgba(255,255,255,0.2)] transition-colors shrink-0">
              {avatarLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-56 p-1.5 bg-sidebar border border-(--border-med) rounded-[12px] shadow-lg"
          >
            {/* Wallet row */}
            <div className="px-3 py-2.5 mb-0.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
                    <div className="w-1.25 h-1.25 rounded-full bg-(--green)" />
                    Connected
                  </div>
                  <div className="font-mono text-[11px] text-foreground">
                    {walletAddress ? formatAddress(walletAddress) : "—"}
                  </div>
                </div>
                <button
                  onClick={copyAddress}
                  className="p-1.5 rounded-[6px] text-(--hint) hover:text-foreground hover:bg-card transition-colors cursor-pointer"
                >
                  <Copy size={12} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="h-px bg-border mx-1 mb-1" />

            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] text-muted-foreground hover:text-foreground hover:bg-card transition-colors no-underline"
            >
              <LayoutDashboard size={14} strokeWidth={1.4} />
              Dashboard
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] text-muted-foreground hover:text-foreground hover:bg-card transition-colors no-underline"
            >
              <Settings size={14} strokeWidth={1.4} />
              Settings
            </Link>

            <div className="h-px bg-border mx-1 my-1" />

            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] text-(--hint) hover:text-red-500 hover:bg-[rgba(239,68,68,0.06)] transition-colors cursor-pointer"
            >
              <LogOut size={14} strokeWidth={1.4} />
              Disconnect
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
