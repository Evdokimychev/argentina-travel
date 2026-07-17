import JsonLdScript from "@/components/seo/JsonLdScript";
import { fetchSiteBranding, fetchSiteNavigation } from "@/lib/site-settings-server";
import { buildHomePrimarySectionsItemListJsonLd } from "@/lib/site-sections-json-ld";

export default async function HomePrimarySectionsItemListJsonLd() {
  const [branding, navigation] = await Promise.all([
    fetchSiteBranding(),
    fetchSiteNavigation(),
  ]);
  return (
    <JsonLdScript
      data={buildHomePrimarySectionsItemListJsonLd(branding.siteName, navigation)}
    />
  );
}
