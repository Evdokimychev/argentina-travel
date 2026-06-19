import { absoluteUrl } from "@/lib/site-url";

export type BreadcrumbJsonLdItem = {
  name: string;
  path: string;
};

export function buildBreadcrumbListJsonLd(items: BreadcrumbJsonLdItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
