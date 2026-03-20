"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Role } from "@/generated/prisma/enums";
import type { WalletUser } from "@/types/index";

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: Role.OWNER, label: "Agent Owner", description: "Deploy and manage AI agents" },
  { value: Role.CLIENT, label: "Client", description: "Hire agents to complete tasks" },
  { value: Role.BOTH, label: "Both", description: "Deploy agents and hire others" },
];

interface ProfileSectionProps {
  user: WalletUser | null;
  onUpdateRole: (role: Role) => Promise<void>;
  onToast: (msg: string) => void;
}

export function ProfileSection({ user, onUpdateRole, onToast }: ProfileSectionProps) {
  const [copied, setCopied] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleCopy() {
    if (!user?.walletAddress) return;
    await navigator.clipboard.writeText(user.walletAddress);
    setCopied(true);
    onToast("Address copied");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveRole() {
    if (!selectedRole) return;
    setIsSaving(true);
    await onUpdateRole(selectedRole);
    setIsSaving(false);
    setRoleDialogOpen(false);
    onToast("Role updated");
  }

  function openRoleDialog() {
    setSelectedRole(user?.role ?? null);
    setRoleDialogOpen(true);
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div id="s-profile" className="bg-sidebar border-[0.5px] border-(--border-med) rounded-[16px] overflow-hidden">
      {/* Header */}
      <div className="px-[22px] py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-[9px]">
          <div className="w-[30px] h-[30px] rounded-[8px] bg-card border-[0.5px] border-border flex items-center justify-center shrink-0">
            <svg viewBox="0 0 15 15" className="w-[14px] h-[14px] stroke-muted-foreground" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7.5" cy="5" r="3"/>
              <path d="M1.5 13.5c0-3.5 2.7-6 6-6s6 2.5 6 6"/>
            </svg>
          </div>
          <div>
            <div className="font-head text-[14px] font-semibold">Profile</div>
            <div className="text-[12px] text-(--hint) mt-[1px]">Your wallet identity and roles</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div>
        {/* Wallet address */}
        <div className="flex items-center gap-2.5 px-[22px] py-3.5 border-b border-border">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-(--hint) uppercase tracking-[0.06em] mb-[5px]">
              Connected wallet
            </div>
            <div className="font-mono text-[12px] break-all leading-[1.6]">
              {user?.walletAddress ?? "—"}
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="w-[30px] h-[30px] rounded-[7px] bg-card border-[0.5px] border-(--border-med) flex items-center justify-center cursor-pointer shrink-0 hover:border-white/[0.18] transition-colors"
          >
            {copied ? (
              <Check size={12} strokeWidth={1.3} className="text-(--green)" />
            ) : (
              <Copy size={12} strokeWidth={1.3} className="text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Network */}
        <div className="flex items-center justify-between gap-4 px-[22px] py-3.5 border-b border-border">
          <div className="flex flex-col gap-[3px]">
            <div className="text-[13px] font-medium">Network</div>
            <div className="text-[12px] text-muted-foreground font-light leading-[1.5]">
              Transactions are settled on Base
            </div>
          </div>
          <div className="flex items-center gap-[6px] text-[12px] text-muted-foreground bg-card border-[0.5px] border-(--border-med) rounded-full px-[11px] py-1 shrink-0">
            <div className="w-[6px] h-[6px] rounded-full bg-(--green) shrink-0" />
            Base
          </div>
        </div>

        {/* Roles */}
        <div className="flex items-center justify-between px-[22px] py-3.5 border-b border-border">
          <div className="flex flex-col gap-[3px]">
            <div className="text-[13px] font-medium mb-[6px]">Roles</div>
            <div className="flex gap-[6px] flex-wrap">
              {user?.role === Role.OWNER || user?.role === Role.BOTH ? (
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full tracking-[0.04em] uppercase bg-(--orange-dim) border-[0.5px] border-(--orange-border) text-(--orange)">
                  Agent Owner
                </span>
              ) : null}
              {user?.role === Role.CLIENT || user?.role === Role.BOTH ? (
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full tracking-[0.04em] uppercase bg-(--green)/10 border-[0.5px] border-(--green)/20 text-(--green)">
                  Client
                </span>
              ) : null}
            </div>
          </div>
          <button
            onClick={openRoleDialog}
            className="text-[12px] text-muted-foreground bg-transparent border-none cursor-pointer px-2 py-[5px] rounded-[6px] hover:text-foreground hover:bg-card transition-all whitespace-nowrap"
          >
            Change roles
          </button>
        </div>

        {/* Member since */}
        <div className="flex items-center justify-between gap-4 px-[22px] py-3.5">
          <div className="flex flex-col gap-[3px]">
            <div className="text-[13px] font-medium">Member since</div>
            <div className="text-[12px] text-muted-foreground font-light leading-[1.5]">
              Account created when wallet first connected
            </div>
          </div>
          <div className="text-[12px] text-muted-foreground font-mono shrink-0">{memberSince}</div>
        </div>
      </div>

      {/* Role dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-[360px] bg-sidebar border-(--border-med) p-6">
          <DialogHeader>
            <DialogTitle className="font-head text-[16px] font-bold">Change roles</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground font-light leading-[1.65] mt-1 mb-4">
            Select how you want to use AgentEra.
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedRole(opt.value)}
                className={cn(
                  "flex flex-col items-start gap-[3px] px-4 py-3 rounded-[10px] border-[0.5px] text-left transition-all cursor-pointer",
                  selectedRole === opt.value
                    ? "bg-(--orange-dim) border-(--orange-border)"
                    : "bg-card border-border hover:border-(--border-med)"
                )}
              >
                <span className={cn("text-[13px] font-medium", selectedRole === opt.value ? "text-(--orange)" : "text-foreground")}>
                  {opt.label}
                </span>
                <span className="text-[12px] text-muted-foreground font-light">{opt.description}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSaveRole}
              disabled={!selectedRole || isSaving}
              className="w-full bg-primary text-primary-foreground rounded-[10px] h-10 font-head font-semibold"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              className="w-full rounded-[10px] h-10 text-[13px]"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
