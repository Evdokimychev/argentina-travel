import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import {
  CONTENT_FRESHNESS_CRITICAL_DAYS,
  CONTENT_FRESHNESS_STALE_DAYS,
  listContentFreshnessDocTypes,
  listContentFreshnessItems,
} from "@/lib/content-freshness-server";
import type { ContentFreshnessDocType } from "@/types/content-freshness";

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
  });
}
