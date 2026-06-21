import { cn } from "@/lib/cn";
import { resolveSectionHtml } from "@/lib/content-section-body";
import type { ContentSection } from "@/types/content-page";

type Props = {
  section: ContentSection;
  className?: string;
  /** Extra top margin when section has a heading above. */
  withHeading?: boolean;
};

export default function ContentSectionBody({ section, className, withHeading }: Props) {
  const html = resolveSectionHtml(section);

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
