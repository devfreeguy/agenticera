"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatTxHash, getExplorerTxUrl } from "@/utils/format";
import { TransactionDetail } from "@/components/transactions/TransactionDetail";
import type { SerializedTransaction } from "@/utils/serialize";

const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    dotClass: string;
    amountPrefix: string;
    amountClass: string;
    badgeClass: string;
  }
> = {
  EARNED: {
    label: "Earned",
    dotClass: "bg-(--green)",
    amountPrefix: "+",
    amountClass: "text-(--green)",
    badgeClass:
      "bg-[rgba(34,197,94,0.1)] border-[0.5px] border-[rgba(34,197,94,0.2)] text-(--green)",
  },
  SPENT: {
    label: "Spent",
    dotClass: "bg-(--orange)",
    amountPrefix: "-",
    amountClass: "text-(--orange)",
    badgeClass: "bg-(--orange-dim) border-[0.5px] border-(--orange-border) text-(--orange)",
  },
  WITHDRAWAL: {
    label: "Withdrawal",
    dotClass: "bg-[#3b82f6]",
    amountPrefix: "-",
    amountClass: "text-[#3b82f6]",
    badgeClass:
      "bg-[rgba(59,130,246,0.1)] border-[0.5px] border-[rgba(59,130,246,0.2)] text-[#3b82f6]",
  },
  SUB_AGENT_PAYMENT: {
    label: "Agent payment",
    dotClass: "bg-[#8b5cf6]",
    amountPrefix: "-",
    amountClass: "text-[#8b5cf6]",
    badgeClass:
      "bg-[rgba(139,92,246,0.1)] border-[0.5px] border-[rgba(139,92,246,0.22)] text-[#8b5cf6]",
  },
};

const TAG_PALETTES = [
  { bg: "rgba(99,102,241,0.12)", color: "rgba(139,130,255,0.85)", border: "rgba(99,102,241,0.2)" },
  { bg: "rgba(251,146,60,0.10)", color: "rgba(232,121,58,0.85)", border: "rgba(251,146,60,0.2)" },
  { bg: "rgba(34,197,94,0.09)", color: "rgba(34,197,94,0.85)", border: "rgba(34,197,94,0.2)" },
  { bg: "rgba(59,130,246,0.10)", color: "rgba(59,130,246,0.85)", border: "rgba(59,130,246,0.2)" },
  {
    bg: "rgba(139,92,246,0.10)",
    color: "rgba(139,92,246,0.85)",
    border: "rgba(139,92,246,0.22)",
  },
  { bg: "rgba(236,72,153,0.10)", color: "rgba(236,72,153,0.85)", border: "rgba(236,72,153,0.2)" },
];

function getAgentTagStyle(agentId: string) {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = (hash * 31 + agentId.charCodeAt(i)) | 0;
  }
  return TAG_PALETTES[Math.abs(hash) % TAG_PALETTES.length];
}


interface TransactionRowProps {
  transaction: SerializedTransaction;
  agentName: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function TransactionRow({
  transaction,
  agentName,
  isExpanded,
  onToggle,
}: TransactionRowProps) {
  const cfg = TYPE_CONFIG[transaction.type] ?? TYPE_CONFIG.SPENT;
  const tagStyle = getAgentTagStyle(transaction.agentId);
  const rawAmount = parseFloat(transaction.amountUsdt);
  const formattedAmount =
    rawAmount !== 0 && rawAmount < 0.01
      ? rawAmount.toFixed(4)
      : rawAmount.toFixed(2) === "0.00" || rawAmount.toFixed(2) === "-0.00"
        ? "<0.01"
        : rawAmount.toFixed(2);
  const amountDisplay = `${cfg.amountPrefix}${formattedAmount}`;

  return (
    <>
      <div
        onClick={onToggle}
        className={cn(
          "flex items-center bg-sidebar border-[0.5px] border-(--border-med) px-3.5 py-3 transition-colors cursor-pointer hover:border-[rgba(255,255,255,0.18)]",
          isExpanded
            ? "rounded-[10px_10px_0_0] mb-0 border-b-0"
            : "rounded-[10px] mb-1.5"
        )}
      >
        {/* Dot */}
        <div className="w-6 flex-shrink-0 flex items-center justify-center">
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", cfg.dotClass)} />
        </div>

        {/* Agent tag */}
        <div className="w-26.5 shrink-0">
          <span
            className="inline-flex items-center font-mono text-[10px] px-[7px] py-[2px] rounded-[4px] max-w-25 truncate"
            style={{
              background: tagStyle.bg,
              color: tagStyle.color,
              border: `0.5px solid ${tagStyle.border}`,
            }}
          >
            {agentName}
          </span>
        </div>

        {/* Description */}
        <div className="flex-1 min-w-0 px-3.5">
          <div className="text-[13px] text-foreground truncate">{transaction.description}</div>
          <div className="mt-0.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] px-[7px] py-[2px] rounded-full",
                cfg.badgeClass
              )}
            >
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="w-[110px] flex-shrink-0 text-right">
          <span className={cn("font-mono text-[13px] font-medium", cfg.amountClass)}>
            {amountDisplay} USDT
          </span>
        </div>

        {/* Tx hash — hidden on mobile */}
        <div className="hidden min-[900px]:block w-[120px] flex-shrink-0 pl-3.5">
          {transaction.txHash ? (
            <a
              href={getExplorerTxUrl(transaction.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 justify-end font-mono text-[11px] text-(--hint) hover:text-[#3b82f6] transition-colors"
            >
              {formatTxHash(transaction.txHash)}
              <ExternalLink size={10} strokeWidth={1.4} className="flex-shrink-0" />
            </a>
          ) : (
            <span className="block text-right font-mono text-[11px] text-(--hint)">—</span>
          )}
        </div>

        {/* Time — hidden on mobile */}
        <div className="hidden min-[900px]:block w-[60px] flex-shrink-0 text-right pl-2.5">
          <span className="text-[11px] text-(--hint) whitespace-nowrap">
            {formatRelativeTime(transaction.createdAt)}
          </span>
        </div>
      </div>

      <TransactionDetail
        transaction={transaction}
        amountDisplay={amountDisplay}
        isExpanded={isExpanded}
      />
    </>
  );
}
