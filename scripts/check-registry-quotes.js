#!/usr/bin/env node

/**
 * Pre-commit script to check for single quotes in registry files
 * Prevents shadcn CLI transformation issues
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

const REGISTRY_DIR = path.join(__dirname, "..", "registry");
const PROBLEMATIC_PATTERNS = [
  {
    // String literals with single quotes (but not in template literals or type annotations)
    pattern: /(?<!`)(?<!\\)(?<!\|\s)(?<!:\s)'[^']*'(?!`)/g,
    description: "String literal with single quotes",
    skipInTemplates: true,
    skipInTypes: true,
  },
  {
    // typeof comparisons with single quotes
    pattern: /typeof\s+\w+\s*===\s*'[^']+'/g,
    description: "typeof comparison with single quotes",
  },
  {
    // Event listeners with single quotes
    pattern: /addEventListener\s*\(\s*'[^']+'/g,
    description: "addEventListener with single quotes",
  },
  {
    pattern: /removeEventListener\s*\(\s*'[^']+'/g,
    description: "removeEventListener with single quotes",
  },
  {
    // Property access with single quotes
    pattern: /\['[^']+'\]/g,
    description: "Property access with single quotes",
  },
  {
    // String comparisons with single quotes
    pattern: /===\s*'[^']+'/g,
    description: "String comparison with single quotes",
    skipInTypes: true,
  },
];

let hasErrors = false;

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(process.cwd(), filePath);
  const lines = content.split("\n");
  
  let fileHasErrors = false;
  
  lines.forEach((line, index) => {
    // Skip comments and empty lines
    if (line.trim().startsWith("//") || line.trim().startsWith("*") || !line.trim()) {
      return;
    }
    
    PROBLEMATIC_PATTERNS.forEach(({ pattern, description, skipInTemplates, skipInTypes }) => {
      // Skip if this is inside a template literal
      if (skipInTemplates && line.includes("`")) {
        return;
      }
      
      // Skip if this is a type annotation line
      if (skipInTypes && (line.includes(":") && line.includes("|")) || line.includes("type ") || line.includes("interface ")) {
        return;
      }
      
      // Skip CSS class strings (they often have single quotes in selectors)
      if (line.includes("[class*=") || line.includes("[&_")) {
        return;
      }
      
      const matches = line.match(pattern);
      if (matches) {
        if (!fileHasErrors) {
          console.error(`\n❌ ${relativePath}`);
          fileHasErrors = true;
        }
        console.error(`   Line ${index + 1}: ${line.trim()}`);
        console.error(`   Issue: ${description}`);
        hasErrors = true;
      }
    });
  });
}

// Find all TypeScript files in registry
const files = glob.sync(path.join(REGISTRY_DIR, "**/*.{ts,tsx}"), {
  ignore: ["**/node_modules/**"],
});

console.log("🔍 Checking registry files for single quote usage...\n");

files.forEach(checkFile);

if (hasErrors) {
  console.error("\n⚠️  Single quotes found in registry files!");
  console.error("These will cause installation issues with shadcn CLI.");
  console.error("\nTo fix:");
  console.error("1. Replace all single quotes with double quotes");
  console.error("2. Run: pnpm lint:fix");
  console.error("\nSee CLAUDE.md for more information.");
  process.exit(1);
} else {
  console.log("✅ All registry files use double quotes correctly!");
}