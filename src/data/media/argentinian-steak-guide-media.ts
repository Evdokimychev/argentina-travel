/**
 * Media manifest for /blog/argentinian-steak-guide.
 *
 * Every entry is either:
 *  - a licensed photo already downloaded to public/media/blog/argentinian-steak-guide/
 *    with author/source/license recorded in src/data/media-library/stock-cache.json
 *    and docs/content-overhaul/media-rights-register.csv, or
 *  - a neutral, non-photographic HTML/SVG visual (no external asset, no license needed).
 *
 * Do not add new photo entries here without a matching stock-cache.json /
 * media-rights-register.csv record — see docs/integrations for the media pipeline.
 */

export type SteakGuideMediaLicense = "Pexels License" | "Unsplash License";

export interface SteakGuidePhotoAsset {
  kind: "photo";
  key: string;
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  author: string;
  authorUrl: string;
  sourceUrl: string;
  license: SteakGuideMediaLicense;
  /** md5 of the downloaded file — used by tests to catch accidental re-duplication. */
  contentHash: string;
}

/**
 * Non-photographic visual (inline SVG / HTML component). No file, no license —
 * text stays in the DOM instead of being baked into a raster.
 */
export interface SteakGuideHtmlVisual {
  kind: "html";
  key: string;
  componentName: string;
  description: string;
}

/**
 * Project-generated illustration (AI-generated raster, no external stock license).
 * No text/numbers/labels are baked in — those stay in HTML overlays so they remain
 * accessible, editable and localizable. Regions/positions are decorative and
 * approximate; see the disclaimer copy shown alongside it in the UI.
 */
export interface SteakGuideIllustrationAsset {
  kind: "illustration";
  key: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  /** md5 of the file — used by tests to catch accidental re-duplication. */
  contentHash: string;
  generator: string;
  note: string;
}

export type SteakGuideMediaAsset =
  | SteakGuidePhotoAsset
  | SteakGuideHtmlVisual
  | SteakGuideIllustrationAsset;

/**
 * hero — post header image (BlogPostHeroImage via blog-post-image-bindings.ts).
 * Kept here too so the "no hero duplicate in body" test has one source of truth.
 */
