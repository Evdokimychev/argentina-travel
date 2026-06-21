import JsonLdScript from "@/components/seo/JsonLdScript";
import { buildWebPageSchema } from "@/lib/schema-json-ld";

type WebPageJsonLdProps = {
  name: string;
  description: string;
  path: string;
};

export default function WebPageJsonLd({ name, description, path }: WebPageJsonLdProps) {
  return <JsonLdScript data={buildWebPageSchema({ name, description, path })} />;
}
