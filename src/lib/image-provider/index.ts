export type {
  ImageRole,
  ImageQuery,
  ResolvedImage,
  ImageAttribution,
  ImageSourceKind,
} from "./types";

export { ROLE_WIDTHS, ROLE_SIZES, widthForRole, sizesForRole } from "./sizes";
export { generateImageAlt, generateImageTitle, generateImageDescription } from "./seo";
export {
  buildSearchQuery,
  buildImageQuery,
  buildDestinationCardQueries,
  type QueryBuilderInput,
} from "./query-builder";
export { resolveFromWikimedia, findWikimediaAssets, listWikimediaByPlace } from "./wikimedia-fallback";
export {
  searchWikimedia,
  toWikimediaAttribution,
  WIKIMEDIA_MIN_WIDTH,
  WIKIMEDIA_PREFERRED_WIDTH,
  type WikimediaSearchResult,
} from "./wikimedia-client";

export {
  resolvePageImages,
  getHeroImage,
  getGalleryImages,
  getSectionImage,
  getContentImage,
  getBackgroundImage,
  getCardImage,
  getHeroSrc,
  getHeroAlt,
  imageSizesForRole,
  listRegisteredPages,
  type PageImages,
  type ResolvePageImagesOptions,
} from "./image-provider";

export { getPageEntry, getAllPageEntries, resolvePageIdFromRoute } from "./page-registry";
export { mediaAssetToResolved, resolveFromManifestBinding } from "./local-fallback";
export { resolveSlotAssetId } from "./slot-ids";
