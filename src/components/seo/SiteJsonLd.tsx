import { fetchSiteBranding, fetchSiteContact } from "@/lib/site-settings-server";
import { absoluteUrl } from "@/lib/site-url";

const DEFAULT_OG_IMAGE = "/media/destinations/ba/cover.jpg";

export function getDefaultOgImageUrl(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE);
}

export default async function SiteJsonLd() {
  const [branding, contact] = await Promise.all([fetchSiteBranding(), fetchSiteContact()]);
  const siteUrl = absoluteUrl("/");
  const sameAs = [contact.telegramUrl, contact.instagramUrl, contact.whatsAppUrl]
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: branding.siteName,
    url: siteUrl,
    logo: absoluteUrl("/logo-light.svg"),
    sameAs,
  };

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: branding.siteName,
    url: siteUrl,
    inLanguage: "ru-RU",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}tours?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSite) }} />
    </>
  );
}
