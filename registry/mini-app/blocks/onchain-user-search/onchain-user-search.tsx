"use client";

import * as React from "react";
import { Button } from "@/registry/mini-app/ui/button";
import { Input } from "@/registry/mini-app/ui/input";
import { useMiniAppSdk } from "@/registry/mini-app/hooks/use-miniapp-sdk";
import { Search, User, Users, X, AtSign, Wallet } from "lucide-react";
import { formatLargeNumber } from "@/registry/mini-app/lib/text-utils";
import { cn } from "@/registry/mini-app/lib/utils";
import {
  detectInputType,
  formatAddress,
  normalizeAddress,
  addressesEqual,
} from "@/registry/mini-app/lib/address-utils";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { getAlchemyEndpoint } from "@/registry/mini-app/lib/chains";

// Types based on Neynar API response
export type FarcasterUser = {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
  following_count: number;
  power_badge?: boolean;
  profile?: {
    bio?: {
      text?: string;
    };
  };
  verified_addresses?: {
    eth_addresses?: string[];
  };
};

export type NeynarSearchResponse = {
  result: {
    users: FarcasterUser[];
    next?: {
      cursor: string;
    };
  };
};

export type NeynarBulkAddressResponse = {
  "0x...": FarcasterUser[];
};

// Unified user type that combines all identities
export type UnifiedUser = {
  // Primary identifier is the onchain address
  primaryAddress: string;
  // ENS name if available
  ensName?: string;
  // Farcaster profile if available
  farcaster?: FarcasterUser;
  // Additional addresses associated with this user
  addresses: string[];
  // Source of the result
  source: "farcaster" | "ens" | "address";
};

type OnchainUserSearchProps = {
  apiKey: string;
  alchemyApiKey?: string;
  placeholder?: string;
  variant?: "destructive" | "secondary" | "ghost" | "default";
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  layout?: "horizontal" | "vertical";
  showIcon?: boolean;
  autoSearch?: boolean;
  maxResults?: number;
  searchFunction?: (
    query: string,
    apiKey: string,
    maxResults: number,
    cursor?: string,
  ) => Promise<{ users: UnifiedUser[]; nextCursor?: string }>;
  userCardComponent?: React.ComponentType<UserCardProps>;
  onError?: (error: string) => void;
  onUserClick?: (user: UnifiedUser) => void;
  showAddresses?: boolean;
  showENS?: boolean;
};

export const calculateRelevanceScore = (
  user: FarcasterUser,
  query: string,
): number => {
  const lowerQuery = query.toLowerCase();
  const username = user.username.toLowerCase();
  const displayName = user.display_name.toLowerCase();

  let score = 0;

  // Exact matches get highest score
  if (username === lowerQuery || username === `${lowerQuery}.eth`)
    score += 1000;
  else if (username.startsWith(lowerQuery)) score += 600;
  else if (username.includes(lowerQuery)) score += 500;

  // make these else ifs:
  if (displayName === lowerQuery) score += 500;
  else if (displayName.startsWith(lowerQuery)) score += 500;
  else if (displayName.includes(lowerQuery)) score += 400;

  // FID match
  if (user.fid.toString() === query) score += 950;

  // Bonus for shorter usernames (more relevant for short queries)
  if (username.includes(lowerQuery)) {
    score += Math.max(0, 100 - username.length);
  }

  if (user.verified_addresses?.eth_addresses?.length) score += 30;

  // Bonus for follower count (logarithmic to avoid overwhelming)
  score += Math.log(user.follower_count + 1) * 10;

  return score;
};

