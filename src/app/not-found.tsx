import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/constants/brand";

export const metadata = {
  title: `Page not found — ${BRAND_NAME}`,
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-16 flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-5 text-center py-20">
          {/* Glow */}
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] sm:w-120 h-60 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(232,121,58,0.07) 0%, transparent 70%)",
            }}
          />

          <div className="relative mb-6">
            <div className="text-[130px] sm:text-[160px] font-bold font-head leading-none text-(--orange) opacity-[0.07] select-none">
              404
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[14px] bg-(--orange-dim) border border-(--orange-border) flex items-center justify-center">
                <Search size={20} className="text-(--orange)" strokeWidth={1.6} />
              </div>
              <h1 className="font-head text-[22px] sm:text-[28px] font-bold tracking-[-0.3px]">
                Page not found
              </h1>
            </div>
          </div>

          <p className="text-[14px] sm:text-[15px] text-muted-foreground leading-[1.65] font-light max-w-sm mb-8">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button asChild variant="primary" size="md" className="w-full sm:w-auto">
              <Link href="/">
                <Home size={14} strokeWidth={1.6} />
                Back to home
              </Link>
            </Button>
            <Button asChild variant="secondary" size="md" className="w-full sm:w-auto">
              <Link href="/jobs">
                <Search size={14} strokeWidth={1.6} />
                Browse job board
              </Link>
            </Button>
          </div>
        </div>

        <PublicFooter />
      </div>
    </div>
  );
}
