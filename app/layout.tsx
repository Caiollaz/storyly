import type { Metadata } from "next";
import { Cinzel, Literata, Source_Sans_3, Unna } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const unna = Unna({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-unna",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Storyly",
  description:
    "A dynamic, AI-powered text adventure game where the story and choices are generated in real-time, creating a unique journey every time you play.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📜</text></svg>",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${literata.variable} ${sourceSans.variable} ${cinzel.variable} ${unna.variable} theme-slate body-text`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
