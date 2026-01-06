import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Product Ad Engine - AI-Powered Video Ads in 60 Seconds",
  description: "Transform product photos into cinematic video ads using AI. Background removal, set design, and video animation in under a minute.",
  keywords: ["AI video ads", "product videos", "e-commerce", "TikTok ads", "Instagram Reels"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#3b82f6",
          colorBackground: "#000000",
          colorInputBackground: "#1a1a1a",
          colorInputText: "#ffffff",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
