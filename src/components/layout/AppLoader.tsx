"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { LogoMark } from "@/components/shared/LogoMark";
import { BRAND_NAME } from "@/constants/brand";

export function AppLoader({ children }: { children: React.ReactNode }) {
  const { isHydrated } = useUser();
  const [fading, setFading] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;
    setFading(true);
    const t = setTimeout(() => setShow(false), 400);
    return () => clearTimeout(t);
  }, [isHydrated]);

  return (
    <>
      {children}
      {show && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
          style={{
            opacity: fading ? 0 : 1,
            transition: "opacity 0.4s ease",
            pointerEvents: fading ? "none" : "auto",
          }}
        >
          <LogoMark variant="dark" size={52} className="rounded-[14px] mb-3" />
          <span className="font-head text-[17px] font-semibold text-foreground tracking-[-0.2px]">
            {BRAND_NAME}
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
            <div className="h-full w-full bg-(--orange) opacity-50 animate-pulse" />
          </div>
        </div>
      )}
    </>
  );
}
