import { buildBlogFaqJsonLd } from "@/lib/content-json-ld";
import { getBlogRichArticle } from "@/data/blog-articles";
import type { BlogPost } from "@/types";

export default function BlogFaqJsonLd({ post }: { post: BlogPost }) {
  if (!post.richArticleId) return null;

  const article = getBlogRichArticle(post.richArticleId);
  const faq = article?.faq;
  if (!faq?.length) return null;

  const jsonLd = buildBlogFaqJsonLd(faq, `/blog/${post.slug}`);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
