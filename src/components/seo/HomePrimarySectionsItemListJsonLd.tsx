import JsonLdScript from "@/components/seo/JsonLdScript";
import { fetchSiteBranding } from "@/lib/site-settings-server";
import { fetchSiteControlPlaneEdge } from "@/lib/site-settings-edge";
import { buildHomePrimarySectionsItemListJsonLd } from "@/lib/site-sections-json-ld";

export default async function HomePrimarySectionsItemListJsonLd() {
  const [branding, controlPlane] = await Promise.all([
    fetchSiteBranding(),
    fetchSiteControlPlaneEdge(),
  ]);
  return (
    <JsonLdScript
      data={buildHomePrimarySectionsItemListJsonLd(branding.siteName, controlPlane.navigation)}
    />
  );
}
