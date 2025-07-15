#!/bin/bash

# Install all components from hellno-mini-app-ui registry (overwrite existing files)
# Usage: curl -sSL https://hellno-mini-app-ui.vercel.app/r/install-all-overwrite.sh | bash

REGISTRY_URL="https://hellno-mini-app-ui.vercel.app"

# Install shared libraries first
echo "Installing shared libraries (overwrite mode)..."
pnpm dlx shadcn@latest add $REGISTRY_URL/r/chains.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/utils.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/address-utils.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/avatar-utils.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/text-utils.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/nft-standards.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/manifold-utils.json --overwrite --yes

# Install hooks
echo "Installing hooks (overwrite mode)..."
pnpm dlx shadcn@latest add $REGISTRY_URL/r/use-miniapp-sdk.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/use-profile.json --overwrite --yes

# Install UI primitives
echo "Installing UI primitives (overwrite mode)..."
pnpm dlx shadcn@latest add $REGISTRY_URL/r/button.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/input.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/card.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/sheet.json --overwrite --yes

# Install components
echo "Installing components (overwrite mode)..."
pnpm dlx shadcn@latest add $REGISTRY_URL/r/avatar.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/user-context.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/add-miniapp-button.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/share-cast-button.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/show-coin-balance.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/nft-card.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/nft-mint-flow.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/manifold-nft-mint.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/onchain-user-search.json --overwrite --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/daimo-pay-transfer-button.json --overwrite --yes

echo "✅ All components installed successfully (overwrite mode)!"