import type { BlogPost } from "@/types";
import { buildBlogArticleJsonLd } from "@/lib/content-json-ld";

export default function ArticleJsonLd({ post }: { post: BlogPost }) {
  const jsonLd = buildBlogArticleJsonLd(post);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
