import { SEO_QUERY_CLUSTERS, type SeoQueryCluster } from "@/data/seo-query-clusters";
import {
  isIndexableInternalPath,
  STABLE_TOUR_LANDING_PATHS,
} from "@/lib/sitemap-urls";

export type SeoClusterCoverageStatus = "ok" | "warn" | "missing";

export type SeoClusterCoverageRow = {
  id: string;
  label: string;
  intent: SeoQueryCluster["intent"];
  priority: SeoQueryCluster["priority"];
  targetPath: string;
  status: SeoClusterCoverageStatus;
  notes: string[];
  commercialLanding: boolean;
};

const COMMERCIAL_LANDINGS = new Set<string>(STABLE_TOUR_LANDING_PATHS);

function coverageForCluster(cluster: SeoQueryCluster): SeoClusterCoverageRow {
  const notes: string[] = [];
  const commercialLanding = COMMERCIAL_LANDINGS.has(cluster.targetPath);
  const indexable = isIndexableInternalPath(cluster.targetPath);

  if (!cluster.targetPath.startsWith("/")) {
    notes.push("Цель должна быть внутренним путём");
  }
  if (!indexable) {
    notes.push("Цель не индексируется в публичном sitemap-контракте");
  }
  if (cluster.intent === "commercial" && !commercialLanding && !cluster.targetPath.startsWith("/tours") && !cluster.targetPath.startsWith("/excursions")) {
    notes.push("Коммерческий кластер без каталожной/landing цели");
  }
  if (commercialLanding) {
    notes.push("Есть выделенный commercial landing");
  }

  let status: SeoClusterCoverageStatus = "ok";
  if (!indexable) status = "missing";
  else if (notes.some((note) => note.includes("без каталожной"))) status = "warn";

  return {
    id: cluster.id,
    label: cluster.label,
    intent: cluster.intent,
    priority: cluster.priority,
    targetPath: cluster.targetPath,
    status,
    notes,
    commercialLanding,
  };
}

export function evaluateSeoClusterCoverage(
  clusters: SeoQueryCluster[] = SEO_QUERY_CLUSTERS,
): SeoClusterCoverageRow[] {
  return clusters.map(coverageForCluster);
}

export function summarizeSeoClusterCoverage(rows: SeoClusterCoverageRow[]) {
  return {
    total: rows.length,
    ok: rows.filter((row) => row.status === "ok").length,
    warn: rows.filter((row) => row.status === "warn").length,
    missing: rows.filter((row) => row.status === "missing").length,
  };
}
