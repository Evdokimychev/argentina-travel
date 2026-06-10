import { buildTourMessageHref } from "@/lib/messages-store";

/** Primary path: in-app messaging. Contacts page remains fallback. */
export function buildTourContactHref(slug: string, bookingId?: string): string {
  return buildTourMessageHref(slug, bookingId);
}

export function buildTourContactsFallbackHref(slug: string): string {
  return `/contacts?${new URLSearchParams({ tour: slug }).toString()}`;
}
