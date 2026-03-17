"use client";

import { LogOut, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useState } from "react";

interface DangerSectionProps {
  onDisconnect: () => void;
}

export function DangerSection({ onDisconnect }: DangerSectionProps) {
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    setOpen(false);
    onDisconnect();
  }

  return (
    <div
      id="s-danger"
      className="bg-[rgba(239,68,68,0.03)] border-[0.5px] border-[rgba(239,68,68,0.14)] rounded-[16px] overflow-hidden"
    >
      {/* Header */}
      <div className="px-[22px] py-4 border-b border-[rgba(239,68,68,0.1)] flex items-center">
        <div className="flex items-center gap-[9px]">
          <div className="w-[30px] h-[30px] rounded-[8px] bg-[rgba(239,68,68,0.08)] border-[0.5px] border-[rgba(239,68,68,0.15)] flex items-center justify-center shrink-0">
            <TriangleAlert
              size={14}
              strokeWidth={1.4}
              className="text-destructive"
            />
          </div>
          <div>
            <div className="font-head text-[14px] font-semibold text-destructive">Danger zone</div>
            <div className="text-[12px] text-(--hint) mt-[1px]">Irreversible actions</div>
          </div>
        </div>
      </div>

      {/* Row */}
      <div className="px-[22px] py-4 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-[3px]">
          <div className="text-[13px] font-medium">Disconnect wallet</div>
          <div className="text-[12px] text-muted-foreground font-light leading-[1.5] max-w-[340px]">
            Removes your wallet connection from this session. Your agents will continue running and
            funds remain safe in their wallets. You can reconnect at any time.
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-[6px] px-4 py-[9px] bg-[rgba(239,68,68,0.1)] border-[0.5px] border-[rgba(239,68,68,0.22)] rounded-[9px] text-[13px] font-medium text-destructive hover:bg-[rgba(239,68,68,0.18)] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <LogOut size={13} strokeWidth={1.4} />
          Disconnect
        </button>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[360px] bg-sidebar border-(--border-med) p-7">
          <div className="flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-full bg-[rgba(239,68,68,0.1)] border-[0.5px] border-[rgba(239,68,68,0.2)] flex items-center justify-center mb-4">
              <TriangleAlert size={20} strokeWidth={1.4} className="text-destructive" />
            </div>
            <h3 className="font-head text-[16px] font-bold mb-2">Disconnect wallet?</h3>
            <p className="text-[13px] text-muted-foreground font-light leading-[1.65] mb-[22px]">
              Your agents will keep running and all funds stay safe in their wallets. You&apos;ll be
              returned to the connect screen.
            </p>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={handleConfirm}
                className="w-full py-3 bg-destructive text-white border-none rounded-[10px] font-head text-[14px] font-semibold cursor-pointer hover:opacity-[0.88] transition-opacity"
              >
                Yes, disconnect
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-full py-[11px] bg-transparent text-muted-foreground border-[0.5px] border-(--border-med) rounded-[10px] text-[13px] cursor-pointer hover:text-foreground hover:border-white/[0.18] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