export function OnchainUserSearch({
  apiKey,
  alchemyApiKey,
  onUserClick,
  placeholder = "Search by username, ENS, or address...",
  variant = "default",
  className,
  inputClassName,
  buttonClassName,
  layout = "horizontal",
  showIcon = true,
  autoSearch = false,
  maxResults = 5,
  searchFunction,
  userCardComponent: CustomUserCard,
  onError,
  showAddresses = true,
  showENS = true,
}: OnchainUserSearchProps) {
  const [searchInput, setSearchInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<UnifiedUser[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | undefined>();
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const debounceRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  const { sdk, isSDKLoaded, isMiniApp } = useMiniAppSdk();
  // Create viem client for ENS resolution
  const publicClient = React.useMemo(() => {
    const alchemyKey = alchemyApiKey || process.env.NEXT_PUBLIC_ALCHEMY_KEY;
    const rpcUrl = alchemyKey ? getAlchemyEndpoint(1, alchemyKey) : undefined;

    return createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl),
    });
  }, [alchemyApiKey]);

  // Search for Farcaster users by username
  const searchFarcasterUsers = async (
    query: string,
    cursor?: string,
  ): Promise<{ users: FarcasterUser[]; nextCursor?: string }> => {
    let url = `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(query)}&limit=${maxResults}`;
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        api_key: apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    const data: NeynarSearchResponse = await response.json();

    // Sort by relevance if multiple results (only for first page)
    const users = !cursor
      ? (data.result.users || [])
          .map((user) => ({
            user,
            score: calculateRelevanceScore(user, query),
          }))
          .sort((a, b) => b.score - a.score)
          .map((item) => item.user)
      : data.result.users || [];

    return {
      users,
      nextCursor: data.result.next?.cursor,
    };
  };

  // Search for Farcaster users by address
  const searchFarcasterByAddress = async (
    address: string,
  ): Promise<FarcasterUser[]> => {
    const url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${encodeURIComponent(address)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        api_key: apiKey,
      },
    });

    if (!response.ok) {
      // If 404, it means no users found for this address
      if (response.status === 404) {
        return [];
      }
      const errorData = await response.json();
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    const data: NeynarBulkAddressResponse = await response.json();

    // The response is an object with addresses as keys
    const users: FarcasterUser[] = [];
    for (const [addr, userList] of Object.entries(data)) {
      if (addressesEqual(addr, address) && Array.isArray(userList)) {
        users.push(...userList);
      }
    }

    return users;
  };

  // Resolve ENS name to address
  const resolveENSToAddress = async (
    ensName: string,
  ): Promise<string | null> => {
    try {
      const address = await publicClient.getEnsAddress({
        name: ensName,
      });
      return address || null;
    } catch (error) {
      return null;
    }
  };

  // Reverse resolve address to ENS name
  const resolveAddressToENS = async (
    address: string,
  ): Promise<string | null> => {
    try {
      const ensName = await publicClient.getEnsName({
        address: address as `0x${string}`,
      });

      // Verify the reverse resolution
      if (ensName) {
        const verifyAddress = await publicClient.getEnsAddress({
          name: ensName,
        });
        if (!addressesEqual(verifyAddress, address)) {
          return null;
        }
      }

      return ensName || null;
    } catch (error) {
      return null;
    }
  };

  // Default unified search function
  const defaultSearchFunction = async (
    query: string,
    apiKey: string,
    maxResults: number,
    cursor?: string,
  ): Promise<{
    users: UnifiedUser[];
    nextCursor?: string;
  }> => {
    const inputType = detectInputType(query);
    const results: UnifiedUser[] = [];

    if (inputType === "address") {
      // For addresses, do parallel lookups
      const normalizedAddr = normalizeAddress(query);
      if (!normalizedAddr) {
        throw new Error("Invalid Ethereum address");
      }

      // Parallel lookups for address
      const [ensName, farcasterUsers] = await Promise.all([
        showENS ? resolveAddressToENS(normalizedAddr) : Promise.resolve(null),
        searchFarcasterByAddress(normalizedAddr),
      ]);

      if (farcasterUsers.length > 0) {
        // Group by primary address if multiple Farcaster accounts
        for (const fcUser of farcasterUsers) {
          const addresses = fcUser.verified_addresses?.eth_addresses || [];
          results.push({
            primaryAddress: normalizedAddr,
            ensName,
            farcaster: fcUser,
            addresses: addresses
              .filter((addr) => !addressesEqual(addr, normalizedAddr))
              .concat(normalizedAddr),
            source: "address",
          });
        }
      } else {
        // No Farcaster account, just show address info
        results.push({
          primaryAddress: normalizedAddr,
          ensName,
          addresses: [normalizedAddr],
          source: "address",
        });
      }
    } else if (inputType === "ens") {
      // For ENS names, resolve to address first
      const address = await resolveENSToAddress(query);
      if (!address) {
        throw new Error("ENS name could not be resolved");
      }

      // Then search for Farcaster accounts
      const farcasterUsers = await searchFarcasterByAddress(address);

      if (farcasterUsers.length > 0) {
        for (const fcUser of farcasterUsers) {
          const addresses = fcUser.verified_addresses?.eth_addresses || [];
          results.push({
            primaryAddress: address,
            ensName: query,
            farcaster: fcUser,
            addresses: addresses
              .filter((addr) => !addressesEqual(addr, address))
              .concat(address),
            source: "ens",
          });
        }
      } else {
        // No Farcaster account
        results.push({
          primaryAddress: address,
          ensName: query,
          addresses: [address],
          source: "ens",
        });
      }
    } else {
      // Username search
      const { users: farcasterUsers, nextCursor } = await searchFarcasterUsers(
        query,
        cursor,
      );

      // Convert to unified format
      for (const fcUser of farcasterUsers) {
        const primaryAddr = fcUser.verified_addresses?.eth_addresses?.[0];
        if (!primaryAddr) {
          // Skip users without verified addresses
          continue;
        }

        // Look up ENS for primary address if enabled
        const ensName = showENS ? await resolveAddressToENS(primaryAddr) : null;

        results.push({
          primaryAddress: primaryAddr,
          ensName,
          farcaster: fcUser,
          addresses: fcUser.verified_addresses?.eth_addresses || [],
          source: "farcaster",
        });
      }

      return {
        users: results,
        nextCursor,
      };
    }

    return {
      users: results,
      nextCursor: undefined,
    };
  };

  const searchUsers = async (query: string, loadMore = false) => {
    if (!searchFunction && !apiKey.trim()) {
      const errorMsg = "API key is required";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (!query.trim()) {
      const errorMsg = "Please enter a search term";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      if (loadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
        setSearchResults([]);
        setNextCursor(undefined);
      }
      setError("");

      const searchFn = searchFunction || defaultSearchFunction;
      const cursor = loadMore ? nextCursor : undefined;

      const { users, nextCursor: newCursor } = await searchFn(
        query,
        apiKey,
        maxResults,
        cursor,
      );

      if (loadMore) {
        setSearchResults((prev) => [...prev, ...users]);
      } else {
        setSearchResults(users);
      }

      setNextCursor(newCursor);

      if (!loadMore && users.length === 0) {
        const errorMsg = "No users found matching your search";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to search users";
      setError(errorMsg);
      if (!loadMore) {
        setSearchResults([]);
        setNextCursor(undefined);
      }
      onError?.(errorMsg);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const viewProfile = async (user: UnifiedUser) => {
    try {
      if (user.farcaster && isMiniApp) {
        await sdk.actions.viewProfile({ fid: user.farcaster.fid });
      } else if (user.farcaster) {
        window.open(
          `https://farcaster.xyz/${user.farcaster.username}`,
          "_blank",
        );
      } else if (user.ensName) {
        window.open(`https://app.ens.domains/${user.ensName}`, "_blank");
      } else {
        window.open(
          `https://etherscan.io/address/${user.primaryAddress}`,
          "_blank",
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to view profile";
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleSearch = async () => {
    await searchUsers(searchInput);
  };

  const handleClear = () => {
    setSearchInput("");
    setSearchResults([]);
    setNextCursor(undefined);
    setError("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setSearchInput(value);
    setError("");

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value === "") {
      setSearchResults([]);
      setNextCursor(undefined);
      return;
    }

    // Auto-search with debounce
    if (autoSearch && value.length > 2) {
      debounceRef.current = setTimeout(() => {
        searchUsers(value);
      }, 500);
    }
  };

  const containerClasses = cn("flex flex-col gap-4 w-full", className);

  const searchContainerClasses = cn(
    "flex gap-2 w-full",
    layout === "vertical" ? "flex-col" : "flex-row",
  );

  const hasMoreResults = !!nextCursor;

  return (
    <div className={containerClasses}>
      {/* Search Input */}
      <div className={searchContainerClasses}>
        <div className="flex-1 flex gap-2">
          <Input
            type="text"
            placeholder={placeholder}
            value={searchInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className={cn("w-full", error && "border-red-500", inputClassName)}
          />
          {searchInput && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleClear}
              disabled={loading}
              className="shrink-0"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Clear Button - only show when there's a search term */}
        <Button
          variant={variant}
          onClick={handleSearch}
          disabled={loading || !searchInput.trim() || !isSDKLoaded}
          className={cn(
            layout === "vertical" ? "w-full" : "shrink-0",
            buttonClassName,
          )}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Searching...
            </>
          ) : (
            <>
              {showIcon && <Search className="h-4 w-4 mr-2" />}
              Search
            </>
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Showing {searchResults.length} user
              {searchResults.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="grid gap-3">
            {searchResults.map((user) => {
              const UserCardComponent = CustomUserCard || UserCard;
              return (
                <UserCardComponent
                  key={user.primaryAddress + (user.farcaster?.fid || "")}
                  user={user}
                  onClick={() => {
                    if (onUserClick) {
                      onUserClick(user);
                    } else {
                      viewProfile(user);
                    }
                  }}
                  showAddresses={showAddresses}
                  showENS={showENS}
                />
              );
            })}
          </div>

          {hasMoreResults && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => searchUsers(searchInput, true)}
                disabled={isLoadingMore || loading}
                className="w-full sm:w-auto"
              >
                {isLoadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Loading more...
                  </>
                ) : (
                  <>Load More</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// User Card Component
type UserCardProps = {
  user: UnifiedUser;
  onClick: () => void;
  showAddresses?: boolean;
  showENS?: boolean;
};

function UserCard({
  user,
  onClick,
  showAddresses = true,
  showENS = true,
}: UserCardProps) {
  const hasFarcaster = !!user.farcaster;
  const displayName =
    user.farcaster?.display_name ||
    user.ensName ||
    formatAddress(user.primaryAddress);
  const username = user.farcaster?.username;
  const pfpUrl = user.farcaster?.pfp_url;

  return (
    <div
      onClick={onClick}
      className="p-2 sm:p-3 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
    >
      {/* Top row with avatar, name, and identifiers */}
      <div className="flex gap-2 sm:gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0 mt-[3px]">
          {pfpUrl ? (
            <img
              src={pfpUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {hasFarcaster ? (
                <User className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Wallet className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        {/* Name and identifiers */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="font-medium text-xs sm:text-sm truncate flex-1">
              {displayName}
            </h3>
            {user.farcaster && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                FID {user.farcaster.fid}
              </span>
            )}
          </div>

          {/* Username or ENS */}
          {username && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1">
              @{username}
            </p>
          )}

          {/* ENS name if different from display */}
          {showENS && user.ensName && user.ensName !== displayName && (
            <p className="text-xs text-muted-foreground truncate">
              {user.ensName}
            </p>
          )}

          {/* Primary address */}
          {showAddresses && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              {formatAddress(user.primaryAddress)}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {user.farcaster?.profile?.bio?.text && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-tight ml-12 sm:ml-15">
          {user.farcaster.profile.bio.text}
        </p>
      )}

      {/* Stats or additional addresses */}
      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground ml-12 sm:ml-15">
        {user.farcaster ? (
          <>
            <span className="whitespace-nowrap">
              {formatLargeNumber(user.farcaster.follower_count)} followers
            </span>
            <span className="whitespace-nowrap">
              {formatLargeNumber(user.farcaster.following_count)} following
            </span>
          </>
        ) : (
          <>
            {user.addresses.length > 1 && showAddresses && (
              <span className="text-xs">
                +{user.addresses.length - 1} more address
                {user.addresses.length > 2 ? "es" : ""}
              </span>
            )}
            {user.source === "ens" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                ENS
              </span>
            )}
            {user.source === "address" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs">
                Address
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
