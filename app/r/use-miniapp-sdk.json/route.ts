import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export async function GET() {
  // Read the use-miniapp-sdk.ts hook file
  const hookPath = path.join(process.cwd(), "registry", "mini-app", "hooks", "use-miniapp-sdk.ts");
  const hookContent = readFileSync(hookPath, "utf-8");
  
  const useMiniappSdkJson = {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    "name": "use-miniapp-sdk",
    "type": "registry:hook",
    "title": "useMiniAppSdk",
    "description": "Hook for Farcaster MiniApp SDK context and state",
    "dependencies": [
      "@farcaster/frame-core",
      "@farcaster/frame-sdk"
    ],
    "registryDependencies": [],
    "files": [
      {
        "path": "registry/mini-app/hooks/use-miniapp-sdk.ts",
        "content": hookContent,
        "type": "registry:hook"
      }
    ]
  };
  
  return NextResponse.json(useMiniappSdkJson);
} 