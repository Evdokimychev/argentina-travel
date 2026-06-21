/**
 * Hero stock slots for editorial override slugs (S8).
 * @see src/data/blog-editorial/
 */
import { blogHeroLocalPath, blogMediaFolder } from "./blog-slug-media-path.mjs";

const PATAGONIA_COPY = "media/places/el-chalten/hero.jpg";
const PATAGONIA_QUERY = "Patagonia Fitz Roy El Chalten mountains Argentina trekking";
const MONEY_COPY = "media/blog/blue-dollar-argentina-2026/hero.jpg";
const BA_COPY = "media/blog/buenos-aires-neighborhoods/hero.jpg";
const IGUazu_COPY = "media/blog/iguazu-za-3-dnya/hero.jpg";
const NW_COPY = "media/blog/salta-i-severo-zapad-marshrut/hero.jpg";

/** @typedef {import('./stock-media-entities.mjs').StockMediaSlot} StockMediaSlot */

/**
 * @param {string} slug
 * @param {Partial<StockMediaSlot> & { alt: string }} spec
 * @returns {StockMediaSlot}
 */
function editorialHero(slug, spec) {
  const folder = blogMediaFolder(slug);
  return {
    id: `blog-${folder}-hero`,
    blogPostSlug: slug,
    query: spec.query ?? PATAGONIA_QUERY,
    wikimediaQuery: spec.wikimediaQuery,
    preferWikimedia: spec.preferWikimedia,
    copyFrom: spec.copyFrom ?? PATAGONIA_COPY,
    fallbackIds: spec.fallbackIds ?? ["1506905925346-21bda4d32df4"],
    role: "hero",
    category: spec.category ?? "blog-article",
    alt: spec.alt,
    localPath: blogHeroLocalPath(slug),
  };
}

