import BlogMediaBlock from "@/components/blog/BlogMediaBlock";
import BlogBudgetWidget from "@/components/blog/BlogBudgetWidget";
import BlogCallout from "@/components/blog/BlogCallout";
import BlogChecklist from "@/components/blog/BlogChecklist";
import BlogContentTable from "@/components/blog/BlogContentTable";
import BlogFaqSection from "@/components/blog/BlogFaqSection";
import BlogMapBlock from "@/components/blog/BlogMapBlock";
import BlogSeasonWidget from "@/components/blog/BlogSeasonWidget";
import BlogSectionDivider from "@/components/blog/BlogSectionDivider";
import BlogStepList from "@/components/blog/BlogStepList";
import BlogTicketLink from "@/components/blog/BlogTicketLink";
import { resolveBlogSectionBlocks } from "@/lib/blog-section-blocks";
import type { BlogPostSection } from "@/types";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";

type BlogSectionBodyProps = {
  section: BlogPostSection;
  postSlug?: string;
  className?: string;
};

function renderBlock(block: BlogBodyBlock, index: number) {
  switch (block.type) {
    case "paragraph":
      return (
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
    case "budget":
      return <BlogBudgetWidget key={index} items={block.items} note={block.note} />;
    case "media":
      return (
        <BlogMediaBlock key={index} src={block.src} alt={block.alt} caption={block.caption} />
      );
    default:
      return null;
  }
}

export default function BlogSectionBody({ section, postSlug, className }: BlogSectionBodyProps) {
  const blocks = resolveBlogSectionBlocks(section, postSlug);

  return (
    <div className={className ?? "blog-section-body space-y-5"}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

export { renderBlock as renderBlogBodyBlock };
