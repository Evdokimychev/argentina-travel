import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import {
  CONTENT_FRESHNESS_CRITICAL_DAYS,
  CONTENT_FRESHNESS_STALE_DAYS,
  listContentFreshnessDocTypes,
  listContentFreshnessItems,
} from "@/lib/content-freshness-server";
import type { ContentFreshnessDocType } from "@/types/content-freshness";
import fs from "node:fs/promises";
import path from "node:path";

type KnowledgeBaseAudit = {
  counts?: Record<string, number>;
  entries?: Array<{
    id: string;
    route: string;
    title?: string;
    severity: string;
    issues?: Array<{ code: string }>;
  }>;
};

async function readKnowledgeBaseAudit() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "var/ops/content-audit.json"), "utf8");
    const audit = JSON.parse(raw) as KnowledgeBaseAudit;
    const issueCounts = new Map<string, number>();
    for (const entry of audit.entries ?? []) {
      for (const issue of entry.issues ?? []) {
        issueCounts.set(issue.code, (issueCounts.get(issue.code) ?? 0) + 1);
      }
    }
    return {
      counts: audit.counts ?? {},
      issues: [...issueCounts.entries()]
        .map(([code, count]) => ({ code, count }))
        .sort((left, right) => right.count - left.count),
      criticalEntries: (audit.entries ?? [])
        .filter((entry) => entry.severity === "critical")
        .slice(0, 20),
    };
  } catch {
    return { counts: {}, issues: [], criticalEntries: [] };
  }
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const requestedType = url.searchParams.get("docType")?.trim() || "all";
  const knownDocTypes = listContentFreshnessDocTypes();
  const docType =
    requestedType !== "all" && knownDocTypes.includes(requestedType as ContentFreshnessDocType)
      ? (requestedType as ContentFreshnessDocType)
      : undefined;

  const items = await listContentFreshnessItems({
    docType,
    staleOnly: true,
    seedMissing: true,
  });
  const knowledgeBase = await readKnowledgeBaseAudit();

  return NextResponse.json({
    staleAfterDays: CONTENT_FRESHNESS_STALE_DAYS,
    criticalAfterDays: CONTENT_FRESHNESS_CRITICAL_DAYS,
    availableDocTypes: knownDocTypes,
    selectedDocType: docType ?? "all",
    items,
    summary: {
      staleCount: items.filter((item) => item.status === "stale").length,
      criticalCount: items.filter((item) => item.status === "critical").length,
      total: items.length,
    },
    knowledgeBase,
  });
}
