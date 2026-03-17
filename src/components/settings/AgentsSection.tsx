"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AgentSettingRow } from "@/components/settings/AgentSettingRow";
import type { AgentPublic } from "@/types/index";

interface AgentsSectionProps {
  agents: AgentPublic[];
  onUpdateAgent: (id: string, updates: Partial<AgentPublic>) => void;
  onToast: (msg: string) => void;
}

type OpenEdit = { agentId: string; type: "prompt" | "price" } | null;

export function AgentsSection({ agents, onUpdateAgent, onToast }: AgentsSectionProps) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState<OpenEdit>(null);

  function handleOpenEdit(agentId: string, type: "prompt" | "price") {
    setOpenEdit({ agentId, type });
  }

  function handleCloseEdit() {
    setOpenEdit(null);
  }

  return (
    <div id="s-agents" className="bg-sidebar border-[0.5px] border-(--border-med) rounded-[16px] overflow-hidden">
      {/* Header */}
      <div className="px-[22px] py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-[9px]">
          <div className="w-[30px] h-[30px] rounded-[8px] bg-card border-[0.5px] border-border flex items-center justify-center shrink-0">
            <svg viewBox="0 0 15 15" className="w-[14px] h-[14px] stroke-muted-foreground" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="9" height="8" rx="2"/>
              <path d="M5 4V3a2.5 2.5 0 0 1 5 0v1"/>
              <circle cx="7.5" cy="8" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div>
            <div className="font-head text-[14px] font-semibold">My agents</div>
            <div className="text-[12px] text-(--hint) mt-[1px]">
              {agents.length} deployed
            </div>
          </div>
        </div>
        <div className="text-[11px] text-(--hint) font-mono">
          {agents.length} / 5 slots used
        </div>
      </div>

      {/* Agent rows */}
      <div>
        {agents.length === 0 ? (
          <div className="px-[22px] py-8 text-center text-[13px] text-muted-foreground">
            No agents deployed yet.
          </div>
        ) : (
          agents.map((agent, i) => (
            <AgentSettingRow
              key={agent.id}
              agent={agent}
              isLast={i === agents.length - 1}
              openEdit={openEdit?.agentId === agent.id ? openEdit.type : null}
              onOpenEdit={(type) => handleOpenEdit(agent.id, type)}
              onCloseEdit={handleCloseEdit}
              onUpdateAgent={onUpdateAgent}
              onToast={onToast}
            />
          ))
        )}
      </div>

      {/* Deploy new */}
      <div className="px-[22px] py-3.5 flex items-center justify-center border-t border-border">
        <button
          onClick={() => router.push("/agents/new")}
          className="flex items-center gap-[7px] px-[18px] py-[9px] bg-(--orange-dim) border-[0.5px] border-(--orange-border) rounded-[9px] text-[13px] font-medium text-(--orange) hover:bg-(--orange-dim)/[1.8] transition-colors cursor-pointer"
        >
          <Plus size={13} strokeWidth={1.5} />
          Deploy new agent
        </button>
      </div>
    </div>
  );
}
