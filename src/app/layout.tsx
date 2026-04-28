import type { Metadata, Viewport } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Inter is the closest available variable font to sohne-var
// Replace with self-hosted sohne-var if a license is available
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Finance Manager",
  description: "Privacy-first personal finance manager — track expenses and stock portfolio locally.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceCodePro.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
