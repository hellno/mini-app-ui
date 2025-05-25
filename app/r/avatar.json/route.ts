import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // Read the avatar.tsx component file
  const avatarComponentPath = path.join(process.cwd(), "registry", "mini-app", "blocks", "avatar", "avatar.tsx");
  const avatarComponentContent = readFileSync(avatarComponentPath, "utf-8");
  
  // Read the avatar UI file
  const avatarUIPath = path.join(process.cwd(), "registry", "mini-app", "ui", "avatar.tsx");
  const avatarUIContent = readFileSync(avatarUIPath, "utf-8");
  
  // Read the utils.ts file
  const utilsPath = path.join(process.cwd(), "lib", "utils.ts");
  const utilsContent = readFileSync(utilsPath, "utf-8");
  
  const avatarJson = {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    "name": "avatar",
    "type": "registry:component",
    "title": "User Avatar",
    "description": "Customizable user avatar component with various sizes and shapes",
    "dependencies": [
      "@radix-ui/react-avatar",
      "clsx",
      "tailwind-merge"
    ],
    "registryDependencies": [
      `${appUrl}/r/use-profile.json`
    ],
    "files": [
      {
        "path": "registry/mini-app/blocks/avatar/avatar.tsx",
        "content": avatarComponentContent,
        "type": "registry:component"
      },
      {
        "path": "registry/mini-app/ui/avatar.tsx",
        "content": avatarUIContent,
        "type": "registry:ui"
      },
      {
        "path": "lib/utils.ts",
        "content": utilsContent,
        "type": "registry:lib"
      }
    ]
  };
  
  return NextResponse.json(avatarJson);
} 