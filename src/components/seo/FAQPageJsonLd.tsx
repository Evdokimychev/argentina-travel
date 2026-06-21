import JsonLdScript from "@/components/seo/JsonLdScript";
import { buildFaqPageSchema } from "@/lib/schema-json-ld";

type FAQPageJsonLdProps = {
  questions: Array<{ question: string; answer: string }>;
  path: string;
};

export default function FAQPageJsonLd({ questions, path }: FAQPageJsonLdProps) {
  return <JsonLdScript data={buildFaqPageSchema({ path, questions })} />;
}
