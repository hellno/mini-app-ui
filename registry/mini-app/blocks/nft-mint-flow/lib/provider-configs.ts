import { type Address, maxUint256 } from "viem";
import type { ProviderConfig } from "@/registry/mini-app/blocks/nft-mint-flow/lib/types";
import { MANIFOLD_EXTENSION_ABI, KNOWN_CONTRACTS, PRICE_DISCOVERY_ABI, MINT_ABI, THIRDWEB_OPENEDITONERC721_ABI, THIRDWEB_NATIVE_TOKEN } from "@/registry/mini-app/lib/nft-standards";

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  manifold: {
    name: "manifold",
    extensionAddresses: [
      KNOWN_CONTRACTS.manifoldExtension, // Known Manifold extension
    ],
    priceDiscovery: {
      abis: [MANIFOLD_EXTENSION_ABI],
      functionNames: ["MINT_FEE"],
      requiresInstanceId: true
    },
    mintConfig: {
      abi: MANIFOLD_EXTENSION_ABI,
      functionName: "mint",
      buildArgs: (params) => [
        params.contractAddress,
        BigInt(params.instanceId || "0"),
        Number(params.tokenId || "0"),
        params.merkleProof || [],
        params.recipient
      ],
      calculateValue: (mintFee, params) => {
        // For Manifold, value is just the mint fee
        // The actual NFT cost might be in ERC20
        return mintFee;
      }
    },
    requiredParams: ["contractAddress", "chainId"],
    supportsERC20: true
  },
  
  opensea: {
    name: "opensea",
    priceDiscovery: {
      abis: [PRICE_DISCOVERY_ABI],
      functionNames: ["mintPrice", "price", "publicMintPrice"]
    },
    mintConfig: {
      abi: MINT_ABI,
      functionName: "mint",
      buildArgs: (params) => [BigInt(params.amount || 1)],
      calculateValue: (price, params) => price * BigInt(params.amount || 1)
    },
    requiredParams: ["contractAddress", "chainId"],
    supportsERC20: false
  },

  zora: {
    name: "zora",
    priceDiscovery: {
      abis: [PRICE_DISCOVERY_ABI],
      functionNames: ["mintPrice", "price"]
    },
    mintConfig: {
      abi: MINT_ABI,
      functionName: "mint",
      buildArgs: (params) => [params.recipient, BigInt(params.amount || 1)],
      calculateValue: (price, params) => price * BigInt(params.amount || 1)
    },
    requiredParams: ["contractAddress", "chainId"],
    supportsERC20: false
  },

  generic: {
    name: "generic",
    priceDiscovery: {
      abis: [PRICE_DISCOVERY_ABI],
      functionNames: ["mintPrice", "price", "MINT_PRICE", "getMintPrice"]
    },
    mintConfig: {
      abi: MINT_ABI,
      functionName: "mint",
      buildArgs: (params) => [BigInt(params.amount || 1)],
      calculateValue: (price, params) => price * BigInt(params.amount || 1)
    },
    requiredParams: ["contractAddress", "chainId"],
    supportsERC20: false
  },

  nfts2me: {
    name: "nfts2me",
    priceDiscovery: {
      // For nfts2me, we need a custom ABI with mintFee function
      abis: [[{
        inputs: [{ name: "amount", type: "uint256" }],
        name: "mintFee",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      }]],
      functionNames: ["mintFee"],
      // Custom logic to handle mintFee with amount parameter
      requiresAmountParam: true
    },
    mintConfig: {
      // NFTs2Me mint(amount) expects the number of NFTs to mint
      // For minting 1 NFT, pass 1. Payment is via msg.value.
      abi: [{
        inputs: [{ name: "amount", type: "uint256" }],
        name: "mint",
        outputs: [],
        stateMutability: "payable",
        type: "function"
      }],
      functionName: "mint",
      buildArgs: (params) => [BigInt(params.amount || 1)],
      calculateValue: (price, params) => price * BigInt(params.amount || 1)
    },
    requiredParams: ["contractAddress", "chainId"],
    supportsERC20: false
  },

  thirdweb: {
    name: "thirdweb",
    priceDiscovery: {
      abis: [THIRDWEB_OPENEDITONERC721_ABI],
      functionNames: ["claimCondition", "getClaimConditionById"],
      requiresInstanceId: false
    },
    mintConfig: {
      abi: THIRDWEB_OPENEDITONERC721_ABI,
      functionName: "claim",
      buildArgs: (params) => {
        // This will be overridden by getProviderConfig for thirdweb
        // when contractInfo with claimCondition is available
        return [
          params.recipient || params.contractAddress, // _receiver
          BigInt(params.amount || 1), // _quantity
          THIRDWEB_NATIVE_TOKEN, // _currency (default to ETH)
          BigInt(0), // _pricePerToken (default to 0)
          {
            proof: params.merkleProof || [],
            quantityLimitPerWallet: maxUint256,
            pricePerToken: maxUint256,
            currency: "0x0000000000000000000000000000000000000000"
          }, // _allowlistProof
          "0x" // _data
        ];
      },
      calculateValue: (price, params) => {
        // This will be overridden by getProviderConfig for thirdweb
        // Default assumes native token payment
        return price * BigInt(params.amount || 1);
      }
    },
    requiredParams: ["contractAddress", "chainId"],
    supportsERC20: true
  }
};

// Helper to get config by provider name
export function getProviderConfig(provider: string, contractInfo?: any): ProviderConfig {
  const baseConfig = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.generic;
  
  // For thirdweb, we need to inject the claim condition data
  if (provider === "thirdweb" && contractInfo?.claimCondition) {
    return {
      ...baseConfig,
      mintConfig: {
        ...baseConfig.mintConfig,
        buildArgs: (params) => {
          const pricePerToken = contractInfo.claimCondition.pricePerToken || BigInt(0);
          const currency = contractInfo.claimCondition.currency || THIRDWEB_NATIVE_TOKEN;
          
          return [
            params.recipient || params.contractAddress, // _receiver
            BigInt(params.amount || 1), // _quantity
            currency, // _currency
            pricePerToken, // _pricePerToken
            {
              proof: params.merkleProof || [],
              quantityLimitPerWallet: maxUint256,
              pricePerToken: maxUint256,
              currency: "0x0000000000000000000000000000000000000000"
            }, // _allowlistProof
            "0x" // _data
          ];
        },
        calculateValue: (price, params) => {
          const currency = contractInfo.claimCondition?.currency;
          
          if (!currency || currency.toLowerCase() === THIRDWEB_NATIVE_TOKEN.toLowerCase()) {
            return price * BigInt(params.amount || 1);
          }
          return BigInt(0);
        }
      }
    };
  }
  
  return baseConfig;
}