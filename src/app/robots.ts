import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/organizer/",
        "/profile/",
        "/booking/pay/",
        "/booking/travelers/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
