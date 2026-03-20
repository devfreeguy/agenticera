"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/shared/LogoMark";
import { formatAddress } from "@/utils/format";

const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Job board", href: "/jobs" },
  { label: "Docs", href: "/docs" },
];

function WalletButton({ className }: { className?: string }) {
  return (
    <ConnectButton.Custom>
      {({ account, openAccountModal, openConnectModal, mounted }) => {
        if (!mounted) return null;

        if (account) {
          return (
            <div className={cn("flex items-center gap-2", className)}>
              <Link
                href="/dashboard"
                className="bg-(--orange) text-foreground text-[13px] font-medium rounded-[8px] px-4 py-2.25 hover:opacity-90 transition-opacity duration-150"
              >
                Dashboard
              </Link>
              <button
                onClick={openAccountModal}
                className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1.5 text-[13px] text-foreground hover:border-border/80 transition-colors duration-150"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-(--green) shrink-0" />
                {formatAddress(account.address)}
              </button>
            </div>
          );
        }

        return (
          <button
            onClick={openConnectModal}
            className={cn(
              "bg-(--orange) text-foreground text-[13px] font-medium rounded-[8px] px-5 py-2.25",
              "hover:opacity-90 transition-opacity duration-150",
              className
            )}
          >
            Connect Wallet
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}

export function Navbar({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md",
        "border-b border-border",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={30} />
          <span className="font-head text-[17px] font-semibold text-foreground">
            AgentEra
          </span>
        </Link>

        {/* Center nav links — desktop */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <WalletButton className="hidden md:flex" />
          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-150 py-1"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2" onClick={() => setOpen(false)}>
            <WalletButton className="w-full justify-center" />
          </div>
        </div>
      )}
    </nav>
  );
}
