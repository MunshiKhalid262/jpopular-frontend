import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

/**
 * Inter for UI text and JetBrains Mono for codes (SKU, slug, HSN).
 *
 * Inter is the deliberate choice for a dense admin tool: it has real tabular
 * figures and disambiguation forms, which is what keeps small text and numeric
 * columns legible. The variable names match the tokens in globals.css.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JPopular",
    template: "%s · JPopular",
  },
  description:
    "Business management for electric scooters, batteries and accessories.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
