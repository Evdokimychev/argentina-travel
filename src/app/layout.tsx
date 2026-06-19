import type { Metadata } from "next";
import { Unbounded } from "next/font/google";
import Providers from "@/components/Providers";
import SiteChrome from "@/components/SiteChrome";
import SiteJsonLd from "@/components/seo/SiteJsonLd";
import { getDefaultOgImageUrl } from "@/components/seo/SiteJsonLd";
import { loadSiteLegalForFooter } from "@/lib/site-legal-display";
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
    default: "Пора в Аргентину — путешествия по Аргентине",
    template: "%s | Пора в Аргентину",
  },
  description:
    "Авторские туры и экскурсии по Аргентине: Патагония, Буэнос-Айрес, Мендоса, Игуасу. Русскоязычные гиды и организаторы.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Пора в Аргентину",
    images: [{ url: getDefaultOgImageUrl(), width: 1200, height: 630, alt: "Пора в Аргентину" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Пора в Аргентину — путешествия по Аргентине",
    description:
      "Авторские туры и экскурсии по Аргентине: Патагония, Буэнос-Айрес, Мендоса, Игуасу.",
    images: [getDefaultOgImageUrl()],
  },
  icons: {
    icon: "/logo-light.svg",
    apple: "/logo-light.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteLegal = await loadSiteLegalForFooter();

  return (
    <html lang="ru" className={unbounded.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <SiteJsonLd />
        <Providers>
          <SiteChrome siteLegal={siteLegal}>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