export const STEAK_GUIDE_MEDIA = {
  hero: {
    kind: "photo",
    key: "hero",
    src: "/media/blog/argentinian-steak-guide/hero.jpg",
    alt: "Асадо а-ла-крус: рёбра и мясо жарятся на решётке над открытым огнём",
    caption: "Фото: Andres Idda Bianchi / Pexels",
    width: 6000,
    height: 4000,
    author: "Andres Idda Bianchi",
    authorUrl: "https://www.pexels.com/@davincidelasfotos",
    sourceUrl: "https://www.pexels.com/photo/traditional-argentine-asado-barbecue-cooking-37126416/",
    license: "Pexels License",
    contentHash: "b9b4ac0de052654dd5b6a76dd73dcb71",
  },
  parrillaProcess: {
    kind: "photo",
    key: "parrillaProcess",
    src: "/media/blog/argentinian-steak-guide/section-1.jpg",
    alt: "Раскалённые угли и дрова под решёткой parrilla — жар для медленного asado",
    caption: "Угли под решёткой parrilla — жар для медленного asado. Фото: Alex Dos Santos / Pexels",
    width: 6016,
    height: 3760,
    author: "Alex Dos Santos",
    authorUrl: "https://www.pexels.com/@alex-dos-santos-305643819",
    sourceUrl: "https://www.pexels.com/photo/traditional-argentine-asado-fire-in-uribelarrea-37057980/",
    license: "Pexels License",
    contentHash: "e02dc11fcdb1095c1d1f10d073f8c1c4",
  },
  cutsGallery: {
    kind: "photo",
    key: "cutsGallery",
    src: "/media/blog/argentinian-steak-guide/cuts-gallery.jpg",
    alt: "Сырые отрубы говядины приправляют крупной солью и травами перед parrilla",
    caption: "Мясо приправляют непосредственно перед грилем. Фото: Benjamin R. / Unsplash",
    width: 1920,
    height: 1280,
    author: "Benjamin R.",
    authorUrl: "https://unsplash.com/@dapperprofessional",
    sourceUrl: "https://unsplash.com/photos/6_1Pt6p64MA",
    license: "Unsplash License",
    contentHash: "59344ceb91baf02028c10f829333fe16",
  },
  saucesGallery: {
    kind: "photo",
    key: "saucesGallery",
    src: "/media/blog/argentinian-steak-guide/sauces.jpg",
    alt: "Соус chimichurri в тарелке рядом с вилкой и ножом",
    caption: "Chimichurri — один из двух основных соусов аргентинской parrilla. Фото: Gera Cejas / Pexels",
    width: 4962,
    height: 3684,
    author: "Gera Cejas",
    authorUrl: "https://www.pexels.com/@gera-cejas-3616330",
    sourceUrl: "https://www.pexels.com/photo/traditional-argentine-chimichurri-sauce-on-table-37049896/",
    license: "Pexels License",
    contentHash: "fafe46b38d73e536fd96d8cb59b5c271",
  },
  meatPlatter: {
    kind: "photo",
    key: "meatPlatter",
    src: "/media/blog/argentinian-steak-guide/meat-platter.jpg",
    alt: "Ассорти из мяса, колбасок и картофеля фри на общем блюде",
    caption: "Большая порция на компанию — уточняйте состав перед заказом. Фото: Boris Hamer / Pexels",
    width: 5973,
    height: 4480,
    author: "Boris Hamer",
    authorUrl: "https://www.pexels.com/@borishamer",
    sourceUrl: "https://www.pexels.com/photo/meal-on-tray-16014227/",
    license: "Pexels License",
    contentHash: "83fb23b9bdcb7211f6b2f9916f3773d4",
  },
  slicedSteak: {
    kind: "photo",
    key: "slicedSteak",
    src: "/media/blog/argentinian-steak-guide/sliced-steak.jpg",
    alt: "Нарезанный стейк с розовым центром на сковороде",
    caption:
      "Иллюстрация текстуры среза — не эталон конкретной степени прожарки. Фото: Sebastian Doll / Unsplash",
    width: 1920,
    height: 1280,
    author: "Sebastian Doll",
    authorUrl: "https://unsplash.com/@sebastiandoll",
    sourceUrl: "https://unsplash.com/photos/wxt4m8ECpgM",
    license: "Unsplash License",
    contentHash: "251e03c2b9ecb59d6382c4f2e03e982a",
  },
  grillFlames: {
    kind: "photo",
    key: "grillFlames",
    src: "/media/blog/argentinian-steak-guide/grill-flames.jpg",
    alt: "Мясо и перец на решётке parrilla на фоне открытого огня",
    caption: "Решётка parrilla над открытым огнём. Фото: Mike Kotsch / Unsplash",
    width: 1920,
    height: 1280,
    author: "Mike Kotsch",
    authorUrl: "https://unsplash.com/@mikekotsch",
    sourceUrl: "https://unsplash.com/photos/vn4obEjdFPs",
    license: "Unsplash License",
    contentHash: "21cffcd490f5ce652cc9275e95a3cf24",
  },
  cutsDiagram: {
    kind: "illustration",
    key: "cutsDiagram",
    src: "/media/blog/argentinian-steak-guide/cow-diagram.png",
    alt: "Реалистичная иллюстрация бычка в профиль с цветными зонами основных отрубов",
    width: 1536,
    height: 1024,
    contentHash: "e31d461d83d9e1d04f0ecda4b47d9b08",
    generator: "Project-generated illustration (text-to-image), 2026-07-25 — no external stock license required.",
    note:
      "Coloured cut regions are decorative/approximate and baked into the illustration; numbered pins, leader lines, cut names and descriptions are separate HTML overlays rendered by SteakCutDiagram, not baked into the image.",
  },
  doneness: {
    kind: "html",
    key: "doneness",
    componentName: "SteakDonenessScale",
    description:
      "CSS gradient doneness meter (jugoso → a punto → bien cocido); term labels are HTML text rendered next to the gradient.",
  },
} satisfies Record<string, SteakGuideMediaAsset>;

export const STEAK_GUIDE_PHOTO_ASSETS: SteakGuidePhotoAsset[] = Object.values(
  STEAK_GUIDE_MEDIA,
).filter((asset): asset is SteakGuidePhotoAsset => asset.kind === "photo");

/** Content hashes currently in use — new photo assets must not repeat one of these. */
export const STEAK_GUIDE_MEDIA_HASHES = STEAK_GUIDE_PHOTO_ASSETS.map(
  (asset) => asset.contentHash,
);
