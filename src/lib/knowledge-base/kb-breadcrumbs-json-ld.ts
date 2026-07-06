import type { BreadcrumbJsonLdItem } from "@/lib/breadcrumb-json-ld";
import type { KbCrumb } from "@/lib/knowledge-base/content";

/** Map KB UI crumbs to JSON-LD; trim to last 3 items per Yandex navigation chain limit. */
export function kbCrumbsToJsonLdItems(crumbs: KbCrumb[]): BreadcrumbJsonLdItem[] {
  const items = crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href }));
  return items.length > 3 ? items.slice(-3) : items;
}
