import { buildBreadcrumbListSchema } from "@/lib/schema-json-ld";

export type BreadcrumbJsonLdItem = {
  name: string;
  path: string;
};

/** @deprecated Use buildBreadcrumbListSchema from schema-json-ld */
export function buildBreadcrumbListJsonLd(items: BreadcrumbJsonLdItem[]) {
  return buildBreadcrumbListSchema(items);
}
