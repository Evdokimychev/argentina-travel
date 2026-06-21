import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/sitemap-urls";

/** Generated on request — avoids 60s+ Supabase/API work during `next build`. */
export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapEntries();
}
