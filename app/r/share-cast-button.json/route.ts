import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // Read the share-cast-button.tsx component file
  const buttonPath = path.join(process.cwd(), "registry", "mini-app", "blocks", "share-cast-button", "share-cast-button.tsx");
  const buttonContent = readFileSync(buttonPath, "utf-8");
  
  // Read the button UI file
  const buttonUIPath = path.join(process.cwd(), "registry", "mini-app", "ui", "button.tsx");
  const buttonUIContent = readFileSync(buttonUIPath, "utf-8");
  
  // Read the utils.ts file
  const utilsPath = path.join(process.cwd(), "lib", "utils.ts");
  const utilsContent = readFileSync(utilsPath, "utf-8");
  
  const shareCastButtonJson = {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    "name": "share-cast-button",
    "type": "registry:component",
    "title": "Share Cast Button",
    "description": "A button for sharing a cast",
    "dependencies": [
      "@radix-ui/react-slot",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "lucide-react",
      "@farcaster/frame-sdk",
      "@farcaster/frame-core"
    ],
    "registryDependencies": [
      "button",
      `${appUrl}/r/use-miniapp-sdk.json`
    ],
    "files": [
      {
        "path": "registry/mini-app/blocks/share-cast-button/share-cast-button.tsx",
        "content": buttonContent,
        "type": "registry:component"
      },
      {
        "path": "registry/mini-app/ui/button.tsx",
        "content": buttonUIContent,
        "type": "registry:ui"
      },
      {
        "path": "lib/utils.ts",
        "content": utilsContent,
        "type": "registry:lib"
      }
    ],
    "meta": {
      "mediaUrl": "/previews/share-cast-button.mp4",
      "demoUrl": "/component/share-cast-button"
    }
  };
  
  return NextResponse.json(shareCastButtonJson);
} 