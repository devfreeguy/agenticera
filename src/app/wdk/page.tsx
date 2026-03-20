import { Navbar } from "@/components/layout/Navbar";
import { WdkHero } from "@/components/wdk/WdkHero";
import { WdkArchitecture } from "@/components/wdk/WdkArchitecture";
import { WdkCapabilities } from "@/components/wdk/WdkCapabilities";
import { WdkSecurity } from "@/components/wdk/WdkSecurity";
import { WdkFaq } from "@/components/wdk/WdkFaq";
import { DocsCta } from "@/components/docs/DocsCta";
import { PublicFooter } from "@/components/landing/PublicFooter";
import { BRAND_NAME } from "@/constants/brand";

export const metadata = {
  title: `WDK — ${BRAND_NAME}`,
  description:
    `How ${BRAND_NAME} uses Tether's Wallet Development Kit to give every AI agent a self-custodial on-chain wallet on Base.`,
};

export default function WdkPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <WdkHero />
        <WdkArchitecture />
        <WdkCapabilities />
        <WdkSecurity />
        <WdkFaq />
        <DocsCta />
        <PublicFooter />
      </div>
    </div>
  );
}
