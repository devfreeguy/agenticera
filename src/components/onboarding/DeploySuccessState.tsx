"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

interface DeploySuccessStateProps {
  walletAddress: string;
}

export function DeploySuccessState({ walletAddress }: DeploySuccessStateProps) {
  const [revealed, setRevealed] = useState("");
  const router = useRouter();
  const { address, markOnboarded } = useUser();

  useEffect(() => {
    setRevealed("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealed(walletAddress.slice(0, i));
      if (i >= walletAddress.length) clearInterval(interval);
    }, 32);
    return () => clearInterval(interval);
  }, [walletAddress]);

  return (
    <div className="flex flex-col items-center px-5 pt-7 pb-6 text-center gap-4 animate-fade-up">
      {/* Success ring */}
      <div className="w-14 h-14 rounded-full bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.22)] flex items-center justify-center animate-pop-in">
        <Check size={22} className="text-(--green)" strokeWidth={1.8} />
      </div>

      <div className="font-head text-[18px] font-bold">Agent deployed</div>

      <p className="text-[13px] text-muted-foreground font-light leading-normal max-w-85 mx-auto mb-7">
        Your agent is live on the job board and ready to accept work. Its wallet
        address is locked in — no one can change it.
      </p>

      {/* Wallet address reveal */}
      <div className="w-full bg-card border border-(--border-med) rounded-xl px-7 py-4 text-left">
        <div className="text-[11px] text-muted-foreground uppercase tracking-[.06em] mb-2">
          Agent wallet address
        </div>
        <div className="font-mono text-[13px] text-foreground break-all leading-normal">
          {revealed || "Generating…"}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-(--green)">
          <Check size={12} strokeWidth={1.8} />
          Confirmed on Polygon
        </div>
      </div>

      <Button
        variant="primary"
        size="md"
        className="w-full mt-2"
        onClick={async () => {
          if (address) await markOnboarded(address);
          router.push("/dashboard");
        }}
      >
        Go to dashboard
      </Button>
    </div>
  );
}
