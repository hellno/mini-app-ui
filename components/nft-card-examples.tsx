"use client";

import * as React from "react";
import { NFTCard } from "@/registry/mini-app/blocks/nft-card/nft-card";

interface NFTExample {
  title: string;
  description: string;
  contractAddress: string;
  tokenId: string;
  network: string;
  customTitle?: string;
  titlePosition?: "top" | "bottom" | "outside";
  networkPosition?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "outside";
  layout?: "compact" | "card" | "detailed";
}

const nftExamples: NFTExample[] = [
  {
    title: "Thirdweb OpenEdition",
    description: "Thirdweb OpenEditionERC721",
    contractAddress: "0xD2Ede6B7b1B08B2A8bB36118fBC0F76409719070",
    tokenId: "1",
    network: "celo",
    titlePosition: "outside",
    networkPosition: "outside",
  },
  {
    title: "Zora NFT",
    description: "NFT on Zora Network",
    contractAddress: "0xe03ef4b9db1a47464de84fb476f9baf493b3e886",
    tokenId: "1",
    network: "zora",
    titlePosition: "outside",
    networkPosition: "outside",
  },
  {
    title: "Base Flamenco",
    description: "NFTs2Me on Base",
    contractAddress: "0x60b400dC94195076580b3556004E87488C10FC83",
    tokenId: "315",
    network: "base",
    titlePosition: "outside",
    networkPosition: "outside",
  },
  {
    title: "Farcaster Pro OG",
    description: "Base NFT collection",
    contractAddress: "0x61886e7d61F4086AdA1829880AF440AA0DE3fc96",
    tokenId: "1",
    network: "base",
  },
  {
    title: "Mutant Ape Yacht Club",
    description: "MAYC on Ethereum",
    contractAddress: "0x60e4d786628fea6478f785a6d7e704777c86a7c6",
    tokenId: "7789",
    network: "mainnet",
    customTitle: "Mutant Ape #7789",
    titlePosition: "outside",
    networkPosition: "outside",
  },
  {
    title: "Manifold NFT",
    description: "Manifold on Base",
    // contractAddress: "0x22fbd94bfc652dcb8b7958dda318566138d4bedc",
    // tokenId: "3",
    contractAddress: "0x32dd0a7190b5bba94549a0d04659a9258f5b1387",
    tokenId: "2",
    network: "base",
    networkPosition: "outside",
  },
  {
    title: "Manifold Video NFT",
    description: "NFT with video animation",
    contractAddress: "0xc9Fda06ab3015Cec0F803684baaF3fFdb692F42b",
    tokenId: "1",
    network: "base",
    titlePosition: "outside",
    networkPosition: "outside",
  },
  {
    title: "Test NFT on Base",
    description: "Testing NFT processing",
    contractAddress: "0x8F843c58201197D20A4ed8AeC12ae8527c2c4d7b",
    tokenId: "1",
    network: "base",
    titlePosition: "outside",
    networkPosition: "outside",
    layout: "detailed",
  },
  {
    title: "Azuki",
    description: "Title inside and blockchain in top right",
    contractAddress: "0xed5af388653567af2f388e6224dc7c4b3241c544",
    tokenId: "1",
    network: "ethereum",
    titlePosition: "bottom",
    networkPosition: "top-right",
  },
  {
    title: "Doodles",
    description: "Title at top and blockchain in bottom right",
    contractAddress: "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
    tokenId: "1",
    network: "ethereum",
    titlePosition: "top",
    networkPosition: "bottom-right",
    layout: "compact",
  },
];

export function NftCardExamples({
  showHeader = true,
}: {
  showHeader?: boolean;
}) {
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile screen
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // On mobile, show only first 4 examples
  const displayExamples = isMobile ? nftExamples.slice(0, 4) : nftExamples;

  return (
    <div className="w-full">
      {showHeader && (
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">NFT Card Examples</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Showcase of NFT cards from various collections and networks. Each
            card demonstrates different layout options and metadata display
            styles.
          </p>
        </div>
      )}

      <div
        className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"} gap-4 sm:gap-6 md:gap-8`}
      >
        {displayExamples.map((example, index) => (
          <div
            key={index}
            className="flex flex-col items-center space-y-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-card hover:shadow-md transition-shadow"
          >
            <div className="w-full max-w-[250px] sm:max-w-none">
              <NFTCard
                contractAddress={example.contractAddress}
                tokenId={example.tokenId}
                network={example.network}
                size={isMobile ? 250 : 200}
                displayOptions={{
                  showTitle: true,
                  showNetwork: true,
                  rounded: "lg",
                  shadow: true,
                }}
                className="mx-auto text-center"
              />
            </div>

            <div className="text-center space-y-1 px-2">
              <h4 className="text-sm font-medium line-clamp-1">
                {example.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {example.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
