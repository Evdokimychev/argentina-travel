import type { Metadata, Viewport } from "next";
import { Unbounded } from "next/font/google";
import Providers from "@/components/Providers";
import ThemeScript from "@/components/ThemeScript";
import SiteChrome from "@/components/SiteChrome";
import SiteJsonLd from "@/components/seo/SiteJsonLd";
import GtmHeadScripts from "@/components/analytics/GtmHeadScripts";
import { loadSiteFooterInfo } from "@/lib/site-footer-info";
import { siteRobotsMetadata } from "@/lib/cms/site-globals/robots-meta";
import { resolveSiteVerificationMeta } from "@/lib/analytics/site-verification-meta";
import { fetchSiteBranding, fetchSitePublicMeta } from "@/lib/site-settings-server";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  display: "optional",
  adjustFontFallback: true,
});

function resolveOgImageUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return absoluteUrl(pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`);
}

export async function generateMetadata(): Promise<Metadata> {
  const { branding, seo } = await fetchSitePublicMeta();
  const ogImageUrl = resolveOgImageUrl(branding.defaultOgImage);
  const twitterTitle = branding.defaultTitle;
  const twitterDescription = seo.defaultDescription;
  const verification = resolveSiteVerificationMeta(seo);

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: branding.defaultTitle,
      template: branding.titleTemplate,
    },
    description: seo.defaultDescription,
    robots: siteRobotsMetadata(seo.allowIndexing),
    ...(verification ? { verification } : {}),
    openGraph: {
      type: "website",
      locale: "ru_RU",
      siteName: branding.siteName,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: branding.siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
      images: [ogImageUrl],
      ...(seo.twitterHandle?.trim()
        ? { site: seo.twitterHandle.trim(), creator: seo.twitterHandle.trim() }
        : {}),
    },
    icons: {
      icon: branding.faviconUrl?.trim() || "/logo-light.svg",
      apple: branding.appleTouchIconUrl?.trim() || "/icons/pwa-icon.svg",
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      title: branding.siteName,
      statusBarStyle: "default",
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const branding = await fetchSiteBranding();
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: branding.themeColor,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteFooter = await loadSiteFooterInfo();

  return (
    <html lang="ru" className={unbounded.variable} data-site-header="visible" suppressHydrationWarning>
      <head>
        <GtmHeadScripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var w=window.matchMedia("(min-width:768px)").matches;var h=w?140:84;d.style.setProperty("--site-header-full-height",h+"px");d.style.setProperty("--site-header-height",h+"px");d.dataset.siteHeader="visible";}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <ThemeScript />
        <SiteJsonLd />
        <Providers>
          <SiteChrome siteFooter={siteFooter}>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
