import JsonLdScript from "@/components/seo/JsonLdScript";
import { fetchSiteBranding } from "@/lib/site-settings-server";
import { buildHomePrimarySectionsItemListJsonLd } from "@/lib/site-sections-json-ld";

export default async function HomePrimarySectionsItemListJsonLd() {
  const branding = await fetchSiteBranding();
  return <JsonLdScript data={buildHomePrimarySectionsItemListJsonLd(branding.siteName)} />;
}
