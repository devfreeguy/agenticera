"use client";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "s-profile", label: "Profile" },
  { id: "s-agents", label: "Agents" },
  { id: "s-notifs", label: "Notifications" },
  { id: "s-danger", label: "Danger zone" },
] as const;

interface SettingsSectionNavProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

export function SettingsSectionNav({ activeSection, onNavigate }: SettingsSectionNavProps) {
  return (
    <div className="flex gap-1 flex-wrap mb-[18px]">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={cn(
            "px-[11px] py-[5px] rounded-[7px] text-[12px] border-[0.5px] border-transparent cursor-pointer transition-all",
            activeSection === item.id
              ? "text-(--orange) bg-(--orange-dim) border-(--orange-border)"
              : "text-(--hint) hover:text-muted-foreground hover:bg-card"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
