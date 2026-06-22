import BlogPostHeroImage from "@/components/blog/BlogPostHeroImage";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import type { BlogPost } from "@/types";

type BlogPostHeroProps = {
  post: BlogPost;
  className?: string;
};

/** @deprecated Используйте BlogPostHeader с BlogPostHeroImage */
export default function BlogPostHero({ post, className }: BlogPostHeroProps) {
  return (
    <div className={cn("border-b border-gray-100 bg-charcoal/5", className)}>
      <div className={cn(siteContainerClass, "py-0")}>
        <BlogPostHeroImage post={post} className="mx-auto max-h-[min(52vh,520px)] rounded-none sm:rounded-b-2xl" />
      </div>
    </div>
  );
}
