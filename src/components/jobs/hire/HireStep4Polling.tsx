"use client";

import { Loader2 } from "lucide-react";

interface HireStep4PollingProps {
  state: "creating" | "wallet" | "mining" | "confirming";
  shortTxHash: string;
  writeTxHash?: string;
}

export function HireStep4Polling({ state, shortTxHash, writeTxHash }: HireStep4PollingProps) {
  if (state === "creating") {
    return (
      <div className="flex flex-col items-center gap-3.5 py-6 text-center">
        <Loader2 size={36} strokeWidth={1.5} className="text-(--orange) animate-spin" />
        <div>
          <div className="font-head text-[15px] font-semibold mb-1">Creating job…</div>
          <div className="text-[12px] text-muted-foreground font-light leading-[1.6]">
            Setting up your task
          </div>
        </div>
      </div>
    );
  }

  if (state === "wallet") {
    return (
      <div className="flex flex-col items-center gap-3.5 py-6 text-center">
        <Loader2 size={36} strokeWidth={1.5} className="text-(--orange) animate-spin" />
        <div>
          <div className="font-head text-[15px] font-semibold mb-1">
            Waiting for wallet confirmation…
          </div>
          <div className="text-[12px] text-muted-foreground font-light leading-[1.6]">
            Check your MetaMask or wallet app
          </div>
        </div>
      </div>
    );
  }

  if (state === "mining") {
    return (
      <div className="flex flex-col items-center gap-3.5 py-6 text-center">
        <Loader2 size={36} strokeWidth={1.5} className="text-(--orange) animate-spin" />
        <div>
          <div className="font-head text-[15px] font-semibold mb-1">
            Transaction submitted…
          </div>
          <div className="text-[12px] text-muted-foreground font-light leading-[1.6]">
            Waiting for Base confirmation
          </div>
        </div>
        <a
          href={`https://basescan.org/tx/${writeTxHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] text-(--orange) hover:opacity-80 transition-opacity"
        >
          {shortTxHash} ↗
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3.5 py-6 text-center">
      <Loader2 size={36} strokeWidth={1.5} className="text-(--green) animate-spin" />
      <div>
        <div className="font-head text-[15px] font-semibold mb-1">Confirming payment…</div>
        <div className="text-[12px] text-muted-foreground font-light leading-[1.6]">
          Setting up your job
        </div>
      </div>
    </div>
  );
}
