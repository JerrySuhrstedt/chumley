import type { Metadata, Viewport } from "next";
import { Inter_Tight, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/install-prompt";
import { RegisterServiceWorker } from "@/components/register-sw";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sell1",
  description: "Your sales pipeline, minus the clutter.",
  // iOS ignores the web manifest's display mode and reads these instead.
  appleWebApp: {
    capable: true,
    title: "Sell1",
    // Dark chrome behind the notch, matching the app's own header.
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#16293d",
  // The board is a touch surface; pinch-zooming it fights the drag.
  // Zoom stays available so the page remains accessible.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
        <RegisterServiceWorker />
        <InstallPrompt />
      </body>
    </html>
  );
}
