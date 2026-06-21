/** Major airports in Argentina for the interactive map (IATA hubs). */
export type ArgentinaAirport = {
  id: string;
  slug: string;
  name: string;
  iata: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  description: string;
};

export const ARGENTINA_AIRPORTS: ArgentinaAirport[] = [
  {
    id: "airport-eze",
    slug: "ezeiza",
    name: "Международный аэропорт Эсейса",
    iata: "EZE",
    city: "Буэнос-Айрес",
    region: "Buenos Aires",
    latitude: -34.8222,
    longitude: -58.5358,
    description: "Главный международный аэропорт Буэнос-Айреса (Министро Пistarini).",
  },
  {
    id: "airport-aep",
    slug: "aeroparque",
    name: "Аэропарк Хорхе Ньюbery",
    iata: "AEP",
    city: "Буэнос-Айрес",
    region: "Buenos Aires",
    latitude: -34.5592,
    longitude: -58.4156,
    description: "Городской аэропорт для внутренних рейсов и соседних стран.",
  },
  {
    id: "airport-cor",
    slug: "cordoba",
    name: "Аэропорт Кордобы",
    iata: "COR",
    city: "Кордова",
    region: "Córdoba",
    latitude: -31.3236,
    longitude: -64.2079,
    description: "Крупный хаб центральной Аргентины.",
  },
  {
    id: "airport-mdz",
    slug: "mendoza",
    name: "Аэропорт Мендосы",
    iata: "MDZ",
    city: "Мендоса",
    region: "Mendoza",
    latitude: -32.8317,
    longitude: -68.7928,
    description: "Ворота в винный регион и Андes.",
  },
  {
    id: "airport-brc",
    slug: "bariloche",
    name: "Аэропорт Барилоче",
    iata: "BRC",
    city: "Барилoche",
    region: "Patagonia",
    latitude: -41.1511,
    longitude: -71.1575,
    description: "Основной аэропорт озёрного региона Науэль-Уапи.",
  },
  {
    id: "airport-igl",
    slug: "iguazu",
    name: "Аэропорт Игуасу",
    iata: "IGR",
    city: "Пуэрто-Игуасу",
    region: "Misiones",
    latitude: -25.7373,
    longitude: -54.4734,
    description: "Ближайший аэропорт к водопадам Игуасу.",
  },
  {
    id: "airport-slta",
    slug: "salta",
    name: "Аэропорт Сальты",
    iata: "SLA",
    city: "Сальта",
    region: "Salta",
    latitude: -24.856,
    longitude: -65.4862,
    description: "Главный аэропорт северо-запада Аргентины.",
  },
  {
    id: "airport-fte",
    slug: "el-calafate",
    name: "Аэропорт Эль-Калафате",
    iata: "FTE",
    city: "Эль-Калафате",
    region: "Patagonia",
    latitude: -50.2843,
    longitude: -72.0531,
    description: "Аэропорт у ледников Патагонии и нацпарка Лос-Гласьярес.",
  },
  {
    id: "airport-ush",
    slug: "ushuaia",
    name: "Аэропорт Уshuaia",
    iata: "USH",
    city: "Уshuaia",
    region: "Tierra del Fuego",
    latitude: -54.8433,
    longitude: -68.2958,
    description: "Самый южный международный аэропорт мира.",
  },
];
