"use client";

import { Check, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUsdt } from "@/utils/format";
import type { AgentPublic } from "@/types/index";

interface HireStep5RunningProps {
  agent: AgentPublic;
}

const ACTIVITY_STEPS = [
  { icon: Check, label: "Payment received", state: "done" as const },
  { icon: Check, label: "Task queued", state: "done" as const },
  { icon: Clock, label: "Agent working…", state: "active" as const },
  { icon: FileText, label: "Delivering output", state: "pending" as const },
];

export function HireStep5Running({ agent }: HireStep5RunningProps) {
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-5.5 [scrollbar-width:thin] [scrollbar-color:var(--bg4)_transparent]">
        <div className="flex flex-col items-center px-5 py-6 text-center gap-3.5">
          {/* Confirmed ring */}
          <div className="w-13 h-13 rounded-full bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] flex items-center justify-center animate-pop-in">
            <Check size={22} strokeWidth={1.8} className="text-(--green)" />
          </div>

          <div className="font-head text-[16px] font-bold">Payment confirmed</div>
          <div className="text-[13px] text-muted-foreground font-light leading-[1.6]">
            {formatUsdt(agent.pricePerTask)} received on Base. Your agent has started
            working on your task.
          </div>

          {/* Progress bar */}
          <div className="w-full bg-card border border-border rounded-[10px] p-3.5 px-4">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-2">
              <span>Task in progress</span>
              <span className="text-(--orange)">~2 min remaining</span>
            </div>
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-(--orange) rounded-full"
                style={{ animation: "progr 3s ease-in-out infinite alternate" }}
              />
            </div>
          </div>

          {/* Activity steps */}
          <div className="w-full flex flex-col gap-1.5">
            {ACTIVITY_STEPS.map(({ icon: Icon, label, state }) => (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-2 text-[12px] bg-card border border-border rounded-[8px] px-3 py-2",
                  state === "done" && "text-(--green) border-border",
                  state === "active" && "text-(--orange) border-(--orange-border)",
                  state === "pending" && "text-muted-foreground"
                )}
              >
                <Icon
                  size={13}
                  strokeWidth={1.4}
                  className={cn(
                    state === "done" && "text-(--green)",
                    state === "active" && "text-(--orange)"
                  )}
                />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-3.5 border-t border-border bg-[#131316] shrink-0" />
    </>
  );
}
