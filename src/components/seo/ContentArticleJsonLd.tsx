import JsonLdScript from "@/components/seo/JsonLdScript";
import type { JsonLdGraph } from "@/lib/schema-json-ld";

type ContentArticleJsonLdProps = {
  data: JsonLdGraph;
};

/** Schema.org Article/BlogPosting JSON-LD for Yandex Metrika content analytics. */
export default function ContentArticleJsonLd({ data }: ContentArticleJsonLdProps) {
  return <JsonLdScript data={data} />;
}
