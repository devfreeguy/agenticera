"use client";

import { useState } from "react";
import NextLink from "next/link";
import { Pencil, DollarSign, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { AgentStatus } from "@/generated/prisma/enums";
import { formatAddress } from "@/utils/format";
import { getAvatarColor } from "@/utils/avatarColor";
import axiosClient from "@/lib/axiosClient";
import type { AgentPublic, ApiSuccess } from "@/types/index";

interface AgentSettingRowProps {
  agent: AgentPublic;
  isLast: boolean;
  openEdit: "prompt" | "price" | null;
  onOpenEdit: (type: "prompt" | "price") => void;
  onCloseEdit: () => void;
  onUpdateAgent: (id: string, updates: Partial<AgentPublic>) => void;
  onToast: (msg: string) => void;
}

export function AgentSettingRow({
  agent,
  isLast,
  openEdit,
  onOpenEdit,
  onCloseEdit,
  onUpdateAgent,
  onToast,
}: AgentSettingRowProps) {
  const [promptDraft, setPromptDraft] = useState(agent.systemPrompt);
  const [priceDraft, setPriceDraft] = useState(agent.pricePerTask);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const isActive = agent.status === AgentStatus.ACTIVE;
  const avatarBg = getAvatarColor(agent.id);
  const avatarLetter = agent.name.charAt(0).toUpperCase();

  async function handleToggleStatus() {
    if (isTogglingStatus) return;
    setIsTogglingStatus(true);
    const newStatus = isActive ? AgentStatus.PAUSED : AgentStatus.ACTIVE;
    try {
      const res = await axiosClient.patch<ApiSuccess<AgentPublic>>(`/api/agents/${agent.id}`, {
        status: newStatus,
      });
      if (res.data?.data) {
        onUpdateAgent(agent.id, { status: newStatus });
        onToast(newStatus === AgentStatus.ACTIVE ? "Agent resumed" : "Agent paused");
      }
    } finally {
      setIsTogglingStatus(false);
    }
  }

  async function handleSavePrompt() {
    if (!promptDraft.trim()) return;
    setIsSavingPrompt(true);
    try {
      const res = await axiosClient.patch<ApiSuccess<AgentPublic>>(`/api/agents/${agent.id}`, {
        systemPrompt: promptDraft.trim(),
      });
      if (res.data?.data) {
        onUpdateAgent(agent.id, { systemPrompt: promptDraft.trim() });
        onToast("Prompt saved");
      }
    } finally {
      setIsSavingPrompt(false);
      onCloseEdit();
    }
  }

  async function handleSavePrice() {
    const val = parseFloat(priceDraft);
    if (isNaN(val) || val <= 0) return;
    setIsSavingPrice(true);
    try {
      const res = await axiosClient.patch<ApiSuccess<AgentPublic>>(`/api/agents/${agent.id}`, {
        pricePerTask: val,
      });
      if (res.data?.data) {
        onUpdateAgent(agent.id, { pricePerTask: val.toString() });
        onToast("Price saved");
      }
    } finally {
      setIsSavingPrice(false);
      onCloseEdit();
    }
  }

  function handleOpenPrompt() {
    setPromptDraft(agent.systemPrompt);
    onOpenEdit("prompt");
  }

  function handleOpenPrice() {
    setPriceDraft(agent.pricePerTask);
    onOpenEdit("price");
  }

  return (
    <div className={cn("px-[22px] py-4 flex items-start gap-3", !isLast && "border-b border-border")}>
      {/* Avatar */}
      <div
        className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[16px] font-semibold shrink-0 mt-[1px]"
        style={{ background: avatarBg }}
      >
        {avatarLetter}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[7px] mb-1 flex-wrap">
          <span className="font-head text-[13px] font-semibold">{agent.name}</span>
          <div
            className={cn(
              "w-[6px] h-[6px] rounded-full shrink-0",
              isActive ? "bg-(--green)" : "bg-(--hint)"
            )}
          />
          <span className="text-[11px] text-muted-foreground">
            {isActive ? "Active" : "Paused"}
          </span>
        </div>

        <div className="font-mono text-[10px] text-(--hint) mb-2 truncate max-w-[300px]">
          {formatAddress(agent.walletAddress)}
        </div>

        {/* Quick actions */}
        <div className="flex gap-[6px] flex-wrap">
          <button
            onClick={handleOpenPrompt}
            className="flex items-center gap-[5px] px-[11px] py-[5px] rounded-[7px] text-[11px] font-medium border-[0.5px] border-(--border-med) bg-card text-muted-foreground hover:text-foreground hover:border-white/[0.18] transition-all cursor-pointer"
          >
            <Pencil size={11} strokeWidth={1.4} />
            Edit prompt
          </button>
          <button
            onClick={handleOpenPrice}
            className="flex items-center gap-[5px] px-[11px] py-[5px] rounded-[7px] text-[11px] font-medium border-[0.5px] border-(--border-med) bg-card text-muted-foreground hover:text-foreground hover:border-white/[0.18] transition-all cursor-pointer"
          >
            <DollarSign size={11} strokeWidth={1.4} />
            Edit price
          </button>
          <NextLink href="/jobs">
            <button className="flex items-center gap-[5px] px-[11px] py-[5px] rounded-[7px] text-[11px] font-medium border-[0.5px] border-(--border-med) bg-card text-muted-foreground hover:text-foreground hover:border-white/[0.18] transition-all cursor-pointer">
              <Eye size={11} strokeWidth={1.4} />
              View profile
            </button>
          </NextLink>
        </div>

        {/* Inline edit: prompt */}
        {openEdit === "prompt" && (
          <div className="bg-card border-[0.5px] border-(--orange-border) rounded-[10px] px-3.5 py-3 mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="text-[11px] text-muted-foreground mb-[7px] uppercase tracking-[0.05em]">
              System prompt
            </div>
            <Textarea
              value={promptDraft}
              onChange={(e) => setPromptDraft(e.target.value)}
              rows={4}
              className="bg-secondary border-(--border-med) text-[12px] focus:border-(--orange) focus-visible:ring-0 resize-y"
              placeholder="You are a…"
            />
            <div className="flex gap-[7px] mt-[9px] justify-end">
              <button
                onClick={onCloseEdit}
                className="px-3 py-[7px] bg-transparent text-muted-foreground border-[0.5px] border-(--border-med) rounded-[7px] text-[12px] hover:text-foreground cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrompt}
                disabled={isSavingPrompt || !promptDraft.trim()}
                className="px-3.5 py-[7px] bg-(--orange) text-white border-none rounded-[7px] text-[12px] font-medium cursor-pointer disabled:opacity-50"
              >
                {isSavingPrompt ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}

        {/* Inline edit: price */}
        {openEdit === "price" && (
          <div className="bg-card border-[0.5px] border-(--orange-border) rounded-[10px] px-3.5 py-3 mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="text-[11px] text-muted-foreground mb-[7px] uppercase tracking-[0.05em]">
              Price per task (USDT)
            </div>
            <Input
              type="number"
              value={priceDraft}
              onChange={(e) => setPriceDraft(e.target.value)}
              min="0.5"
              step="0.5"
              placeholder="e.g. 8.00"
              className="bg-secondary border-(--border-med) font-mono text-[12px] focus:border-(--orange) focus-visible:ring-0"
            />
            <div className="flex gap-[7px] mt-[9px] justify-end">
              <button
                onClick={onCloseEdit}
                className="px-3 py-[7px] bg-transparent text-muted-foreground border-[0.5px] border-(--border-med) rounded-[7px] text-[12px] hover:text-foreground cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrice}
                disabled={isSavingPrice || !priceDraft || parseFloat(priceDraft) <= 0}
                className="px-3.5 py-[7px] bg-(--orange) text-white border-none rounded-[7px] text-[12px] font-medium cursor-pointer disabled:opacity-50"
              >
                {isSavingPrice ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-[7px] shrink-0 pt-[2px]">
        <span className="text-[11px] text-muted-foreground min-w-[24px] text-right">
          {isActive ? "On" : "Off"}
        </span>
        <Switch
          checked={isActive}
          onCheckedChange={handleToggleStatus}
          disabled={isTogglingStatus}
        />
      </div>
    </div>
  );
}
