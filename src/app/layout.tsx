import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const frauncesHeading = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
});

const outfitSans = Outfit({
  variable: "--font-outfit-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prododesk",
  description: "Prododesk - Simple AI Productivity Calendar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        outfitSans.variable,
        outfitSans.className,
        "font-sans",
        frauncesHeading.variable,
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
