import { type Address, type PublicClient, getAddress } from "viem";
import { 
  MANIFOLD_DETECTION_ABI, 
  MANIFOLD_EXTENSION_ABI, 
  KNOWN_CONTRACTS, 
  ERC721_ABI,
  ERC1155_ABI,
  THIRDWEB_OPENEDITONERC721_ABI
} from "@/registry/mini-app/lib/nft-standards";

/**
 * NFT metadata utilities with support for multiple standards and fallback mechanisms
 */

export type ProviderHint = "manifold" | "thirdweb" | "standard" | "erc1155";

export interface ManifoldDetectionResult {
  isManifold: boolean;
  extensionAddress?: Address;
  extensions?: Address[];
}

export interface ManifoldClaim {
  total: number;
  totalMax: number;
  walletMax: number;
  startDate: bigint;
  endDate: bigint;
  storageProtocol: number;
  merkleRoot: `0x${string}`;
  location: string;
  tokenId: bigint;
  cost: bigint;
  paymentReceiver: Address;
  erc20: Address;
  signingAddress: Address;
}

/**
 * Detect if a contract is a Manifold contract with extensions
 */
export async function detectManifoldContract(
  client: PublicClient,
  contractAddress: Address
): Promise<ManifoldDetectionResult> {
  try {
    const extensions = await client.readContract({
      address: getAddress(contractAddress),
      abi: MANIFOLD_DETECTION_ABI,
      functionName: "getExtensions",
    }) as Address[];
    
    if (!extensions || extensions.length === 0) {
      return { isManifold: false };
    }
    
    // Check if it has the known Manifold extension
    const knownExtension = extensions.find(
      ext => ext.toLowerCase() === KNOWN_CONTRACTS.manifoldExtension.toLowerCase()
    );
    
    return {
      isManifold: true,
      extensionAddress: knownExtension || extensions[0],
      extensions,
    };
  } catch {
    return { isManifold: false };
  }
}

/**
 * Get token URI for a Manifold NFT
 */
export async function getManifoldTokenURI(
  client: PublicClient,
  contractAddress: Address,
  tokenId: string,
  extensionAddress?: Address
): Promise<string> {
  const extension = extensionAddress || KNOWN_CONTRACTS.manifoldExtension;
  
  return await client.readContract({
    address: getAddress(extension),
    abi: MANIFOLD_EXTENSION_ABI,
    functionName: "tokenURI",
    args: [getAddress(contractAddress), BigInt(tokenId)],
  }) as string;
}

/**
 * Get token URI with automatic Manifold detection
 * @deprecated Use getTokenMetadataURL instead for more comprehensive metadata support
 */
export async function getTokenURIWithManifoldSupport(
  client: PublicClient,
  contractAddress: Address,
  tokenId: string
): Promise<string> {
  // Try Manifold first
  const manifoldInfo = await detectManifoldContract(client, contractAddress);
  
  if (manifoldInfo.isManifold && manifoldInfo.extensionAddress) {
    try {
      return await getManifoldTokenURI(
        client,
        contractAddress,
        tokenId,
        manifoldInfo.extensionAddress
      );
    } catch (error) {
      console.warn("Failed to get Manifold tokenURI, falling back to standard", error);
    }
  }
  
  // Fallback to standard ERC721 tokenURI
  return await client.readContract({
    address: getAddress(contractAddress),
    abi: ERC721_ABI.tokenURI,
    functionName: "tokenURI",
    args: [BigInt(tokenId)],
  }) as string;
}

/**
 * Get token metadata URL with comprehensive fallback chain
 * Supports multiple NFT standards including ERC721, ERC1155, Manifold, and Thirdweb OpenEditions
 * 
 * @param client - Public client for blockchain interactions
 * @param contractAddress - NFT contract address
 * @param tokenId - Token ID to fetch metadata for
 * @param providerHint - Optional hint about the contract type for optimization
 * @returns Token metadata URL or empty string if not found
 */
