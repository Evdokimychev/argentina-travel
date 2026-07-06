/** URL-хелперы раздела «База знаний» (клиент-безопасно, без fs). */

export function entryHref(id: string): string {
  return `/baza-znaniy/${id}`;
}

export function sectionHref(slug: string): string {
  return `/baza-znaniy/razdel/${slug}`;
}
