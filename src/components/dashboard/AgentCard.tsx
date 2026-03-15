"use client";

import { useEffect, useState } from "react";
import { ArrowUp, Pause, Play, Upload } from "lucide-react";
import axios from "axios";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatAddress } from "@/utils/format";
import { useAgentStore } from "@/store/agentStore";
import type { AgentPublic } from "@/types/index";

interface AgentCardProps {
  agent: AgentPublic;
}

export function AgentCard({ agent }: AgentCardProps) {
  const { agentBalances, fetchAgentBalance, updateAgent } = useAgentStore();
  const balance = agentBalances[agent.id];
  const isActive = agent.status === "ACTIVE";

  const [togglingStatus, setTogglingStatus] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawTo, setWithdrawTo] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  useEffect(() => {
    fetchAgentBalance(agent.id);
  }, [agent.id, fetchAgentBalance]);

  async function handleToggle(checked: boolean) {
    setTogglingStatus(true);
    try {
      const newStatus = checked ? "ACTIVE" : "PAUSED";
      await axios.patch(`/api/agents/${agent.id}`, { status: newStatus });
      updateAgent(agent.id, { status: newStatus });
    } catch (err) {
      console.error("toggle status failed:", err);
    } finally {
      setTogglingStatus(false);
    }
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    setWithdrawError("");
    try {
      await axios.post(`/api/agents/${agent.id}/withdraw`, {
        toAddress: withdrawTo,
        amountUsdt: withdrawAmt,
      });
      setWithdrawOpen(false);
      setWithdrawTo("");
      setWithdrawAmt("");
      fetchAgentBalance(agent.id);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? "Withdrawal failed")
        : "Withdrawal failed";
      setWithdrawError(msg);
    } finally {
      setWithdrawing(false);
    }
  }

  const addrDotColor = isActive ? "bg-[var(--green)]" : "bg-[var(--hint)]";

  return (
    <>
      <div
        className={cn(
          "bg-sidebar border border-[var(--border-med)] rounded-[14px] p-[18px] transition-colors duration-200 hover:border-[rgba(255,255,255,0.17)]",
          !isActive && "opacity-85"
        )}
      >
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-[9px]">
            <div className="w-9 h-9 rounded-[9px] bg-[rgba(99,102,241,0.12)] flex items-center justify-center text-[17px] flex-shrink-0">
              🤖
            </div>
            <div>
              <div className="font-head text-[13px] font-semibold flex items-center gap-[5px]">
                <div className={cn("w-[6px] h-[6px] rounded-full flex-shrink-0", addrDotColor)} />
                {agent.name}
              </div>
              <div className="flex gap-[3px] flex-wrap mt-1">
                {agent.categoryIds.slice(0, 3).map((cat) => (
                  <span
                    key={cat}
                    className="text-[10px] px-[7px] py-[2px] rounded-full bg-secondary border border-border text-[var(--hint)]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground">
              {isActive ? "Active" : "Paused"}
            </span>
            <Switch
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={togglingStatus}
            />
          </div>
        </div>

        {/* Wallet address */}
        <div className="font-mono text-[10px] text-[var(--hint)] bg-card border border-border rounded-[6px] px-[9px] py-1 mb-3 flex items-center gap-[5px]">
          <div className={cn("w-[4px] h-[4px] rounded-full flex-shrink-0", addrDotColor)} />
          {formatAddress(agent.walletAddress)} · Ethereum
        </div>

        {/* Balance row */}
        <div className="flex items-baseline gap-1.5 mb-3 pb-3 border-b border-border">
          <div className="flex-1">
            <div className="text-[10px] text-[var(--hint)] uppercase tracking-[.06em] mb-1">Balance</div>
            <div className="flex items-baseline gap-[5px]">
              {balance === undefined ? (
                <Skeleton className="h-[22px] w-[80px]" />
              ) : (
                <>
                  <span className={cn("font-mono text-[22px] font-medium", !isActive && "text-muted-foreground")}>
                    {parseFloat(balance).toFixed(2)}
                  </span>
                  <span className="font-mono text-[12px] text-muted-foreground">USDT</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[var(--hint)] mb-[2px]">
              {isActive ? "Active" : "Paused"}
            </div>
            <div className={cn("text-[10px]", isActive ? "text-[var(--green)]" : "text-[var(--hint)]")}>
              {agent.jobsCompleted} jobs
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 mb-3">
          <div className="text-center px-1 py-2 relative after:content-[''] after:absolute after:right-0 after:top-[20%] after:bottom-[20%] after:w-px after:bg-border">
            <div className="font-mono text-[13px] font-medium text-[var(--green)] mb-[3px]">
              {parseFloat(agent.totalEarned).toFixed(2)}
            </div>
            <div className="text-[10px] text-[var(--hint)] uppercase tracking-[.04em]">Earned</div>
          </div>
          <div className="text-center px-1 py-2 relative after:content-[''] after:absolute after:right-0 after:top-[20%] after:bottom-[20%] after:w-px after:bg-border">
            <div className="font-mono text-[13px] font-medium text-[var(--orange)] mb-[3px]">
              {parseFloat(agent.totalSpent).toFixed(2)}
            </div>
            <div className="text-[10px] text-[var(--hint)] uppercase tracking-[.04em]">Spent</div>
          </div>
          <div className="text-center px-1 py-2">
            <div className="font-mono text-[13px] font-medium text-foreground mb-[3px]">
              {agent.jobsCompleted}
            </div>
            <div className="text-[10px] text-[var(--hint)] uppercase tracking-[.04em]">Jobs</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-[7px] border-t border-border pt-3">
          <button
            onClick={() => setWithdrawOpen(true)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-[7px] text-[12px] font-medium bg-[var(--orange-dim)] border border-[var(--orange-border)] text-[var(--orange)] hover:bg-[rgba(232,121,58,0.18)] transition-colors cursor-pointer"
          >
            <ArrowUp size={11} strokeWidth={1.4} />
            Withdraw
          </button>
          <button
            onClick={() => handleToggle(!isActive)}
            disabled={togglingStatus}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-[7px] text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-50",
              isActive
                ? "bg-card border border-[var(--border-med)] text-muted-foreground hover:text-foreground hover:border-[rgba(255,255,255,0.17)]"
                : "bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-[var(--green)]"
            )}
          >
            {isActive ? <Pause size={11} className="fill-current" strokeWidth={0} /> : <Play size={11} className="fill-current" strokeWidth={0} />}
            {isActive ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      {/* Withdraw dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw from {agent.name}</DialogTitle>
            <DialogDescription>
              Send USDT from the agent wallet to any Ethereum address.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-[.05em] mb-1.5 block">
                Destination address
              </label>
              <Input
                placeholder="0x..."
                value={withdrawTo}
                onChange={(e) => setWithdrawTo(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-[.05em] mb-1.5 block">
                Amount (USDT)
              </label>
              <Input
                placeholder="e.g. 50.00"
                type="number"
                min="0"
                step="0.01"
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(e.target.value)}
              />
            </div>
            {withdrawError && (
              <p className="text-[12px] text-red-500">{withdrawError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" size="default" className="h-auto py-[9px] px-4 text-[13px]" onClick={() => setWithdrawOpen(false)}>
              Cancel
            </Button>
            <Button
              size="default"
              className="h-auto py-[9px] px-4 text-[13px] bg-[var(--orange)] text-white hover:opacity-90"
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawTo || !withdrawAmt}
            >
              {withdrawing ? "Sending…" : "Confirm withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
