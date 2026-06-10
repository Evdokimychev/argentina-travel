export type BackgroundTone = "light" | "dark";

const DARK_LUMINANCE_THRESHOLD = 0.42;

function parseRgba(color: string): [number, number, number, number] | null {
  const match = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] !== undefined ? Number(match[4]) : 1];
}

function relativeLuminance(red: number, green: number, blue: number): number {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

function toneFromLuminance(luminance: number): BackgroundTone {
  return luminance < DARK_LUMINANCE_THRESHOLD ? "dark" : "light";
}

function readExplicitTone(element: Element | null): BackgroundTone | null {
  let node: Element | null = element;
  while (node) {
    const tone = node.getAttribute("data-scroll-rail-tone");
    if (tone === "dark" || tone === "light") return tone;
    node = node.parentElement;
  }
  return null;
}

/** Effective background tone at viewport coordinates (ignores `exclude` for hit-testing). */
export function getBackgroundToneAt(
  x: number,
  y: number,
  exclude?: HTMLElement | null
): BackgroundTone {
  if (typeof document === "undefined") return "light";

  const previousPointerEvents = exclude?.style.pointerEvents;
  if (exclude) exclude.style.pointerEvents = "none";

  const hit = document.elementFromPoint(x, y);

  if (exclude) {
    exclude.style.pointerEvents = previousPointerEvents ?? "";
  }

  const explicit = readExplicitTone(hit);
  if (explicit) return explicit;

  let node: Element | null = hit;
  while (node && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const rgba = parseRgba(style.backgroundColor);

    if (rgba && rgba[3] > 0.08) {
      const luminance = relativeLuminance(rgba[0], rgba[1], rgba[2]);
      if (rgba[3] >= 0.92) return toneFromLuminance(luminance);
      if (rgba[3] >= 0.35) return toneFromLuminance(luminance);
    }

    node = node.parentElement;
  }

  const bodyRgba = parseRgba(window.getComputedStyle(document.body).backgroundColor);
  if (bodyRgba) {
    return toneFromLuminance(relativeLuminance(bodyRgba[0], bodyRgba[1], bodyRgba[2]));
  }

  return "light";
}
