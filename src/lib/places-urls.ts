/** URL-хелперы для мест — без серверных зависимостей (безопасно для client components). */

export function placeHref(slug: string): string {
  return `/places/${slug}`;
}

export function collectionHref(slug: string): string {
  return `/collections/${slug}`;
}

export function itineraryHref(slug: string): string {
  return `/itineraries/${slug}`;
}
