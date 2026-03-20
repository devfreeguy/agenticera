"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { useUser } from "@/hooks/useUser";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { address, isConnected, isHydrated, hydrated } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Both wagmi (isHydrated) AND our session store (hydrated) must be ready
    // before we decide to boot the user to /connect.
    if (isHydrated && hydrated && !isConnected) {
      router.replace("/connect");
    }
  }, [isHydrated, hydrated, isConnected, router]);

  if (!isConnected) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar walletAddress={address ?? ""} />
      <div className="min-[900px]:ml-60 flex-1 min-w-0 flex flex-col min-h-screen pb-16 md:pb-0">
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
