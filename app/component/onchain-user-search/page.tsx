"use client";

import { OnchainUserSearch } from "@/registry/mini-app/blocks/onchain-user-search/onchain-user-search";

export default function OnchainUserSearchDemo() {
  const neynarApiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "";

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Onchain User Search</h1>
          <p className="text-muted-foreground">
            Search for users by Farcaster username, ENS name, or Ethereum
            address. All results are unified with the onchain address as the
            primary identifier.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Try searching for:</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Farcaster username: &quot;vitalik&quot;, &quot;dwr&quot;</li>
            <li>ENS name: &quot;vitalik.eth&quot;, &quot;nick.eth&quot;</li>
            <li>
              Ethereum address: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
            </li>
          </ul>
        </div>

        <OnchainUserSearch
          apiKey={neynarApiKey}
          placeholder="Search by farcaster username, ENS, or address..."
          autoSearch={true}
          maxResults={10}
          showAddresses={true}
          showENS={true}
          onUserClick={(user) => {
            // Example: Navigate to Farcaster profile
            if (user.farcaster) {
              window.open(`https://farcaster.xyz/${user.farcaster.username}`, "_blank");
            } else if (user.ensName) {
              window.open(`https://app.ens.domains/${user.ensName}`, "_blank");
            } else {
              window.open(`https://etherscan.io/address/${user.primaryAddress}`, "_blank");
            }
          }}
        />

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Features:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Auto-detects input type (username, ENS, or address)</li>
            <li>Resolves ENS names to addresses and vice versa</li>
            <li>Finds Farcaster accounts associated with addresses</li>
            <li>Shows all identities in unified cards</li>
            <li>Supports pagination for username searches</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
