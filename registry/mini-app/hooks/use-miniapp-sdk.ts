"use client";

import { useCallback, useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { Context } from "@farcaster/miniapp-core";

export function useMiniAppSdk() {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.MiniAppContext>();
  const [isMiniAppSaved, setIsMiniAppSaved] = useState(false);
  const [lastEvent, setLastEvent] = useState("");
  const [pinFrameResponse, setPinFrameResponse] = useState("");
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    if (!sdk) return;

    sdk.on("miniAppAdded", ({ notificationDetails }) => {
      setLastEvent(
        `miniAppAdded${notificationDetails ? ", notifications enabled" : ""}`,
      );
      setIsMiniAppSaved(true);
    });

    sdk.on("miniAppAddRejected", ({ reason }) => {
      setLastEvent(`miniAppAddRejected, reason ${reason}`);
    });

    sdk.on("miniAppRemoved", () => {
      setLastEvent("miniAppRemoved");
      setIsMiniAppSaved(false);
    });

    sdk.on("notificationsEnabled", ({ notificationDetails }) => {
      setLastEvent("notificationsEnabled");
    });

    sdk.on("notificationsDisabled", () => {
      setLastEvent("notificationsDisabled");
    });

    // CRITICAL TO LOAD MINI APP - DON'T REMOVE
    sdk.actions.ready({});
    setIsSDKLoaded(true);

    // Clean up on unmount
    return () => {
      sdk.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    const updateContext = async () => {
      const frameContext = await sdk.context;
      if (frameContext) {
        setContext(frameContext);
        setIsMiniAppSaved(frameContext.client.added);
      }

      const miniAppStatus = await sdk.isInMiniApp();
      setIsMiniApp(miniAppStatus);
    };

    if (isSDKLoaded) {
      updateContext();
    }
  }, [isSDKLoaded]);

  const pinFrame = useCallback(async () => {
    try {
      const result = await sdk.actions.addMiniApp();
      // @ts-expect-error - result type mixup
      if (result.added) {
        setPinFrameResponse(
          result.notificationDetails
            ? `Added, got notificaton token ${result.notificationDetails.token} and url ${result.notificationDetails.url}`
            : "Added, got no notification details",
        );
      }
    } catch (error) {
      setPinFrameResponse(`Error: ${error}`);
    }
  }, []);

  return {
    context,
    pinFrame,
    pinFrameResponse,
    isMiniAppSaved,
    lastEvent,
    sdk,
    isSDKLoaded,
    isAuthDialogOpen,
    setIsAuthDialogOpen,
    isMiniApp,
  };
}
