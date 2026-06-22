import BlogMediaBlock from "@/components/blog/BlogMediaBlock";
import BlogBudgetWidget from "@/components/blog/BlogBudgetWidget";
import BlogCallout from "@/components/blog/BlogCallout";
import BlogChecklist from "@/components/blog/BlogChecklist";
import BlogContentTable from "@/components/blog/BlogContentTable";
import BlogFaqSection from "@/components/blog/BlogFaqSection";
import BlogMapBlock from "@/components/blog/BlogMapBlock";
import { LinkifiedText } from "@/components/blog/BlogLinkifiedText";
import BlogSeasonWidget from "@/components/blog/BlogSeasonWidget";
import ArgentinaSeasonMatrix from "@/components/travel/ArgentinaSeasonMatrix";
import ArgentinaTourismInfographic from "@/components/travel/ArgentinaTourismInfographic";
import ArgentinaTourismTimeline from "@/components/travel/ArgentinaTourismTimeline";
import BlogSectionDivider from "@/components/blog/BlogSectionDivider";
import BlogStepList from "@/components/blog/BlogStepList";
import BlogTicketLink from "@/components/blog/BlogTicketLink";
import BlogAccordionBlock from "@/components/page-builder/blocks/BlogAccordionBlock";
import BlogComparisonTableBlock from "@/components/page-builder/blocks/BlogComparisonTableBlock";
import BlogContentEmbedBlock from "@/components/page-builder/blocks/BlogContentEmbedBlock";
import BlogCtaBlock from "@/components/page-builder/blocks/BlogCtaBlock";
import BlogGalleryBlock from "@/components/page-builder/blocks/BlogGalleryBlock";
import BlogInfoboxBlock from "@/components/page-builder/blocks/BlogInfoboxBlock";
import BlogRouteMapBlock from "@/components/page-builder/blocks/BlogRouteMapBlock";
import BlogTourBookingBlock from "@/components/page-builder/blocks/BlogTourBookingBlock";
import BlogVideoBlock from "@/components/page-builder/blocks/BlogVideoBlock";
import BlogWidgetBlock from "@/components/page-builder/blocks/BlogWidgetBlock";
import { sanitizeHtml } from "@/lib/rich-text";
import { resolveBlogSectionBlocks } from "@/lib/blog-section-blocks";
import type { BlogPostSection } from "@/types";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";

type BlogSectionBodyProps = {
  section: BlogPostSection;
  postSlug?: string;
  className?: string;
  linkifyText?: boolean;
};

function renderBlock(block: BlogBodyBlock, index: number, linkifyText?: boolean) {
  switch (block.type) {
    case "paragraph":
      if (block.html?.trim()) {
        return (
          <div
            key={index}
            className="prose prose-sm max-w-none leading-relaxed text-slate"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.html) }}
          />
        );
      }
      return linkifyText ? (
        <LinkifiedText key={index} text={block.text} className="leading-relaxed text-slate" />
      ) : (
        <p key={index} className="leading-relaxed text-slate">
          {block.text}
        </p>
      );
    case "subheading":
      return (
        <h3
          key={index}
          className="mt-5 font-heading text-base font-semibold text-charcoal first:mt-0 sm:text-lg"
        >
          {block.text}
        </h3>
      );
    case "bullets":
      return (
        <ul key={index} className="space-y-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4">
          {block.items.map((item) => (
            <li key={item.slice(0, 48)} className="flex gap-2.5 text-sm leading-relaxed text-slate">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "checklist":
      return <BlogChecklist key={index} items={block.items} />;
    case "steps":
      return <BlogStepList key={index} items={block.items} />;
    case "table":
      return (
        <BlogContentTable
          key={index}
          headers={block.headers}
          rows={block.rows}
          caption={block.caption}
        />
      );
    case "callout":
      return (
        <BlogCallout
          key={index}
          variant={block.variant}
          title={block.title}
          body={block.body}
        />
      );
    case "faq":
      return <BlogFaqSection key={index} items={block.items} />;
    case "divider":
      return <BlogSectionDivider key={index} />;
    case "map":
      return <BlogMapBlock key={index} lat={block.lat} lng={block.lng} label={block.label} />;
    case "ticket-link":
      return <BlogTicketLink key={index} url={block.url} label={block.label} />;
    case "seasons":
      return (
        <BlogSeasonWidget key={index} items={block.items} conclusion={block.conclusion} />
      );
    case "season-matrix":
      return <ArgentinaSeasonMatrix key={index} className="my-6" />;
    case "tourism-infographic":
      return <ArgentinaTourismInfographic key={index} className="my-6" />;
    case "tourism-timeline":
      return <ArgentinaTourismTimeline key={index} className="my-6" />;
    case "budget":
      return <BlogBudgetWidget key={index} items={block.items} note={block.note} />;
    case "media":
      return (
        <BlogMediaBlock key={index} src={block.src} alt={block.alt} caption={block.caption} />
      );
    case "infobox":
      return (
        <BlogInfoboxBlock
          key={index}
          variant={block.variant}
          title={block.title}
          body={block.body}
        />
      );
    case "accordion":
      return <BlogAccordionBlock key={index} items={block.items} />;
    case "comparison-table":
      return (
        <BlogComparisonTableBlock
          key={index}
          headers={block.headers}
          rows={block.rows}
          highlightColumn={block.highlightColumn}
          caption={block.caption}
        />
      );
    case "cta":
      return (
        <BlogCtaBlock key={index} label={block.label} href={block.href} variant={block.variant} />
      );
    case "tour-booking":
      return (
        <BlogTourBookingBlock
          key={index}
          tourSlug={block.tourSlug}
          label={block.label}
          showPrice={block.showPrice}
        />
      );
    case "route-map":
      return (
        <BlogRouteMapBlock key={index} points={block.points} caption={block.caption} />
      );
    case "gallery":
      return (
        <BlogGalleryBlock key={index} items={block.items} columns={block.columns} />
      );
    case "video":
      return (
        <BlogVideoBlock
          key={index}
          provider={block.provider}
          videoId={block.videoId}
          title={block.title}
          caption={block.caption}
        />
      );
    case "content-embed":
      return (
        <BlogContentEmbedBlock
          key={index}
          embedKind={block.embedKind}
          slug={block.slug}
          title={block.title}
        />
      );
    case "widget":
      return (
        <BlogWidgetBlock
          key={index}
          widgetKey={block.widgetKey}
          title={block.title}
          config={block.config}
        />
      );
    default:
      return null;
  }
}

export default function BlogSectionBody({ section, postSlug, className, linkifyText }: BlogSectionBodyProps) {
  const blocks = resolveBlogSectionBlocks(section, postSlug);

  return (
    <div className={className ?? "blog-section-body space-y-5"}>
      {blocks.map((block, index) => renderBlock(block, index, linkifyText))}
    </div>
  );
}

export { renderBlock as renderBlogBodyBlock };
