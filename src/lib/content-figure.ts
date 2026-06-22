export const contentFigureShellClass =
  "relative mx-auto max-w-prose overflow-hidden rounded-2xl bg-charcoal/5 ring-1 ring-gray-100";

export const CONTENT_FIGURE_SIZES = "(max-width: 768px) 100vw, 720px";
export const CONTENT_FIGURE_FALLBACK_WIDTH = 1200;
export const CONTENT_FIGURE_FALLBACK_HEIGHT = 800;

export function contentFigureDimensions(image?: { width?: number; height?: number }) {
  return {
    width: image?.width ?? CONTENT_FIGURE_FALLBACK_WIDTH,
    height: image?.height ?? CONTENT_FIGURE_FALLBACK_HEIGHT,
  };
}
