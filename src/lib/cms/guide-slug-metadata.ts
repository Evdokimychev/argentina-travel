import type { Metadata } from "next";
import { KAK_DOBRATSYA_HUB } from "@/data/guide-hub-kak-dobratsya";
import { resolveGuidePage, resolveGuideTopic } from "@/lib/cms/guide-resolver";
import { buildCmsContentHreflangAlternates } from "@/lib/cms/cms-hreflang";
import { buildCmsPageMetadata } from "@/lib/cms/cms-page-metadata";
import {
  isCmsPublicContentUnavailableError,
} from "@/lib/cms/public-read-result";
import { getContentPage } from "@/lib/content-pages";
import {
  getGuideTopicMetadata,
} from "@/lib/guide-topics";
import type { I18nLocale } from "@/lib/i18n/config";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getGuideTopicHeroImage } from "@/lib/media-resolver";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const GUIDE_FALLBACK_TITLE = "Путеводитель";
const GUIDE_FALLBACK_DESCRIPTION =
  "Практические материалы об Аргентине: регионы, транспорт, жильё и подготовка к поездке.";

/**
 * Guide metadata must stay emit-able when CMS/DB is down.
 * Prefer topic file metadata, then static guide file pages, then a generic title.
 * Never throw on typed CMS public unavailability — a missing `<title>` is worse than a soft fallback.
 */
export async function buildGuideSlugPageMetadata(
  slug: string,
  locale: I18nLocale,
): Promise<Metadata> {
  const path = `/guide/${slug}`;
  const topicMeta = getGuideTopicMetadata(slug);

  if (topicMeta) {
    try {
      const resolvedTopic = await resolveGuideTopic(slug, locale);
      if (slug === "kak-dobratsya") {
        return {
          ...buildPublicPageMetadata({
            title: resolvedTopic?.cmsPage?.title ?? KAK_DOBRATSYA_HUB.heroTitle,
            description:
              resolvedTopic?.cmsPage?.description ?? KAK_DOBRATSYA_HUB.heroSubtitle,
            path,
            image: getGuideTopicHeroImage(slug),
          }),
          alternates: buildHreflangAlternates(path),
        };
      }
      return {
        ...buildPublicPageMetadata({
          title: resolvedTopic?.cmsPage?.title
            ? `${resolvedTopic.cmsPage.title} — Путеводитель`
            : topicMeta.title,
          description:
            resolvedTopic?.cmsPage?.description ??
            resolvedTopic?.pillarPage?.heroSubtitle ??
            topicMeta.description,
          path,
          image: getGuideTopicHeroImage(slug),
        }),
        alternates: buildHreflangAlternates(path),
      };
    } catch {
      return {
        ...buildPublicPageMetadata({
          title: topicMeta.title,
          description: topicMeta.description,
          path,
          image: getGuideTopicHeroImage(slug),
        }),
        alternates: buildHreflangAlternates(path),
      };
    }
  }

  const filePage = getContentPage("guide", slug) ?? null;
  try {
    const page = await resolveGuidePage(slug, locale);
    if (!page) {
      if (filePage) {
        const alternates = await buildCmsContentHreflangAlternates("guide", slug, locale).catch(
          () => buildHreflangAlternates(path),
        );
        return buildCmsPageMetadata({
          content: filePage,
          title: filePage.title,
          description: filePage.description,
          path,
          alternates,
        });
      }
      return { title: GUIDE_FALLBACK_TITLE };
    }
    const alternates = await buildCmsContentHreflangAlternates("guide", slug, locale);
    return buildCmsPageMetadata({
      content: page,
      title: page.title,
      description: page.description,
      path,
      alternates,
    });
  } catch (error) {
    if (!isCmsPublicContentUnavailableError(error)) throw error;

    if (filePage) {
      return {
        ...buildPublicPageMetadata({
          title: filePage.title,
          description: filePage.description,
          path,
        }),
        alternates: buildHreflangAlternates(path),
        robots: { index: false, follow: true },
      };
    }

    // CMS-only slug during outage: keep a real <title>, avoid false "missing" SEO.
    return {
      ...buildPublicPageMetadata({
        title: GUIDE_FALLBACK_TITLE,
        description: GUIDE_FALLBACK_DESCRIPTION,
        path,
      }),
      alternates: buildHreflangAlternates(path),
      robots: { index: false, follow: true },
    };
  }
}
