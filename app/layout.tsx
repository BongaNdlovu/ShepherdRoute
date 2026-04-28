import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/app/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ShepardRoute",
    template: "%s | ShepardRoute"
  },
  description: "The follow-up pathway for churches that care.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ShepardRoute",
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
