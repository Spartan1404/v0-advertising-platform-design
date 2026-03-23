import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const fontSans = Figtree({subsets:['latin'],variable:'--font-sans'});


export const metadata: Metadata = {
  title: "Ad Platform - Backoffice",
  description: "Advertising management platform for campaigns, banners, and analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={fontSans.variable}>
      <body
        className="antialiased"
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
