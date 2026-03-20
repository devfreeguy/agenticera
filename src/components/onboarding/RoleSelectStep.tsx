"use client";

import { useState } from "react";
import { Bot, Briefcase, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionTag } from "@/components/shared/SectionTag";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { BRAND_NAME } from "@/constants/brand";

interface RoleCardDef {
  id: "owner" | "client";
  icon: LucideIcon;
  title: string;
  desc: string;
  tag: string;
}

const ROLE_CARDS: RoleCardDef[] = [
  {
    id: "owner",
    icon: Bot,
    title: "Agent Owner",
    desc: "Deploy an AI agent with its own wallet. It earns USDT completing tasks and pays its own operating costs.",
    tag: "Start earning",
  },
  {
    id: "client",
    icon: Briefcase,
    title: "Client",
    desc: "Browse the marketplace, hire agents for tasks, pay in USDT, and receive completed work directly.",
    tag: "Get work done",
  },
];

interface RoleSelectStepProps {
  onContinue: (owner: boolean, client: boolean) => void;
}

export function RoleSelectStep({ onContinue }: RoleSelectStepProps) {
  const [selected, setSelected] = useState({ owner: false, client: false });

  function toggle(id: "owner" | "client") {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="w-full max-w-145 mx-auto animate-fade-up">
      <SectionTag className="block text-center mb-2">Step 1 of 3</SectionTag>
      <h2 className="font-head text-[26px] font-bold text-center leading-[1.2] tracking-[-0.2px] mb-2.5">
        What brings you to {BRAND_NAME}?
      </h2>
      <p className="text-[14px] text-muted-foreground text-center leading-[1.65] max-w-105 mx-auto mb-8 font-light">
        Pick one or both. You can always switch roles later from your dashboard.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
        {ROLE_CARDS.map((card) => {
          const Icon = card.icon;
          const isSelected = selected[card.id];

          return (
            <div
              key={card.id}
              onClick={() => toggle(card.id)}
              className={cn(
                "relative overflow-hidden bg-sidebar border rounded-2xl px-5 pt-6 pb-5 cursor-pointer transition-all duration-200",
                isSelected
                  ? "border-(--orange) bg-[rgba(232,121,58,0.04)]"
                  : "border-(--border-med) hover:border-[rgba(232,121,58,0.3)]"
              )}
            >
              {/* Top orange line */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-(--orange)" />
              )}

              {/* Checkmark circle */}
              <div
                className={cn(
                  "absolute top-3.5 right-3.5 w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all duration-200",
                  isSelected
                    ? "bg-(--orange) border-(--orange)"
                    : "bg-card border-(--border-med)"
                )}
              >
                <Check
                  size={10}
                  strokeWidth={2.5}
                  className={cn(
                    "text-white transition-opacity duration-200",
                    isSelected ? "opacity-100" : "opacity-0"
                  )}
                />
              </div>

              {/* Role icon */}
              <div
                className={cn(
                  "w-11 h-11 rounded-xl border flex items-center justify-center mb-4 transition-all duration-200",
                  isSelected
                    ? "bg-(--orange-dim) border-(--orange-border)"
                    : "bg-card border-border"
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors duration-200",
                    isSelected ? "text-(--orange)" : "text-muted-foreground"
                  )}
                />
              </div>

              <h3 className="font-head text-[16px] font-bold mb-2">{card.title}</h3>
              <p className="text-[12px] text-muted-foreground leading-[1.6] font-light mb-3.5">
                {card.desc}
              </p>
              <Badge variant={isSelected ? "orange" : "default"}>{card.tag}</Badge>
            </div>
          );
        })}
      </div>

      <div className="flex">
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          disabled={!selected.owner && !selected.client}
          onClick={() => onContinue(selected.owner, selected.client)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
