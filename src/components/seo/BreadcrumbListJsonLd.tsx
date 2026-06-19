import { buildBreadcrumbListJsonLd, type BreadcrumbJsonLdItem } from "@/lib/breadcrumb-json-ld";

export default function BreadcrumbListJsonLd({ items }: { items: BreadcrumbJsonLdItem[] }) {
  const jsonLd = buildBreadcrumbListJsonLd(items);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
