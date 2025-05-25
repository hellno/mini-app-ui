import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // Read the user-context.tsx component file
  const componentPath = path.join(process.cwd(), "registry", "mini-app", "blocks", "user-context", "user-context.tsx");
  const componentContent = readFileSync(componentPath, "utf-8");
  
  // Read utils.ts file
  const utilsPath = path.join(process.cwd(), "lib", "utils.ts");
  const utilsContent = readFileSync(utilsPath, "utf-8");
  
  const userContextJson = {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    "name": "user-context",
    "type": "registry:component",
    "title": "User Context",
    "description": "Display user information with customizable layout and elements",
    "dependencies": [
      "clsx",
      "tailwind-merge"
    ],
    "registryDependencies": [
      `${appUrl}/r/avatar.json`,
      `${appUrl}/r/use-profile.json`
    ],
    "files": [
      {
        "path": "registry/mini-app/blocks/user-context/user-context.tsx",
        "content": componentContent,
        "type": "registry:component"
      },
      {
        "path": "lib/utils.ts",
        "content": utilsContent,
        "type": "registry:lib"
      }
    ]
  };
  
  return NextResponse.json(userContextJson);
} 