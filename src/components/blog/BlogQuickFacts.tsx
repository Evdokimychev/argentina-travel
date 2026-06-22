import HubQuickFactsGrid from "@/components/guide/hub/HubQuickFactsGrid";
import { buildBlogQuickFacts } from "@/lib/blog-utils";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogQuickFactsProps = {
  post: BlogPost;
  className?: string;
};

export default function BlogQuickFacts({ post, className }: BlogQuickFactsProps) {
  const facts = buildBlogQuickFacts(post);
  if (facts.length === 0) return null;

  return (
    <section className={cn(className)} aria-labelledby="blog-quick-facts-title">
      <h2
        id="blog-quick-facts-title"
        className="font-heading text-lg font-bold text-charcoal sm:text-xl"
      >
        Кратко о материале
      </h2>
      <HubQuickFactsGrid facts={facts} className="mt-4" columns={facts.length >= 4 ? 4 : 3} />
    </section>
  );
}
