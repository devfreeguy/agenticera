"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { LogoMark } from "@/components/shared/LogoMark";
import { AddressDisplay } from "@/components/shared/AddressDisplay";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { RoleSelectStep } from "@/components/onboarding/RoleSelectStep";
import { AgentSetupStep } from "@/components/onboarding/AgentSetupStep";
import { ClientDoneStep } from "@/components/onboarding/ClientDoneStep";

type TopStep = "role" | "agent-setup" | "client-done";

export default function OnboardingPage() {
  const { user, address, isConnected, isHydrated } = useUser();
  const router = useRouter();
  const [topStep, setTopStep] = useState<TopStep>("role");
  const [progressStep, setProgressStep] = useState<1 | 2 | 3>(1);
  const [isClientAlso, setIsClientAlso] = useState(false);

  useEffect(() => {
    if (isHydrated && !isConnected) router.replace("/connect");
    else if (user?.onboarded) router.replace("/dashboard");
  }, [isHydrated, isConnected, user, router]);

  if (!isHydrated) return null;
  if (!isConnected || user?.onboarded) return null;

  function handleRoleContinue(owner: boolean, client: boolean) {
    setIsClientAlso(client);
    if (owner) {
      setTopStep("agent-setup");
    } else {
      setTopStep("client-done");
    }
    setProgressStep(2);
  }

  function handleBack() {
    setTopStep("role");
    setProgressStep(1);
  }

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow */}
      <div
        className="fixed -top-20 left-1/2 -translate-x-1/2 w-150 h-90 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(232,121,58,0.11) 0%, transparent 65%)",
        }}
      />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-4.5 border-b border-border">
        <Link
          href="/"
          className="flex items-center gap-2.25 font-head text-[16px] font-semibold text-foreground"
        >
          <LogoMark size={27} />
          AgentBank
        </Link>
        {address && (
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-2.5 py-1">
            <span className="w-1.25 h-1.25 rounded-full bg-(--green) shrink-0" />
            <AddressDisplay address={address} />
          </div>
        )}
      </nav>

      {/* Progress bar */}
      <ProgressBar step={progressStep} />

      {/* Main content */}
      <main className="relative z-1 flex-1 flex items-start justify-center px-6 py-9 pb-20">
        {topStep === "role" && (
          <RoleSelectStep onContinue={handleRoleContinue} />
        )}

        {topStep === "agent-setup" && (
          <AgentSetupStep
            onBack={handleBack}
            onProgressChange={(s) => setProgressStep(s)}
            ownerId={user?.id ?? ""}
            walletAddress={address ?? ""}
            isClientAlso={isClientAlso}
          />
        )}

        {topStep === "client-done" && (
          <ClientDoneStep onBack={handleBack} walletAddress={address ?? ""} />
        )}
      </main>
    </div>
  );
}
