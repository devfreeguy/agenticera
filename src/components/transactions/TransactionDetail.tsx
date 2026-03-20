"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getExplorerTxUrl } from "@/utils/format";
import type { SerializedTransaction } from "@/utils/serialize";

const TYPE_LABELS: Record<string, string> = {
  EARNED: "Earned",
  SPENT: "Spent",
  WITHDRAWAL: "Withdrawal",
  SUB_AGENT_PAYMENT: "Agent payment",
};

interface TransactionDetailProps {
  transaction: SerializedTransaction;
  amountDisplay: string;
  isExpanded: boolean;
}

export function TransactionDetail({
  transaction,
  amountDisplay,
  isExpanded,
}: TransactionDetailProps) {
  const [copied, setCopied] = useState(false);

  if (!isExpanded) return null;

  function copyHash() {
    if (!transaction.txHash) return;
    navigator.clipboard.writeText(transaction.txHash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const fullDate = new Date(transaction.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-card border-[0.5px] border-(--border-med) border-t-0 rounded-[0_0_10px_10px] px-4 py-3.5 pl-[38px] mb-1.5 grid grid-cols-3 max-[640px]:grid-cols-2 gap-2">
      <DetailItem label="Description">
        <span className="text-[12px] text-foreground leading-[1.5]">
          {transaction.description}
        </span>
      </DetailItem>

      <DetailItem label="Amount">
        <span className="text-[12px] text-foreground font-mono">{amountDisplay} USDT</span>
      </DetailItem>

      <DetailItem label="Type">
        <span className="text-[12px] text-foreground">
          {TYPE_LABELS[transaction.type] ?? transaction.type}
        </span>
      </DetailItem>

      <DetailItem label="Tx Hash">
        {transaction.txHash ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[11px] text-muted-foreground break-all">
              {transaction.txHash}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={copyHash}
                className="text-(--hint) hover:text-foreground transition-colors cursor-pointer"
                title="Copy hash"
              >
                <Copy size={10} strokeWidth={1.4} />
              </button>
              <a
                href={getExplorerTxUrl(transaction.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-(--hint) hover:text-[#3b82f6] transition-colors"
                title="View on Basescan"
              >
                <ExternalLink size={10} strokeWidth={1.4} />
              </a>
            </div>
            {copied && (
              <span className="text-[10px] text-(--green)">Copied</span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-(--hint)">—</span>
        )}
      </DetailItem>

      <DetailItem label="Network">
        <span className="text-[12px] text-foreground">Base</span>
      </DetailItem>

      <DetailItem label="Time">
        <span className="text-[11px] text-muted-foreground">{fullDate}</span>
      </DetailItem>
    </div>
  );
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[3px]">
      <div className="text-[10px] text-(--hint) uppercase tracking-[0.05em]">{label}</div>
      <div>{children}</div>
    </div>
  );
}