export async function getTokenMetadataURL(
  client: PublicClient,
  contractAddress: Address,
  tokenId: string,
  providerHint?: ProviderHint
): Promise<string> {
  const address = getAddress(contractAddress);
  const tokenIdBigInt = BigInt(tokenId);
  
  // If provider hint is given, try that first
  if (providerHint) {
    try {
      switch (providerHint) {
        case "manifold": {
          const manifoldInfo = await detectManifoldContract(client, address);
          if (manifoldInfo.isManifold && manifoldInfo.extensionAddress) {
            return await getManifoldTokenURI(client, address, tokenId, manifoldInfo.extensionAddress);
          }
          break;
        }
        case "erc1155": {
          const uri = await client.readContract({
            address,
            abi: ERC1155_ABI.uri,
            functionName: "uri",
            args: [tokenIdBigInt],
          }) as string;
          // ERC1155 URIs often have {id} placeholder that needs to be replaced
          return uri.replace("{id}", tokenId.padStart(64, "0"));
        }
        case "thirdweb": {
          // Try sharedMetadata first for OpenEditions
          const metadata = await client.readContract({
            address,
            abi: THIRDWEB_OPENEDITONERC721_ABI,
            functionName: "sharedMetadata",
          }) as any;
          if (metadata && metadata.image) {
            // Construct metadata JSON from sharedMetadata
            const metadataJson = {
              name: metadata.name || "",
              description: metadata.description || "",
              image: metadata.image,
              animation_url: metadata.animationUrl || undefined,
            };
            // Return as data URI
            return `data:application/json;base64,${btoa(JSON.stringify(metadataJson))}`;
          }
          break;
        }
      }
    } catch (error) {
      console.debug(`Provider hint ${providerHint} failed, trying other methods`, error);
    }
  }
  
  // Comprehensive fallback chain
  const fallbackMethods = [
    // 1. Standard ERC721 tokenURI
    async () => {
      return await client.readContract({
        address,
        abi: ERC721_ABI.tokenURI,
        functionName: "tokenURI",
        args: [tokenIdBigInt],
      }) as string;
    },
    
    // 2. ERC1155 uri
    async () => {
      const uri = await client.readContract({
        address,
        abi: ERC1155_ABI.uri,
        functionName: "uri",
        args: [tokenIdBigInt],
      }) as string;
      // Replace {id} placeholder if present
      return uri.replace("{id}", tokenId.padStart(64, "0"));
    },
    
    // 3. Manifold detection and tokenURI
    async () => {
      const manifoldInfo = await detectManifoldContract(client, address);
      if (manifoldInfo.isManifold && manifoldInfo.extensionAddress) {
        return await getManifoldTokenURI(client, address, tokenId, manifoldInfo.extensionAddress);
      }
      throw new Error("Not a Manifold contract");
    },
    
    // 4. contractURI (for contracts with shared metadata)
    async () => {
      const contractURI = await client.readContract({
        address,
        abi: ERC721_ABI.contractURI,
        functionName: "contractURI",
      }) as string;
      // Note: contractURI typically contains collection-level metadata, not token-specific
      // This is a last resort fallback
      return contractURI;
    },
    
    // 5. Thirdweb sharedMetadata (for OpenEditions)
    async () => {
      const metadata = await client.readContract({
        address,
        abi: THIRDWEB_OPENEDITONERC721_ABI,
        functionName: "sharedMetadata",
      }) as any;
      
      if (metadata && metadata.image) {
        // Construct metadata JSON from sharedMetadata
        const metadataJson = {
          name: metadata.name || `Token #${tokenId}`,
          description: metadata.description || "",
          image: metadata.image,
          animation_url: metadata.animationUrl || undefined,
        };
        // Return as data URI
        return `data:application/json;base64,${btoa(JSON.stringify(metadataJson))}`;
      }
      throw new Error("No shared metadata found");
    },
    
    // 6. baseURI + tokenId concatenation
    async () => {
      const baseURI = await client.readContract({
        address,
        abi: ERC721_ABI.baseURI,
        functionName: "baseURI",
      }) as string;
      
      if (baseURI) {
        // Ensure proper URL joining
        const separator = baseURI.endsWith("/") ? "" : "/";
        return `${baseURI}${separator}${tokenId}`;
      }
      throw new Error("No baseURI found");
    },
  ];
  
  // Try each method in order
  for (const method of fallbackMethods) {
    try {
      const result = await method();
      if (result && typeof result === "string" && result.length > 0) {
        return result;
      }
    } catch (error) {
      // Continue to next method
      continue;
    }
  }
  
  // If all methods fail, return empty string
  console.warn(`Could not fetch metadata for token ${tokenId} at ${contractAddress}`);
  return "";
}

/**
 * Get Manifold claim information
 */
export async function getManifoldClaim(
  client: PublicClient,
  contractAddress: Address,
  instanceId: string,
  extensionAddress?: Address
): Promise<ManifoldClaim | null> {
  try {
    const extension = extensionAddress || KNOWN_CONTRACTS.manifoldExtension;
    
    const claim = await client.readContract({
      address: getAddress(extension),
      abi: MANIFOLD_EXTENSION_ABI,
      functionName: "getClaim",
      args: [getAddress(contractAddress), BigInt(instanceId)],
    });
    
    return claim as unknown as ManifoldClaim;
  } catch {
    return null;
  }
}

/**
 * Get Manifold mint fee
 */
export async function getManifoldMintFee(
  client: PublicClient,
  extensionAddress?: Address
): Promise<bigint> {
  const extension = extensionAddress || KNOWN_CONTRACTS.manifoldExtension;
  
  try {
    return await client.readContract({
      address: getAddress(extension),
      abi: MANIFOLD_EXTENSION_ABI,
      functionName: "MINT_FEE",
    }) as bigint;
  } catch {
    // Try MINT_FEE_MERKLE as fallback
    try {
      return await client.readContract({
        address: getAddress(extension),
        abi: MANIFOLD_EXTENSION_ABI,
        functionName: "MINT_FEE_MERKLE",
      }) as bigint;
    } catch {
      return BigInt(0);
    }
  }
}

/**
 * Check if an address is the zero address
 */
export function isZeroAddress(address: string): boolean {
  return address === "0x0000000000000000000000000000000000000000";
}

/**
 * Format instance ID and token ID for display
 */
export function formatManifoldTokenId(instanceId: string, tokenId: string): string {
  return `${instanceId}-${tokenId}`;
}