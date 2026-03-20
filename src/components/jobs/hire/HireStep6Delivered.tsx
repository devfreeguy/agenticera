"use client";

import { Check, Copy, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AgentPublic, JobWithRelations } from "@/types/index";

function isJsonOutput(output: string): boolean {
  const trimmed = output.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

interface HireStep6DeliveredProps {
  agent: AgentPublic;
  avatarBg: string;
  initial: string;
  activeJob: JobWithRelations;
  copyText: (text: string) => void;
  onHireAgain: () => void;
  onDashboard: () => void;
}

export function HireStep6Delivered({
  agent,
  avatarBg,
  initial,
  activeJob,
  copyText,
  onHireAgain,
  onDashboard,
}: HireStep6DeliveredProps) {
  const output = activeJob.output ?? "";
  const looksLikeJson = isJsonOutput(output);
  
  // 🔥 Check if the job was rejected/failed so we can update the UI
  const isFailed = activeJob.status === "FAILED";

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-5.5 [scrollbar-width:thin] [scrollbar-color:var(--bg4)_transparent]">
        {/* Agent + Status badge */}
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-9.5 h-9.5 rounded-[10px] flex items-center justify-center shrink-0 font-head text-[15px] font-bold text-foreground"
            style={{ background: avatarBg }}
          >
            {initial}
          </div>
          <div>
            {isFailed ? (
              <Badge variant="outline" className="mb-1 gap-1.5 px-3 py-1.5 text-[12px] bg-destructive/10 text-destructive border-destructive/20">
                <AlertTriangle size={12} strokeWidth={1.4} />
                Refunded
              </Badge>
            ) : (
              <Badge variant="green" className="mb-1 gap-1.5 px-3 py-1.5 text-[12px]">
                <Check size={12} strokeWidth={1.4} />
                Delivered
              </Badge>
            )}
            <div className="font-head text-[14px] font-semibold">{agent.name}</div>
          </div>
        </div>

        {/* Output Box */}
        <div className={`border rounded-[11px] p-4 mb-3.5 ${isFailed ? 'bg-destructive/5 border-destructive/20' : 'bg-card border-(--border-med)'}`}>
          <div className="flex justify-between items-center mb-2.5 pb-2.5 border-b border-border">
            <span className="text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
              {isFailed ? "Agent Decision" : "Task output"}
            </span>
            <button
              onClick={() => copyText(output)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary border border-border rounded-[5px] text-[11px] text-muted-foreground hover:border-(--border-med) transition-colors cursor-pointer"
            >
              <Copy size={11} strokeWidth={1.3} />
              Copy
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--bg4)_transparent]">
            {output ? (
              looksLikeJson ? (
                <pre className={`font-mono text-[12px] leading-[1.6] whitespace-pre-wrap break-all ${isFailed ? 'text-destructive/90' : 'text-muted-foreground'}`}>
                  {output}
                </pre>
              ) : (
                <div className={`prose prose-sm prose-invert max-w-none text-[13px] leading-[1.7] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_code]:bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_pre]:bg-secondary [&_pre]:p-3 [&_pre]:rounded-[8px] [&_pre]:overflow-x-auto ${isFailed ? '[&_p]:text-destructive/90' : ''}`}>
                  <ReactMarkdown>{output}</ReactMarkdown>
                </div>
              )
            ) : (
              <p className="text-[13px] text-muted-foreground">No output received.</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-3.5 border-t border-border bg-[#131316] shrink-0 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="md"
          onClick={onHireAgain}
          className="w-full py-3 rounded-[10px] text-[13px]"
        >
          {isFailed ? "Try new prompt" : "Hire again"}
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={onDashboard}
          className="w-full py-3.25 rounded-[10px] text-[14px] font-semibold"
        >
          Dashboard
        </Button>
      </div>
    </>
  );
}