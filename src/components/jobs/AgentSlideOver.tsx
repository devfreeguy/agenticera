"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { HireFlow, type HireStep } from "@/components/jobs/HireFlow";
import { cn } from "@/lib/utils";
import type { AgentPublic, JobWithRelations, WalletUser } from "@/types/index";

interface AgentSlideOverProps {
  agent: AgentPublic | null;
  open: boolean;
  onClose: () => void;
  user: WalletUser | null;
  onJobAdded: (job: JobWithRelations) => void;
  showToast: (msg: string) => void;
  initialStep?: HireStep;
  initialJobId?: string;
  initialTaskDescription?: string;
}

const STEP_LABELS: Record<HireStep, string> = {
  detail: "Detail",
  describe: "Describe task",
  review: "Review & pay",
  waiting: "Waiting",
  running: "In progress",
  delivered: "Delivered",
};

const STEP_DOT_INDEX: Record<HireStep, number> = {
  detail: 1,
  describe: 2,
  review: 3,
  waiting: 4,
  running: 5,
  delivered: 5,
};

const TOTAL_DOTS = 5;

export function AgentSlideOver({
  agent,
  open,
  onClose,
  user,
  onJobAdded,
  showToast,
  initialStep,
  initialJobId,
  initialTaskDescription,
}: AgentSlideOverProps) {
  const [step, setStep] = useState<HireStep>(initialStep || "detail");

  useEffect(() => {
    setStep(initialStep || "detail");
  }, [agent?.id, initialStep]);

  // Reset when closed — but not mid-job (let it run in background)
  useEffect(() => {
    if (!open && step !== "running" && step !== "waiting") {
      const t = setTimeout(() => setStep("detail"), 300);
      return () => clearTimeout(t);
    }
  }, [open, step]);

  const activeDot = STEP_DOT_INDEX[step];

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="flex flex-col z-101"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          {/* Step dots */}
          <div className="flex items-center gap-1.25">
            {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
              const dotNum = i + 1;
              const isDone = dotNum < activeDot;
              const isActive = dotNum === activeDot;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-5 h-0.75 rounded-sm transition-colors duration-250",
                    isDone && "bg-[rgba(34,197,94,0.35)]",
                    isActive && "bg-(--orange)",
                    !isDone && !isActive && "bg-secondary"
                  )}
                />
              );
            })}
            <span className="text-[11px] text-muted-foreground ml-1.5">
              {STEP_LABELS[step]}
            </span>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-7.5 h-7.5 rounded-[7px] bg-card border border-(--border-med) flex items-center justify-center cursor-pointer hover:border-(--border-med) transition-colors"
          >
            <X size={14} strokeWidth={1.5} className="text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        {agent && (
          <HireFlow
            agent={agent}
            user={user}
            step={step}
            onStepChange={setStep}
            onClose={onClose}
            onJobAdded={onJobAdded}
            showToast={showToast}
            initialJobId={initialJobId}
            initialTaskDescription={initialTaskDescription}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
