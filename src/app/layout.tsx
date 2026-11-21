import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa-register";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#0D4A47",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "AL IHSAN Academy of Moral Education",
  description: "Building a generation for tomorrow",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Al-Ihsan LMS",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-apple-touch.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} font-sans h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans bg-[#F8F9FA] text-[#1A2B23]">
        {children}
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
