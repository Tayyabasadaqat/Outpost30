
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GameAudio from "@/components/audio/GameAudio";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OUTPOST 30 | Save Our Moon Base",
  description:
    "A NASA-inspired junior astronaut training game featuring 30 lunar missions, interactive challenges, and space survival.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}

        {/* Global sound effects and background music */}
        <GameAudio />
      </body>
    </html>
  );
}