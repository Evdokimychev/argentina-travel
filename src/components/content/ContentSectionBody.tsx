import { cn } from "@/lib/cn";
import { resolveSectionHtml } from "@/lib/content-section-body";
import { resolveGuideSectionBlocks } from "@/lib/guide-section-blocks";
import { renderBlogBodyBlock } from "@/components/blog/BlogSectionBody";
import type { ContentSection } from "@/types/content-page";

type Props = {
  section: ContentSection;
  className?: string;
  /** Extra top margin when section has a heading above. */
  withHeading?: boolean;
};

export default function ContentSectionBody({ section, className, withHeading }: Props) {
  const blocks = resolveGuideSectionBlocks(section);
  const html = resolveSectionHtml(section);

  if (blocks.length > 0) {
    return (
      <>
        <div
          className={cn(
            "guide-section-body space-y-5",
            withHeading ? "mt-3" : undefined,
            className
          )}
        >
          {blocks.map((block, index) => renderBlogBodyBlock(block, index))}
        </div>
        {section.list?.length ? (
          <ul
            className={cn(
              "list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate",
              "mt-3",
              className
            )}
          >
            {section.list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </>
    );
  }

  return (
    <>
      {html ? (
        <div
          className={cn(
            "rich-text-editor-content text-sm leading-relaxed text-slate",
            withHeading ? "mt-3" : undefined,
            className
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
      {section.list?.length ? (
        <ul
          className={cn(
            "list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate",
            html || withHeading ? "mt-3" : undefined,
            className
          )}
        >
          {section.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
