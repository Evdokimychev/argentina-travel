import { NextResponse } from "next/server";
import { getEditorialBlogPosts } from "@/data/blog";
import { LEGAL_DOCUMENTS } from "@/data/legal-content";
import { PLACES_SEED } from "@/data/places-seed";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { getPagesBySection } from "@/lib/content-pages";
import { getAllDestinations } from "@/lib/destinations";
import { fetchCmsOverrideMap } from "@/lib/cms/content-resolver";
import {
  isPublishedTranslationComplete,
  isCmsDocumentComplete,
  toLocaleTranslationStatus,
} from "@/lib/cms/translation-status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cmsDocumentId, type CmsDocType } from "@/types/cms-content";

type TranslationInventoryItem = {
  docType: CmsDocType;
  slug: string;
  title: string;
  href: string;
  ruFallbackComplete: boolean;
};

const DOC_TYPE_LABELS: Record<CmsDocType, string> = {
  legal: "Юридический документ",
  blog: "Статья",
  guide: "Путеводитель",
  destination: "Направление",
  place: "Место",
};

const DOC_TYPE_SEGMENTS: Record<CmsDocType, string> = {
  legal: "legal",
  blog: "blog",
  guide: "guide",
  destination: "destinations",
  place: "places",
};

function toPublicHref(docType: CmsDocType, slug: string): string {
  return `/${DOC_TYPE_SEGMENTS[docType]}/${slug}`;
}

function toEditorHref(id: string | null): string | null {
  return id ? `/admin/content/documents/${encodeURIComponent(id)}` : null;
}

function asPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function addInventoryItem(registry: Map<string, TranslationInventoryItem>, item: TranslationInventoryItem) {
  const key = `${item.docType}:${item.slug}`;
  const existing = registry.get(key);
  if (!existing) {
    registry.set(key, item);
    return;
  }

  const title = existing.title || item.title;
  const href = existing.href || item.href;
  registry.set(key, {
    ...existing,
    title,
    href,
    ruFallbackComplete: existing.ruFallbackComplete || item.ruFallbackComplete,
  });
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const cmsMap = await fetchCmsOverrideMap(supabase);
  const inventory = new Map<string, TranslationInventoryItem>();

  for (const doc of Object.values(LEGAL_DOCUMENTS)) {
    addInventoryItem(inventory, {
      docType: "legal",
      slug: doc.slug,
      title: doc.title,
      href: `/legal/${doc.slug}`,
      ruFallbackComplete: true,
    });
  }

  for (const post of getEditorialBlogPosts().slice(0, 80)) {
    addInventoryItem(inventory, {
      docType: "blog",
      slug: post.slug,
      title: post.title,
      href: `/blog/${post.slug}`,
      ruFallbackComplete: true,
    });
  }

  for (const page of getPagesBySection("guide")) {
    addInventoryItem(inventory, {
      docType: "guide",
      slug: page.slug,
      title: page.title,
      href: `/guide/${page.slug}`,
      ruFallbackComplete: true,
    });
  }

  for (const destination of getAllDestinations()) {
    addInventoryItem(inventory, {
      docType: "destination",
      slug: destination.id,
      title: destination.name,
      href: `/destinations/${destination.id}`,
      ruFallbackComplete: true,
    });
  }

  for (const place of PLACES_SEED) {
    addInventoryItem(inventory, {
      docType: "place",
      slug: place.slug,
      title: place.name,
      href: `/places/${place.slug}`,
      ruFallbackComplete: true,
    });
  }

  for (const doc of cmsMap.values()) {
    addInventoryItem(inventory, {
      docType: doc.docType,
      slug: doc.slug,
      title: doc.title,
      href: toPublicHref(doc.docType, doc.slug),
      ruFallbackComplete: false,
    });
  }

  const rows = Array.from(inventory.values()).map((item) => {
    const ruDoc = cmsMap.get(cmsDocumentId(item.docType, item.slug, "ru")) ?? null;
    const esDoc = cmsMap.get(cmsDocumentId(item.docType, item.slug, "es")) ?? null;
    const enDoc = cmsMap.get(cmsDocumentId(item.docType, item.slug, "en")) ?? null;

    const translationStatus = {
      ru_complete: ruDoc ? isCmsDocumentComplete(ruDoc) : item.ruFallbackComplete,
      es_status: toLocaleTranslationStatus(esDoc),
      en_status: toLocaleTranslationStatus(enDoc),
    };

    const missingLocales: Array<"es" | "en"> = [];
    if (!isPublishedTranslationComplete(translationStatus.es_status)) missingLocales.push("es");
    if (!isPublishedTranslationComplete(translationStatus.en_status)) missingLocales.push("en");

    return {
      docType: item.docType,
      docTypeLabel: DOC_TYPE_LABELS[item.docType],
      slug: item.slug,
      title: item.title,
      href: item.href,
      translationStatus,
      missingLocales,
      editors: {
        ru: toEditorHref(ruDoc?.id ?? null),
        es: toEditorHref(esDoc?.id ?? ruDoc?.id ?? null),
        en: toEditorHref(enDoc?.id ?? ruDoc?.id ?? null),
      },
    };
  });

  const total = rows.length;
  const readyEs = rows.filter((row) => row.translationStatus.es_status === "published_complete").length;
  const readyEn = rows.filter((row) => row.translationStatus.en_status === "published_complete").length;
  const missingRows = rows
    .filter((row) => row.missingLocales.length > 0)
    .sort((a, b) => {
      const typeCompare = a.docTypeLabel.localeCompare(b.docTypeLabel, "ru");
      if (typeCompare !== 0) return typeCompare;
      return a.title.localeCompare(b.title, "ru");
    });

  return NextResponse.json({
    summary: {
      total,
      esReady: readyEs,
      enReady: readyEn,
      esCoveragePercent: asPercent(readyEs, total),
      enCoveragePercent: asPercent(readyEn, total),
      missingEs: total - readyEs,
      missingEn: total - readyEn,
      ruComplete: rows.filter((row) => row.translationStatus.ru_complete).length,
    },
    rows: missingRows,
    generatedAt: new Date().toISOString(),
  });
}
