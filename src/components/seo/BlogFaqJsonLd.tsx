import { extractFaqFromBlogPost } from "@/lib/blog-faq";
import { buildBlogFaqJsonLd } from "@/lib/content-json-ld";
import { getBlogRichArticle } from "@/data/blog-articles";
import type { BlogPost } from "@/types";

export default function BlogFaqJsonLd({ post }: { post: BlogPost }) {
  const richFaq = post.richArticleId
    ? getBlogRichArticle(post.richArticleId)?.faq
    : undefined;
  const faq = richFaq?.length ? richFaq : extractFaqFromBlogPost(post);
  if (!faq?.length) return null;

  const jsonLd = buildBlogFaqJsonLd(faq, `/blog/${post.slug}`);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
