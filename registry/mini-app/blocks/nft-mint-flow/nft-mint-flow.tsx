"use client";

/**
 * @shadcn-registry
 * 
 * IMPORTANT: This file is part of the shadcn registry.
 * Always use double quotes (") instead of single quotes (') to prevent
 * transformation issues during component installation.
 * 
 * See: /CLAUDE.md#shadcn-cli-transformation-issues
 */

import * as React from "react";
import { NFTCard } from "@/registry/mini-app/blocks/nft-card/nft-card";
import { NFTMintButton } from "@/registry/mini-app/blocks/nft-mint-flow/nft-mint-button";

interface NFTMintPageProps {
  /**
   * The NFT contract address to mint from
   * @example "0x32dd0a7190b5bba94549a0d04659a9258f5b1387"
   */
  contractAddress: `0x${string}`;
  
  /**
   * The token ID to display in the NFTCard preview
   * @example "1" or "42"
   */
  tokenId: string;
  
  /**
   * Network name for display purposes (e.g., "base", "ethereum")
   * @default "ethereum"
   */
  network?: string;
  
  /**
   * Chain ID for the blockchain network
   * Note: Supports any chain ID, not limited to specific values
   * @example 1 (Ethereum), 8453 (Base), 42220 (Celo)
   */
  chainId: number;
  
  /**
   * Force a specific NFT provider instead of auto-detection
   * 
   * Leave undefined for automatic provider detection (recommended).
   * Only use this if auto-detection fails or you need to override it.
   * 
   * @default undefined (auto-detect)
   */
  forceProvider?: "manifold" | "opensea" | "zora";
  
  /**
   * Parameters specific to Manifold NFTs
   * Required when forceProvider="manifold" or when minting Manifold contracts
   * 
   * @example { instanceId: "4293509360" } for claim-based mints
   * @example { tokenId: "2" } for specific edition mints
   */
  manifoldParams?: {
    /** Manifold claim instance ID (found in claim page URL) */
    instanceId?: string;
    /** Specific token ID for Manifold editions */
    tokenId?: string;
  };
  
  /**
   * Custom text for the mint button
   * @default "Mint NFT"
   */
  buttonText?: string;
}

/**
 * NFT Mint Page - Complete NFT display and minting experience
 * 
 * This component combines NFTCard for preview and NFTMintButton for minting
 * in a properly aligned vertical layout. The minting provider (Manifold, OpenSea, etc.)
 * is automatically detected from the contract.
 * 
 * @example
 * ```tsx
 * // Basic usage - auto-detects provider
 * <NFTMintFlow
 *   contractAddress="0x5b97886E4e1fC0F7d19146DEC03C917994b3c3a4"
 *   tokenId="1"
 *   network="ethereum"
 *   chainId={1}
 * />
 * 
 * // Manifold NFT - just provide the required params
 * <NFTMintFlow
 *   contractAddress="0x32dd0a7190b5bba94549a0d04659a9258f5b1387"
 *   tokenId="2"
 *   network="base"
 *   chainId={8453}
 *   manifoldParams={{
 *     instanceId: "4293509360"
 *   }}
 * />
 * 
 * // Force specific provider (rarely needed)
 * <NFTMintFlow
 *   contractAddress="0x..."
 *   tokenId="1"
 *   chainId={8453}
 *   forceProvider="manifold"
 *   manifoldParams={{ instanceId: "123" }}
 * />
 * ```
 */
export function NFTMintFlow({
  contractAddress,
  tokenId,
  network = "ethereum",
  chainId,
  forceProvider,
  manifoldParams,
  buttonText = "Mint NFT",
}: NFTMintPageProps) {
  const [containerWidth, setContainerWidth] = React.useState(350);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(Math.min(width, 350));
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <div ref={containerRef} className="space-y-4 w-full max-w-[350px]">
      <NFTCard 
        contractAddress={contractAddress}
        tokenId={tokenId}
        network={network}
        width={containerWidth}
        height={containerWidth}
        rounded="xl"
        shadow={true}
        showTitle={true}
        showNetwork={true}
        titlePosition="outside"
        networkPosition="outside"
      />
      
      <NFTMintButton
        contractAddress={contractAddress}
        chainId={chainId}
        forceProvider={forceProvider}
        manifoldParams={manifoldParams}
        buttonText={buttonText}
        variant="default"
        size="lg"
        className="w-full"
      />
    </div>
  );
}