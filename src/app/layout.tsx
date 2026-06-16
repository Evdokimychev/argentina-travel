import type { Metadata } from "next";
import { Unbounded } from "next/font/google";
import Providers from "@/components/Providers";
import SiteChrome from "@/components/SiteChrome";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "ArgentinaTravel — Путешествия по Аргентине",
    template: "%s | ArgentinaTravel",
  },
  description:
    "Авторские туры по Аргентине: Патагония, Буэнос-Айрес, Мендоса, Игуасу. Русскоязычные гиды, незабываемые впечатления.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={unbounded.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
