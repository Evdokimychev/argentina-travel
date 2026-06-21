import { PageSlotImage } from "@/components/media/ContentSectionImage";
import BlogSectionBody from "@/components/blog/BlogSectionBody";
import { getBlogSectionKind } from "@/lib/blog-section-body";
import { hasContentSlotImage } from "@/lib/media-resolver";
import { cn } from "@/lib/cn";
import { siteScrollAnchorClass } from "@/lib/site-container";
import type { BlogPostSection } from "@/types";

const SECTION_IMAGE_SLOTS = ["section-1", "section-2", "section-3"] as const;

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
  postSlug: string;
  totalSections: number;
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
    default:
      return undefined;
  }
}

export default function BlogPostSectionView({
  section,
  headingId,
  index,
  postSlug,
  totalSections,
}: BlogPostSectionViewProps) {
  const accent = sectionAccentClass(section);
  const imageSlot = sectionImageSlot(index, totalSections);
  const isShortPost = totalSections < 6;
  const imagePriority = imageSlot === "section-1" && isShortPost;
  const imageLoading: "lazy" | undefined =
    imageSlot === "section-1" && isShortPost ? undefined : "lazy";

  return (
    <div className="space-y-6">
      <section className={cn("space-y-5", accent)}>
        <h2
          id={headingId}
          className={cn(
            "font-heading text-xl font-bold text-charcoal sm:text-[1.375rem]",
            siteScrollAnchorClass,
          )}
        >
          {section.title}
        </h2>
        <BlogSectionBody section={section} postSlug={postSlug} />
      </section>
      {imageSlot ? (
        <PageSlotImage
          pageId={`blog:${postSlug}`}
          slotId={imageSlot}
          role="section"
          priority={imagePriority}
          loading={imageLoading}
        />
      ) : null}
    </div>
  );
}
