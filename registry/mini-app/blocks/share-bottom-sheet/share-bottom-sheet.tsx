"use client";

import { useState } from "react";
import { Button } from "@/registry/mini-app/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/registry/mini-app/ui/sheet";
import { useMiniAppSdk } from "@/registry/mini-app/hooks/use-miniapp-sdk";
import { Share } from "lucide-react";

export interface ShareBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareText: string;
  shareUrl?: string;
  title?: string;
}

export function ShareBottomSheet({
  open,
  onOpenChange,
  shareText,
  shareUrl,
  title = "Inspire others to support!",
}: ShareBottomSheetProps) {
  const { sdk } = useMiniAppSdk();
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    // Prevent double clicks
    if (isSharing) return;
    
    setIsSharing(true);
    
    try {
      const frameContext = await sdk.context;
      
      if (frameContext) {
        // Use SDK to compose cast within the mini app
        let cast: { text: string; embeds: [] | [string] } = {
          text: shareText.slice(0, 320), // Enforce character limit
          embeds: [],
        };
        if (shareUrl) {
          cast.embeds = [shareUrl];
        }
        await sdk.actions.composeCast(cast);
        onOpenChange(false);
      } else {
        // Fallback to Warpcast intent URL
        const truncatedText = shareText.slice(0, 320);
        const encodedText = encodeURIComponent(truncatedText);
        const url = shareUrl
          ? `https://warpcast.com/~/compose?text=${encodedText}&embeds[]=${encodeURIComponent(shareUrl)}`
          : `https://warpcast.com/~/compose?text=${encodedText}`;
        
        window.open(url, "_blank");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Reset sharing state on error so user can retry
      setIsSharing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-2xl px-6 pb-8 pt-6"
      >
        <div className="mx-auto max-w-md space-y-6">
          <SheetHeader>
            <SheetTitle className="text-center text-2xl font-semibold">
              {title}
            </SheetTitle>
          </SheetHeader>

          <div className="px-4">
            <p className="text-center text-base leading-relaxed text-muted-foreground line-clamp-4 italic">
              "{shareText}"
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleShare}
              size="lg"
              className="w-full h-14 text-lg font-medium rounded-full"
              disabled={isSharing}
            >
              <Share className="mr-2 h-5 w-5" />
              {isSharing ? "Sharing..." : "Share"}
            </Button>

            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              size="lg"
              className="w-full h-12 text-base text-muted-foreground hover:text-foreground"
            >
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}