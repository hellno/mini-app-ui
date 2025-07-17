"use client";

import { useState } from "react";
import { ShareBottomSheet } from "@/registry/mini-app/blocks/share-bottom-sheet/share-bottom-sheet";
import { Button } from "@/registry/mini-app/ui/button";

export default function ShareBottomSheetDemo() {
  const [open, setOpen] = useState(false);
  const [customText, setCustomText] = useState(
    "I just donated to help support Roman Storm's legal defense fund. Join me in defending the right to privacy and the right to publish code!"
  );

  const examples = [
    {
      title: "Legal Defense Fund",
      text: "I just donated to help support Roman Storm's legal defense fund. Join me in defending the right to privacy and the right to publish code!",
      url: "https://www.justiceforstorm.com",
    },
    {
      title: "Project Launch",
      text: "Just launched my new Farcaster mini app! 🚀 It's a game-changer for the community. Check it out and let me know what you think! This is a longer text that will be truncated after 4 lines to maintain a clean UI design while still conveying the essential message.",
      url: "https://mini-app-ui.vercel.app",
    },
    {
      title: "Simple Share",
      text: "Building in public is the way! 🛠️",
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Share Bottom Sheet</h1>
          <p className="text-muted-foreground">
            A bottom sheet component for sharing content to Farcaster with a
            customizable message. Text is automatically truncated to 4 lines
            for optimal readability.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Examples</h2>
          
          <div className="grid gap-4">
            {examples.map((example, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">{example.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {example.text}
                </p>
                <Button
                  onClick={() => {
                    setCustomText(example.text);
                    setOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Try this example
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Custom Text</h2>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Enter your share message..."
            className="w-full min-h-[100px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
            Open Share Bottom Sheet
          </Button>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Features:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Customizable share text with automatic 4-line truncation</li>
            <li>Optional URL embedding for casts</li>
            <li>Uses Farcaster SDK when in mini app context</li>
            <li>Falls back to Warpcast intent URL when outside mini app</li>
            <li>Smooth bottom sheet animation</li>
            <li>Responsive design for mobile and desktop</li>
            <li>Ghost close button for subtle dismissal</li>
          </ul>
        </div>

        <ShareBottomSheet
          open={open}
          onOpenChange={setOpen}
          shareText={customText}
          shareUrl="https://mini-app-ui.vercel.app"
          title="Inspire others to support!"
        />
      </div>
    </div>
  );
}