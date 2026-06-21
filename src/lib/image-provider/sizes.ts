import type { ImageRole } from "./types";

/** Target pixel widths per role for downloads and next/image. */
export const ROLE_WIDTHS: Record<ImageRole, number> = {
  hero: 1920,
  gallery: 1400,
  content: 1200,
  section: 1200,
  card: 800,
  background: 1600,
};

/** next/image `sizes` attribute strings per role. */
export const ROLE_SIZES: Record<ImageRole, string> = {
  hero: "100vw",
  gallery: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  content: "(max-width: 768px) 100vw, 50vw",
  section: "(max-width: 768px) 100vw, 50vw",
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  background: "100vw",
};

export function widthForRole(role: ImageRole): number {
  return ROLE_WIDTHS[role];
}

export function sizesForRole(role: ImageRole): string {
  return ROLE_SIZES[role];
}
