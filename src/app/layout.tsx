import type { Metadata, Viewport } from "next";
import "@fontsource/baloo-2/500.css";
import "@fontsource/baloo-2/700.css";
import "@fontsource/baloo-2/800.css";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/900.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Word Game 3D — بازی کلمات سه‌بعدی",
  description:
    "A joyful 3D brain-training game: hunt hidden words and match 3D memory cards. Two worlds of puzzles, rewards, missions and shop. بازی فکری سه‌بعدی با دو دنیای پازل.",
  applicationName: "Word Game 3D",
  manifest: "/manifest.json",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#ff8a3d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        style={{
          ["--font-baloo" as string]: "'Baloo 2'",
          ["--font-vazir" as string]: "'Vazirmatn'",
        }}
        className="antialiased bg-background text-foreground"
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
