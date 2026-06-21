import type { SupabaseClient } from "@supabase/supabase-js";
import { blogPosts } from "@/data/blog";
import { LEGAL_DOCUMENTS } from "@/data/legal-content";
import { getPagesBySection } from "@/lib/content-pages";
import { getAllDestinations } from "@/lib/destinations";
import { PLACES_SEED } from "@/data/places-seed";
import { cmsDocumentToRow } from "@/lib/cms/content-mapper";
import { buildCmsI18nPilotEntries } from "@/lib/cms/cms-i18n-pilot";
import {
  buildCmsI18nRolloutPlaceholderEntries,
  buildCmsI18nRolloutStubEntries,
} from "@/lib/cms/cms-i18n-rollout";
import type { Database, Json } from "@/types/database";
import { enrichContentSectionsWithHtml } from "@/lib/content-section-body";
import {
  blogBodyFromTs,
  cmsDocumentId,
  destinationBodyFromTs,
  guideBodyFromTs,
  legalBodyFromTs,
  placeBodyFromTs,
  type CmsDocType,
  type CmsDocumentBody,
  type CmsDocumentSeo,
} from "@/types/cms-content";

type DbClient = SupabaseClient<Database>;

export type CmsSeedEntry = {
  docType: CmsDocType;
  slug: string;
  locale: string;
  title: string;
  body: CmsDocumentBody;
  seo: CmsDocumentSeo;
};

export type CmsSeedOptions = {
  docTypes?: CmsDocType[];
  locale?: string;
  publish?: boolean;
  skipExisting?: boolean;
  /** When true (default), legal/guide sections get `html` from plain paragraphs. */
  includeRichHtml?: boolean;
  actorId?: string | null;
};

export type CmsSeedResult = {
  created: number;
  skipped: number;
  updated: number;
  total: number;
  errors: string[];
};

/** Collect importable rows from static TS sources (audit baseline for E35). */
export function buildCmsSeedEntries(locale = "ru"): CmsSeedEntry[] {
  const entries: CmsSeedEntry[] = [];

  for (const doc of Object.values(LEGAL_DOCUMENTS)) {
    entries.push({
      docType: "legal",
      slug: doc.slug,
      locale,
      title: doc.title,
      body: legalBodyFromTs(doc),
      seo: { description: doc.description },
    });
  }

  for (const post of blogPosts) {
    entries.push({
      docType: "blog",
      slug: post.slug,
      locale,
      title: post.title,
      body: blogBodyFromTs(post),
      seo: { title: post.seoTitle, description: post.excerpt },
    });
  }

  for (const page of getPagesBySection("guide")) {
    entries.push({
      docType: "guide",
      slug: page.slug,
      locale,
      title: page.title,
      body: guideBodyFromTs(page),
      seo: { description: page.description },
    });
  }

  for (const destination of getAllDestinations()) {
    entries.push({
      docType: "destination",
      slug: destination.id,
      locale,
      title: destination.name,
      body: destinationBodyFromTs(destination),
      seo: { description: destination.description },
    });
  }

  for (const place of PLACES_SEED) {
    entries.push({
      docType: "place",
      slug: place.slug,
      locale,
      title: place.name,
      body: placeBodyFromTs(place),
      seo: { description: place.shortDescription },
    });
  }

  return entries;
}

/** Enrich legal/guide seed bodies with sanitized HTML for rich-text editor (E1). */
export function enrichSeedBodyWithRichHtml(body: CmsDocumentBody): CmsDocumentBody {
  if (body.kind === "legal") {
    return {
      ...body,
      sections: enrichContentSectionsWithHtml(body.sections),
    };
  }
  if (body.kind === "guide") {
    return {
      ...body,
      sections: enrichContentSectionsWithHtml(body.sections),
    };
  }
  return body;
}

