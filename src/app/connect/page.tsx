"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronLeft, ChevronDown, Lock, Wallet, Loader2, AlertCircle } from "lucide-react";
import { LogoMark } from "@/components/shared/LogoMark";
import { BRAND_NAME } from "@/constants/brand";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useUser } from "@/hooks/useUser";
import { PublicFooter } from "@/components/landing/PublicFooter";

function AuthPageInner() {
  const { isConnected, user, hydrated, signIn, address } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [faqOpen, setFaqOpen] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const signingRef = useRef(false);

  // Sync user on connect, then redirect based on onboarded flag
  useEffect(() => {
    if (!isConnected || !address) return;

    // Wait until the userStore has finished its initial session check (hydration)
    // before deciding if we need to prompt for a new signature.
    if (!hydrated) return;

    if (!user) {
      // Guard: if already signing or user has dismissed, do not re-prompt
      if (signingRef.current) return;
      signingRef.current = true;
      setSignInError(null);
      signIn(address).catch((err: Error) => {
        // Keep signingRef = true so wagmi re-fires don't auto-prompt again
        setSignInError(
          err?.message?.includes("User rejected")
            ? "You cancelled the signature request."
            : "Authentication failed. Please try again.",
        );
      });
      return;
    }

    if (user) {
      if (!user.onboarded) {
        router.replace("/onboarding");
      } else if (next && next.startsWith("/")) {
        router.replace(next);
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isConnected, address, user, hydrated, signIn, router]);

  // While connected: show overlay for both pending and error states
  if (isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="fixed -top-30 left-1/2 -translate-x-1/2 w-175 h-105 pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(ellipse at center top, rgba(232,121,58,0.13) 0%, transparent 65%)",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-5 text-center">
          {signInError ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] flex items-center justify-center">
                <AlertCircle size={26} className="text-red-400" strokeWidth={1.6} />
              </div>
              <div>
                <h2 className="font-head text-[20px] font-bold tracking-[-0.2px] mb-1.5">
                  Signature cancelled
                </h2>
                <p className="text-[13px] text-muted-foreground font-light leading-[1.65] max-w-[260px]">
                  {signInError}
                </p>
              </div>
              <button
                onClick={() => {
                  signingRef.current = false;
                  setSignInError(null);
                }}
                className="mt-1 px-5 py-2.25 bg-(--orange) text-white text-[13px] font-medium rounded-[8px] hover:opacity-90 transition-opacity duration-150"
              >
                Try again
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-sidebar border border-(--border-med) flex items-center justify-center">
                <Wallet size={26} className="text-(--orange)" strokeWidth={1.6} />
              </div>
              <div>
                <h2 className="font-head text-[20px] font-bold tracking-[-0.2px] mb-1.5">
                  Confirm signature
                </h2>
                <p className="text-[13px] text-muted-foreground font-light leading-[1.65] max-w-[260px]">
                  Check your wallet — a signature request is waiting for you.
                </p>
              </div>
              <Loader2 size={18} className="text-(--orange) animate-spin mt-1" strokeWidth={1.8} />
            </>
          )}
        </div>
      </div>
    );
  }

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
          {BRAND_NAME}
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
                    {BRAND_NAME} uses your wallet to generate a unique address for
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
              Your keys, your agents. {BRAND_NAME} never holds your funds.
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}
