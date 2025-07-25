"use client";

import { createConfig, http, injected, WagmiProvider } from "wagmi";
import { base, degen, mainnet, optimism, celo } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";
import { DaimoPayProvider, getDefaultConfig } from "@daimo/pay";

const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;

export const config = createConfig(
  getDefaultConfig({
    appName: "hi",
    chains: [base, degen, mainnet, optimism, celo],
    additionalConnectors: [farcasterFrame(), injected()],
    transports: {
      [base.id]: http(
        alchemyApiKey
          ? `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
          : undefined,
      ),
      [celo.id]: http(), // Use public RPC for Celo
    },
  }),
);

const queryClient = new QueryClient();

export default function OnchainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <DaimoPayProvider>{children}</DaimoPayProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
