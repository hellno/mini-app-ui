import { DaimoPayTransferButton } from "@/registry/mini-app/blocks/daimo-pay-transfer/components/daimo-pay-transfer-button";
import { ShareCastButton } from "@/registry/mini-app/blocks/share-cast-button/share-cast-button";
import { ShareBottomSheet } from "@/registry/mini-app/blocks/share-bottom-sheet/share-bottom-sheet";
import { AddMiniappButton } from "@/registry/mini-app/blocks/add-miniapp-button/add-miniapp-button";
import { ShowCoinBalance } from "@/registry/mini-app/blocks/show-coin-balance/show-coin-balance";
import { UserAvatar } from "@/registry/mini-app/blocks/avatar/avatar";
import { UserContext } from "@/registry/mini-app/blocks/user-context/user-context";
import * as React from "react";
import { OnchainUserSearchSimulationDemo } from "@/registry/mini-app/blocks/onchain-user-search/simulationHelper";
import { NFTMintExamples } from "@/components/nft-mint-examples";
import { NftCardExamples } from "@/components/nft-card-examples";
import { NFTShowcaseDemo } from "@/components/nft-showcase-demo";

export interface ComponentItem {
  title: string;
  component: React.ReactNode;
  installName?: string;
  isDemo?: boolean;
  demoCode?: string;
  slug?: string;
}

export interface ComponentGroup {
  title: string;
  items: ComponentItem[];
}

export const componentGroups: ComponentGroup[] = [
  {
    title: "Payments",
    items: [
      {
        title: "Token transfer",
        component: (
          <DaimoPayTransferButton
            text="Donate $20 to Protocol Guild"
            toAddress="0x32e3C7fD24e175701A35c224f2238d18439C7dBC"
            amount="20"
          />
        ),
        installName: "daimo-pay-transfer-button",
      },
    ],
  },
  {
    title: "Data Display",
    items: [
      {
        title: "Show Coin Balance",
        component: (
          <ShowCoinBalance
            defaultAddress="vitalik.eth"
            defaultTokenAddress="0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
          />
        ),
        installName: "show-coin-balance",
      },
    ],
  },
  {
    title: "Mini App Actions",
    items: [
      {
        title: "Share text and link in a cast",
        component: (
          <ShareCastButton
            text="Share hellno/mini-app-ui"
            url="https://hellno-mini-app-ui.vercel.app"
          />
        ),
        installName: "share-cast-button",
      },
      {
        title: "Add or pin a mini app",
        component: <AddMiniappButton />,
        installName: "add-miniapp-button",
      },
      {
        title: "Share Bottom Sheet",
        component: <ShareBottomSheetDemo />,
        installName: "share-bottom-sheet",
      },
    ],
  },
  {
    title: "User & Profile",
    items: [
      {
        title: "User Avatar Component",
        component: (
          <div className="flex flex-wrap gap-4 justify-center">
            <UserAvatar useProfileData={true} size="sm" shape="circle" />
            <UserAvatar
              useProfileData={true}
              size="md"
              shape="square"
              clickable={true}
            />
            <UserAvatar useProfileData={true} size="lg" shape="rounded" />
            <UserAvatar useProfileData={true} size="xl" clickable={true} />
          </div>
        ),
        installName: "avatar",
      },
      {
        title: "User Context Display",
        component: (
          <div className="flex flex-col gap-4">
            <UserContext
              showAvatar={true}
              showUsername={true}
              showDisplayName={true}
              showFid={true}
              clickable={true}
            />
            <UserContext
              layout="vertical"
              avatarSize="lg"
              avatarShape="rounded"
              avatarClickable={true}
            />
          </div>
        ),
        installName: "user-context",
      },
      {
        title: "Onchain User Search",
        component: (
          <div className="flex flex-col gap-6 w-full max-w-2xl">
            <OnchainUserSearchSimulationDemo />
          </div>
        ),
        installName: "onchain-user-search",
      },
    ],
  },
  {
    title: "NFT",
    items: [
      {
        title: "NFT Card Display",
        component: <NftCardExamples showHeader={false} />,
        installName: "nft-card",
      },
      {
        title: "NFT Mint Examples",
        component: <NFTMintExamples showHeader={false} />,
        installName: "nft-mint-flow",
      },
      {
        title: "NFT Composition Example",
        component: <NFTShowcaseDemo showHeader={false} />,
        isDemo: true,
        slug: "nft-composition-demo",
        demoCode: `import { NFTMintFlow } from "@/registry/mini-app/blocks/nft-mint-flow/nft-mint-flow";

export function NFTShowcase() {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <NFTMintFlow
        contractAddress="0x32dd0a7190b5bba94549a0d04659a9258f5b1387"
        tokenId="2"
        network="base"
        chainId={8453}
        provider="manifold"
        manifoldParams={{
          instanceId: "4293509360",
          tokenId: "2"
        }}
        buttonText="Mint with $HIGHER"
        cardSize={350}
      />
    </div>
  );
}`,
      },
    ],
  },
];

// ShareBottomSheet demo component
function ShareBottomSheetDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        Open Share Sheet
      </button>
      <ShareBottomSheet
        open={open}
        onOpenChange={setOpen}
        shareText="I just donated to help support Roman Storm's legal defense fund. Join me in defending the right to privacy and the right to publish code!"
        shareUrl="https://www.justiceforstorm.com"
        title="Inspire others to support!"
      />
    </>
  );
}

// Flatten groups into a single array for backward compatibility
export const componentItems: ComponentItem[] = componentGroups.flatMap(
  (group) => group.items,
);
