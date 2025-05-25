import { NextResponse } from "next/server";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const registry = {
    "$schema": "https://ui.shadcn.com/schema/registry.json",
    "name": "hellno/mini-app-ui",
    "homepage": appUrl,
    "items": [
      {
        "name": "nft-card",
        "type": "registry:component",
        "title": "NFT Card",
        "description": "Simple NFT card component that displays NFT image from blockchain by contract address and token ID",
        "dependencies": [
          "next",
          "clsx",
          "tailwind-merge",
          "viem",
          "react"
        ],
        "registryDependencies": [],
        "files": [
          {
            "path": "registry/mini-app/blocks/nft-card/nft-card.tsx",
            "type": "registry:component"
          }
        ]
      },
      {
        "name": "daimo-pay-transfer-button",
        "type": "registry:component",
        "title": "Daimo Pay Button Token Transfer",
        "description": "A custom button for transferring tokens",
        "meta": {
          "mediaUrl": "/previews/daimo-pay-transfer-button.mp4",
          "demoUrl": "/component/daimo-pay-transfer-button"
        },
        "dependencies": [
          "@daimo/pay",
          "@daimo/contract",
          "wagmi",
          "viem",
          "@farcaster/frame-wagmi-connector"
        ],
        "registryDependencies": ["button"],
        "files": [
          {
            "path": "registry/mini-app/blocks/daimo-pay-transfer/components/daimo-pay-transfer-button.tsx",
            "type": "registry:component"
          },
          {
            "path": "registry/mini-app/blocks/daimo-pay-transfer/components/wagmi-provider.tsx",
            "type": "registry:component"
          }
        ]
      },
      {
        "name": "share-cast-button",
        "type": "registry:component",
        "title": "Share Cast Button",
        "description": "A button for sharing a cast",
        "dependencies": [],
        "registryDependencies": [
          "button",
          "@app/use-miniapp-sdk"
        ],
        "meta": {
          "mediaUrl": "/previews/share-cast-button.mp4",
          "demoUrl": "/component/share-cast-button"
        },
        "files": [
          {
            "path": "registry/mini-app/blocks/share-cast-button/share-cast-button.tsx",
            "type": "registry:component"
          }
        ]
      },
      {
        "name": "add-miniapp-button",
        "type": "registry:component",
        "title": "Add MiniApp Button",
        "description": "A button to add or pin a mini app",
        "dependencies": [],
        "registryDependencies": [
          "button",
          "@app/use-miniapp-sdk"
        ],
        "files": [
          {
            "path": "registry/mini-app/blocks/add-miniapp-button/add-miniapp-button.tsx",
            "type": "registry:component"
          }
        ]
      },
      {
        "name": "use-miniapp-sdk",
        "type": "registry:hook",
        "title": "useMiniAppSdk",
        "description": "Hook for Farcaster MiniApp SDK context and state",
        "files": [
          {
            "path": "registry/mini-app/hooks/use-miniapp-sdk.ts",
            "type": "registry:hook"
          }
        ],
        "dependencies": ["@farcaster/frame-core", "@farcaster/frame-sdk"],
        "registryDependencies": []
      },
      {
        "name": "show-coin-balance",
        "type": "registry:component",
        "title": "Show Coin Balance",
        "description": "Show coin balance for an address using Alchemy SDK",
        "dependencies": ["viem", "alchemy-sdk"],
        "registryDependencies": ["button", "input"],
        "files": [
          {
            "path": "registry/mini-app/blocks/show-coin-balance/show-coin-balance.tsx",
            "type": "registry:component"
          }
        ]
      },
      {
        "name": "use-profile",
        "type": "registry:hook",
        "title": "useProfile",
        "description": "Hook for accessing Farcaster user profile information",
        "dependencies": ["@farcaster/frame-core", "@farcaster/frame-sdk"],
        "registryDependencies": [
          "@app/use-miniapp-sdk"
        ],
        "files": [
          {
            "path": "registry/mini-app/hooks/use-profile.ts",
            "type": "registry:hook"
          }
        ]
      },
      {
        "name": "user-context",
        "type": "registry:component",
        "title": "User Context",
        "description": "Display user information with customizable layout and elements",
        "dependencies": [],
        "registryDependencies": [
          "avatar",
          "@app/use-profile"
        ],
        "files": [
          {
            "path": "registry/mini-app/blocks/user-context/user-context.tsx",
            "type": "registry:component"
          }
        ]
      },
      {
        "name": "avatar",
        "type": "registry:component",
        "title": "User Avatar",
        "description": "Customizable user avatar component with various sizes and shapes",
        "dependencies": ["@radix-ui/react-avatar"],
        "registryDependencies": [
          "@app/use-profile"
        ],
        "files": [
          {
            "path": "registry/mini-app/blocks/avatar/avatar.tsx",
            "type": "registry:component"
          },
          {
            "path": "registry/mini-app/ui/avatar.tsx",
            "type": "registry:ui"
          }
        ]
      }
    ]
  };

  // Convert all registryDependencies using @app/ to full URLs
  registry.items.forEach(item => {
    if (item.registryDependencies) {
      item.registryDependencies = item.registryDependencies.map((dep: string) => {
        if (dep.startsWith('@app/')) {
          const componentName = dep.replace('@app/', '');
          return `${appUrl}/r/${componentName}.json`;
        }
        return dep;
      });
    }
  });

  return NextResponse.json(registry);
} 