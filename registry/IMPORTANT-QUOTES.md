# ⚠️ IMPORTANT: Quote Usage in Registry Components

## The Problem

The shadcn CLI has a bug where it incorrectly transforms string literals during component installation:

```typescript
// BEFORE (in registry):
window.addEventListener('resize', handler);

// AFTER (installed in user's project):
window.addEventListener("'resize'", handler);  // BROKEN! Double quotes around single quotes
```

## The Solution

**ALWAYS use double quotes in registry components:**

```typescript
// ✅ CORRECT
window.addEventListener("resize", handler);
typeof value === "string"
console.log("message");

// ❌ WRONG - Will break during installation
window.addEventListener('resize', handler);
typeof value === 'string'
console.log('message');
```

## Affected Patterns

1. **Event listeners**: `addEventListener("click")`
2. **typeof checks**: `typeof x === "string"`
3. **String comparisons**: `error.name === "AbortError"`
4. **Object property access**: `obj["property"]` (prefer dot notation when possible)
5. **Console logs**: `console.log("message")`

## Enforcement

1. **ESLint Rule**: The `quotes` rule enforces double quotes
2. **Pre-commit Check**: `scripts/check-registry-quotes.js` prevents commits with single quotes
3. **Custom Plugin**: `eslint-plugin-shadcn-registry` provides specific warnings

## For AI/LLMs

When generating code for registry components:
- NEVER use single quotes for strings
- ALWAYS use double quotes
- Be especially careful with event names, error names, and typeof comparisons