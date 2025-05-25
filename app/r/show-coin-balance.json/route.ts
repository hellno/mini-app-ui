import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export async function GET() {
  // Read the show-coin-balance.tsx component file
  const componentPath = path.join(process.cwd(), "registry", "mini-app", "blocks", "show-coin-balance", "show-coin-balance.tsx");
  const componentContent = readFileSync(componentPath, "utf-8");
  
  // Read the input UI file
  const inputPath = path.join(process.cwd(), "registry", "mini-app", "ui", "input.tsx");
  const inputContent = readFileSync(inputPath, "utf-8");
  
  // Read the utils.ts file
  const utilsPath = path.join(process.cwd(), "lib", "utils.ts");
  const utilsContent = readFileSync(utilsPath, "utf-8");
  
  const showCoinBalanceJson = {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    "name": "show-coin-balance",
    "type": "registry:component",
    "title": "Show Coin Balance",
    "description": "Show coin balance for an address using Alchemy SDK",
    "dependencies": [
      "viem",
      "alchemy-sdk",
      "clsx",
      "tailwind-merge",
      "react"
    ],
    "registryDependencies": ["button", "input"],
    "files": [
      {
        "path": "registry/mini-app/blocks/show-coin-balance/show-coin-balance.tsx",
        "content": componentContent,
        "type": "registry:component"
      },
      {
        "path": "registry/mini-app/ui/input.tsx",
        "content": inputContent,
        "type": "registry:ui"
      },
      {
        "path": "lib/utils.ts",
        "content": utilsContent,
        "type": "registry:lib"
      }
    ]
  };
  
  return NextResponse.json(showCoinBalanceJson);
} 