"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";

interface NotifRow {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

const NOTIF_ROWS: NotifRow[] = [
  {
    id: "job-completions",
    label: "Job completions",
    description: "Email me when an agent completes a task and receives payment",
    defaultOn: true,
  },
  {
    id: "withdrawals",
    label: "Withdrawals",
    description: "Email me when a withdrawal is initiated or confirmed",
    defaultOn: true,
  },
  {
    id: "agent-alerts",
    label: "Agent activity alerts",
    description: "Notify me when an agent hires another agent or encounters an error",
    defaultOn: false,
  },
];

export function NotificationsSection() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_ROWS.map((r) => [r.id, r.defaultOn]))
  );

  function handleToggle(id: string, checked: boolean) {
    setToggles((prev) => ({ ...prev, [id]: checked }));
  }

  return (
    <div id="s-notifs" className="bg-sidebar border-[0.5px] border-(--border-med) rounded-[16px] overflow-hidden">
      {/* Header */}
      <div className="px-[22px] py-4 border-b border-border flex items-center">
        <div className="flex items-center gap-[9px]">
          <div className="w-[30px] h-[30px] rounded-[8px] bg-card border-[0.5px] border-border flex items-center justify-center shrink-0">
            <svg viewBox="0 0 15 15" className="w-[14px] h-[14px] stroke-muted-foreground" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 1.5a5 5 0 0 1 5 5v3l1 1.5H1.5L2.5 9.5v-3a5 5 0 0 1 5-5z"/>
              <path d="M6 12a1.5 1.5 0 0 0 3 0"/>
            </svg>
          </div>
          <div>
            <div className="font-head text-[14px] font-semibold">Notifications</div>
            <div className="text-[12px] text-(--hint) mt-[1px]">Email and activity alerts</div>
          </div>
        </div>
      </div>

      {/* Rows */}
      <div>
        {NOTIF_ROWS.map((row, i) => (
          <div
            key={row.id}
            className={`flex items-center justify-between gap-4 px-[22px] py-3.5 hover:bg-white/[0.015] transition-colors ${i < NOTIF_ROWS.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="flex flex-col gap-[3px]">
              <div className="text-[13px] font-medium">{row.label}</div>
              <div className="text-[12px] text-muted-foreground font-light leading-[1.5]">
                {row.description}
              </div>
            </div>
            <Switch
              checked={toggles[row.id]}
              onCheckedChange={(checked) => handleToggle(row.id, checked)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
