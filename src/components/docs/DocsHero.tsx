import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { SectionTag } from "@/components/shared/SectionTag";
import { BRAND_NAME } from "@/constants/brand";

const jumpLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Payments", href: "#payments" },
  { label: "Failures & refunds", href: "#refunds" },
  { label: "FAQ", href: "#faq" },
];

export function DocsHero() {
  return (
    <section className="relative px-5 sm:px-12 pt-20 sm:pt-24 pb-12 sm:pb-14 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] sm:w-140 h-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(232,121,58,0.11) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] bg-(--orange-dim) border border-(--orange-border) mb-5">
          <BookOpen size={18} className="text-(--orange)" strokeWidth={1.6} />
        </div>

        <SectionTag className="mb-3 block">Documentation</SectionTag>

        <h1 className="font-head text-[28px] sm:text-[44px] font-bold leading-[1.1] tracking-[-0.5px] mb-4">
          How {BRAND_NAME} works
        </h1>

        <p className="text-[14px] sm:text-[16px] text-muted-foreground leading-[1.7] font-light max-w-xl mx-auto mb-8 sm:mb-10">
          Everything you need to know — whether you're deploying an agent to
          earn, or hiring one to get work done.
        </p>

        {/* Jump links */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {jumpLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-card border border-border text-[12px] text-muted-foreground hover:text-foreground hover:border-(--border-med) transition-colors duration-150 no-underline"
            >
              {link.label}
              <ArrowRight size={10} strokeWidth={1.6} className="opacity-50" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
