#!/bin/bash

# Install all components from hellno-mini-app-ui registry
# Usage: curl -sSL https://hellno-mini-app-ui.vercel.app/r/install-all.sh | bash

REGISTRY_URL="https://hellno-mini-app-ui.vercel.app"

# Install shared libraries first
echo "Installing shared libraries..."
pnpm dlx shadcn@latest add $REGISTRY_URL/r/chains.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/utils.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/address-utils.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/avatar-utils.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/text-utils.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/nft-standards.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/manifold-utils.json --yes

# Install hooks
echo "Installing hooks..."
pnpm dlx shadcn@latest add $REGISTRY_URL/r/use-miniapp-sdk.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/use-profile.json --yes

# Install UI primitives
echo "Installing UI primitives..."
pnpm dlx shadcn@latest add $REGISTRY_URL/r/button.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/input.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/card.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/sheet.json --yes

# Install components
echo "Installing components..."
pnpm dlx shadcn@latest add $REGISTRY_URL/r/avatar.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/user-context.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/add-miniapp-button.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/share-cast-button.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/show-coin-balance.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/nft-card.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/nft-mint-flow.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/manifold-nft-mint.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/onchain-user-search.json --yes
pnpm dlx shadcn@latest add $REGISTRY_URL/r/daimo-pay-transfer-button.json --yes

echo "✅ All components installed successfully!"