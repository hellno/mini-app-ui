# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based component registry for Farcaster mini apps, built using the shadcn architecture. It provides reusable components, hooks, and utilities that developers can install via shadcn CLI from the custom registry.

## LLM Component Development Guide

### Interface Design Rules

- **FLAT PROPS**: No nested objects in component props
- **EXPLICIT TYPES**: `contractAddress: string` not `contract: { address: string }`
- **SINGLE RESPONSIBILITY**: One component = one clear purpose
- **NO HOOKS EXPORT**: Components only, no separate hook files
- **SELF-CONTAINED**: Each component includes all logic it needs

### Code Patterns

#### ✅ GOOD: Self-contained with flat props
```tsx
<NFTCard 
  contractAddress="0x..." 
  tokenId="1"
  network="ethereum"
  showTitle={true}
  showOwner={false}
/>
```

#### ❌ BAD: Nested config objects
```tsx
<NFTCard 
  config={{ 
    contract: { address: "0x...", tokenId: "1" },
    display: { showTitle: true, showOwner: false }
  }}
/>
```

#### ❌ BAD: Too many abstractions
```tsx
// Don't create separate files for every piece
useNFTMetadata.ts
useNFTImage.ts  
useNFTPrice.ts
NFTCard.tsx
NFTCardTypes.ts
NFTCardUtils.ts
NFTCardContext.tsx
```

#### ✅ GOOD: Everything in one place
```tsx
// nft-card.tsx - contains everything needed
export function NFTCard(props: NFTCardProps) {
  // All logic contained within component
}
```

### Standard Libraries Location

Always use these shared libraries instead of creating duplicates:
- **Chains**: `/registry/mini-app/lib/chains.ts` - RPC configuration, chain detection
- **NFT Standards**: `/registry/mini-app/lib/nft-standards.ts` - ABIs and constants
- **NFT Metadata Utils**: `/registry/mini-app/lib/nft-metadata-utils.ts` - NFT metadata fetching with comprehensive fallbacks

### Component Organization Pattern

For complex components with multiple use cases, use this structure:
```
blocks/component-name/
├── page.tsx                    # Default composed view (what users see)
├── components/
│   └── component-name.tsx      # Core component logic
└── lib/
    └── helper-files.ts         # Supporting utilities
```

Example with NFT Mint Flow:
- `page.tsx` - Shows NFTCard + NFTMintFlow composed together
- `components/nft-mint-flow.tsx` - Just the mint button logic
- Users can import either the full page or just the component

### ABI Usage Pattern

Always use full contract ABIs, not parsed fragments:

```typescript
// ✅ GOOD: Full ABI as const array
export const MANIFOLD_EXTENSION_ABI = [
  { name: "tokenURI", inputs: [...], outputs: [...], type: "function" },
  { name: "getClaim", inputs: [...], outputs: [...], type: "function" },
  // ... all functions
] as const;

// ❌ BAD: Mixed formats
export const MANIFOLD_ABI = {
  tokenURI: parseAbi([...]),     // parsed
  getClaim: [{...}] as const,     // raw array
  mint: parseAbi([...])           // parsed
};
```

### Error Handling Checklist

- [ ] **Abort controllers** for all async operations
- [ ] **Input validation** with clear error messages
- [ ] **Network failure** fallbacks
- [ ] **Type validation** for external data
- [ ] **Race condition** prevention

Example implementation:
```tsx
const abortControllerRef = useRef<AbortController | null>(null);

useEffect(() => {
  // Cancel previous request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  
  const abortController = new AbortController();
  abortControllerRef.current = abortController;
  
  // Make request with abort signal
  fetch(url, { signal: abortController.signal })
    .then(handleResponse)
    .catch(err => {
      if (err.name === 'AbortError') return;
      handleError(err);
    });
    
  return () => abortController.abort();
}, [deps]);
```

### Data Validation Pattern

