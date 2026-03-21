"use client";

import { CheckCircle2, Copy, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/shared/StarRating";
import type { AgentPublic, JobWithRelations } from "@/types/index";

function isJsonOutput(output: string): boolean {
  const trimmed = output.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function JsonOutput({ raw }: { raw: string }) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return (
      <pre className="font-mono text-[12px] leading-[1.6] whitespace-pre-wrap break-all text-muted-foreground">
        {raw}
      </pre>
    );
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return (
      <dl className="space-y-3">
        {Object.entries(parsed as Record<string, unknown>).map(([key, val]) => (
          <div key={key}>
            <dt className="text-[10px] text-(--hint) uppercase tracking-[.06em] font-medium mb-0.5">{key}</dt>
            <dd className="text-[13px] text-foreground leading-[1.65]">{String(val)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  if (Array.isArray(parsed)) {
    return (
      <ul className="space-y-1.5 list-disc list-inside">
        {(parsed as unknown[]).map((item, i) => (
          <li key={i} className="text-[13px] text-muted-foreground leading-[1.65]">
            {typeof item === "object" ? JSON.stringify(item, null, 2) : String(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <pre className="font-mono text-[12px] leading-[1.6] whitespace-pre-wrap break-all text-muted-foreground">
      {raw}
    </pre>
  );
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
  const isFailed = activeJob.status === "FAILED";

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:thin] [scrollbar-color:var(--bg4)_transparent]">
        {/* Agent + status */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0 font-head text-[16px] font-bold text-white"
            style={{ background: avatarBg }}
          >
            {initial}
          </div>
          <div className="w-full flex items-center gap-2">
            <div className="font-head text-[14px] font-semibold leading-none flex-1">
              {agent.name}
            </div>
            {isFailed ? (
              <Badge
                variant="outline"
                className="mb-1 gap-1.5 px-2.5 py-1 text-[11px] bg-[rgba(239,68,68,0.07)] text-[#ef4444] border-[rgba(239,68,68,0.2)]"
              >
                <AlertTriangle size={11} strokeWidth={1.4} />
                Refunded
              </Badge>
            ) : (
              <Badge
                variant="green"
                className="mb-1 gap-1.5 px-2.5 py-1 text-[11px]"
              >
                <CheckCircle2 size={11} strokeWidth={1.4} />
                Delivered
              </Badge>
            )}
          </div>
        </div>

        {/* Output box */}
        <div
          className={`border rounded-[11px] overflow-hidden mb-3.5 ${
            isFailed
              ? "bg-[rgba(239,68,68,0.04)] border-[rgba(239,68,68,0.15)]"
              : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)]"
          }`}
        >
          <div className="flex justify-between items-center px-4 py-2.5 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[10px] text-(--hint) uppercase tracking-[.06em] font-medium">
              {isFailed ? "Agent decision" : "Task output"}
            </span>
            <button
              onClick={() => copyText(output)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[5px] text-[11px] text-muted-foreground hover:border-[rgba(255,255,255,0.18)] transition-colors cursor-pointer"
            >
              <Copy size={10} strokeWidth={1.4} />
              Copy
            </button>
          </div>
          <div className="p-4 max-h-60 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--bg4)_transparent]">
            {output ? (
              looksLikeJson ? (
                <JsonOutput raw={output} />
              ) : (
                <div className="prose prose-sm prose-invert max-w-none text-[13px] leading-[1.7] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_code]:bg-[rgba(255,255,255,0.07)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_pre]:bg-[rgba(255,255,255,0.05)] [&_pre]:p-3 [&_pre]:rounded-[8px] [&_pre]:overflow-x-auto">
                  <ReactMarkdown>{output}</ReactMarkdown>
                </div>
              )
            ) : (
              <p className="text-[13px] text-muted-foreground">No output received.</p>
            )}
          </div>
        </div>

        {/* Rating */}
        {!isFailed && (
          <div className="flex justify-center py-2">
            <StarRating
              jobId={activeJob.id}
              initialRating={activeJob.clientRating}
            />
          </div>
        )}
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
          className="w-full py-3 rounded-[10px] text-[14px] font-semibold"
        >
          Go to dashboard
        </Button>
      </div>
    </>
  );
}