function prepareSeedEntry(entry: CmsSeedEntry, includeRichHtml: boolean): CmsSeedEntry {
  if (!includeRichHtml) return entry;
  return {
    ...entry,
    body: enrichSeedBodyWithRichHtml(entry.body),
  };
}

async function appendSeedRevision(
  supabase: DbClient,
  documentId: string,
  title: string,
  body: CmsDocumentBody,
  seo: CmsDocumentSeo,
  actorId: string | null
): Promise<void> {
  const { data } = await supabase
    .from("content_revisions")
    .select("revision_number")
    .eq("document_id", documentId)
    .order("revision_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("content_revisions").insert({
    document_id: documentId,
    revision_number: (data?.revision_number ?? 0) + 1,
    title,
    body: body as Json,
    seo: seo as Json,
    created_by: actorId,
  });
}

/** Idempotent import: skips existing documents by default. */
export async function seedCmsFromTs(
  supabase: DbClient,
  options: CmsSeedOptions = {}
): Promise<CmsSeedResult> {
  const locale = options.locale ?? "ru";
  const publish = options.publish ?? true;
  const skipExisting = options.skipExisting ?? true;
  const includeRichHtml = options.includeRichHtml !== false;
  const actorId = options.actorId ?? null;
  const allowedTypes = options.docTypes ? new Set(options.docTypes) : null;

  const entries = buildCmsSeedEntries(locale)
    .filter((entry) => !allowedTypes || allowedTypes.has(entry.docType))
    .map((entry) => prepareSeedEntry(entry, includeRichHtml));

  let created = 0;
  let skipped = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    const id = cmsDocumentId(entry.docType, entry.slug, entry.locale);
    const { data: existing, error: readError } = await supabase
      .from("content_documents")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (readError) {
      errors.push(`${id}: ${readError.message}`);
      continue;
    }

    if (existing && skipExisting) {
      skipped += 1;
      continue;
    }

    const status = publish ? "published" : "draft";
    const publishedAt = publish ? new Date().toISOString() : null;

    if (existing) {
      const { error } = await supabase
        .from("content_documents")
        .update({
          title: entry.title,
          body: entry.body as Json,
          seo: entry.seo as Json,
          status,
          published_at: publishedAt,
          updated_by: actorId,
        })
        .eq("id", id);

      if (error) {
        errors.push(`${id}: ${error.message}`);
        continue;
      }

      await appendSeedRevision(supabase, id, entry.title, entry.body, entry.seo, actorId);
      updated += 1;
      continue;
    }

    const row = cmsDocumentToRow({
      id,
      docType: entry.docType,
      slug: entry.slug,
      locale: entry.locale,
      title: entry.title,
      status,
      body: entry.body,
      seo: entry.seo,
      publishedAt,
      scheduledPublishAt: null,
      createdBy: actorId,
      updatedBy: actorId,
    });

    const { error } = await supabase.from("content_documents").insert(row);
    if (error) {
      errors.push(`${id}: ${error.message}`);
      continue;
    }

    await appendSeedRevision(supabase, id, entry.title, entry.body, entry.seo, actorId);
    created += 1;
  }

  return { created, skipped, updated, total: entries.length, errors };
}

