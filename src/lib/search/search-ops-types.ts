import type { SearchReadinessReport } from "@/lib/search/search-readiness";
import type { SearchReindexStatus } from "@/lib/search/search-reindex-status";

export type SearchOpsSnapshot = {
  meilisearchConfigured: boolean;
  readiness: SearchReadinessReport | null;
  lastReindex: SearchReindexStatus | null;
};
