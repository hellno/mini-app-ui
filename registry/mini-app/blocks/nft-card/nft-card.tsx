"use client";

import { cn } from "@/registry/mini-app/lib/utils";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  image_url?: string;
  animation_url?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  image_details?: {
    bytes?: number;
    format?: string;
    sha256?: string;
    width?: number;
    height?: number;
  };
  [key: string]: unknown;
}
import { getAddress, type Address } from "viem";
import { 
  findChainByName, 
  getPublicClient 
} from "@/registry/mini-app/lib/chains";
import { 
  ERC721_ABI, 
  ipfsToHttp 
} from "@/registry/mini-app/lib/nft-standards";
import { 
  getTokenMetadataURL 
} from "@/registry/mini-app/lib/nft-metadata-utils";

// Base64 placeholder image
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPk5GVCBJbWFnZTwvdGV4dD48L3N2Zz4=";


interface NFTCardProps {
  // Essential props
  contractAddress: string;
  tokenId: string;
  network?: string;
  
  // Display size - single prop that handles both dimensions
  size?: number | string;
  
  // All display options grouped (all optional with smart defaults)
  displayOptions?: {
    showTitle?: boolean;
    showNetwork?: boolean; 
    rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
    shadow?: boolean;
  };
  
  // Standard React props
  className?: string;
  onLoad?: (metadata: NFTMetadata) => void;
  onError?: (error: Error) => void;
}