/** E43 pilot: seed es/en variants for privacy + best-time blog post. */
export async function seedCmsI18nPilot(
  supabase: DbClient,
  options: Pick<CmsSeedOptions, "publish" | "skipExisting" | "actorId"> = {}
): Promise<CmsSeedResult> {
  const publish = options.publish ?? true;
  const skipExisting = options.skipExisting ?? true;
  const actorId = options.actorId ?? null;
  const entries = buildCmsI18nPilotEntries();

  let created = 0;
  let skipped = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    const id = cmsDocumentId(entry.docType, entry.slug, entry.locale);
    const { data: existing, error: readError } = await supabase
      .from("content_documents")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (readError) {
      errors.push(`${id}: ${readError.message}`);
      continue;
    }

    if (existing && skipExisting) {
      skipped += 1;
      continue;
    }

    const status = publish ? "published" : "draft";
    const publishedAt = publish ? new Date().toISOString() : null;

    if (existing) {
      const { error } = await supabase
        .from("content_documents")
        .update({
          title: entry.title,
          body: entry.body as Json,
          seo: entry.seo as Json,
          status,
          published_at: publishedAt,
          updated_by: actorId,
        })
        .eq("id", id);

      if (error) {
        errors.push(`${id}: ${error.message}`);
        continue;
      }

      await appendSeedRevision(supabase, id, entry.title, entry.body, entry.seo, actorId);
      updated += 1;
      continue;
    }

    const row = cmsDocumentToRow({
      id,
      docType: entry.docType,
      slug: entry.slug,
      locale: entry.locale,
      title: entry.title,
      status,
      body: entry.body,
      seo: entry.seo,
      publishedAt,
      scheduledPublishAt: null,
      createdBy: actorId,
      updatedBy: actorId,
    });

    const { error } = await supabase.from("content_documents").insert(row);
    if (error) {
      errors.push(`${id}: ${error.message}`);
      continue;
    }

    await appendSeedRevision(supabase, id, entry.title, entry.body, entry.seo, actorId);
    created += 1;
  }

  return { created, skipped, updated, total: entries.length, errors };
}

function resolveRuSourceFromTs(
  docType: CmsDocType,
  slug: string
): { title: string; body: CmsDocumentBody; seoDescription?: string } | null {
  switch (docType) {
    case "legal": {
      const doc = LEGAL_DOCUMENTS[slug];
      if (!doc) return null;
      return {
        title: doc.title,
        body: legalBodyFromTs(doc),
        seoDescription: doc.description,
      };
    }
    case "blog": {
      const post = blogPosts.find((item) => item.slug === slug);
      if (!post) return null;
      return {
        title: post.title,
        body: blogBodyFromTs(post),
        seoDescription: post.excerpt,
      };
    }
    case "guide": {
      const page = getPagesBySection("guide").find((item) => item.slug === slug);
      if (!page) return null;
      return {
        title: page.title,
        body: guideBodyFromTs(page),
        seoDescription: page.description,
      };
    }
    case "destination": {
      const destination = getAllDestinations().find((item) => item.id === slug);
      if (!destination) return null;
      return {
        title: destination.name,
        body: destinationBodyFromTs(destination),
        seoDescription: destination.description,
      };
    }
    case "place": {
      const place = PLACES_SEED.find((item) => item.slug === slug);
      if (!place) return null;
      return {
        title: place.name,
        body: placeBodyFromTs(place),
        seoDescription: place.shortDescription,
      };
    }
    default:
      return null;
  }
}

/** E77: seed draft es/en empty stubs for top-10 priority slugs. */
export async function seedCmsI18nEmptyStubs(
  supabase: DbClient,
  options: Pick<CmsSeedOptions, "skipExisting" | "actorId"> = {}
): Promise<CmsSeedResult> {
  const skipExisting = options.skipExisting ?? true;
  const actorId = options.actorId ?? null;
  const entries = buildCmsI18nRolloutStubEntries(resolveRuSourceFromTs);

  let created = 0;
  let skipped = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    const id = cmsDocumentId(entry.docType, entry.slug, entry.locale);
    const { data: existing, error: readError } = await supabase
      .from("content_documents")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (readError) {
      errors.push(`${id}: ${readError.message}`);
      continue;
    }

    if (existing && skipExisting) {
      skipped += 1;
      continue;
    }

    const status = "draft";
    const publishedAt = null;

    if (existing) {
      const { error } = await supabase
        .from("content_documents")
        .update({
          title: entry.title,
          body: entry.body as Json,
          seo: entry.seo as Json,
          status,
          published_at: publishedAt,
          updated_by: actorId,
        })
        .eq("id", id);

      if (error) {
        errors.push(`${id}: ${error.message}`);
        continue;
      }

      await appendSeedRevision(supabase, id, entry.title, entry.body, entry.seo, actorId);
      updated += 1;
      continue;
    }

    const row = cmsDocumentToRow({
      id,
      docType: entry.docType,
      slug: entry.slug,
      locale: entry.locale,
      title: entry.title,
      status,
      body: entry.body,
      seo: entry.seo,
      publishedAt,
      scheduledPublishAt: null,
      createdBy: actorId,
      updatedBy: actorId,
    });

    const { error } = await supabase.from("content_documents").insert(row);
    if (error) {
      errors.push(`${id}: ${error.message}`);
      continue;
    }

    await appendSeedRevision(supabase, id, entry.title, entry.body, entry.seo, actorId);
    created += 1;
  }

  return { created, skipped, updated, total: entries.length, errors };
}

