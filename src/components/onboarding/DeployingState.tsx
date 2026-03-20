"use client";

import { useEffect, useState } from "react";
import { KeyRound, Wallet, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

type StepStatus = "pending" | "active" | "done";

interface DeployStep {
  id: number;
  label: string;
  icon: LucideIcon;
  status: StepStatus;
  activeLabel: string;
  activeSub: string;
}

const INITIAL_STEPS: DeployStep[] = [
  {
    id: 1,
    label: "Generating wallet keypair",
    icon: KeyRound,
    status: "pending",
    activeLabel: "Generating wallet…",
    activeSub: "Creating unique keypair for your agent",
  },
  {
    id: 2,
    label: "Registering agent",
    icon: Wallet,
    status: "pending",
    activeLabel: "Registering on-chain…",
    activeSub: "Broadcasting wallet registration to Base",
  },
  {
    id: 3,
    label: "Listing on job board",
    icon: LayoutList,
    status: "pending",
    activeLabel: "Publishing to job board…",
    activeSub: "Your agent is going live now",
  },
];

interface DeployingStateProps {
  onComplete: () => void;
}

export function DeployingState({ onComplete }: DeployingStateProps) {
  const [steps, setSteps] = useState<DeployStep[]>(INITIAL_STEPS);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    INITIAL_STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setSteps((prev) =>
            prev.map((s, idx) => ({
              ...s,
              status: idx < i ? "done" : idx === i ? "active" : "pending",
            }))
          );
          setActiveIdx(i);
        }, i * 1100)
      );
    });

    // Mark all done, then call onComplete
    timers.push(
      setTimeout(() => {
        setSteps((prev) => prev.map((s) => ({ ...s, status: "done" })));
        setTimeout(onComplete, 400);
      }, INITIAL_STEPS.length * 1100)
    );

    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active = steps[activeIdx];

  return (
    <div className="flex flex-col items-center px-5 pt-7 pb-5 text-center gap-5 animate-fade-up">
      {/* Spinner */}
      <div className="w-12 h-12 rounded-full border-[1.5px] border-(--border-med) border-t-(--orange) animate-spin" />

      <div>
        <div className="font-head text-[15px] font-semibold">
          {active?.activeLabel ?? "Deploying agent…"}
        </div>
        <div className="text-[12px] text-muted-foreground font-light mt-0.5 leading-[1.6]">
          {active?.activeSub ?? "Generating wallet on Base"}
        </div>
      </div>

      {/* Step rows */}
      <div className="w-full">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className="flex items-center gap-2.5 py-2 border-b border-border last:border-b-0 text-[13px] text-left"
            >
              <Icon
                size={18}
                className={cn(
                  "shrink-0 transition-colors duration-300",
                  s.status === "done"
                    ? "text-(--green)"
                    : s.status === "active"
                    ? "text-(--orange)"
                    : "text-(--hint)"
                )}
              />
              <span
                className={cn(
                  "flex-1 transition-colors duration-300",
                  s.status === "pending" ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {s.label}
              </span>
              <span
                className={cn(
                  "text-[11px] transition-colors duration-300",
                  s.status === "done"
                    ? "text-(--green)"
                    : s.status === "active"
                    ? "text-(--orange)"
                    : "text-(--hint)"
                )}
              >
                {s.status === "done"
                  ? "Done"
                  : s.status === "active"
                  ? "…"
                  : "Pending"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
