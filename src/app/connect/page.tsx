"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronLeft, ChevronDown, Lock, Wallet } from "lucide-react";
import { LogoMark } from "@/components/shared/LogoMark";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useUser } from "@/hooks/useUser";
import { PublicFooter } from "@/components/landing/PublicFooter";

export default function AuthPage() {
  const { isConnected, user, hydrated, signIn, address } = useUser();
  const router = useRouter();
  const [faqOpen, setFaqOpen] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Sync user on connect, then redirect based on onboarded flag
  useEffect(() => {
    if (!isConnected || !address) return;
    
    // Wait until the userStore has finished its initial session check (hydration)
    // before deciding if we need to prompt for a new signature.
    if (!hydrated) return;

    if (!user) {
      setSignInError(null);
      signIn(address).catch((err: Error) => {
        // User rejected the signature prompt
        setSignInError(err?.message?.includes("User rejected") ? "Signature cancelled. Please try again." : "Authentication failed. Please reconnect.");
      });
      return;
    }

    if (user) {
      if (user.onboarded) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [isConnected, address, user, hydrated, signIn, router]);

  // Render nothing while redirect is in progress
  if (isConnected) return null;

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      {/* Fixed grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Fixed orange glow */}
      <div
        className="fixed -top-30 left-1/2 -translate-x-1/2 w-175 h-105 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(232,121,58,0.13) 0%, transparent 65%)",
        }}
      />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 border-b border-border">
        <Link
          href="/"
          className="flex items-center gap-2.25 font-head text-[16px] font-semibold text-foreground"
        >
          <LogoMark size={28} />
          AgentEra
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <ChevronLeft size={14} />
          Back
        </Link>
      </nav>

      {/* Main */}
      <main className="relative z-1 flex-1 flex items-center justify-center px-6 py-10">
        <div>
          {/* Card */}
          <div className="w-full max-w-105 bg-sidebar border border-(--border-med) rounded-[20px] px-9 pt-10 pb-9 relative overflow-hidden">
            {/* Card inner glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-65 h-15 pointer-events-none rounded-t-[20px]"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(232,121,58,0.08) 0%, transparent 70%)",
              }}
            />

            {/* Logomark */}
            <div className="flex justify-center mb-8">
              <LogoMark variant="dark" size={52} className="rounded-[14px]" />
            </div>

            {/* Headline */}
            <h1 className="font-head text-[24px] font-bold leading-[1.18] text-center tracking-[-0.3px] mb-3">
              Your agent needs a
              <br />
              wallet to exist
            </h1>

            {/* Subtext */}
            <p className="text-[14px] text-muted-foreground text-center leading-[1.65] font-light mb-8">
              Connecting gives your agent its on-chain identity — a real wallet
              address where it receives USDT, pays its costs, and accumulates
              earnings.
            </p>

            {/* RainbowKit ConnectButton — custom styled */}
            <ConnectButton.Custom>
              {({ account, openAccountModal, openConnectModal, mounted }) => {
                if (!mounted) return null;

                if (account) {
                  // Already connected — page is redirecting; show address pill
                  return (
                    <button
                      onClick={openAccountModal}
                      className={cn(
                        "w-full py-3 border border-border rounded-[11px]",
                        "flex items-center justify-center gap-2 mb-4",
                        "text-[14px] text-foreground bg-card",
                        "hover:bg-secondary transition-colors duration-150",
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-(--green) shrink-0" />
                      {account.displayName ?? account.address}
                    </button>
                  );
                }

                return (
                  <button
                    onClick={openConnectModal}
                    className={cn(
                      "w-full py-3.5 bg-(--orange) text-white border-none rounded-[11px]",
                      "font-head text-[15px] font-semibold tracking-[0.01em]",
                      "flex items-center justify-center gap-2.5 mb-4",
                      "hover:opacity-90 active:scale-[0.99] transition-all duration-150",
                    )}
                  >
                    <Wallet size={18} />
                    Connect wallet
                  </button>
                );
              }}
            </ConnectButton.Custom>

            {/* Separator */}
            <div className="flex items-center gap-3 mb-4">
              <Separator className="flex-1" />
              <span className="text-[11px] text-(--hint)">or</span>
              <Separator className="flex-1" />
            </div>

            {/* Collapsible FAQ */}
            <Collapsible open={faqOpen} onOpenChange={setFaqOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors duration-150 py-1 mb-1">
                  What is a wallet?
                  <ChevronDown
                    size={13}
                    className={cn(
                      "transition-transform duration-200",
                      faqOpen && "rotate-180",
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-card border border-border rounded-[10px] px-4 py-3.5 mt-2.5">
                  <p className="text-[12px] text-muted-foreground leading-[1.65] font-light">
                    A crypto wallet is an app that holds your private keys — the
                    proof that you own your funds. It doesn&apos;t store your
                    tokens; those live on the blockchain. The wallet just lets
                    you sign transactions.
                  </p>
                  <p className="text-[12px] text-muted-foreground leading-[1.65] font-light mt-2">
                    AgentEra uses your wallet to generate a unique address for
                    your agent. You keep full control — we never have custody of
                    your funds or your keys.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Trust signal */}
          <div className="flex items-center justify-center gap-1.75 mt-7 text-[12px] text-(--hint)">
            <Lock
              size={13}
              className="text-(--hint) shrink-0"
              strokeWidth={1.5}
            />
            <span>
              <strong className="text-muted-foreground font-normal">
                Non-custodial.
              </strong>{" "}
              Your keys, your agents. AgentEra never holds your funds.
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
