"use client";

import { Copy, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUsdt } from "@/utils/format";
import type { AgentPublic } from "@/types/index";

interface HireStep1DetailProps {
  agent: AgentPublic;
  isActive: boolean;
  avatarBg: string;
  initial: string;
  onHire: () => void;
  copyText: (text: string) => void;
}

export function HireStep1Detail({
  agent,
  isActive,
  avatarBg,
  initial,
  onHire,
  copyText,
}: HireStep1DetailProps) {
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-5.5 [scrollbar-width:thin] [scrollbar-color:var(--bg4)_transparent]">
        {/* Hero */}
        <div className="flex items-center gap-3 mb-4.5">
          <div
            className="w-13 h-13 rounded-[13px] flex items-center justify-center shrink-0 font-head text-[22px] font-bold text-foreground"
            style={{ background: avatarBg }}
          >
            {initial}
          </div>
          <div>
            <div className="font-head text-[18px] font-bold flex items-center gap-1.5">
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isActive ? "bg-(--green)" : "bg-(--hint)"
                )}
              />
              {agent.name}
            </div>
          </div>
        </div>

        {/* System prompt */}
        <div className="bg-card border border-border rounded-[11px] p-3.5 px-4 mb-3">
          <div className="text-[10px] text-(--hint) uppercase tracking-[0.06em] mb-2">
            System prompt
          </div>
          <div className="max-h-48 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--bg4)_transparent]">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="text-[13px] text-muted-foreground leading-relaxed font-light mb-2 last:mb-0">
                    {children}
                  </p>
                ),
                h1: ({ children }) => (
                  <h1 className="font-head text-[15px] font-bold text-foreground mb-1.5 mt-3 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="font-head text-[14px] font-bold text-foreground mb-1.5 mt-3 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="font-head text-[13px] font-semibold text-foreground mb-1 mt-2.5 first:mt-0">
                    {children}
                  </h3>
                ),
                strong: ({ children }) => (
                  <strong className="text-foreground font-medium">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="text-muted-foreground italic">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside text-[13px] text-muted-foreground space-y-0.5 mb-2 font-light">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside text-[13px] text-muted-foreground space-y-0.5 mb-2 font-light">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                code: ({ children }) => (
                  <code className="font-mono text-[12px] bg-[var(--bg4)] text-foreground rounded px-1 py-0.5">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="font-mono text-[12px] bg-[var(--bg4)] text-foreground rounded-[6px] px-3 py-2.5 overflow-x-auto mb-2">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-(--border-med) pl-3 text-[13px] text-muted-foreground italic mb-2">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {agent.systemPrompt}
            </ReactMarkdown>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card border border-border rounded-[11px] mb-3 overflow-hidden">
          {[
            {
              label: "Rating",
              value: (
                <span>
                  <span className="text-amber-400">★</span> {agent.rating.toFixed(1)}
                </span>
              ),
            },
            { label: "Jobs completed", value: agent.jobsCompleted.toString() },
            {
              label: "Price per task",
              value: (
                <span className="font-mono text-(--orange)">
                  {formatUsdt(agent.pricePerTask)}
                </span>
              ),
            },
            {
              label: "Network",
              value: <Badge variant="orange">Base</Badge>,
            },
          ].map(({ label, value }, i, arr) => (
            <div
              key={label}
              className={cn(
                "flex items-center justify-between px-4 py-2.25 text-[13px]",
                i < arr.length - 1 && "border-b border-border"
              )}
            >
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-right">{value}</span>
            </div>
          ))}
        </div>

        {/* Wallet address */}
        <div className="bg-card border border-border rounded-[11px] p-3.5 px-4">
          <div className="text-[10px] text-(--hint) uppercase tracking-[0.06em] mb-2">
            Wallet address
          </div>
          <div className="flex items-start gap-2">
            <div className="font-mono text-[11px] text-foreground break-all leading-[1.6] flex-1">
              {agent.walletAddress}
            </div>
            <button
              onClick={() => copyText(agent.walletAddress)}
              className="w-6 h-6 rounded-[5px] bg-secondary border border-border flex items-center justify-center cursor-pointer shrink-0 hover:border-(--border-med) transition-colors"
            >
              <Copy size={11} strokeWidth={1.3} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-border bg-[#131316] shrink-0">
        <Button
          variant="primary"
          size="md"
          disabled={!isActive}
          onClick={onHire}
          className="w-full py-3.25 rounded-[10px] text-[14px] font-semibold tracking-[0.01em]"
        >
          <Plus size={15} strokeWidth={1.5} />
          {isActive ? "Hire this agent" : "Agent is paused"}
        </Button>
      </div>
    </>
  );
}
