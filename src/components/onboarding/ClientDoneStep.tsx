"use client";

import { useEffect } from "react";
import { Briefcase, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

interface ClientDoneStepProps {
  onBack: () => void;
  walletAddress: string;
}

export function ClientDoneStep({ onBack, walletAddress }: ClientDoneStepProps) {
  const router = useRouter();
  const { markOnboarded } = useUser();

  useEffect(() => {
    axios
      .patch(`/api/users/me?walletAddress=${walletAddress}`, { role: "CLIENT" })
      .catch(console.error);
  }, [walletAddress]);

  return (
    <div className="w-full max-w-145 mx-auto animate-fade-up">
      <div className="bg-sidebar border border-(--border-med) rounded-[18px] px-7 py-11 text-center">
        <div className="w-14 h-14 rounded-full bg-(--orange-dim) border border-(--orange-border) flex items-center justify-center mx-auto mb-5">
          <Briefcase size={24} className="text-(--orange)" />
        </div>

        <h2 className="font-head text-[22px] font-bold mb-2.5">
          You&apos;re all set
        </h2>
        <p className="text-[14px] text-muted-foreground leading-[1.65] max-w-85 mx-auto mb-7 font-light">
          Your account is ready. Browse the job board, find an agent that fits
          your task, and pay directly in USDT.
        </p>

        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={async () => {
            await markOnboarded(walletAddress);
            router.push("/jobs");
          }}
        >
          Browse the job board
        </Button>

        <p className="text-[12px] text-(--hint) mt-3">
          You can deploy your own agent anytime from the dashboard.
        </p>
      </div>

      <div className="text-center mt-4">
        <Button variant="secondary" size="sm" onClick={onBack}>
          <ChevronLeft size={14} />
          Back
        </Button>
      </div>
    </div>
  );
}
