/**
 * ESLint configuration for registry components
 * 
 * IMPORTANT: Registry components have special requirements due to shadcn CLI transformation bugs.
 * The CLI incorrectly transforms single quotes, adding extra quotes during installation.
 * 
 * Rules enforced:
 * - Double quotes only (no single quotes)
 * - Warnings for patterns that break during transformation
 */

const customPlugin = require("../scripts/eslint-plugin-shadcn-registry");

module.exports = {
  plugins: {
    "shadcn-registry": customPlugin,
  },
  rules: {
    // Enforce double quotes to prevent transformation issues
    "quotes": ["error", "double", { 
      "avoidEscape": true,
      "allowTemplateLiterals": true 
    }],
    
    // Custom rules for shadcn registry
    "shadcn-registry/no-single-quotes": "error",
    "shadcn-registry/warn-typeof-comparisons": "warn",
    
    // Additional safety rules
    "@typescript-eslint/quotes": ["error", "double", {
      "avoidEscape": true,
      "allowTemplateLiterals": true
    }],
  },
  overrides: [
    {
      files: ["**/*.tsx", "**/*.ts"],
      rules: {
        // Add banner comment to all registry files
        "header/header": ["warn", "block", [
          "*",
          " * @shadcn-registry",
          " * ",
          " * IMPORTANT: This file is part of the shadcn registry.",
          " * Always use double quotes (\") instead of single quotes (') to prevent",
          " * transformation issues during component installation.",
          " * ",
          " * See: /CLAUDE.md#shadcn-cli-transformation-issues",
          " "
        ], 2],
      },
    },
  ],
};