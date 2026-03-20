"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentPublic } from "@/types/index";
import { formatUsdt } from "@/utils/format";
import { AlertTriangle, Check, ChevronLeft, Loader2 } from "lucide-react";
import { HireStep4Polling } from "./HireStep4Polling";
import { useEffect, useState } from "react";

interface HireStep3PayProps {
  agent: AgentPublic;
  taskDescription: string;
  isWalletPending: boolean;
  isMining: boolean;
  isConfirming: boolean;
  isBusy: boolean;
  isApprovingState: boolean;
  isBase: boolean;
  isSwitching: boolean;
  isQuoting?: boolean; // 🔥 ADDED: For the AI Quote step
  writeTxHash?: string;
  payError: string | null;
  shortTxHash: string;
  onBack: () => void;
  onPay: () => void;
  onSwitchChain: () => void;
}

export function HireStep3Pay({
  agent,
  taskDescription,
  isWalletPending,
  isMining,
  isConfirming,
  isBusy,
  isApprovingState,
  isBase,
  isSwitching,
  isQuoting = false, // 🔥 Default to false
  writeTxHash,
  payError,
  shortTxHash,
  onBack,
  onPay,
  onSwitchChain,
}: HireStep3PayProps) {
  // Add this block inside your component:
  const [thinkingStep, setThinkingStep] = useState(0);
  const thinkingPhrases = [
    "Waking agent engine...",
    "Analyzing task complexity...",
    "Estimating token costs...",
    "Evaluating sub-agent fees...",
    "Calculating profit margin...",
    "Finalizing quote...",
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isQuoting) {
      setThinkingStep(0);
      interval = setInterval(() => {
        setThinkingStep((prev) =>
          prev < thinkingPhrases.length - 1 ? prev + 1 : prev,
        );
      }, 800); // Changes text every 800ms
    }
    return () => clearInterval(interval);
  }, [isQuoting]);

  const taskPreview =
    taskDescription.length > 60
      ? taskDescription.slice(0, 60) + "…"
      : taskDescription;

  const pollingState = isWalletPending
    ? "wallet"
    : isMining
      ? "mining"
      : "confirming";

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-5.5 [scrollbar-width:thin] [scrollbar-color:var(--bg4)_transparent]">
        {!isBusy && !isQuoting && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 bg-none border-none text-[12px] text-muted-foreground cursor-pointer font-body mb-4 hover:text-foreground transition-colors p-0"
          >
            <ChevronLeft size={13} strokeWidth={1.4} />
            Edit task
          </button>
        )}

        <div className="font-head text-[16px] font-bold mb-3.5">
          Review & pay
        </div>

        {/* Summary card */}
        <div className="bg-card border border-border rounded-[11px] p-3.5 px-4 mb-3.5">
          {[
            {
              label: "Agent",
              value: <span className="font-medium">{agent.name}</span>,
            },
            {
              label: "Task",
              value: (
                <span className="text-[12px] text-muted-foreground max-w-60 text-right">
                  {taskPreview}
                </span>
              ),
            },
            {
              label: "Network",
              value: <Badge variant="orange">Base</Badge>,
            },
            {
              label: "Amount",
              value: (
                <div className="flex flex-col items-end gap-1">
                  <span className="font-mono text-(--green) font-medium">
                    {formatUsdt(agent.pricePerTask)}
                  </span>
                </div>
              ),
            },
          ].map(({ label, value }, i, arr) => (
            <div
              key={label}
              className={cn(
                "flex items-center justify-between py-1.75 text-[13px]",
                i < arr.length - 1 && "border-b border-border",
              )}
            >
              <span className="text-muted-foreground">{label}</span>
              {value}
            </div>
          ))}
        </div>

        {/* Polling states */}
        {isBusy && (
          <HireStep4Polling
            state={pollingState}
            shortTxHash={shortTxHash}
            writeTxHash={writeTxHash}
          />
        )}

        {/* Error */}
        {payError && !isBusy && !isQuoting && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-[9px] px-3.25 py-2.75 text-[12px] text-destructive leading-[1.55] mb-3.5">
            <AlertTriangle size={13} className="inline mr-1.5 mb-0.5" />
            {payError}
          </div>
        )}

        {/* Hint */}
        {!isBusy && !isQuoting && !writeTxHash && isBase && (
          <div className="text-[11px] text-(--hint) text-center mt-1">
            Sends USDT from your connected wallet on Base
          </div>
        )}
        {!isBusy && !isQuoting && !isBase && (
          <div className="text-[11px] text-(--hint) text-center mt-1">
            You need to be on Base to pay in USDT
          </div>
        )}
      </div>

      <div className="px-5 py-3.5 border-t border-border bg-[#131316] shrink-0">
        {!isBusy && isBase && (
          <Button
            variant="primary"
            size="md"
            onClick={onPay}
            disabled={isQuoting}
            className="w-full py-3.25 rounded-[10px] text-[14px] font-semibold tracking-[0.01em] relative overflow-hidden"
          >
            {isQuoting ? (
              <div className="flex flex-col items-center justify-center w-full animate-pulse">
                <div className="flex items-center text-[13px]">
                  <Loader2
                    size={14}
                    strokeWidth={2}
                    className="animate-spin mr-2"
                  />
                  <span className="font-mono text-(--green)">
                    {thinkingPhrases[thinkingStep]}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <Check size={15} strokeWidth={1.5} className="mr-2" />
                {isApprovingState
                  ? "Approve Token Spend"
                  : `Pay ${formatUsdt(agent.pricePerTask)}`}
              </>
            )}
          </Button>
        )}

        {!isBusy && !isBase && (
          <Button
            variant="secondary"
            size="md"
            onClick={onSwitchChain}
            disabled={isSwitching}
            className="w-full py-3.25 rounded-[10px] text-[14px] font-semibold tracking-[0.01em] hover:border-(--orange) hover:text-(--orange) transition-colors"
          >
            {isSwitching ? (
              <>
                <Loader2
                  size={15}
                  strokeWidth={1.5}
                  className="animate-spin mr-2"
                />
                Switching network…
              </>
            ) : (
              <>
                <AlertTriangle size={15} strokeWidth={1.5} className="mr-2" />
                Switch to Base
              </>
            )}
          </Button>
        )}
      </div>
    </>
  );
}