/** E93: seed draft es/en placeholders copied from Russian source for rollout slugs. */
export async function seedCmsLocalePlaceholders(
  supabase: DbClient,
  options: Pick<CmsSeedOptions, "skipExisting" | "actorId"> = {}
): Promise<CmsSeedResult> {
  const skipExisting = options.skipExisting ?? true;
  const actorId = options.actorId ?? null;
  const entries = buildCmsI18nRolloutPlaceholderEntries(resolveRuSourceFromTs);

  let created = 0;
  let skipped = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    const id = cmsDocumentId(entry.docType, entry.slug, entry.locale);
    const { data: existing, error: readError } = await supabase
      .from("content_documents")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (readError) {
      errors.push(`${id}: ${readError.message}`);
      continue;
    }

    if (existing && skipExisting) {
      skipped += 1;
      continue;
    }

    const status = "draft";
    const publishedAt = null;

    if (existing) {
      const { error } = await supabase
        .from("content_documents")
        .update({
          title: entry.title,
          body: entry.body as Json,
          seo: entry.seo as Json,
          status,
          published_at: publishedAt,
          updated_by: actorId,
        })
        .eq("id", id);

      if (error) {
        errors.push(`${id}: ${error.message}`);
        continue;
      }

      await appendSeedRevision(supabase, id, entry.title, entry.body, entry.seo, actorId);
      updated += 1;
      continue;
    }

    const row = cmsDocumentToRow({
      id,
      docType: entry.docType,
      slug: entry.slug,
      locale: entry.locale,
      title: entry.title,
      status,
      body: entry.body,
      seo: entry.seo,
      publishedAt,
      scheduledPublishAt: null,
      createdBy: actorId,
      updatedBy: actorId,
    });

    const { error } = await supabase.from("content_documents").insert(row);
    if (error) {
      errors.push(`${id}: ${error.message}`);
      continue;
    }

    await appendSeedRevision(supabase, id, entry.title, entry.body, entry.seo, actorId);
    created += 1;
  }

  return { created, skipped, updated, total: entries.length, errors };
}

/** TS-only content types (no CMS doc_type yet) — for audit docs. */
export const CMS_TS_ONLY_AUDIT = {
  supportedDocTypes: ["legal", "blog", "guide", "destination", "place"] as const,
  tsOnly: [
    {
      kind: "immigration",
      source: "src/data/immigration-content.ts",
      note: "Страницы /immigration/* — только TS, без content_documents",
    },
    {
      kind: "guide_pillars",
      source: "src/data/guide-pillars/*",
      note: "Столпы путеводителя (/guide/...) — TS, отдельно от guide ContentPage",
    },
    {
      kind: "guide_topics",
      source: "src/data/guide-topics.ts",
      note: "Тематические хабы путеводителя — TS",
    },
    {
      kind: "immigration_topics",
      source: "src/data/immigration-topics.ts",
      note: "Темы иммиграции — TS",
    },
    {
      kind: "blog_plan",
      source: "src/data/blog-content-plan.ts",
      note: "План статей (не опубликовано) — TS",
    },
  ],
} as const;
