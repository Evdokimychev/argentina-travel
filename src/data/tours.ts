import { Tour } from "@/types";
import { getTourCoverImage, getTourGallery } from "@/lib/media-resolver";
import { tourExtra } from "./tour-extra";

type BaseTour = Omit<
  Tour,
  | "rating"
  | "reviewCount"
  | "organizer"
  | "comfort"
  | "startLocation"
  | "features"
  | "tags"
>;

export const baseTours: BaseTour[] = [
  {
    id: "1",
    slug: "patagonia-glaciers",
    title: "Ледники Патагонии",
    shortDescription:
      "Путешествие к леднику Перито-Морено и национальному парку Торрес-дель-Пайне",
    description:
      "Откройте для себя величественную Патагонию — край ледников, горных вершин и дикой природы. Этот тур включает посещение знаменитого ледника Перито-Морено, где вы увидите, как огромные ледяные блоки откалываются и падают в бирюзовые воды озера. Продолжение путешествия в Чили — национальный парк Торрес-дель-Пайне с его гранитными башнями и ледниковыми озёрами.",
    region: "Патагония",
    duration: "10 дней",
    priceUsd: 2663,
    image:
      "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      "https://images.unsplash.com/photo-1519682337058-a94d51933763?w=800&q=80",
      "https://images.unsplash.com/photo-1589182370481-0de83087320f?w=800&q=80",
    ],
    highlights: [
      "Ледник Перито-Морено",
      "Национальный парк Torres del Paine",
      "Круиз по озеру Аргентино",
      "Наблюдение за пингвинами",
      "Треккинг в горах",
    ],
    included: [
      "Проживание в отелях 4*",
      "Завтраки и обеды",
      "Трансферы и внутренние перелёты",
      "Русскоязычный гид",
      "Входные билеты в парки",
    ],
    difficulty: "Средний",
    groupSize: "8–12 человек",
    featured: true,
  },
  {
    id: "2",
    slug: "buenos-aires-tango",
    title: "Буэнос-Айрес и танго",
    shortDescription:
      "Погружение в культуру столицы: танго, архитектура и гастрономия",
    description:
      "Буэнос-Айрес — «Париж Южной Америки». Прогуляйтесь по колоритному району Ла-Бока, посетите кладбище Реколета, где покоится Эва Перón, и насладитесь вечерним шоу танго в историческом milonga. Дегустация аргентинского стейка и вина Malbec завершит незабываемое знакомство с городом.",
    region: "Буэнос-Айрес",
    duration: "5 дней",
    priceUsd: 967,
    image:
      "https://images.unsplash.com/photo-1589909202800-2f2e1b8a4b8e?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1589909202800-2f2e1b8a4b8e?w=800&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80",
      "https://images.unsplash.com/photo-1594909127802-a085ed12fbea?w=800&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
      "https://images.unsplash.com/photo-1565299715192-0a869238b7f0?w=800&q=80",
    ],
    highlights: [
      "Шоу танго в San Telmo",
      "Район La Boca и Caminito",
      "Кладбище Recoleta",
      "Дегустация Malbec",
      "Аргентинский asado",
    ],
    included: [
      "Отель в центре города",
      "Завтраки",
      "Экскурсии с гидом",
      "Билет на шоу танго",
      "Дегустация вин",
    ],
    difficulty: "Лёгкий",
    groupSize: "6–10 человек",
    featured: true,
  },
  {
    id: "3",
    slug: "mendoza-wine",
    title: "Винные туры Мендосы",
    shortDescription:
      "Долина вин и Анд: bodegas, дегустации и горные пейзажи",
    description:
      "Мендоса — столица аргентинского виноделия, расположенная у подножия Анд. Посетите лучшие bodegas региона, пройдите по виноградникам и продегустируйте знаменитый Malbec. В программе — поездка к горе Аконкагуа, высочайшей вершине Америки, и ужин among the vines под звёздным небом.",
    region: "Мендоса",
    duration: "7 дней",
    priceUsd: 1696,
    image:
      "https://images.unsplash.com/photo-1506377247377-2ecb89819a88?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1506377247377-2ecb89819a88?w=800&q=80",
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
      "https://images.unsplash.com/photo-1474722883778-792e2790302b?w=800&q=80",
      "https://images.unsplash.com/photo-1506377247377-2ecb89819a88?w=800&q=80",
      "https://images.unsplash.com/photo-1560493676-04071c5f467f?w=800&q=80",
      "https://images.unsplash.com/photo-1527283120-80239919596f?w=800&q=80",
    ],
    highlights: [
      "Дегустации в 5 bodegas",
      "Вид на Аконкагуа",
      "Велопрогулка по виноградникам",
      "Кулинарный мастер-класс",
      "Ужин among the vines",
    ],
    included: [
      "Boutique-отель в винодельне",
      "Завтраки",
      "Все дегустации",
      "Трансферы",
      "Гид-сommelier",
    ],
    difficulty: "Лёгкий",
    groupSize: "4–8 человек",
    featured: true,
  },
  {
    id: "4",
    slug: "iguazu-falls",
    title: "Водопады Игуасу",
    shortDescription:
      "280 водопадов на границе Аргентины и Бразилии — одно из чудес света",
    description:
      "Национальный парк Игуасу — объект Всемирного наследия UNESCO. Пройдите по подвесным мосткам над бушующими водами, подойдите к самому мощному водопаду «Дьявол's Throat» и прогуляйтесь по джунглям, где обитают туканы и бабуины.",
    region: "Мisiones",
    duration: "4 дня",
    priceUsd: 783,
    image:
      "https://images.unsplash.com/photo-1558980664-1db756751b1a?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1558980664-1db756751b1a?w=800&q=80",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80",
      "https://images.unsplash.com/photo-1516026672322-bc52c61a55d5?w=800&q=80",
      "https://images.unsplash.com/photo-1432407692633-884d652312ea?w=800&q=80",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
    ],
    highlights: [
      "Водопад Garganta del Diablo",
      "Мостки над водопадами",
      "Джунгли Missiones",
      "Птицы и бабуины",
      "Вид с бразильской стороны",
    ],
    included: [
      "Отель у парка",
      "Завтраки",
      "Входные билеты",
      "Экскурсии",
      "Трансферы",
    ],
    difficulty: "Лёгкий",
    groupSize: "8–14 человек",
  },
  {
    id: "5",
    slug: "salta-northwest",
    title: "Северо-Запад: Сальта и Кафаяте",
    shortDescription:
      "Красные каньоны, солёные равнины и колониальная архитектура",
    description:
      "Северо-запад Аргентины — регион контрастов: от колониальной Сальты до равнины Salinas Grandes на высоте 4000 метров. Каньон Quebrada de las Conchas с его красными скалами, винодельни Кафаяте и традиционные peñas с folk-музыкой.",
    region: "Сальта",
    duration: "8 дней",
    priceUsd: 1457,
    image:
      "https://images.unsplash.com/photo-1516026672322-bc52c61a55d5?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1516026672322-bc52c61a55d5?w=800&q=80",
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
    ],
    highlights: [
      "Каньон Quebrada de las Conchas",
      "Salinas Grandes",
      "Колониальная Сальта",
      "Винодельни Кафаяте",
      "Peña с folk-музыкой",
    ],
    included: [
      "Проживание в boutique-отелях",
      "Завтраки",
      "Трансферы",
      "Экскурсии",
      "Гид",
    ],
    difficulty: "Средний",
    groupSize: "6–10 человек",
  },
  {
    id: "6",
    slug: "ushuaia-end-of-world",
    title: "Ушуайя — край света",
    shortDescription:
      "Самый южный город мира, канал Бигля и национальный парк Tierra del Fuego",
    description:
      "Ушуайя — ворота в Антарктиду и край света. Круиз по каналу Бигля с морскими львами и пингвинами, поезд «End of the World» и треккинг в национальном парке Tierra del Fuego. Незабываемое приключение на краю континента.",
    region: "Огненная Земля",
    duration: "6 дней",
    priceUsd: 1935,
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&q=80",
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
      "https://images.unsplash.com/photo-1519682337058-a94d51933763?w=800&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      "https://images.unsplash.com/photo-1589182370481-0de83087320f?w=800&q=80",
    ],
    highlights: [
      "Круиз по каналу Бигля",
      "Пингвины и морские львы",
      "Поезд End of the World",
      "Tierra del Fuego",
      "Панорама гор",
    ],
    included: [
      "Отель в Ушуайе",
      "Завтраки",
      "Круиз",
      "Экскурсии",
      "Трансферы",
    ],
    difficulty: "Средний",
    groupSize: "8–12 человек",
  },
];

export const tours: Tour[] = baseTours.map((t) => {
  const extra = tourExtra[t.slug];
  return {
    ...t,
    image: getTourCoverImage(t.slug),
    gallery: getTourGallery(t.slug),
    rating: extra?.rating ?? 4.8,
    reviewCount: extra?.reviewCount ?? 0,
    tags: extra?.tags ?? [],
  };
});

export function getTourBySlug(slug: string): Tour | undefined {
  return tours.find((t) => t.slug === slug);
}

export function getFeaturedTours(): Tour[] {
  return tours.filter((t) => t.featured);
}
