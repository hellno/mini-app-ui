import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  // Read the use-profile.ts hook file
  const hookPath = path.join(process.cwd(), "registry", "mini-app", "hooks", "use-profile.ts");
  const hookContent = readFileSync(hookPath, "utf-8");
  
  const useProfileJson = {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    "name": "use-profile",
    "type": "registry:hook",
    "title": "useProfile",
    "description": "Hook for accessing Farcaster user profile information",
    "dependencies": [
      "@farcaster/frame-core",
      "@farcaster/frame-sdk"
    ],
    "registryDependencies": [
      `${appUrl}/r/use-miniapp-sdk.json`
    ],
    "files": [
      {
        "path": "registry/mini-app/hooks/use-profile.ts",
        "content": hookContent,
        "type": "registry:hook"
      }
    ]
  };
  
  return NextResponse.json(useProfileJson);
} 