import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/InstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Way Point Travel - Internal Workflow System",
  description: "Internal workflow and client management platform for Way Point Travel Limited.",
  applicationName: "Way Point Travel",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Way Point Travel",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#052754",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-background text-foreground transition-colors duration-200">
        <img
          src="/company-noBG.png"
          alt=""
          aria-hidden="true"
          className="fixed inset-0 m-auto h-[60vmin] w-[60vmin] max-h-[560px] max-w-[560px] object-contain opacity-[0.14] pointer-events-none select-none -z-10"
        />
        <AuthProvider>
          {children}
        </AuthProvider>
        <ServiceWorkerRegistration />
        <InstallPrompt />
      </body>
    </html>
  );
}
