import JsonLdScript from "@/components/seo/JsonLdScript";
import { buildBreadcrumbListSchema } from "@/lib/schema-json-ld";
import type { BreadcrumbJsonLdItem } from "@/lib/breadcrumb-json-ld";

export default function BreadcrumbListJsonLd({ items }: { items: BreadcrumbJsonLdItem[] }) {
  return <JsonLdScript data={buildBreadcrumbListSchema(items)} />;
}
