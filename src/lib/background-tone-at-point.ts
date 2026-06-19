export type BackgroundTone = "light" | "dark";

const DARK_LUMINANCE_THRESHOLD = 0.42;
const TONE_ATTRS = ["data-scroll-rail-tone", "data-surface-tone"] as const;

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
    for (const attr of TONE_ATTRS) {
      const tone = node.getAttribute(attr);
      if (tone === "dark" || tone === "light") return tone;
    }
    node = node.parentElement;
  }
  return null;
}

function isFloatingChrome(element: Element): boolean {
  return element instanceof HTMLElement && element.dataset.floatingChrome === "true";
}

function isMediaElement(element: Element): boolean {
  const tag = element.tagName;
  return tag === "IMG" || tag === "VIDEO" || tag === "PICTURE" || tag === "CANVAS";
}

function findSurfaceElementAt(
  x: number,
  y: number,
  exclude?: HTMLElement | null
): Element | null {
  if (typeof document.elementsFromPoint === "function") {
    for (const element of document.elementsFromPoint(x, y)) {
      if (exclude && (element === exclude || exclude.contains(element))) continue;
      if (isFloatingChrome(element)) continue;
      return element;
    }
    return null;
  }

  const previousPointerEvents = exclude?.style.pointerEvents;
  if (exclude) exclude.style.pointerEvents = "none";

  const hit = document.elementFromPoint(x, y);

  if (exclude) {
    exclude.style.pointerEvents = previousPointerEvents ?? "";
  }

  return hit;
}

function resolveToneFromElement(hit: Element | null): BackgroundTone {
  if (!hit) return "light";

  let node: Element | null = hit;
  let sawMedia = false;

  while (node && node !== document.documentElement) {
    const explicit = readExplicitTone(node);
    if (explicit) return explicit;

    if (isMediaElement(node)) sawMedia = true;

    const rgba = parseRgba(window.getComputedStyle(node).backgroundColor);
    if (rgba && rgba[3] > 0.08) {
      const luminance = relativeLuminance(rgba[0], rgba[1], rgba[2]);
      if (rgba[3] >= 0.35) return toneFromLuminance(luminance);
    }

    node = node.parentElement;
  }

  if (sawMedia) return "dark";

  const bodyRgba = parseRgba(window.getComputedStyle(document.body).backgroundColor);
  if (bodyRgba) {
    return toneFromLuminance(relativeLuminance(bodyRgba[0], bodyRgba[1], bodyRgba[2]));
  }

  return "light";
}

/** Effective background tone at viewport coordinates (ignores floating chrome for hit-testing). */
export function getBackgroundToneAt(
  x: number,
  y: number,
  exclude?: HTMLElement | null
): BackgroundTone {
  if (typeof document === "undefined") return "light";
  return resolveToneFromElement(findSurfaceElementAt(x, y, exclude));
}

/** Sample background tone behind a floating element (multiple points, majority vote). */
export function sampleElementBackgroundTone(
  element: HTMLElement,
  exclude?: HTMLElement | null
): BackgroundTone {
  const rect = element.getBoundingClientRect();
  const excluded = exclude ?? element;
  const samplePoints: [number, number][] = [
    [rect.left + rect.width / 2, rect.top + rect.height / 2],
    [rect.right + 8, rect.top + rect.height / 2],
    [rect.left + rect.width / 2, rect.top + 4],
    [rect.left + rect.width / 2, rect.bottom - 4],
  ];

  const tones = samplePoints
    .filter(([x, y]) => x >= 0 && x <= window.innerWidth && y >= 0 && y <= window.innerHeight)
    .map(([x, y]) => getBackgroundToneAt(x, y, excluded));

  if (tones.length === 0) return "light";

  const darkVotes = tones.filter((tone) => tone === "dark").length;
  return darkVotes >= Math.ceil(tones.length / 2) ? "dark" : "light";
}
