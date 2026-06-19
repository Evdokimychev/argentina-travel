/** Aviasales WL injects a global reset inside `@layer isolation` that targets `html, body, div, …`. */
export const AVIASALES_WL_STYLE_ATTR = "data-style-id";
export const AVIASALES_WL_STYLE_ID = "travelpayouts-css";

/**
 * Strip unscoped reset rules from the Aviasales stylesheet while keeping widget-scoped rules
 * (`:host`, `#tpwl-search`, `#tpwl-tickets`, `#tpwl-modals`, component modules).
 */
export function sanitizeAviasalesGlobalStyles(css: string): string {
  const layerStart = css.indexOf("@layer isolation{");
  if (layerStart === -1) return css;

  const contentStart = layerStart + "@layer isolation{".length;
  const hostStart = css.indexOf(":host", contentStart);
  const tpwlStart = css.indexOf("#tpwl-search{", contentStart);
  const keepFrom =
    hostStart !== -1 && (tpwlStart === -1 || hostStart <= tpwlStart) ? hostStart : tpwlStart;

  if (keepFrom === -1 || keepFrom <= contentStart) return css;

  return css.slice(0, contentStart) + css.slice(keepFrom);
}

export function sanitizeAviasalesStyleElement(styleEl: HTMLStyleElement): boolean {
  if (styleEl.dataset.sanitized === "true") return false;

  const original = styleEl.textContent ?? "";
  const sanitized = sanitizeAviasalesGlobalStyles(original);
  if (sanitized === original) return false;

  styleEl.textContent = sanitized;
  styleEl.dataset.sanitized = "true";
  return true;
}

export function sanitizeAviasalesInjectedStyles(): boolean {
  const styleEl = document.querySelector<HTMLStyleElement>(
    `style[${AVIASALES_WL_STYLE_ATTR}="${AVIASALES_WL_STYLE_ID}"]`,
  );
  if (!styleEl) return false;
  return sanitizeAviasalesStyleElement(styleEl);
}

export function removeAviasalesInjectedStyles(): void {
  document
    .querySelectorAll<HTMLStyleElement>(
      `style[${AVIASALES_WL_STYLE_ATTR}="${AVIASALES_WL_STYLE_ID}"]`,
    )
    .forEach((el) => el.remove());
}
