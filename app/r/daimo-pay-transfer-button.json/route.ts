import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export async function GET() {
  // Read the daimo-pay-transfer-button.tsx component file
  const buttonPath = path.join(process.cwd(), "registry", "mini-app", "blocks", "daimo-pay-transfer", "components", "daimo-pay-transfer-button.tsx");
  const buttonContent = readFileSync(buttonPath, "utf-8");
  
  // Read the wagmi-provider.tsx component file
  const providerPath = path.join(process.cwd(), "registry", "mini-app", "blocks", "daimo-pay-transfer", "components", "wagmi-provider.tsx");
  const providerContent = readFileSync(providerPath, "utf-8");
  
  // Read button.tsx for dependency
  const buttonUIPath = path.join(process.cwd(), "registry", "mini-app", "ui", "button.tsx");
  let buttonUIContent = "";
  try {
    buttonUIContent = readFileSync(buttonUIPath, "utf-8");
  } catch {
    console.warn("Button UI component not found");
  }
  
  const daimoPayTransferButtonJson = {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    "name": "daimo-pay-transfer-button",
    "type": "registry:component",
    "title": "Daimo Pay Button Token Transfer",
    "description": "A custom button for transferring tokens",
    "dependencies": [
      "@daimo/pay",
      "@daimo/contract",
      "wagmi",
      "viem",
      "@farcaster/frame-wagmi-connector",
      "@radix-ui/react-slot",
      "class-variance-authority",
      "clsx",
      "tailwind-merge"
    ],
    "registryDependencies": ["button"],
    "files": [
      {
        "path": "registry/mini-app/blocks/daimo-pay-transfer/components/daimo-pay-transfer-button.tsx",
        "content": buttonContent,
        "type": "registry:component"
      },
      {
        "path": "registry/mini-app/blocks/daimo-pay-transfer/components/wagmi-provider.tsx",
        "content": providerContent,
        "type": "registry:component"
      }
    ],
    "meta": {
      "mediaUrl": "/previews/daimo-pay-transfer-button.mp4",
      "demoUrl": "/component/daimo-pay-transfer-button"
    }
  };
  
  // Add button UI if available
  if (buttonUIContent) {
    daimoPayTransferButtonJson.files.push({
      "path": "registry/mini-app/ui/button.tsx",
      "content": buttonUIContent,
      "type": "registry:ui"
    });
  }
  
  return NextResponse.json(daimoPayTransferButtonJson);
}