"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { MainTopbar } from "@/components/layout/MainTopbar";
import { AgentSetupStep } from "@/components/onboarding/AgentSetupStep";

export default function NewAgentPage() {
  const router = useRouter();
  const { user, address } = useUser();

  return (
    <>
      <MainTopbar title="Deploy Agent" />
      <main className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--bg4)_transparent]">
        <div className="px-6.5 py-7 max-[560px]:px-3.5 max-[560px]:py-4">
          <AgentSetupStep
            onBack={() => router.push("/dashboard")}
            onProgressChange={() => {}}
            ownerId={user?.id ?? ""}
            walletAddress={address ?? ""}
            isClientAlso={false}
            hideStepLabel
          />
        </div>
      </main>
    </>
  );
}
