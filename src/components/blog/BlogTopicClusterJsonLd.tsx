import JsonLdScript from "@/components/seo/JsonLdScript";
import { buildBlogTopicClusterItemListJsonLd } from "@/lib/blog-topic-cluster";
import type { BlogPost } from "@/types";

type BlogTopicClusterJsonLdProps = {
  post: BlogPost;
  catalog: BlogPost[];
};

export default function BlogTopicClusterJsonLd({ post, catalog }: BlogTopicClusterJsonLdProps) {
  const jsonLd = buildBlogTopicClusterItemListJsonLd(post, catalog);
  if (!jsonLd) return null;
  return <JsonLdScript data={jsonLd} />;
}
