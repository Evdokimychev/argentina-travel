import ContentSectionBody from "@/components/content/ContentSectionBody";
import { cn } from "@/lib/cn";
import { siteScrollAnchorClass } from "@/lib/site-container";
import type { ContentSection } from "@/types/content-page";

type Props = {
  sections?: ContentSection[];
  className?: string;
};

/** Renders optional CMS page-builder sections on destination/place (and similar) pages. */
export default function CmsContentSections({ sections, className }: Props) {
  const filtered = (sections ?? []).filter(
    (section) =>
      Boolean(section.heading?.trim()) ||
      (section.blocks?.length ?? 0) > 0 ||
      Boolean(section.html?.trim()) ||
      (section.paragraphs?.length ?? 0) > 0,
  );
  if (filtered.length === 0) return null;

  return (
    <div className={cn("space-y-8", className)} data-cms-content-sections>
      {filtered.map((section, index) => {
        const heading = section.heading?.trim();
        const anchor = heading
          ? `cms-section-${index}-${heading.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-")}`
          : `cms-section-${index}`;
        return (
          <section key={anchor} aria-labelledby={heading ? anchor : undefined}>
            {heading ? (
              <h2
                id={anchor}
                className={cn(
                  "font-heading text-xl font-bold text-charcoal",
                  siteScrollAnchorClass,
                )}
              >
                {heading}
              </h2>
            ) : null}
            <ContentSectionBody section={section} withHeading={Boolean(heading)} />
          </section>
        );
      })}
    </div>
  );
}
