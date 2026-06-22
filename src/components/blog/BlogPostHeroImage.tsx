import PageImage from "@/components/media/PageImage";
import { getBlogPostHeroResolved } from "@/lib/media-resolver";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogPostHeroImageProps = {
  post: BlogPost;
  className?: string;
};

function needsAttribution(hero: ReturnType<typeof getBlogPostHeroResolved>): boolean {
  const src = hero.attribution?.source;
  if (src === "unsplash" || src === "pexels" || src === "wikimedia") return true;
  const html = hero.attributionHtml ?? "";
  return /Unsplash|Pexels|Wikimedia/.test(html);
}

export default function BlogPostHeroImage({ post, className }: BlogPostHeroImageProps) {
  const hero = getBlogPostHeroResolved(post);
  const caption = needsAttribution(hero) ? hero.attributionHtml : null;

  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gray-100 bg-charcoal/5 shadow-card",
        className
      )}
    >
      <div className="relative aspect-[4/3] w-full">
        <PageImage
          image={hero}
          role="hero"
          fill
          priority
          sizes="(min-width: 1024px) 380px, 100vw"
          className="object-cover"
        />
      </div>
      {caption ? (
        <figcaption
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/85 via-charcoal/50 to-transparent px-4 pb-3 pt-10 text-xs leading-relaxed text-white/90 [&_a]:text-white [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: caption }}
        />
      ) : (
        <figcaption className="sr-only">{hero.alt}</figcaption>
      )}
    </figure>
  );
}
