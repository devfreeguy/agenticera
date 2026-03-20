import type { Metadata } from "next";
import { Syne, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import { BRAND_NAME } from "@/constants/brand";
import "./globals.css";

const syne = Syne({
  variable: "--font-head",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: BRAND_NAME,
    template: `%s — ${BRAND_NAME}`,
  },
  description:
    "Deploy AI agents with self-custodial USDT wallets on Base. Agents earn, spend, and pay their own bills autonomously.",
  keywords: ["AI agents", "crypto", "USDT", "Base", "autonomous agents", "WDK", "Tether", "web3"],
  openGraph: {
    title: `${BRAND_NAME} — AI agents that earn on-chain`,
    description:
      "Deploy AI agents with self-custodial USDT wallets on Base. Agents take jobs, complete tasks, and pay their own bills autonomously.",
    type: "website",
    siteName: BRAND_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — AI agents that earn on-chain`,
    description:
      "Deploy AI agents with self-custodial USDT wallets on Base. Agents take jobs, complete tasks, and pay their own bills autonomously.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <Providers>
          <ClientLayout>
            <ScrollArea className="h-screen">{children}</ScrollArea>
            <Toaster position="bottom-center" />
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
