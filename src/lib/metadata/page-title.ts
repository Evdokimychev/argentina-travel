/** Site suffix is applied once via `title.template` in root layout. */
export const SITE_TITLE_BRAND = "Пора в Аргентину";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip legacy duplicated brand suffix from page-level titles. */
export function pageTitle(title: string, brand = SITE_TITLE_BRAND): string {
  const trimmedBrand = brand.trim();
  let result = title;

  if (trimmedBrand) {
    const escaped = escapeRegExp(trimmedBrand);
    result = result
      .replace(new RegExp(`\\s*\\|\\s*${escaped}\\s*$`, "u"), "")
      .replace(new RegExp(`\\s*[—–-]\\s*${escaped}\\s*$`, "u"), "");
  }

  return result
    .replace(/\s*[—–-]\s*форум «Пора в Аргентину»\s*$/u, " — форум")
    .trim();
}
