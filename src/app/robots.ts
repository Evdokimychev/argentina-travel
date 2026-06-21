import type { MetadataRoute } from "next";
import { fetchSiteSeo } from "@/lib/site-settings-server";
import { absoluteUrl } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await fetchSiteSeo();

  if (!seo.allowIndexing) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/organizer/",
        "/profile/",
        "/booking/pay/",
        "/booking/travelers/",
        "/trip/",
        "/auth/",
        "/embed/",
        "/dev/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
