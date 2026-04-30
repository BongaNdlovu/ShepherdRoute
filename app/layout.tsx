import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/app/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ShepherdRoute",
    template: "%s | ShepherdRoute"
  },
  description: "The follow-up pathway for churches that care.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/icon.svg",
    apple: "/icons/apple-touch-icon.png"
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ShepherdRoute",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#f7f3eb",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
