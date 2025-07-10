"use client";

import * as React from "react";
import { NFTMintButton } from "@/registry/mini-app/blocks/nft-mint-flow/nft-mint-button";

interface NFTMintExample {
  title: string;
  description: string;
  contractAddress: `0x${string}`;
  instanceId: string;
  tokenId: string;
  buttonText?: string;
}

const nftExamples: NFTMintExample[] = [
  {
    title: "Generic NFT Mint",
    description: "",
    contractAddress: "0x5b97886E4e1fC0F7d19146DEC03C917994b3c3a4",
    instanceId: "",
    tokenId: "",
    buttonText: "Mint Demo NFT",
  },
  {
    title: "Base Flamenco (NFTs2Me)",
    description: "NFTs2Me contract with dynamic pricing",
    contractAddress: "0x60b400dC94195076580b3556004E87488C10FC83",
    instanceId: "",
    tokenId: "",
    buttonText: "Mint Base Flamenco",
  },
  {
    title: "Manifold Higher ERC20 + ETH Fee",
    description: "",
    contractAddress: "0x32dd0a7190b5bba94549a0d04659a9258f5b1387",
    instanceId: "4293509360",
    tokenId: "2",
    buttonText: "Mint NFT (Higher ERC20)",
  },
  {
    title: "Manifold Free Mint + ETH Fee",
    description: "",
    contractAddress: "0x22fbd94bfc652dcb8b7958dda318566138d4bedc",
    instanceId: "4280815856",
    tokenId: "3",
    buttonText: "Free Mint (Fee Only)",
  },
  {
    title: "Manifold USDC Payment + ETH Fee",
    description: "",
    contractAddress: "0x612b60c14ea517e1a538aee7b443e014a95de2d0",
    instanceId: "4223785200",
    tokenId: "1",
    buttonText: "Mint NFT (USDC ERC20)",
  },
];

export function NFTMintExamples({
  showHeader = true,
}: {
  showHeader?: boolean;
}) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold mb-2">NFT Mint Examples</h3>
          <p className="text-sm text-muted-foreground">
            Click any button below to see how the universal NFT mint component
            handles different scenarios
          </p>
        </div>
      )}

      <div className="grid gap-4 max-w-2xl mx-auto">
        {nftExamples.map((example, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3 bg-card">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <h4 className="font-medium">{example.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {example.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4">
              <div className="text-xs font-mono text-muted-foreground">
                <div>
                  Contract: {example.contractAddress.slice(0, 6)}...
                  {example.contractAddress.slice(-4)}
                </div>
                {example.instanceId && (
                  <div>Instance: {example.instanceId}</div>
                )}
              </div>

              <NFTMintButton
                contractAddress={example.contractAddress}
                chainId={8453} // Base mainnet
                provider={
                  example.instanceId 
                    ? "manifold" 
                    : example.title.includes("NFTs2Me") 
                      ? "nfts2me" 
                      : undefined
                }
                manifoldParams={
                  example.instanceId
                    ? {
                        instanceId: example.instanceId,
                        tokenId: example.tokenId,
                      }
                    : undefined
                }
                buttonText={example.buttonText}
                size="sm"
                variant="outline"
                onMintSuccess={(txHash) =>
                  console.log(`Mint successful for ${example.title}:`, txHash)
                }
                onMintError={(error) =>
                  console.error(`Mint failed for ${example.title}:`, error)
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
