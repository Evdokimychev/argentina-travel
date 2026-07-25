import ContentSectionImage from "@/components/media/ContentSectionImage";
import BlogSectionBody from "@/components/blog/BlogSectionBody";
import BlogInlineRelatedPosts from "@/components/blog/BlogInlineRelatedPosts";
import BlogInlineMapBlock from "@/components/blog/BlogInlineMapBlock";
import BlogExpandableSection from "@/components/blog/BlogExpandableSection";
import { getBlogSectionKind } from "@/lib/blog-section-body";
import { getBlogFullAutoLinkRules } from "@/lib/blog-internal-links";
import { getDistinctBlogSectionImage } from "@/lib/media-resolver";
import { cn } from "@/lib/cn";
import { siteScrollAnchorClass } from "@/lib/site-container";
import type { ArticleMapPoint } from "@/lib/article-map-points";
import type { BlogPost, BlogPostSection } from "@/types";

const SECTION_IMAGE_SLOTS = ["section-1", "section-2", "section-3"] as const;

const EXPANDABLE_KINDS = new Set(["checklist", "mistakes", "tips"]);

type SectionImageSlot = (typeof SECTION_IMAGE_SLOTS)[number];

function sectionImageSlot(
  index: number,
  totalSections: number,
): SectionImageSlot | undefined {
  if (index === 1) return SECTION_IMAGE_SLOTS[0];
  if (totalSections < 6) return undefined;
  if (index === Math.floor(totalSections / 2)) return SECTION_IMAGE_SLOTS[1];
  if (index === totalSections - 2) return SECTION_IMAGE_SLOTS[2];
  return undefined;
}

type BlogPostSectionViewProps = {
  section: BlogPostSection;
  headingId: string;
  index: number;
  post: BlogPost;
  totalSections: number;
  inlineRelatedPosts?: BlogPost[];
  sectionMapPoints?: ArticleMapPoint[];
};

function sectionAccentClass(section: BlogPostSection): string | undefined {
  const kind = getBlogSectionKind(section.title, section.blockType);
  switch (kind) {
    case "faq":
      return "border-l-4 border-sky/40 pl-4 sm:pl-5";
    case "mistakes":
      return "border-l-4 border-red-200 pl-4 sm:pl-5";
    case "checklist":
      return "border-l-4 border-emerald-200/80 pl-4 sm:pl-5";
    case "tips":
      return "border-l-4 border-amber-200/80 pl-4 sm:pl-5";
    default:
      return undefined;
  }
}

function expandableSummaryHint(kind: ReturnType<typeof getBlogSectionKind>): string {
  switch (kind) {
    case "checklist":
      return "Контрольный список — нажмите, чтобы развернуть";
    case "mistakes":
      return "Типичные ошибки — нажмите, чтобы развернуть";
    case "tips":
      return "Практические советы — нажмите, чтобы развернуть";
    default:
      return "Развернуть";
  }
}

export default function BlogPostSectionView({
  section,
  headingId,
  index,
  post,
  totalSections,
  inlineRelatedPosts,
  sectionMapPoints = [],
}: BlogPostSectionViewProps) {
  const kind = getBlogSectionKind(section.title, section.blockType);
  const panelled = post.displayOptions?.sectionPanels === true;
  const accent = sectionAccentClass(section);
  const imageSlot = sectionImageSlot(index, totalSections);
  const sectionImage =
    post.displayOptions?.showAutoSectionImages === false
      ? undefined
      : imageSlot
        ? getDistinctBlogSectionImage(post, imageSlot)
        : undefined;
  const isShortPost = totalSections < 6;
  const imagePriority = imageSlot === "section-1" && isShortPost;
  const imageLoading: "lazy" | undefined =
    imageSlot === "section-1" && isShortPost ? undefined : "lazy";
  const expandable = EXPANDABLE_KINDS.has(kind);
  const linkifyRules = post.displayOptions?.autoLinkDestinations
    ? getBlogFullAutoLinkRules()
    : undefined;
  // Sections read as blocks of a shared page, not as boxed cards stacked
  // inside the article card — a hairline divider plus extra air is enough
  // separation without adding another nested "panel" surface. Keep the
  // article's own card as the only bordered/shadowed chrome at this level.
  const panelClass = panelled
    ? "border-t border-gray-100 pt-8 first:border-t-0 first:pt-0"
    : undefined;

  const body = (
    <BlogSectionBody
      section={section}
      postSlug={post.slug}
      linkifyText
      linkifyRules={linkifyRules}
    />
  );

  return (
    <div className="space-y-6">
      {expandable ? (
        <BlogExpandableSection
          title={section.title}
          headingId={headingId}
          summaryHint={expandableSummaryHint(kind)}
          accentClass={accent}
        >
          {body}
        </BlogExpandableSection>
      ) : (
        <section className={cn("space-y-5", accent, panelClass)}>
          <h2
            id={headingId}
            className={cn(
              "font-heading text-xl font-bold text-charcoal sm:text-[1.375rem]",
              siteScrollAnchorClass,
            )}
          >
            {section.title}
          </h2>
          {body}
        </section>
      )}

      {sectionMapPoints.length > 0 ? (
        <BlogInlineMapBlock points={sectionMapPoints} />
      ) : null}

      {sectionImage ? (
        <ContentSectionImage
          image={sectionImage}
          role="section"
          priority={imagePriority}
          loading={imageLoading}
        />
      ) : null}

      {inlineRelatedPosts?.length ? (
        <BlogInlineRelatedPosts posts={inlineRelatedPosts} sourceSlug={post.slug} />
      ) : null}
    </div>
  );
}