export function NFTCard({
  contractAddress,
  tokenId,
  network = "ethereum",
  size = 300,
  displayOptions = {},
  className = "",
  onLoad,
  onError,
}: NFTCardProps) {
  // Extract display options with defaults
  const {
    showTitle = true,
    showNetwork = true,
    rounded = "md",
    shadow = true,
  } = displayOptions;
  const [imageUrl, setImageUrl] = useState<string>(PLACEHOLDER_IMAGE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string>("");
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  const networkPositionClasses = {
    "top-left": "top-0 left-0 rounded-br-md",
    "top-right": "top-0 right-0 rounded-bl-md",
    "bottom-left": "bottom-0 left-0 rounded-tr-md",
    "bottom-right": "bottom-0 right-0 rounded-tl-md",
    outside: "",
  };


  useEffect(() => {
    const fetchNFTData = async () => {
      if (!contractAddress || !tokenId) return;
      
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new AbortController for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);

      try {
        // Find the chain by name using shared utility
        const selectedChain = findChainByName(network || "ethereum");
        
        if (!selectedChain) {
          console.warn(
            `Chain "${network}" not found, defaulting to Ethereum mainnet`,
          );
          setNetworkName("Ethereum");
        } else {
          setNetworkName(selectedChain.name);
        }

        // Create public client using shared utility
        const client = getPublicClient(selectedChain?.id || 1);

        console.log(
          `Fetching NFT data from ${selectedChain?.name || 'Ethereum'} for contract ${contractAddress} token ${tokenId}`,
        );

        // Get contract name for title
        try {
          // Get contract name
          const name = (await client.readContract({
            address: getAddress(contractAddress),
            abi: ERC721_ABI.name,
            functionName: "name",
          })) as string;

          // Set title
          setTitle(`${name} #${tokenId}`);
        } catch (nameError) {
          console.warn("Could not fetch NFT name:", nameError);
          setTitle(`NFT #${tokenId}`);
        }


          // Get tokenURI with comprehensive metadata support
          let metadataUrl = await getTokenMetadataURL(
            client,
            getAddress(contractAddress) as Address,
            tokenId
          );

          // Handle IPFS URLs using shared utility
          metadataUrl = ipfsToHttp(metadataUrl);

          // Fetch metadata with abort signal
          const response = await fetch(metadataUrl, {
            signal: abortController.signal
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch metadata: ${response.status}`);
          }
          
          const fetchedMetadata = await response.json();
          console.log("NFT metadata:", fetchedMetadata);
          
          // Store metadata in state
          setMetadata(fetchedMetadata);

          // Call onLoad callback if provided
          if (onLoad) {
            onLoad(fetchedMetadata);
          }

          // Get image URL from metadata
          let nftImageUrl = fetchedMetadata.image || fetchedMetadata.image_url;

          // Handle IPFS URLs for image using shared utility
          if (nftImageUrl) {
            nftImageUrl = ipfsToHttp(nftImageUrl);
          }

          if (nftImageUrl) {
            setImageUrl(nftImageUrl);
          } else {
            // If no image URL found, use placeholder
            setImageUrl(PLACEHOLDER_IMAGE);
          }

          // Check for animation URL (video content)
          if (fetchedMetadata.animation_url) {
            const animationUrl = ipfsToHttp(fetchedMetadata.animation_url);
            setVideoUrl(animationUrl);
            setIsVideo(true);
          }
      } catch (err) {
        // Don't update state if request was aborted
        if (err instanceof Error && err.name === "AbortError") {
          console.log("NFT data fetch was cancelled");
          return;
        }
        
        console.error("Error fetching NFT:", err);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(`Failed to load NFT data: ${error.message}`);
        setImageUrl(PLACEHOLDER_IMAGE);

        // Call onError callback if provided
        if (onError) {
          onError(error);
        }
      } finally {
        // Only update loading state if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchNFTData();
    
    // Cleanup function to abort request if component unmounts or deps change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    contractAddress,
    tokenId,
    network,
    onLoad,
    onError,
  ]);

  const defaultLoadingComponent = (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-300 dark:bg-gray-700">
      <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
    </div>
  );

  const defaultErrorComponent = (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <p className="text-red-500 text-sm text-center px-2">{error}</p>
    </div>
  );

  // Render network badge inside the image
  const renderNetworkBadge = () => {
    if (!showNetwork || !networkName)
      return null;

    return (
      <div
        className={cn(
          "absolute bg-black/60 px-2 py-1 text-white text-xs",
          networkPositionClasses["top-right"],
        )}
      >
        {networkName}
      </div>
    );
  };

  // Render title inside the image
  const renderInnerTitle = () => {
    if (!showTitle || !title) return null;

    return (
      <div
        className={cn(
          "absolute left-0 right-0 bg-black/60 p-2 text-white text-sm truncate",
          "bottom-0",
        )}
      >
        {title}
      </div>
    );
  };

  // Render outside information (title, network)
  const renderOutsideInfo = () => {
    if (
      (!showTitle || !title) &&
      (!showNetwork || !networkName)
    ) {
      return null;
    }

    return (
      <div className="mt-2">
        {showTitle && title && (
          <div className={cn("text-sm font-medium truncate")}>
            {title}
          </div>
        )}

        {showNetwork && networkName && (
          <div
            className={cn(
              "text-xs text-gray-500 dark:text-gray-400",
                )}
          >
            Network: {networkName}
          </div>
        )}

      </div>
    );
  };

  // Apply container classes
  const getContainerClasses = () => {
    return "";
  };

  // Calculate display dimensions that preserve aspect ratio
  const getDisplayDimensions = () => {
    // Handle percentage values
    const isPercentageSize = typeof size === "string" && size.includes("%");
    
    if (isPercentageSize) {
      return { 
        width: size, 
        height: size, 
        useContain: false,
        isPercentage: true
      };
    }
    
    const numericSize = typeof size === "number" ? size : 300;
    
    // Get dimensions from metadata or image natural dimensions
    const dimensionsFromMetadata = metadata?.image_details?.width && metadata?.image_details?.height 
      ? { width: metadata.image_details.width, height: metadata.image_details.height }
      : null;
    
    const availableDimensions = dimensionsFromMetadata || imageDimensions || videoDimensions;
    
    // If we have dimensions, calculate dynamic height based on aspect ratio
    if (availableDimensions) {
      const aspectRatio = availableDimensions.width / availableDimensions.height;
      const dynamicHeight = Math.round(numericSize / aspectRatio);
      
      return { 
        width: numericSize, 
        height: dynamicHeight,
        useContain: false, // No need for contain with dynamic sizing
        isPercentage: false
      };
    }
    
    // No dimensions available, use square
    return { width: numericSize, height: numericSize, useContain: false, isPercentage: false };
  };

  const displayDimensions = getDisplayDimensions();
  
  // Apply flexible aspect ratio for any media with known dimensions
  const shouldUseFlexibleHeight = (isVideo && videoDimensions) || imageDimensions || (metadata?.image_details?.width && metadata?.image_details?.height);
  
  // Calculate container height - now using the dynamic height from getDisplayDimensions
  const containerHeight = displayDimensions.isPercentage 
    ? displayDimensions.height 
    : `${displayDimensions.height}px`;

  return (
    <div className={cn(getContainerClasses())}>
      <div
        className={cn(
          "relative overflow-hidden",
          roundedClasses[rounded],
          shadow && "shadow-md",
          className,
        )}
        style={{ 
          width: displayDimensions.isPercentage 
            ? displayDimensions.width 
            : `${displayDimensions.width}px`, 
          height: containerHeight
        }}
      >
        {isLoading && defaultLoadingComponent}

        {error && defaultErrorComponent}

        {videoUrl ? (
          <>
            {/* Background for letterboxing - only show if not using flexible aspect ratio */}
            {!shouldUseFlexibleHeight && (
              <div className="absolute inset-0 bg-black/5 dark:bg-white/5" />
            )}
            <video
              src={videoUrl}
              poster={imageUrl}
              autoPlay
              loop
              muted
              playsInline
              className={cn(
                shouldUseFlexibleHeight ? "w-full h-full" : "absolute inset-0 w-full h-full",
                !shouldUseFlexibleHeight && "object-contain",
                isLoading && "opacity-0"
              )}
              style={{ 
                objectFit: shouldUseFlexibleHeight ? "cover" : "contain"
              }}
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                setVideoDimensions({
                  width: video.videoWidth,
                  height: video.videoHeight
                });
              }}
              onError={() => {
                console.error("Video failed to load, falling back to image");
                setVideoUrl(null);
              }}
            />
          </>
        ) : (
          <Image
            src={imageUrl}
            alt="NFT Image"
            fill={true}
            className={cn(
              shouldUseFlexibleHeight ? "object-cover" : "object-contain",
              isLoading && "opacity-0"
            )}
            unoptimized={true}
            onLoad={(e) => {
              const img = e.currentTarget;
              setImageDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight
              });
            }}
            onError={() => setImageUrl(PLACEHOLDER_IMAGE)}
          />
        )}

        {renderInnerTitle()}
        {renderNetworkBadge()}
      </div>

      {renderOutsideInfo()}
    </div>
  );
}
