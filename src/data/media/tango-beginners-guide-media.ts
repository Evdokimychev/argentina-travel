/**
 * Media manifest for /blog/tango-beginners-guide.
 *
 * Every photographic entry here is a **project-generated illustration**
 * (text-to-image, 2026-07-25) — no external stock license is required and no
 * real, identifiable person is depicted. No text/labels are baked into any
 * image; captions and any wording live in HTML so they stay accessible and
 * localizable.
 *
 * The `ronda` movement diagram is a separate inline SVG/HTML widget
 * (TangoRondaDiagram) — it has no raster asset and no license.
 *
 * Do not add externally-sourced stock photos here without a matching
 * stock-cache.json / media-rights-register.csv record.
 */

export interface TangoGuideImageAsset {
  kind: "generated";
  key: string;
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  /** md5 of the file — tests use it to catch accidental re-duplication. */
  contentHash: string;
  generator: string;
}

export interface TangoGuideHtmlVisual {
  kind: "html";
  key: string;
  componentName: string;
  description: string;
}

export type TangoGuideMediaAsset = TangoGuideImageAsset | TangoGuideHtmlVisual;

const GENERATOR =
  "Project-generated illustration (text-to-image), 2026-07-25 — no external stock license, no identifiable real person, no baked-in text.";

/**
 * hero — post header image (via BLOG_SLUG_HERO_OVERRIDES / blog-post-image-bindings).
 * Kept here too so the "no hero duplicate in body" test has one source of truth.
 */
export const TANGO_GUIDE_MEDIA = {
  hero: {
    kind: "generated",
    key: "hero",
    src: "/media/blog/tango-beginners-guide/hero.jpg",
    alt: "Социальная милонга в салоне Буэнос-Айреса: несколько взрослых пар танцуют на общем деревянном танцполе",
    caption:
      "Социальная милонга — вечер, где обычные люди танцуют друг с другом, а не выступают для зрителей.",
    width: 1536,
    height: 1024,
    contentHash: "71fd02cd7183d25ecef1b5c710b71aef",
    generator: GENERATOR,
  },
  lesson: {
    kind: "generated",
    key: "lesson",
    src: "/media/blog/tango-beginners-guide/lesson.jpg",
    alt: "Групповое занятие танго для начинающих в светлой студии: преподаватель показывает позицию небольшой группе взрослых учеников",
    caption:
      "Вводное занятие перед милонгой — самый удобный способ познакомиться с пространством и базовым шагом.",
    width: 1536,
    height: 1024,
    contentHash: "d6e658427e69fb57692464e51558ad03",
    generator: GENERATOR,
  },
  show: {
    kind: "generated",
    key: "show",
    src: "/media/blog/tango-beginners-guide/show.jpg",
    alt: "Сценическое танго-шоу: профессиональная пара исполняет постановку под театральным светом",
    caption:
      "Танго-шоу — сценический жанр для зрителей. Другая задача, чем у социальной милонги, но не «ненастоящее» танго.",
    width: 1536,
    height: 1024,
    contentHash: "d175ba140a4be6184f74012d4dd3c3f7",
    generator: GENERATOR,
  },
  milongaFloor: {
    kind: "generated",
    key: "milongaFloor",
    src: "/media/blog/tango-beginners-guide/milonga-floor.jpg",
    alt: "Социальный танцпол милонги сверху и сбоку: пары движутся по общему кругу (ronda) в зале",
    caption:
      "На милонге пары движутся по общему потоку — ronda. Одежда повседневно-нарядная, а не сценический костюм.",
    width: 1536,
    height: 1024,
    contentHash: "c96d11eb6a0b21116efa573eaf0a594d",
    generator: GENERATOR,
  },
  shoes: {
    kind: "generated",
    key: "shoes",
    src: "/media/blog/tango-beginners-guide/shoes.jpg",
    alt: "Крупный план простой танцевальной обуви с фиксацией пятки на деревянном полу во время базового шага танго",
    caption:
      "Для первого урока достаточно чистой устойчивой обуви с фиксацией пятки. Профессиональные туфли покупать заранее не нужно.",
    width: 1536,
    height: 1024,
    contentHash: "b9c0f313db32eb4660a51f27b02b162a",
    generator: GENERATOR,
  },
  bandoneon: {
    kind: "generated",
    key: "bandoneon",
    src: "/media/blog/tango-beginners-guide/bandoneon.jpg",
    alt: "Музыкант играет на бандонеоне в небольшом ансамбле на милонге, тёплый приглушённый свет",
    caption:
      "Бандонеон — инструмент, вокруг которого строится звук танго. На некоторых милонгах играет живой оркестр.",
    width: 1536,
    height: 1024,
    contentHash: "c62bbc158c3b6010046185be184219f7",
    generator: GENERATOR,
  },
  salon: {
    kind: "generated",
    key: "salon",
    src: "/media/blog/tango-beginners-guide/salon.jpg",
    alt: "Интерьер исторического салона Буэнос-Айреса: старый бальный зал с колоннами, люстрами и деревянным полом",
    caption:
      "Милонги проходят в клубах, культурных центрах, исторических салонах и кафе — у каждого места свой характер.",
    width: 1536,
    height: 1024,
    contentHash: "1243fd0257bd88f66e6ff37f4e5a21a3",
    generator: GENERATOR,
  },
  rondaDiagram: {
    kind: "html",
    key: "rondaDiagram",
    componentName: "TangoRondaDiagram",
    description:
      "Accessible inline SVG/HTML diagram of the ronda: lanes moving counter-clockwise, a safe entry point and the centre zone not to cross. All labels stay as HTML text, responsive and dark-mode aware — never a text PNG.",
  },
} satisfies Record<string, TangoGuideMediaAsset>;

export const TANGO_GUIDE_IMAGE_ASSETS: TangoGuideImageAsset[] = Object.values(
  TANGO_GUIDE_MEDIA,
).filter((asset): asset is TangoGuideImageAsset => asset.kind === "generated");

/** Content hashes currently in use — new image assets must not repeat one of these. */
export const TANGO_GUIDE_MEDIA_HASHES = TANGO_GUIDE_IMAGE_ASSETS.map(
  (asset) => asset.contentHash,
);
