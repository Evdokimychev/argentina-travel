import {
  buildOrganizationSchema,
  buildSiteSearchUrlTemplate,
  buildWebSiteSchema,
  organizationSchemaId,
} from "@/lib/schema-json-ld";
import JsonLdScript from "@/components/seo/JsonLdScript";
import { absoluteUrl } from "@/lib/site-url";
import type { SiteBrandingGlobalResolved, SiteContactGlobalResolved } from "@/types/site-globals";

const DEFAULT_OG_IMAGE = "/media/destinations/ba/cover.jpg";

export function getDefaultOgImageUrl(): string {
  return absoluteUrl(DEFAULT_OG_IMAGE);
}

export default function SiteJsonLd({
  branding,
  contact,
}: {
  branding: SiteBrandingGlobalResolved;
  contact: SiteContactGlobalResolved;
}) {
  const siteUrl = absoluteUrl("/");
  const sameAs = [
    contact.telegramUrl,
    contact.instagramUrl,
    contact.whatsAppUrl,
    contact.youtubeUrl,
    contact.tiktokUrl,
    contact.facebookUrl,
    contact.xUrl,
  ]
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));

  return (
    <JsonLdScript
      data={[
        buildOrganizationSchema({
          name: branding.siteName,
          url: siteUrl,
          logoUrl: absoluteUrl("/icons/icon-512.png"),
          sameAs,
          contactEmail: contact.supportEmail?.trim() || undefined,
        }),
        buildWebSiteSchema({
          name: branding.siteName,
          url: siteUrl,
          searchUrlTemplate: buildSiteSearchUrlTemplate(siteUrl),
          publisherId: organizationSchemaId(siteUrl),
        }),
      ]}
    />
  );
}
