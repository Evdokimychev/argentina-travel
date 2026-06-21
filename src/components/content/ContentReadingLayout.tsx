import TableOfContents from "@/components/content/TableOfContents";
import RelatedContentCards from "@/components/content/RelatedContentCards";
import { cn } from "@/lib/cn";
import { hubTocStickyMaxHeightClass, hubTocStickyTopClass } from "@/lib/site-container";
import type { ContentTocItem, RelatedContentItem } from "@/types/content-reading";

type ContentReadingLayoutProps = {
  tocItems: ContentTocItem[];
  tocMinItems?: number;
  children: React.ReactNode;
  aside?: React.ReactNode;
  relatedItems?: RelatedContentItem[];
  relatedTitle?: string;
  footer?: React.ReactNode;
  articleClassName?: string;
  className?: string;
};

export default function ContentReadingLayout({
  tocItems,
  tocMinItems = 2,
  children,
  aside,
  relatedItems = [],
  relatedTitle,
  footer,
  articleClassName,
  className,
}: ContentReadingLayoutProps) {
  const showToc = tocItems.length >= tocMinItems;
  const hasSidebar = showToc || aside;

  return (
    <div className={cn("space-y-6", className)}>
      <TableOfContents items={showToc ? tocItems : []} variant="mobile" />

      <div
        className={cn(
          hasSidebar && "lg:grid lg:items-start lg:gap-8 xl:gap-10",
          hasSidebar &&
            (aside
              ? "lg:grid-cols-[minmax(0,1fr)_min(100%,320px)]"
              : "lg:grid-cols-[minmax(0,1fr)_240px]")
        )}
      >
        <div className="min-w-0">
          <article
            className={cn(
              "content-reading-prose rounded-3xl border border-gray-100 bg-white p-5 shadow-card sm:p-8 md:p-10",
              articleClassName
            )}
          >
            {children}

            {relatedItems.length > 0 ? (
              <RelatedContentCards
                title={relatedTitle}
                items={relatedItems}
                className="mt-10 border-t border-gray-100 pt-8"
              />
            ) : null}

            {footer ? <div className="mt-10 border-t border-gray-100 pt-8">{footer}</div> : null}
          </article>
        </div>

        {hasSidebar ? (
          <aside className="hidden min-w-0 lg:block">
            <div
              className={cn(
                "sticky space-y-4 overflow-y-auto scrollbar-thin",
                hubTocStickyTopClass,
                hubTocStickyMaxHeightClass
              )}
            >
              {showToc ? (
                <TableOfContents items={tocItems} variant="sidebar" embedded />
              ) : null}
              {aside}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
