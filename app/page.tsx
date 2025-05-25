"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { OpenInVibesEngineeringButton } from "@/components/open-in-vibes-engineering-button";
import { useMiniAppSdk } from "@/registry/mini-app/hooks/use-miniapp-sdk";
import { componentItems } from "@/lib/components-config";
import {
  Clipboard as ClipboardIcon,
  Check as CheckIcon,
  ExternalLink,
  Github,
} from "lucide-react";
import { Button } from "@/registry/mini-app/ui/button";

function InstallSnippet({ installName }: { installName: string }) {
  const [tab, setTab] = React.useState<"pnpm" | "npm" | "bun">("pnpm");
  const [copied, setCopied] = React.useState(false);
  
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  
  const command = React.useMemo(() => {
    switch (tab) {
      case "pnpm":
        return `pnpm dlx shadcn@latest add ${appUrl}/r/${installName}.json`;
      case "npm":
        return `npx shadcn@latest add ${appUrl}/r/${installName}.json`;
      case "bun":
        return `bun x shadcn@latest add ${appUrl}/r/${installName}.json`;
      default:
        return `pnpm dlx shadcn@latest add ${appUrl}/r/${installName}.json`;
    }
  }, [tab, installName, appUrl]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="mt-4">
      <div className="flex border rounded-t-md justify-between overflow-hidden">
        <div className="flex text-sm font-mono">
          <button
            className={`px-3 py-1 ${tab === "pnpm" ? "bg-gray-100 dark:bg-zinc-800" : ""}`}
            onClick={() => setTab("pnpm")}
          >
            pnpm
          </button>
          <button
            className={`px-3 py-1 ${tab === "npm" ? "bg-gray-100 dark:bg-zinc-800" : ""}`}
            onClick={() => setTab("npm")}
          >
            npm
          </button>
          <button
            className={`px-3 py-1 ${tab === "bun" ? "bg-gray-100 dark:bg-zinc-800" : ""}`}
            onClick={() => setTab("bun")}
          >
            bun
          </button>
        </div>
        <Button variant="ghost" size="icon" onClick={handleCopy}>
          {copied ? (
            <CheckIcon className="w-4 h-4" />
          ) : (
            <ClipboardIcon className="w-4 h-4" />
          )}
        </Button>
      </div>
      <div className="relative">
        <pre className="bg-gray-800 text-white p-4 rounded-b-md overflow-x-auto">
          <code>{command}</code>
        </pre>
      </div>
    </div>
  );
}

// This page displays items from the custom registry.
export default function Home() {
  useMiniAppSdk();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <header className="w-full py-4 px-6 border-b border-border/50 flex items-center justify-between bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">
            hellno/mini-app-ui
          </h1>
        </div>
        
        {/* Action Icons */}
        <div className="flex items-center gap-4">
          <a 
            href="https://farcaster.xyz/hellno.eth" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-muted rounded-full transition-colors flex items-center"
            aria-label="hellno.eth on Farcaster"
          >
            <div className="w-5 h-5 text-foreground/80">
              <Image 
                src="/farcaster.svg" 
                alt="Farcaster" 
                width={20} 
                height={20}
                className="text-foreground"
              />
            </div>
          </a>
          <a 
            href="https://github.com/hellno/mini-app-ui" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5 text-foreground/80" />
          </a>
        </div>
      </header>
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="mb-8">
          <p className="text-muted-foreground">
            A collection of components, hooks and utilities for mini apps using
            shadcn. Build beautiful and functional mini-apps with these ready-to-use components.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {componentItems.map((item, index) => (
            <div
              key={index}
              className="flex flex-col border rounded-xl overflow-hidden bg-card/30 shadow-sm transition-all hover:shadow-md backdrop-blur-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-b border-border/30">
                <h2 className="text-lg font-medium text-foreground">
                  {item.title}
                </h2>
                <div className="flex items-center gap-2 flex-shrink-0 sm:justify-end">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <Link href={`/component/${item.installName}`}>
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Fullscreen
                    </Link>
                  </Button>
                  <OpenInVibesEngineeringButton className="h-8" />
                </div>
              </div>
              
              <div className="flex items-center justify-center p-8 bg-gradient-to-b from-background/20 to-background/5 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.07),transparent_60%)] pointer-events-none"></div>
                <div className="relative z-10 flex items-center justify-center min-h-[280px] w-full">
                  {item.component}
                </div>
              </div>
              
              <div className="p-4 bg-card/40 border-t border-border/30">
                <InstallSnippet installName={item.installName} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
