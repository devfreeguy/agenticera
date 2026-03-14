import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@tetherto/wdk",
    "@tetherto/wdk-wallet-evm",
    "@tetherto/wdk-secret-manager",
    "sodium-native",
  ],
};

export default nextConfig;