/** @type {StockMediaSlot[]} */
export const BLOG_EDITORIAL_HERO_SLOTS = [
  // ── Patagonia editorial (22) ──
  editorialHero("patagonia-советы-новичкам", {
    alt: "Патагония для новичков — горы и тропы у Эль-Чалтена",
    query: "Patagonia beginner travel El Chalten Fitz Roy trail Argentina",
    copyFrom: "media/blog/patagonia-packing-list/hero.jpg",
  }),
  editorialHero("patagonia-бюджет", {
    alt: "Патагония: бюджет поездки — ледники и горные пейзажи",
    query: "Patagonia travel budget glacier mountains Argentina",
    copyFrom: "media/blog/patagoniya-marshrut-14-dney/hero.jpg",
  }),
  editorialHero("patagonia-с-ребёнком", {
    alt: "Патагония с ребёнком — семейный маршрут у озёр и гор",
    query: "Patagonia family travel children lake Bariloche Argentina",
    copyFrom: "media/places/bariloche/hero.jpg",
    category: "family",
  }),
  editorialHero("patagonia-зимой", {
    alt: "Патагония зимой — снежные горы и ледник Перито-Морено",
    query: "Patagonia winter snow Perito Moreno glacier Argentina",
    wikimediaQuery: "Perito Moreno Glacier winter Argentina",
    preferWikimedia: true,
    copyFrom: "media/places/perito-moreno-glacier/hero.jpg",
  }),
  editorialHero("patagonia-весной", {
    alt: "Патагония весной — пробуждение природы у Фиц Роя",
    query: "Patagonia spring Fitz Roy mountains flowers Argentina",
    copyFrom: "media/places/fitz-roy/hero.jpg",
  }),
  editorialHero("patagonia-летом", {
    alt: "Патагония летом — треккинг и длинный световой день",
    query: "Patagonia summer hiking trail sunny Argentina mountains",
    copyFrom: PATAGONIA_COPY,
  }),
  editorialHero("patagonia-осенью", {
    alt: "Патагония осенью — золотые травы и облака у гор",
    query: "Patagonia autumn golden grass mountains Argentina",
    copyFrom: "media/places/los-glaciares-national-park/hero.jpg",
  }),
  editorialHero("patagonia-с-гидом", {
    alt: "Патагония с гидом — групповой треккинг в национальном парке",
    query: "Patagonia guided trekking group tour Argentina glacier",
    copyFrom: "media/blog/wildlife-s-gidom/hero.jpg",
  }),
  editorialHero("patagonia-самостоятельно", {
    alt: "Патагония самостоятельно — автономный маршрут по Ruta 40",
    query: "Patagonia solo travel Ruta 40 road Argentina backpacker",
    copyFrom: "media/blog/patagonia-arenda-avto/hero.jpg",
  }),
  editorialHero("patagonia-чек-лист", {
    alt: "Чек-лист для поездки в Патагонию — снаряжение и документы",
    query: "Patagonia packing hiking gear backpack Argentina travel",
    copyFrom: "media/blog/patagonia-packing-list/hero.jpg",
  }),
  editorialHero("patagonia-ошибки", {
    alt: "Типичные ошибки в Патагонии — ветер и горные тропы",
    query: "Patagonia windy trail hiker mountains Argentina caution",
    copyFrom: PATAGONIA_COPY,
  }),
  editorialHero("patagonia-фото", {
    alt: "Фотосъёмка в Патагонии — рассвет у Cerro Fitz Roy",
    query: "Fitz Roy sunrise photography Patagonia Argentina landscape",
    wikimediaQuery: "Fitz Roy sunrise El Chalten Argentina",
    preferWikimedia: true,
    copyFrom: "media/places/fitz-roy/hero.jpg",
  }),
  editorialHero("patagonia-за-3-дня", {
    alt: "Патагония за 3 дня — ледник Перито-Морено крупным планом",
    query: "Perito Moreno glacier 3 days El Calafate Argentina",
    copyFrom: "media/places/perito-moreno-glacier/hero.jpg",
  }),
  editorialHero("patagonia-за-5-дней", {
    alt: "Патагония за 5 дней — связка Калафате и Эль-Чалтен",
    query: "El Calafate El Chalten 5 days Patagonia Argentina itinerary",
    copyFrom: "media/places/el-calafate/hero.jpg",
  }),
  editorialHero("patagonia-за-7-дней", {
    alt: "Патагония за 7 дней — озёра и горы Лago Argentino",
    query: "Patagonia 7 days lake mountains Argentina scenic",
    copyFrom: "media/places/el-calafate/gallery-1.jpg",
  }),
  editorialHero("patagonia-за-10-дней", {
    alt: "Патагония за 10 дней — ледники, тропы и побережье",
    query: "Patagonia 10 days glacier coast mountains Argentina",
    copyFrom: "media/blog/patagoniya-marshrut-14-dney/hero.jpg",
  }),
  editorialHero("patagonia-за-14-дней", {
    alt: "Патагония за 14 дней — полный маршрут от ледников до Ушуайи",
    query: "Patagonia 14 days Ushuaia glacier complete route Argentina",
    copyFrom: "media/blog/patagoniya-marshrut-14-dney/hero.jpg",
  }),
  editorialHero("patagonia-camping", {
    alt: "Кемпинг в Патагонии — палатка у горного озера",
    query: "Patagonia camping tent lake mountains Argentina wilderness",
    copyFrom: "media/places/el-chalten/gallery-2.jpg",
  }),
  editorialHero("patagonia-ветер", {
    alt: "Ветер в Патагонии — облака над степью и горами",
    query: "Patagonia strong wind clouds steppe mountains Argentina",
    copyFrom: PATAGONIA_COPY,
  }),
  editorialHero("patagonia-холод", {
    alt: "Холод в Патагонии — снежные вершины и ледник",
    query: "Patagonia cold weather snow peaks glacier Argentina",
    copyFrom: "media/places/perito-moreno-glacier/hero.jpg",
  }),
  editorialHero("patagonia-mini-trekking", {
    alt: "Мини-треккинг в Патагонии — короткие маршруты у Фиц Роя",
    query: "Patagonia short day hike trail Fitz Roy Argentina",
    copyFrom: "media/blog/el-chalten-i-fitts-roy/hero.jpg",
  }),
  editorialHero("patagonia-с-чем-совмещать", {
    alt: "Что совмещать с Патагонией — Буэнос-Айрес и юг Аргентины",
    query: "Argentina travel Buenos Aires Patagonia combined itinerary",
    copyFrom: "media/places/buenos-aires/hero.jpg",
    category: "city",
  }),

  // ── Money editorial (4 missing; money-карты already in main list) ──
  editorialHero("money-наличные", {
    alt: "Наличные в Аргентине — обмен долларов и песо",
    query: "Argentine peso cash money exchange Buenos Aires",
    copyFrom: MONEY_COPY,
    category: "city",
  }),
  editorialHero("money-бюджет", {
    alt: "Бюджет поездки в Аргентину — расходы туриста",
    query: "Argentina travel budget expenses tourist Buenos Aires",
    copyFrom: MONEY_COPY,
  }),
  editorialHero("money-советы-новичкам", {
    alt: "Деньги в Аргентине для новичков — карты и наличные",
    query: "Argentina money tips tourist payment cards cash",
    copyFrom: "media/blog/money-karty/hero.jpg",
  }),
  editorialHero("money-90-дней", {
    alt: "Финансы при пребывании 90 дней в Аргентине",
    query: "Argentina long stay 90 days expat finances Buenos Aires apartment",
    copyFrom: MONEY_COPY,
  }),

  // ── Buenos Aires editorial (4) ──
  editorialHero("buenos-aires-советы-новичкам", {
    alt: "Буэнос-Айрес для новичков — улицы Палermo и кафе",
    query: "Buenos Aires beginner tips Palermo street cafe Argentina",
    copyFrom: BA_COPY,
    category: "city",
  }),
  editorialHero("buenos-aires-за-3-дня", {
    alt: "Буэнос-Айрес за 3 дня — обзорная прогулка по центру",
    query: "Buenos Aires 3 days city tour Obelisco Argentina",
    copyFrom: BA_COPY,
    category: "city",
  }),
  editorialHero("buenos-aires-бюджет", {
    alt: "Бюджет поездки в Буэнос-Айрес — жильё и еда",
    query: "Buenos Aires budget travel affordable hostel food Argentina",
    copyFrom: BA_COPY,
    category: "city",
  }),
  editorialHero("buenos-aires-с-гидом", {
    alt: "Буэнос-Айрес с гидом — экскурсия по историческому центру",
    query: "Buenos Aires guided tour San Telmo La Boca Argentina",
    copyFrom: BA_COPY,
    category: "city",
  }),

  // ── Iguazu editorial (1) ──
  editorialHero("iguazu-советы-новичкам", {
    alt: "Игуасу для новичков — водопады и тропы национального парка",
    query: "Iguazu Falls beginner tips national park Argentina waterfall",
    wikimediaQuery: "Iguazu Falls Argentina national park",
    preferWikimedia: true,
    copyFrom: IGUazu_COPY,
    category: "waterfall",
  }),

  // ── Northwest editorial (3) ──
  editorialHero("northwest-за-5-дней", {
    alt: "Северо-запад Аргентины за 5 дней — горы и каньоны Сальты",
    query: "Salta northwest Argentina 5 days mountains canyon route",
    copyFrom: NW_COPY,
  }),
  editorialHero("northwest-сезон-дождей", {
    alt: "Северо-запад в сезон дождей — облака над Андами",
    query: "Salta northwest Argentina rainy season Andes clouds",
    copyFrom: "media/places/purmamarca/hero.jpg",
  }),
  editorialHero("northwest-самостоятельно", {
    alt: "Северо-запад самостоятельно — дорога через Quebrada de Humahuaca",
    query: "Quebrada de Humahuaca road Salta Argentina self drive",
    wikimediaQuery: "Quebrada de Humahuaca Argentina",
    preferWikimedia: true,
    copyFrom: NW_COPY,
  }),
];