Never trust external data:
```typescript
// Validate contract response
const data = await client.readContract({...});

if (!Array.isArray(data) || data.length !== 2) {
  throw new Error("Invalid response structure");
}

const [instanceId, claim] = data;

if (typeof instanceId !== 'bigint' || !claim || typeof claim !== 'object') {
  throw new Error("Invalid data types");
}
```

## Key Commands

**Development:**
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

**Registry Management:**
- `pnpm registry:build` - Build shadcn registry (generates public/r/*.json files)

**Pre-commit Hook:**
The repository uses Husky to run `pnpm lint` and `pnpm registry:build` before each commit. Both must pass for the commit to succeed.

## Architecture

**Registry Structure:**
- Components live in `registry/mini-app/blocks/<component-name>/`
- Hooks live in `registry/mini-app/hooks/`
- UI primitives live in `registry/mini-app/ui/`
- Shared libraries live in `registry/mini-app/lib/`
- Registry metadata is defined in `registry.json`
- Built registry files are generated in `public/r/` for CLI consumption

**Component Installation Flow:**
1. Users run `pnpm dlx shadcn@latest add https://hellno-mini-app-ui.vercel.app/r/<component>.json`
2. shadcn CLI fetches from the custom registry endpoint
3. Components are installed with their dependencies and registryDependencies

**Key Technologies:**
- Next.js 15 with React 19
- Farcaster MiniApp SDK (@farcaster/miniapp-sdk, @farcaster/miniapp-core)
- Daimo Pay integration (@daimo/pay, @daimo/contract)
- Wagmi for Ethereum interaction
- Tailwind CSS for styling
- Lucide React for icons

**Registry Dependencies:**
Components can depend on other registry items via `registryDependencies` field in registry.json. The `use-miniapp-sdk` hook is commonly referenced by components.

## Development Workflow

When adding new components:
1. Create component files in `registry/mini-app/blocks/<name>/`
2. Add registry entry to `registry.json` with proper metadata
3. Add the component to `lib/components-config.tsx` so it appears on the homepage for users to test (components only, not hooks or utils)
4. The pre-commit hook will automatically run `registry:build` to generate public files
5. Deploy triggers automatic Vercel deployment

## Important Notes

- **90/10 Principle**: Start with simple version that covers 80% of use cases
- **Real Examples**: Always test with actual on-chain contracts
- **No Over-Engineering**: Avoid unnecessary abstractions
- **LLM Friendly**: Keep interfaces flat and explicit for AI code generation

## Custom shadcn Registry Challenges

Working with this custom shadcn registry has specific requirements that differ from normal Next.js development:

### Import Path Rules

**CRITICAL**: All imports in registry components MUST use `@/registry/mini-app/...` format, even for files in the same folder:

```typescript
// ❌ WRONG - Will break after installation
import { types } from "./lib/types";
import { utils } from "../utils";

// ✅ CORRECT - shadcn CLI transforms these paths
import { types } from "@/registry/mini-app/blocks/my-component/lib/types";
import { utils } from "@/registry/mini-app/lib/utils";
```

This is because the shadcn CLI transforms `@/registry/mini-app/` to the user's local path during installation.

### File Naming Restrictions

- **NEVER** name a component file `page.tsx` - it installs to wrong location (`src/components/page.tsx`)
- Main component file should match folder name: `nft-mint-flow/nft-mint-flow.tsx`
- Use descriptive names for sub-components: `nft-mint-button.tsx`, not `button.tsx`

### Multi-File Component Pattern

When a component needs multiple files:

```
blocks/my-component/
├── my-component.tsx          # Main export, same name as folder
├── my-component-button.tsx   # Sub-component with prefix
├── my-component-modal.tsx    # Another sub-component
└── lib/
    ├── types.ts             # All imports use @/registry/mini-app/blocks/my-component/lib/types
    ├── utils.ts             # All imports use @/registry/mini-app/blocks/my-component/lib/utils
    └── constants.ts         # All imports use @/registry/mini-app/blocks/my-component/lib/constants
```

### Registry Build Errors

Common issues and solutions:

1. **"Module not found"** during `pnpm registry:build`
   - Check all imports use `@/registry/mini-app/...` format
   - Verify file paths are correct

2. **Component installs to wrong location**
   - Don't use `page.tsx` as filename
   - Check registry.json paths match actual files

3. **Import errors after installation**
   - Relative imports (`./lib/utils`) don't work
   - Must use full registry paths

### Registry Dependencies Handling

**IMPORTANT**: The shadcn CLI treats `registryDependencies` differently based on format:

1. **Name-based references** (e.g., `"button"`, `"card"`) - These ALWAYS resolve to the official shadcn registry
2. **URL-based references** (e.g., `"https://hellno-mini-app-ui.vercel.app/r/use-miniapp-sdk.json"`) - These resolve to the specified URL

For our custom registry:
- **Use names** for standard shadcn components: `button`, `input`, `card`, `sheet`
- **Use full URLs** for our custom components: `use-miniapp-sdk`, `chains`, `utils`, etc.

```json
// ✅ CORRECT: Hybrid approach
"registryDependencies": [
  "button",  // Standard shadcn component - use name
  "sheet",   // Standard shadcn component - use name
  "https://hellno-mini-app-ui.vercel.app/r/use-miniapp-sdk.json",  // Custom - use URL
  "https://hellno-mini-app-ui.vercel.app/r/utils.json"             // Custom - use URL
]

// ❌ WRONG: Will cause 404 errors
"registryDependencies": [
  "use-miniapp-sdk",  // Custom component with name = looks in official registry
  "utils"             // Custom component with name = looks in official registry
]
```

### Testing Installation

Always test your component installation in a separate project:

```bash
# In a different project
pnpm dlx shadcn@latest add https://hellno-mini-app-ui.vercel.app/r/your-component.json

# Check:
# 1. All files installed to correct locations
# 2. Imports resolve correctly
# 3. Component builds without errors
```

### shadcn CLI Transformation Issues

The shadcn CLI sometimes adds extra quotes around string literals during installation. To avoid TypeScript errors:

1. **Avoid default parameters with string literals**
   ```typescript
   // ❌ RISKY - May transform to "'default'" with extra quotes
   export function fn(param: string = 'default') {}
   
   // ✅ SAFER - Use optional parameter + variable assignment
   export function fn(param?: string) {
     const value = param || "default";
   }
   ```

2. **Be careful with string comparisons**
   ```typescript
   // ❌ RISKY - May transform incorrectly
   if (typeof x === 'object') {}
   
   // ✅ SAFER - Use consistent quote style
   if (typeof x === "object") {}
   ```

3. **Test registry output** - After running `pnpm registry:build`, check the generated JSON files in `public/r/` to ensure no transformation issues

### Critical: TypeScript typeof Comparisons

The shadcn CLI has a bug where it adds extra quotes around string literals in typeof comparisons, breaking TypeScript builds:

```typescript
// BEFORE installation (in registry):
if (typeof width === "string") { }

// AFTER installation (broken - extra quotes):
if (typeof width === "'string'") { }
```

**Solution: Always use double quotes for typeof comparisons and test after installation:**

```typescript
// ✅ REQUIRED: Use double quotes consistently
if (typeof value === "string") { }
if (typeof value === "number") { }
if (typeof value === "bigint") { }
if (typeof value === "object") { }
if (typeof value === "boolean") { }
if (typeof value === "undefined") { }
if (typeof value === "function") { }
if (typeof value === "symbol") { }

// ❌ NEVER: Don't use single quotes
if (typeof value === 'string') { }  // Will break during installation
```

**Common locations where this occurs:**
- Width/height checks: `typeof width === "string"`
- Data validation: `typeof data !== "object"`
- Number checks: `typeof value === "number"`
- BigInt validation: `typeof id !== "bigint"`

**Always run `pnpm registry:build` and test installation before committing!**