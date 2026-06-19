/** Site suffix is applied once via `title.template` in root layout. */
export const SITE_TITLE_BRAND = "Пора в Аргентину";

/** Strip legacy duplicated brand suffix from page-level titles. */
export function pageTitle(title: string): string {
  return title
    .replace(/\s*\|\s*Пора в Аргентину\s*$/u, "")
    .replace(/\s*[—–-]\s*Пора в Аргентину\s*$/u, "")
    .replace(/\s*[—–-]\s*форум «Пора в Аргентину»\s*$/u, " — форум")
    .trim();
}