/** Legacy rich posts — blog cover heroes from rich gallery (S8 cards + OG). */
/** @type {StockMediaSlot[]} */
export const BLOG_LEGACY_RICH_HERO_SLOTS = [
  editorialHero("natsionalnyy-park-iguasu", {
    alt: "Национальный парк Игуасу — водопады и джунгли",
    query: "Iguazu Falls national park Argentina waterfall panorama",
    wikimediaQuery: "Iguazu Falls Argentina national park",
    preferWikimedia: true,
    copyFrom: "media/blog/rich/iguazu-national-park/gallery-1.jpg",
    category: "waterfall",
  }),
  editorialHero("natsionalnyy-park-los-glasiares", {
    alt: "Национальный парк Лос-Гласьярес — ледник Перито-Морено",
    query: "Los Glaciares national park Perito Moreno glacier Argentina",
    wikimediaQuery: "Los Glaciares National Park Argentina",
    preferWikimedia: true,
    copyFrom: "media/blog/rich/los-glaciares-national-park/gallery-1.jpg",
  }),
  editorialHero("natsionalnyy-park-nauel-uapi", {
    alt: "Национальный парк Науэль-Уапи — озеро и Анды",
    query: "Nahuel Huapi lake Bariloche Argentina national park",
    wikimediaQuery: "Nahuel Huapi National Park Argentina",
    preferWikimedia: true,
    copyFrom: "media/blog/rich/nahuel-huapi-national-park/gallery-1.jpg",
  }),
  editorialHero("natsionalnyy-park-tierra-del-fuego", {
    alt: "Национальный парк Огненная Земля — лес и канал Бигля",
    query: "Tierra del Fuego national park forest Beagle Channel Argentina",
    wikimediaQuery: "Tierra del Fuego National Park Argentina",
    preferWikimedia: true,
    copyFrom: "media/blog/rich/tierra-del-fuego-national-park/gallery-1.jpg",
  }),
];
