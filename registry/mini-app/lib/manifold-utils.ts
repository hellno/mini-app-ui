/**
 * @deprecated This file is kept for backward compatibility. 
 * Please use nft-metadata-utils.ts instead which provides the same functionality plus enhanced metadata support.
 */
export * from "@/registry/mini-app/lib/nft-metadata-utils";

// Re-export the deprecated function name for backward compatibility
export { getTokenMetadataURL as getTokenURIWithManifoldSupport } from "@/registry/mini-app/lib/nft-metadata-utils";