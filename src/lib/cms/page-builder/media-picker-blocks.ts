import type { BlogBodyBlock } from "@/types/blog-content-blocks";

/** Block types that can open the CMS media library from the page builder card. */
export const MEDIA_PICKER_BLOCK_TYPES = [
  "media",
  "gallery",
  "image-text",
  "author-card",
  "photo",
  "hero-banner",
] as const satisfies ReadonlyArray<BlogBodyBlock["type"]>;

export type MediaPickerBlockType = (typeof MEDIA_PICKER_BLOCK_TYPES)[number];

export function supportsMediaPicker(type: BlogBodyBlock["type"]): type is MediaPickerBlockType {
  return (MEDIA_PICKER_BLOCK_TYPES as ReadonlyArray<string>).includes(type);
}
