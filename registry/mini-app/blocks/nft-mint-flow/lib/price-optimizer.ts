import type { PublicClient } from "viem";
import type { NFTContractInfo, MintParams } from "@/registry/mini-app/blocks/nft-mint-flow/lib/types";
import { getProviderConfig } from "@/registry/mini-app/blocks/nft-mint-flow/lib/provider-configs";
import { THIRDWEB_OPENEDITONERC721_ABI, THIRDWEB_NATIVE_TOKEN } from "@/registry/mini-app/lib/nft-standards";

/**
 * Optimized price discovery that batches RPC calls where possible
 */
export async function fetchPriceData(
  client: PublicClient,
  params: MintParams,
  contractInfo: NFTContractInfo
): Promise<{
  mintPrice?: bigint;
  erc20Details?: {
    address: string;
    symbol: string;
    decimals: number;
    allowance?: bigint;
    balance?: bigint;
  };
  totalCost: bigint;
  claim?: NFTContractInfo["claim"];
}> {
  const config = getProviderConfig(contractInfo.provider);
  
  if (contractInfo.provider === "manifold" && contractInfo.extensionAddress) {
    // For Manifold, we need extension fee + claim cost
    const calls = [
      // Get MINT_FEE from extension
      {
        address: contractInfo.extensionAddress,
        abi: config.mintConfig.abi,
        functionName: "MINT_FEE",
        args: []
      }
    ];
    
    // Add claim fetch if we have instanceId
    if (params.instanceId) {
      calls.push({
        address: contractInfo.extensionAddress,
        abi: config.mintConfig.abi,
        functionName: "getClaim",
        args: [params.contractAddress, BigInt(params.instanceId)]
      } as any);
    }
    
    try {
      const results = await Promise.all(
        calls.map(call => 
          client.readContract(call as any).catch(err => {
            console.error("RPC call failed:", err);
            return null;
          })
        )
      );
      
      const mintFee = results[0] as bigint | null;
      const claim = results[1] as any;
      
      let totalCost = mintFee || BigInt(0);
      let erc20Details = undefined;
      
      if (claim) {
        // Store claim data in contractInfo for later use
        contractInfo.claim = {
          cost: claim.cost,
          merkleRoot: claim.merkleRoot,
          erc20: claim.erc20,
          startDate: claim.startDate,
          endDate: claim.endDate,
          walletMax: claim.walletMax
        };
        
        // Check if ERC20 payment
        if (claim.erc20 && claim.erc20 !== "0x0000000000000000000000000000000000000000") {
          // Batch ERC20 details fetch
          const [symbol, decimals, allowance, balance] = await Promise.all([
            client.readContract({
              address: claim.erc20,
              abi: [{ name: "symbol", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" }],
              functionName: "symbol"
            }),
            client.readContract({
              address: claim.erc20,
              abi: [{ name: "decimals", type: "function", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" }],
              functionName: "decimals"
            }),
            params.recipient ? client.readContract({
              address: claim.erc20,
              abi: [{ 
                name: "allowance", 
                type: "function", 
                inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], 
                outputs: [{ type: "uint256" }], 
                stateMutability: "view" 
              }],
              functionName: "allowance",
              args: [params.recipient, contractInfo.extensionAddress || params.contractAddress]
            }).catch(() => BigInt(0)) : Promise.resolve(undefined), // Return undefined when no recipient, not 0
            params.recipient ? client.readContract({
              address: claim.erc20,
              abi: [{ 
                name: "balanceOf", 
                type: "function", 
                inputs: [{ name: "owner", type: "address" }], 
                outputs: [{ type: "uint256" }], 
                stateMutability: "view" 
              }],
              functionName: "balanceOf",
              args: [params.recipient]
            }).catch(() => BigInt(0)) : Promise.resolve(undefined)
          ]);
          
          // Validate decimals
          const validatedDecimals = Number(decimals);
          if (isNaN(validatedDecimals) || validatedDecimals < 0 || validatedDecimals > 255) {
            console.error(`Invalid ERC20 decimals for ${claim.erc20}:`, decimals);
            throw new Error(`Invalid ERC20 decimals: ${decimals}`);
          }
          
          erc20Details = {
            address: claim.erc20,
            symbol: symbol as string,
            decimals: validatedDecimals,
            allowance: allowance as bigint,
            balance: balance as bigint | undefined
          };
          
          // For ERC20, total cost in ETH is just the mint fee
          totalCost = mintFee || BigInt(0);
        } else {
          // ETH payment - add claim cost to mint fee
          totalCost = (mintFee || BigInt(0)) + (claim.cost || BigInt(0));
        }
      }
      
      return {
        mintPrice: mintFee || BigInt(0),
        erc20Details,
        totalCost,
        claim: claim ? contractInfo.claim : undefined
      };
    } catch (err) {
      console.error("Failed to fetch Manifold price data:", err);
      return { totalCost: BigInt(0) };
    }
  } else if (contractInfo.provider === "nfts2me") {
    // Special handling for nfts2me - try different pricing patterns
    
    // Pattern 1: Try mintPrice() first - for simple/free NFTs2Me contracts
    try {
      const mintPrice = await client.readContract({
        address: params.contractAddress,
        abi: [{
          inputs: [],
          name: "mintPrice",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function"
        }],
        functionName: "mintPrice",
        args: []
      });
      
      if (mintPrice !== undefined) {
        // mintPrice() returns the price per NFT
        const pricePerNFT = mintPrice as bigint;
        const totalCost = pricePerNFT * BigInt(params.amount || 1);
        
        // Handle free mints (mintPrice = 0)
        return {
          mintPrice: pricePerNFT,
          totalCost: totalCost
        };
      }
    } catch (err) {
      // mintPrice() doesn't exist, try next pattern
      console.log("mintPrice() not found, trying mintFee pattern");
    }
    
    // Pattern 2: Try mintFee(amount) + protocolFee() - for more complex pricing
    try {
      // Fetch both fees in parallel
      const [mintFee, protocolFee] = await Promise.all([
        // mintFee is the creator's revenue per NFT
        client.readContract({
          address: params.contractAddress,
          abi: [{
            inputs: [{ name: "amount", type: "uint256" }],
            name: "mintFee",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function"
          }],
          functionName: "mintFee",
          args: [BigInt(params.amount || 1)]
        }),
        // protocolFee is the platform fee (0.0001 ETH unless disabled)
        client.readContract({
          address: params.contractAddress,
          abi: [{
            inputs: [],
            name: "protocolFee",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function"
          }],
          functionName: "protocolFee",
          args: []
        })
      ]);
      
      if (mintFee !== undefined && protocolFee !== undefined) {
        // Total cost = creator revenue (mintFee) + platform fee (protocolFee * amount)
        const totalCost = (mintFee as bigint) + ((protocolFee as bigint) * BigInt(params.amount || 1));
        return {
          mintPrice: mintFee as bigint,
          totalCost: totalCost
        };
      }
    } catch (err) {
      console.error("Failed to fetch nfts2me fees:", err);
    }
    
    // Pattern 3: Fallback to default fees if all patterns fail
    const amount = BigInt(params.amount || 1);
    const creatorFeePerNFT = BigInt("100000000000000"); // 0.0001 ETH creator fee per NFT
    const protocolFeePerNFT = BigInt("100000000000000"); // 0.0001 ETH protocol fee per NFT
    return { 
      mintPrice: creatorFeePerNFT * amount,
      totalCost: (creatorFeePerNFT + protocolFeePerNFT) * amount
    };
  } else if (contractInfo.provider === "thirdweb") {
    // thirdweb OpenEditionERC721 price discovery
    try {
      // First get the active claim condition ID
      const claimCondition = await client.readContract({
        address: params.contractAddress,
        abi: THIRDWEB_OPENEDITONERC721_ABI,
        functionName: "claimCondition"
      });
      
      // Validate the response is an array with expected values
      if (!Array.isArray(claimCondition) || claimCondition.length !== 2) {
        throw new Error("Invalid claim condition response from contract");
      }
      
      const [currentStartId, count] = claimCondition as [bigint, bigint];
      
      if (count === BigInt(0)) {
        // No claim conditions set
        return { mintPrice: BigInt(0), totalCost: BigInt(0) };
      }
      
      // Get the active claim condition (last one)
      const activeConditionId = currentStartId + count - BigInt(1);
      
      const condition = await client.readContract({
        address: params.contractAddress,
        abi: THIRDWEB_OPENEDITONERC721_ABI,
        functionName: "getClaimConditionById",
        args: [activeConditionId]
      });
      
      if (!condition || typeof condition !== "object") {
        throw new Error("Invalid claim condition response");
      }
      
      const {
        startTimestamp,
        maxClaimableSupply,
        supplyClaimed,
        quantityLimitPerWallet,
        merkleRoot,
        pricePerToken,
        currency,
        metadata
      } = condition as any;
      
      // Store claim condition in contractInfo for later use
      contractInfo.claimCondition = {
        id: Number(activeConditionId),
        pricePerToken: pricePerToken as bigint,
        currency: currency as `0x${string}`,
        maxClaimableSupply: maxClaimableSupply as bigint,
        merkleRoot: merkleRoot as `0x${string}`,
        startTimestamp: Number(startTimestamp),
        quantityLimitPerWallet: quantityLimitPerWallet as bigint
      };
      
      // Check if it's ERC20 payment
      if (currency && currency.toLowerCase() !== THIRDWEB_NATIVE_TOKEN.toLowerCase()) {
        // ERC20 payment
        const [symbol, decimals, allowance, balance] = await Promise.all([
          client.readContract({
            address: currency,
            abi: [{ name: "symbol", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" }],
            functionName: "symbol"
          }),
          client.readContract({
            address: currency,
            abi: [{ name: "decimals", type: "function", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" }],
            functionName: "decimals"
          }),
          params.recipient ? client.readContract({
            address: currency,
            abi: [{ 
              name: "allowance", 
              type: "function", 
              inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], 
              outputs: [{ type: "uint256" }], 
              stateMutability: "view" 
            }],
            functionName: "allowance",
            args: [params.recipient, params.contractAddress]
          }).catch(() => BigInt(0)) : Promise.resolve(undefined),
          params.recipient ? client.readContract({
            address: currency,
            abi: [{ 
              name: "balanceOf", 
              type: "function", 
              inputs: [{ name: "owner", type: "address" }], 
              outputs: [{ type: "uint256" }], 
              stateMutability: "view" 
            }],
            functionName: "balanceOf",
            args: [params.recipient]
          }).catch(() => BigInt(0)) : Promise.resolve(undefined)
        ]);
        
        // Validate decimals
        const validatedDecimals = Number(decimals);
        if (isNaN(validatedDecimals) || validatedDecimals < 0 || validatedDecimals > 255) {
          console.error(`Invalid ERC20 decimals for ${currency}:`, decimals);
          throw new Error(`Invalid ERC20 decimals: ${decimals}`);
        }
        
        return {
          mintPrice: pricePerToken as bigint,
          erc20Details: {
            address: currency,
            symbol: symbol as string,
            decimals: validatedDecimals,
            allowance: allowance as bigint,
            balance: balance as bigint | undefined
          },
          totalCost: BigInt(0) // No ETH needed for ERC20 payment
        };
      } else {
        // ETH payment
        const totalCost = (pricePerToken as bigint) * BigInt(params.amount || 1);
        return {
          mintPrice: pricePerToken as bigint,
          totalCost
        };
      }
    } catch (err) {
      console.error("Failed to fetch thirdweb price data:", err);
      return { totalCost: BigInt(0) };
    }
  } else {
    // Generic price discovery - try multiple function names
    const functionNames = config.priceDiscovery.functionNames;
    
    for (const functionName of functionNames) {
      try {
        // Check if this function requires an amount parameter
        const args = config.priceDiscovery.requiresAmountParam 
          ? [BigInt(params.amount || 1)]
          : [];
        
        const price = await client.readContract({
          address: params.contractAddress,
          abi: config.priceDiscovery.abis[0],
          functionName: functionName as any,
          args
        });
        
        if (price !== undefined) {
          // Calculate total cost based on provider's custom logic
          const totalCost = config.mintConfig.calculateValue(price as bigint, params);
          return {
            mintPrice: price as bigint,
            totalCost
          };
        }
      } catch {
        // Try next function name
        continue;
      }
    }
    
    // No price found, assume free mint
    return { mintPrice: BigInt(0), totalCost: BigInt(0) };
  }
}