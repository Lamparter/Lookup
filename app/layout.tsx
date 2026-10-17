import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({ subsets: ["latin", "latin-ext"], weight: ["400", "700", "900"], variable: "--font-lato" });

export const metadata: Metadata = {
  metadataBase: new URL("https://contacts.lamparter.dev"),
  title: { default: "Contacts", template: "%s · Contacts" },
  description: "Hack Club Slack profiles, on the web.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8f8" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1d21" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={lato.variable}>
      <body>{children}</body>
    </html>
  );
}
