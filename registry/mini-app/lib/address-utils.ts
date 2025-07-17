import { isAddress, getAddress } from "viem";

/**
 * Formats an Ethereum address to show first and last few characters
 * @param address - The address to format
 * @param chars - Number of characters to show at start and end (default: 4)
 * @returns Formatted address like "0x1234...5678"
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Detects the type of input (address, ENS name, or username)
 * @param input - The search input
 * @returns The detected input type
 */
export type InputType = "address" | "ens" | "username";

export function detectInputType(input: string): InputType {
  if (!input || input.trim().length === 0) return "username";
  
  const trimmed = input.trim();
  
  // Check if it's a valid Ethereum address
  if (isAddress(trimmed)) {
    return "address";
  }
  
  // Check if it's an ENS name (contains . and not already an address)
  if (trimmed.includes(".") && trimmed.length > 3) {
    // Common ENS TLDs
    const ensPattern = /\.(eth|xyz|luxe|kred|art|club|test)$/i;
    if (ensPattern.test(trimmed)) {
      return "ens";
    }
  }
  
  // Default to username (Farcaster username or FID)
  return "username";
}

/**
 * Validates and normalizes an Ethereum address
 * @param address - The address to validate
 * @returns The checksummed address or null if invalid
 */
export function normalizeAddress(address: string): string | null {
  try {
    if (!isAddress(address)) return null;
    return getAddress(address);
  } catch {
    return null;
  }
}

/**
 * Checks if two addresses are equal (case-insensitive)
 * @param addr1 - First address
 * @param addr2 - Second address
 * @returns True if addresses are equal
 */
export function addressesEqual(addr1: string | null | undefined, addr2: string | null | undefined): boolean {
  if (!addr1 || !addr2) return false;
  try {
    return getAddress(addr1).toLowerCase() === getAddress(addr2).toLowerCase();
  } catch {
    return false;
  }
}