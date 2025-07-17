# Registry Installation Guide

## Quick Start

The recommended approach for installing hellno/mini-app-ui components:

### Option 1: Install Popular Components (Recommended)

```bash
# NFT display and minting
pnpm dlx shadcn@latest add https://hellno-mini-app-ui.vercel.app/r/nft-card.json
pnpm dlx shadcn@latest add https://hellno-mini-app-ui.vercel.app/r/nft-mint-flow.json

# User search (Farcaster, ENS, addresses)
pnpm dlx shadcn@latest add https://hellno-mini-app-ui.vercel.app/r/onchain-user-search.json

# Payment button
pnpm dlx shadcn@latest add https://hellno-mini-app-ui.vercel.app/r/daimo-pay-transfer-button.json
```

### Option 2: Install All Components (Recommended)

Install all components with a single command:

```bash
# Default: Skip existing files (safe for updates)
curl -sSL https://hellno-mini-app-ui.vercel.app/r/install-all.sh | bash

# Force overwrite all files
curl -sSL https://hellno-mini-app-ui.vercel.app/r/install-all-overwrite.sh | bash
```

This approach:
- ✅ Skips prompts automatically (no hanging scripts)
- ✅ Preserves your modifications by default
- ✅ Installs components in dependency order
- ✅ Works with both local and production registries
- ✅ Single command, no configuration needed

## Technical Details

### How Install Scripts Work

The install scripts (`install-all.sh` and `install-essential.sh`) provide a reliable way to install components:

1. **Dependency Order**: Components are installed in the correct order, with shared libraries first, then hooks, UI primitives, and finally complex components.

2. **Individual Installations**: Each component is installed separately using `pnpm dlx shadcn@latest add`, which:
   - Avoids pnpm store version conflicts
   - Shows progress for each component
   - Makes it easy to identify which component fails if there's an error

3. **Component Categories**:
   - **Shared Libraries**: Core utilities like chains, nft-standards, utils
   - **Hooks**: React hooks like use-miniapp-sdk, use-profile
   - **UI Primitives**: Basic components like button, input, card
   - **Components**: Complex components like nft-card, onchain-user-search

4. **Essential vs All**:
   - `install-essential.sh`: Installs only the most commonly used components (~9 components)
   - `install-all.sh`: Installs the complete registry (~25+ components)

### File Structure After Installation

The shadcn CLI will place files based on your `components.json` configuration:
```
your-project/
├── components/       # Main components and UI primitives
├── lib/             # Utility libraries
├── hooks/           # React hooks
└── registry/        # Complex components (if alias configured)
    └── mini-app/
        ├── blocks/
        ├── hooks/
        └── lib/
```

### Installation Requirements

Before installing, ensure you have:
1. A Next.js project with TypeScript
2. Tailwind CSS configured
3. A proper `components.json` file with aliases:
```json
{
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

## Troubleshooting

### Common Issues

1. **"ERR_PNPM_UNEXPECTED_STORE" error**
   - This happens when different pnpm versions are mixed
   - Solution: Clean reinstall your project dependencies
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```
   - Alternative: Use `npx` instead of `pnpm dlx` in the install commands

2. **"Invalid configuration" error**
   - Ensure your `components.json` has all required fields
   - Check that the `css` path exists in your project

3. **Files not in expected locations**
   - The shadcn CLI uses your `components.json` aliases
   - Registry paths are transformed to match your project structure
   - Check `components/`, `lib/`, and `hooks/` directories

4. **Import errors after installation**
   - Ensure your `tsconfig.json` has proper path mappings
   - Restart your TypeScript server
   - Check that all files were installed

### Manual File Verification

To verify all files were installed:
```bash
# Count installed files
find . -name "*.tsx" -o -name "*.ts" | grep -E "(components|lib|hooks)" | wc -l
# Should show ~25+ files for full installation
```

## Development Notes

For contributors:
- Run `pnpm registry:build` to rebuild all registry files including install scripts
- Test with `pnpm registry:test` for installation verification
- The `generate-install-script.js` creates install scripts with components in dependency order
- Scripts are generated for both local (localhost:3000) and production URLs

## Testing Your Installation

After installing, verify everything works:

```typescript
// Test imports
import { NFTCard } from "@/components/nft-card"
import { getChainById } from "@/lib/chains"
import { OnchainUserSearch } from "@/components/onchain-user-search"

// If these imports fail, some dependencies are missing
```

## Getting Help

If you encounter issues:
1. Check which files are missing
2. Install the specific component that includes those files
3. Report issues at: https://github.com/hellno/mini-app-ui/issues