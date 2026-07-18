type PublicGalleryImage = {
  src: string;
};

function isPublicGallerySource(src: string): boolean {
  const normalized = src.trim().split(/[?#]/, 1)[0]?.toLocaleLowerCase("en-US") ?? "";
  if (!normalized) return false;
  if (normalized.endsWith("/logo-light.svg")) return false;
  return !/(?:^|\/)(?:no[-_ ]?photo|placeholder)(?:[./_-]|$)/i.test(normalized);
}

/** Public editorial galleries fail closed instead of rendering branded/no-photo fallbacks. */
export function filterPublicGalleryImages<T extends PublicGalleryImage>(images: readonly T[]): T[] {
  return images.filter((image) => isPublicGallerySource(image.src));
}
