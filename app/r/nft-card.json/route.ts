import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export async function GET() {
  // Read the nft-card.tsx component file
  const nftCardPath = path.join(process.cwd(), "registry", "mini-app", "blocks", "nft-card", "nft-card.tsx");
  const nftCardContent = readFileSync(nftCardPath, "utf-8");
  
  // Read the utils.ts file for dependencies
  const utilsPath = path.join(process.cwd(), "lib", "utils.ts");
  const utilsContent = readFileSync(utilsPath, "utf-8");
  
  const nftCardJson = {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    "name": "nft-card",
    "type": "registry:component",
    "title": "NFT Card",
    "description": "Komponen NFT card yang sangat fleksibel untuk menampilkan NFT dari blockchain berdasarkan alamat kontrak dan token ID. Mendukung semua chain yang tersedia di viem dengan opsi kustomisasi tampilan yang lengkap.",
    "dependencies": [
      "next",
      "clsx",
      "tailwind-merge",
      "viem",
      "react"
    ],
    "registryDependencies": [],
    "files": [
      {
        "path": "registry/mini-app/blocks/nft-card/nft-card.tsx",
        "content": nftCardContent,
        "type": "registry:component"
      },
      {
        "path": "lib/utils.ts",
        "content": utilsContent,
        "type": "registry:lib"
      }
    ]
  };
  
  return NextResponse.json(nftCardJson);
} 