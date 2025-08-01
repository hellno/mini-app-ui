import { type Address, type PublicClient } from "viem";
import type {
  NFTProvider,
  NFTContractInfo,
  MintParams,
} from "@/registry/mini-app/blocks/nft-mint-flow/lib/types";
import { PROVIDER_CONFIGS } from "@/registry/mini-app/blocks/nft-mint-flow/lib/provider-configs";
import { getPublicClient } from "@/registry/mini-app/lib/chains";
import {
  ERC165_ABI,
  INTERFACE_IDS,
  MANIFOLD_DETECTION_ABI,
} from "@/registry/mini-app/lib/nft-standards";

// Re-export from shared library for backward compatibility
export const getClientForChain = getPublicClient;

/**
 * Detects NFT provider and contract info with minimal RPC calls
 * Uses multicall where possible to batch requests
 */
export async function detectNFTProvider(
  params: MintParams,
): Promise<NFTContractInfo> {
  const { contractAddress, chainId, provider: specifiedProvider } = params;
  const client = getClientForChain(chainId);

  console.log(
    `[Provider Detection] Starting for contract ${contractAddress} on chain ${chainId}`,
  );

  // If provider is specified, use known configuration
  if (specifiedProvider) {
    console.log(
      `[Provider Detection] Using specified provider: ${specifiedProvider}`,
    );
    const config = PROVIDER_CONFIGS[specifiedProvider];

    // For Manifold, we know the extension address
    if (specifiedProvider === "manifold" && config.extensionAddresses?.[0]) {
      return {
        provider: "manifold",
        isERC1155: true, // Manifold contracts are typically ERC1155
        isERC721: false,
        extensionAddress: config.extensionAddresses[0],
        hasManifoldExtension: true,
      };
    }

    // For other providers, return basic info
    return {
      provider: specifiedProvider,
      isERC1155: false,
      isERC721: false,
    };
  }

  try {
    // Batch 1: Check interfaces and Manifold extensions in parallel
    const [isERC721, isERC1155, extensions] = await Promise.all([
      client
        .readContract({
          address: contractAddress,
          abi: ERC165_ABI,
          functionName: "supportsInterface",
          args: [INTERFACE_IDS.ERC721],
        })
        .catch(() => false),

      client
        .readContract({
          address: contractAddress,
          abi: ERC165_ABI,
          functionName: "supportsInterface",
          args: [INTERFACE_IDS.ERC1155],
        })
        .catch(() => false),

      client
        .readContract({
          address: contractAddress,
          abi: MANIFOLD_DETECTION_ABI,
          functionName: "getExtensions",
        })
        .catch(() => null),
    ]);

    // Check if it's a Manifold contract
    if (extensions && extensions.length > 0) {
      const knownManifoldExtension = extensions.find((ext) =>
        PROVIDER_CONFIGS.manifold.extensionAddresses?.includes(ext),
      );

      if (knownManifoldExtension || extensions.length > 0) {
        console.log(
          `[Provider Detection] ✅ Detected as Manifold (has extensions)`,
        );
        return {
          provider: "manifold",
          isERC1155: isERC1155 as boolean,
          isERC721: isERC721 as boolean,
          extensionAddress: knownManifoldExtension || extensions[0],
          hasManifoldExtension: true,
        };
      }
    }

    // Check if it's an NFTs2Me contract by looking for unique functions
    try {
      // Try to call n2mVersion - this is unique to NFTs2Me contracts
      const version = await client.readContract({
        address: contractAddress,
        abi: [
          {
            inputs: [],
            name: "n2mVersion",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "pure",
            type: "function",
          },
        ],
        functionName: "n2mVersion",
      });

      // If n2mVersion exists, it's an NFTs2Me contract
      if (version !== undefined) {
        console.log(
          `[Provider Detection] ✅ Detected as NFTs2Me (n2mVersion: ${version})`,
        );
        return {
          provider: "nfts2me",
          isERC1155: isERC1155 as boolean,
          isERC721: isERC721 as boolean,
        };
      }
    } catch {
      // Not an NFTs2Me contract, continue detection
    }

    // Check if it's a thirdweb OpenEditionERC721 contract
    // Thirdweb contracts have a unique claimCondition() function that returns (uint256, uint256)
    console.log(`[Thirdweb Detection] Checking contract: ${contractAddress}`);
    try {
      const claimConditionResult = await client.readContract({
        address: contractAddress,
        abi: [
          {
            inputs: [],
            name: "claimCondition",
            outputs: [
              { name: "currentStartId", type: "uint256" },
              { name: "count", type: "uint256" },
            ],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "claimCondition",
      });
      
      // Verify the result is a valid tuple with 2 uint256 values
      if (Array.isArray(claimConditionResult) && claimConditionResult.length === 2) {
        console.log(`[Thirdweb Detection] ✅ Found claimCondition: startId=${claimConditionResult[0]}, count=${claimConditionResult[1]}`);
        
        // Optional: Quick validation of sharedMetadata to reduce false positives
        try {
          await client.readContract({
            address: contractAddress,
            abi: [
              {
                inputs: [],
                name: "sharedMetadata",
                outputs: [
                  { name: "name", type: "string" },
                  { name: "description", type: "string" },
                  { name: "imageURI", type: "string" },
                  { name: "animationURI", type: "string" },
                ],
                stateMutability: "view",
                type: "function",
              },
            ],
            functionName: "sharedMetadata",
          });
          console.log(`[Thirdweb Detection] ✅ Confirmed with sharedMetadata`);
        } catch {
          // sharedMetadata not found, but claimCondition is strong enough signal
          console.log(`[Thirdweb Detection] ⚠️ sharedMetadata not found, but claimCondition is sufficient`);
        }
        
        return {
          provider: "thirdweb",
          isERC1155: isERC1155 as boolean,
          isERC721: isERC721 as boolean,
        };
      }
    } catch (error) {
      console.log(
        `[Thirdweb Detection] ❌ Not Thirdweb - claimCondition check failed`,
      );
      // Not a thirdweb contract, continue detection
    }

    // TODO: Add detection for OpenSea, Zora, etc.
    // For now, return generic
    console.log(
      `[Provider Detection] Final result: Generic provider (no specific platform detected)`,
    );
    return {
      provider: "generic",
      isERC1155: isERC1155 as boolean,
      isERC721: isERC721 as boolean,
    };
  } catch (error) {
    console.error("Error detecting NFT provider:", error);
    // Default to generic provider
    return {
      provider: "generic",
      isERC1155: false,
      isERC721: false,
    };
  }
}

/**
 * Validates parameters based on detected provider
 */
export function validateParameters(
  params: MintParams,
  contractInfo: NFTContractInfo,
): {
  isValid: boolean;
  missingParams: string[];
  errors: string[];
} {
  const config = PROVIDER_CONFIGS[contractInfo.provider];
  const missingParams: string[] = [];
  const errors: string[] = [];

  // Check required params for the provider
  for (const param of config.requiredParams) {
    if (!params[param as keyof MintParams]) {
      missingParams.push(param);
    }
  }

  // Provider-specific validation
  if (contractInfo.provider === "manifold") {
    if (!params.instanceId && !params.tokenId) {
      errors.push("Manifold NFTs require either instanceId or tokenId. Check the Manifold claim page URL for the instanceId (e.g., /instance/123456) or use getClaimForToken to find the instanceId for a specific tokenId.");
      missingParams.push("instanceId or tokenId");
    }
    
    // Validate instanceId format if provided
    if (params.instanceId) {
      const instanceIdNum = parseInt(params.instanceId);
      if (isNaN(instanceIdNum) || instanceIdNum < 0) {
        errors.push(`Invalid instanceId format: ${params.instanceId}. Must be a positive integer.`);
      }
    }

    if (
      contractInfo.claim?.merkleRoot &&
      contractInfo.claim.merkleRoot !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      errors.push(
        "This NFT requires a merkle proof for minting - not supported yet",
      );
    }
  }

  if (contractInfo.provider === "thirdweb") {
    if (
      contractInfo.claimCondition?.merkleRoot &&
      contractInfo.claimCondition.merkleRoot !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      errors.push(
        "This NFT requires a merkle proof for minting - not supported yet",
      );
    }

    if (contractInfo.claimCondition?.startTimestamp) {
      const now = Math.floor(Date.now() / 1000);
      if (now < contractInfo.claimCondition.startTimestamp) {
        errors.push("Claim has not started yet");
      }
    }
  }

  return {
    isValid: missingParams.length === 0 && errors.length === 0,
    missingParams,
    errors,
  };
}
