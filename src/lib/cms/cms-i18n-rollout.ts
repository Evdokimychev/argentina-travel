import type { CmsSeedEntry } from "@/lib/cms/cms-ts-seed";
import type { CmsDocumentBody, CmsDocType } from "@/types/cms-content";

/** E77 rollout priority: top 10 slugs for es/en empty stub seeding. */
export const CMS_I18N_ROLLOUT_TOP_SLUGS: ReadonlyArray<{ docType: CmsDocType; slug: string }> = [
  { docType: "legal", slug: "privacy" },
  { docType: "legal", slug: "terms" },
  { docType: "blog", slug: "best-time-to-visit-argentina" },
  { docType: "blog", slug: "patagonia-packing-list" },
  { docType: "blog", slug: "buenos-aires-neighborhoods" },
  { docType: "guide", slug: "sezony-i-klimat" },
  { docType: "guide", slug: "patagoniya-s-chego-nachat" },
  { docType: "destination", slug: "patagonia" },
  { docType: "destination", slug: "ba" },
  { docType: "place", slug: "perito-moreno-glacier" },
];

const EMPTY_STUB_LOCALES = ["es", "en"] as const;

function emptyBodyFromSource(body: CmsDocumentBody): CmsDocumentBody {
  switch (body.kind) {
    case "legal":
      return {
        kind: "legal",
        description: "",
        sections: [{ paragraphs: [""] }],
      };
    case "blog":
      return {
        kind: "blog",
        excerpt: "",
        sections: [{ title: "", body: "" }],
      };
    case "guide":
      return {
        kind: "guide",
        description: "",
        sections: [{ paragraphs: [""] }],
      };
    case "destination":
      return {
        kind: "destination",
        description: "",
        intro: "",
      };
    case "place":
      return {
        kind: "place",
        shortDescription: "",
        fullDescription: "",
      };
  }
}

/** Build draft es/en stub entries cloned from a Russian CMS row (empty body). */
export function buildCmsI18nEmptyStubEntries(source: {
  docType: CmsDocType;
  slug: string;
  title: string;
  body: CmsDocumentBody;
  seoDescription?: string;
}): CmsSeedEntry[] {
  return EMPTY_STUB_LOCALES.map((locale) => ({
    docType: source.docType,
    slug: source.slug,
    locale,
    title: source.title,
    body: emptyBodyFromSource(source.body),
    seo: { description: source.seoDescription ?? "" },
  }));
}

/** Resolve rollout priority slugs to seed entries using ru TS/CMS source metadata. */
export function buildCmsI18nRolloutStubEntries(
  resolveRuSource: (docType: CmsDocType, slug: string) => {
    title: string;
    body: CmsDocumentBody;
    seoDescription?: string;
  } | null
): CmsSeedEntry[] {
  const entries: CmsSeedEntry[] = [];

  for (const { docType, slug } of CMS_I18N_ROLLOUT_TOP_SLUGS) {
    const ru = resolveRuSource(docType, slug);
    if (!ru) continue;
    entries.push(...buildCmsI18nEmptyStubEntries({ docType, slug, ...ru }));
  }

  return entries;
}
