import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchSiteFeatures } from "@/lib/site-settings-server";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export type CmsOpsSummary = {
  maintenanceMode: boolean;
  scheduledPublishCount: number;
  cmsMediaPendingManifest: number;
};

export async function fetchCmsOpsSummary(supabase: DbClient): Promise<CmsOpsSummary> {
  const [features, scheduledRes, mediaRes] = await Promise.all([
    fetchSiteFeatures(),
    supabase
      .from("content_documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled"),
    supabase
      .from("cms_media_assets")
      .select("id", { count: "exact", head: true })
      .eq("manifest_synced", false),
  ]);

  return {
    maintenanceMode: features.maintenanceMode,
    scheduledPublishCount: scheduledRes.count ?? 0,
    cmsMediaPendingManifest: mediaRes.count ?? 0,
  };
}
