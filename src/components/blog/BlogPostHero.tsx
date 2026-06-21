import PageImage from "@/components/media/PageImage";
import { getBlogPostHeroResolved } from "@/lib/media-resolver";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import type { BlogPost } from "@/types";

type BlogPostHeroProps = {
  post: BlogPost;
  className?: string;
};

function needsAttribution(hero: ReturnType<typeof getBlogPostHeroResolved>): boolean {
  const src = hero.attribution?.source;
  if (src === "unsplash" || src === "pexels" || src === "wikimedia") return true;
  const html = hero.attributionHtml ?? "";
  return /Unsplash|Pexels|Wikimedia/.test(html);
}

export default function BlogPostHero({ post, className }: BlogPostHeroProps) {
  const hero = getBlogPostHeroResolved(post);
  const caption = needsAttribution(hero) ? hero.attributionHtml : null;

  return (
    <div className={cn("border-b border-gray-100 bg-charcoal/5", className)}>
      <div className={cn(siteContainerClass, "py-0")}>
        <figure className="relative mx-auto aspect-[21/9] max-h-[min(52vh,520px)] w-full overflow-hidden rounded-none sm:rounded-b-2xl">
          <PageImage
            image={hero}
            role="hero"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {caption ? (
            <figcaption
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/85 via-charcoal/50 to-transparent px-4 pb-3 pt-10 text-xs leading-relaxed text-white/90 [&_a]:text-white [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: caption }}
            />
          ) : (
            <figcaption className="sr-only">{hero.alt}</figcaption>
          )}
        </figure>
      </div>
    </div>
  );
}
