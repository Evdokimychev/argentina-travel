/**
 * Media manifest for /blog/patagonia-packing-list.
 *
 * Every photo entry has rights metadata for media:rights:check.
 * Hero is header-only — never reuse hero.src in body blocks.
 */

export type PackingMediaLicense =
  | "Pexels License"
  | "Unsplash License"
  | "Public domain"
  | "Argentina.travel / INPROTUR — указать источник на сайте"
  | "CC BY-SA / CC BY (Wikimedia Commons)";

export interface PackingPhotoAsset {
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
  license: PackingMediaLicense;
  contentHash: string;
  focalPoint?: { x: number; y: number };
}

export const PATAGONIA_PACKING_MEDIA = {
  hero: {
    kind: "photo",
    key: "hero",
    src: "/media/blog/patagonia-packing-list/hero.jpg",
    alt: "Путешественник в многослойной одежде на горном маршруте Патагонии",
    caption: "Фото: Marina Zvada / Pexels",
    width: 4032,
    height: 3024,
    author: "Marina Zvada",
    authorUrl: "https://www.pexels.com/@marina-zvada-844583049",
    sourceUrl: "https://www.pexels.com/photo/man-hiking-in-mountains-23669561/",
    license: "Pexels License",
    contentHash: "d196324e29c6bb35196f48ac4bc51dfb",
    focalPoint: { x: 0.5, y: 0.42 },
  },
  trailHiker: {
    kind: "photo",
    key: "trailHiker",
    src: "/media/blog/patagonia-packing-list/section-1.jpg",
    alt: "Путешественник смотрит на долину с извилистой рекой — ветреный треккинг в горах",
    caption: "На открытых участках ветер и смена погоды ощущаются сильнее, чем в городе. Фото: Kelsey Wilkerson / Pexels",
    width: 3130,
    height: 2075,
    author: "Kelsey Wilkerson",
    authorUrl: "https://www.pexels.com/@kelsey-wilkerson-443975242",
    sourceUrl: "https://www.pexels.com/photo/hiker-looking-at-winding-river-in-valley-26856185/",
    license: "Pexels License",
    contentHash: "bec0cc716f1939e15297b3f702934155",
    focalPoint: { x: 0.48, y: 0.4 },
  },
  layers: {
    kind: "photo",
    key: "layers",
    src: "/media/blog/patagonia-packing-list/layers.jpg",
    alt: "Зимний комплект слоёв на склоне: утепление и внешняя оболочка в холодных условиях",
    caption: "Система слоёв помогает быстро менять теплоизоляцию. Фото: Maarten Duineveld / Unsplash",
    width: 1400,
    height: 933,
    author: "Maarten Duineveld",
    authorUrl: "https://unsplash.com/@maarten_jpg",
    sourceUrl: "https://unsplash.com/photos/man-ice-skiing-on-hill-pmfJcN7RGiw",
    license: "Unsplash License",
    contentHash: "601603cb591be2d9df94063f1c4d9dfb",
    focalPoint: { x: 0.5, y: 0.45 },
  },
  shellJacket: {
    kind: "photo",
    key: "shellJacket",
    src: "/media/blog/patagonia-packing-list/shell-jacket.jpg",
    alt: "Путешественник в ветро- и влагозащитной куртке на открытом горном участке",
    caption: "Внешняя оболочка защищает от ветра и осадков поверх остальных слоёв. Фото: INPROTUR / Visit Argentina",
    width: 1889,
    height: 1259,
    author: "INPROTUR / Visit Argentina",
    authorUrl: "https://www.argentina.travel/",
    sourceUrl:
      "https://api-inprotur-hom.turismo.gob.ar/files/uploads/1625573849110-rourzagasti_62__1_.jpg",
    license: "Argentina.travel / INPROTUR — указать источник на сайте",
    contentHash: "0123a4cdebff26217454bf6c548f38ee",
    focalPoint: { x: 0.5, y: 0.4 },
  },
  hikingBoots: {
    kind: "photo",
    key: "hikingBoots",
    src: "/media/blog/patagonia-packing-list/hiking-boots.jpg",
    alt: "Тропа под ногами — разношенная треккинговая обувь с надёжным сцеплением",
    caption: "Новые ботинки прямо из коробки — частая ошибка. Фото: Unsplash",
    width: 1400,
    height: 932,
    author: "Unsplash contributor",
    authorUrl: "https://unsplash.com/",
    sourceUrl: "https://unsplash.com/photos/1441974231531-c6227db76b6e",
    license: "Unsplash License",
    contentHash: "37377d3dc229c672c4627615a0880fb0",
    focalPoint: { x: 0.5, y: 0.55 },
  },
  daypack: {
    kind: "photo",
    key: "daypack",
    src: "/media/blog/patagonia-packing-list/daypack.jpg",
    alt: "Дневной рюкзак — компактный объём для оболочки, воды и перекуса",
    caption: "Для однодневных выходов обычно достаточно 18–30 литров. Фото: Sun Lingyan / Unsplash",
    width: 1400,
    height: 2100,
    author: "Sun Lingyan",
    authorUrl: "https://unsplash.com/@sunlingyan",
    sourceUrl: "https://unsplash.com/photos/blue-backpack-_H0fjILH5Vw",
    license: "Unsplash License",
    contentHash: "89c7922e45bb45f329df646df7a775da",
    focalPoint: { x: 0.5, y: 0.35 },
  },
  glacier: {
    kind: "photo",
    key: "glacier",
    src: "/media/blog/patagonia-packing-list/glacier.jpg",
    alt: "Ледник Перито-Морено — навигация и смотровые площадки требуют ветрозащиты",
    caption: "Возле льда ощущается холоднее, чем в городе. Фото: Maximiliano Pezzali / Pexels",
    width: 1920,
    height: 1280,
    author: "Maximiliano Pezzali",
    authorUrl: "https://www.pexels.com/",
    sourceUrl: "https://www.pexels.com/photo/perito-moreno-glacier-in-argentina-26988244/",
    license: "Pexels License",
    contentHash: "c022295b934ecd4c38d6a9ce7031dbc0",
    focalPoint: { x: 0.5, y: 0.45 },
  },
  winter: {
    kind: "photo",
    key: "winter",
    src: "/media/blog/patagonia-packing-list/winter.jpg",
    alt: "Зимний пейзаж Патагонии — снег, ветер и отдельная подготовка комплекта",
    caption: "Зима требует усиленного утепления и проверки правил маршрута. Фото: Zhenming Wang / Pexels",
    width: 1920,
    height: 1280,
    author: "Zhenming Wang",
    authorUrl: "https://www.pexels.com/",
    sourceUrl: "https://www.pexels.com/photo/scenic-mountain-stream-in-patagonian-landscape-33088312/",
    license: "Pexels License",
    contentHash: "b7d5be33c4e237bc66ff1764b6dfa3ae",
    focalPoint: { x: 0.5, y: 0.4 },
  },
  roadTrip: {
    kind: "photo",
    key: "roadTrip",
    src: "/media/blog/patagonia-packing-list/road-trip.jpg",
    alt: "Удалённая дорога Ruta 40 в Патагонии — автомобиль и аварийный комплект",
    caption: "На длинных перегонах важны топливо, офлайн-карты и тёплый аварийный набор. Фото: Paolo Petrignani / INPROTUR",
    width: 2339,
    height: 1556,
    author: "Paolo Petrignani / INPROTUR",
    authorUrl: "https://www.argentina.travel/",
    sourceUrl:
      "https://api-inprotur-hom.turismo.gob.ar/files/uploads/1626960953393-ruta_40_en_la_patagonia___ph_paolo_petrignani.jpg",
    license: "Argentina.travel / INPROTUR — указать источник на сайте",
    contentHash: "ea3523b8a68868bcd6e1f7ed08721680",
    focalPoint: { x: 0.5, y: 0.45 },
  },
  regionCalafate: {
    kind: "photo",
    key: "regionCalafate",
    src: "/media/places/el-calafate/hero.jpg",
    alt: "Эль-Калафате — база для поездок к Перито-Морено",
    caption: "Фото: Wikimedia Commons",
    width: 2560,
    height: 1918,
    author: "Wikimedia Commons contributors",
    authorUrl: "https://commons.wikimedia.org/",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/3/33/El_Calafate_%2825825005237%29.jpg",
    license: "CC BY-SA / CC BY (Wikimedia Commons)",
    contentHash: "8a25beb542b945af930bbaeb8de4e1a0",
    focalPoint: { x: 0.5, y: 0.45 },
  },
  regionChalten: {
    kind: "photo",
    key: "regionChalten",
    src: "/media/places/el-chalten/gallery-1.jpg",
    alt: "Эль-Чальтен — однодневные треки и переменчивая погода",
    caption: "Фото: Wikimedia Commons",
    width: 2560,
    height: 1563,
    author: "Wikimedia Commons contributors",
    authorUrl: "https://commons.wikimedia.org/",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/4/47/El_Chalt%C3%A9n.jpg",
    license: "CC BY-SA / CC BY (Wikimedia Commons)",
    contentHash: "9399c606e9e3d7bf0e16873b2d8caad2",
    focalPoint: { x: 0.5, y: 0.4 },
  },
  regionUshuaia: {
    kind: "photo",
    key: "regionUshuaia",
    src: "/media/places/ushuaia/hero.jpg",
    alt: "Ушуая — город, пролив Бигль и национальный парк Огненная Земля",
    caption: "Фото: Wikimedia Commons",
    width: 2560,
    height: 1440,
    author: "Wikimedia Commons contributors",
    authorUrl: "https://commons.wikimedia.org/",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Ushuaia_aerial_panorama.jpg",
    license: "CC BY-SA / CC BY (Wikimedia Commons)",
    contentHash: "edf64e845d6eb3af4afb6beb2fc39027",
    focalPoint: { x: 0.5, y: 0.4 },
  },
  regionBariloche: {
    kind: "photo",
    key: "regionBariloche",
    src: "/media/places/bariloche/hero.jpg",
    alt: "Барилоче и Озёрный край — лето, треки и зимний сезон",
    caption: "Фото: Wikimedia Commons",
    width: 2560,
    height: 1707,
    author: "Wikimedia Commons contributors",
    authorUrl: "https://commons.wikimedia.org/",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c6/San_Carlos_de_Bariloche.jpg",
    license: "CC BY-SA / CC BY (Wikimedia Commons)",
    contentHash: "f2d8dc624ec86641539d0d471977c16b",
    focalPoint: { x: 0.5, y: 0.4 },
  },
  regionValdes: {
    kind: "photo",
    key: "regionValdes",
    src: "/media/places/valdes-peninsula/hero.jpg",
    alt: "Атлантическая Патагония — полуостров Вальдес",
    caption: "Фото: Wikimedia Commons",
    width: 2560,
    height: 1707,
    author: "Wikimedia Commons contributors",
    authorUrl: "https://commons.wikimedia.org/",
    sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Southern_right_whale.jpg",
    license: "CC BY-SA / CC BY (Wikimedia Commons)",
    contentHash: "98bda8bc85976efa16b591000dcad256",
    focalPoint: { x: 0.5, y: 0.45 },
  },
} as const satisfies Record<string, PackingPhotoAsset>;

export type PackingMediaKey = keyof typeof PATAGONIA_PACKING_MEDIA;
