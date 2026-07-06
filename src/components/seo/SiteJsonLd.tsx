import { fetchSiteBranding, fetchSiteContact } from "@/lib/site-settings-server";
import {
  buildOrganizationSchema,
  buildSiteSearchUrlTemplate,
  buildWebSiteSchema,
  organizationSchemaId,
} from "@/lib/schema-json-ld";
import JsonLdScript from "@/components/seo/JsonLdScript";
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

  return (
    <JsonLdScript
      data={[
        buildOrganizationSchema({
          name: branding.siteName,
          url: siteUrl,
          logoUrl: absoluteUrl("/logo-light.svg"),
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
