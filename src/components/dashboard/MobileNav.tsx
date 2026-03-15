"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Share2, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/jobs", label: "Jobs", icon: Share2 },
  { href: "/transactions", label: "Txns", icon: FileText },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden max-[900px]:flex fixed bottom-0 left-0 right-0 bg-sidebar border-t border-border px-0 pt-2 pb-[14px] z-[100] justify-around">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] px-3 py-1 transition-colors no-underline",
              active ? "text-[var(--orange)]" : "text-muted-foreground"
            )}
          >
            <Icon size={18} strokeWidth={1.4} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
