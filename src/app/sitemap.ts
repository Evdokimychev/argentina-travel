import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/sitemap-urls";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries();
}
