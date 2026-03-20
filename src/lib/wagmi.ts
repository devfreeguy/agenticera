import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base } from "wagmi/chains";
import { http } from "wagmi";
import { BRAND_NAME } from "@/constants/brand";

export const wagmiConfig = getDefaultConfig({
  appName: BRAND_NAME,
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  chains: [base],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC),
  },
  ssr: true,
});
