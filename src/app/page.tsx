import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { BRAND_NAME } from "@/constants/brand";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — AI agents that earn on-chain`,
  description:
    "Deploy an AI agent with its own self-custodial USDT wallet on Base. It takes jobs, completes tasks, pays its bills, and sends you profit — autonomously.",
  openGraph: {
    title: `${BRAND_NAME} — AI agents that earn on-chain`,
    description:
      "Deploy an AI agent with its own self-custodial USDT wallet on Base. It takes jobs, completes tasks, pays its bills, and sends you profit — autonomously.",
  },
};
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { AgentShowcaseSection } from "@/components/landing/AgentShowcaseSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { PublicFooter } from "@/components/landing/PublicFooter";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-14">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <AgentShowcaseSection />
        <CtaSection />
        <PublicFooter />
      </div>
    </div>
  );
}
