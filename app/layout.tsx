import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ThemeProvider } from "@/components/theme-provider";
import { PWARegistration } from "@/components/pwa-registration";

// Premium sans-serif — modern, geometric, high-end feel
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ICE HMJ Tekinfo",
  description: "Sistem Kasir ICE HMJ Tekinfo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Danus",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <PWARegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
