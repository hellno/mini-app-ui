import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import OnchainProvider from "@/registry/mini-app/blocks/daimo-pay-transfer/components/wagmi-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const frame = {
  version: "next",
  imageUrl: `${appUrl}/opengraph-image`,
  button: {
    title: "Show hellno/mini-app-ui",
    action: {
      type: "launch_frame",
      name: "hellno/mini-app-ui",
      url: appUrl,
      splashImageUrl: `${appUrl}/vibes-icon.png`,
      splashBackgroundColor: "#fff",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "hellno/mini-app-ui",
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    openGraph: {
      title: "hellno/mini-app-ui",
      description:
        "A collection of components, hooks and utilities for mini apps",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <OnchainProvider>{children}</OnchainProvider>
      </body>
    </html>
  );
}
