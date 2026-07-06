import type { BlogPost } from "@/types";
import { buildBlogArticleJsonLd } from "@/lib/content-json-ld";
import ContentArticleJsonLd from "@/components/seo/ContentArticleJsonLd";

export default function ArticleJsonLd({ post }: { post: BlogPost }) {
  return <ContentArticleJsonLd data={buildBlogArticleJsonLd(post)} />;
}
