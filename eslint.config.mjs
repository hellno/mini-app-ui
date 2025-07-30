import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // React rules
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-no-target-blank": "warn",
      
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "@typescript-eslint/consistent-type-imports": ["warn", {
        prefer: "type-imports",
        fixStyle: "inline-type-imports"
      }],
      
      // General rules
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      
      // Note: quotes rule is enforced only in registry files to prevent shadcn CLI issues
    }
  },
  // Special rules for registry components to prevent shadcn CLI transformation issues
  {
    files: ["registry/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "quotes": ["error", "double", { 
        "avoidEscape": true,
        "allowTemplateLiterals": true 
      }],
      "@typescript-eslint/quotes": ["error", "double", {
        "avoidEscape": true,
        "allowTemplateLiterals": true
      }],
    }
  }
];

export default eslintConfig;
