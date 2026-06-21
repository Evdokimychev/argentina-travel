/** Destination id → place slug for hero/gallery reuse */
export const DESTINATION_PLACE_MAP: Record<string, string> = {
  ba: "buenos-aires",
  bariloche: "bariloche",
  calafate: "el-calafate",
  ushuaia: "ushuaia",
  iguazu: "iguazu-falls",
  mendoza: "mendoza",
  salta: "salta",
  patagonia: "el-chalten",
};

/** Blog category → place slug for contextual hero */
export const BLOG_CATEGORY_PLACE_MAP: Record<string, string> = {
  travel: "buenos-aires",
  "buenos-aires": "buenos-aires",
  patagonia: "perito-moreno-glacier",
  north: "salta",
  iguazu: "iguazu-falls",
  "national-parks": "los-glaciares-national-park",
  trekking: "el-chalten",
  wineries: "mendoza",
  wildlife: "valdes-peninsula",
  food: "buenos-aires",
  transport: "buenos-aires",
  safety: "buenos-aires",
  money: "buenos-aires",
  internet: "buenos-aires",
  "ba-neighborhoods": "buenos-aires",
  relocation: "buenos-aires",
};

/** Blog hub label (Russian) → place slug */
export const BLOG_HUB_PLACE_MAP: Record<string, string> = {
  Патагония: "perito-moreno-glacier",
  "Буэнос-Айрес": "buenos-aires",
  "Север Аргентины": "salta",
  "Водопады Игуасу": "iguazu-falls",
  "Национальные парки": "los-glaciares-national-park",
  "Горы и треккинг": "el-chalten",
  Винодельни: "mendoza",
  "Животные Аргентины": "valdes-peninsula",
  "Кухня Аргентины": "buenos-aires",
  Транспорт: "buenos-aires",
  "Деньги и обмен валют": "buenos-aires",
  Безопасность: "buenos-aires",
  "Интернет и связь": "buenos-aires",
  "Районы Буэнос-Айреса": "buenos-aires",
  "Переезд и релокация": "buenos-aires",
  Путешествия: "iguazu-falls",
  Советы: "buenos-aires",
  Гастрономия: "buenos-aires",
  Культура: "buenos-aires",
  Путеводитель: "buenos-aires",
  Иммиграция: "buenos-aires",
  Туры: "mendoza",
};

/** Guide topic slug → place slug for hero reuse */
export const GUIDE_TOPIC_PLACE_MAP: Record<string, string> = {
  "kak-dobratsya": "buenos-aires",
  "gde-zhit": "buenos-aires",
  transport: "bariloche",
  "turistskie-regiony": "perito-moreno-glacier",
  dostoprimechatelnosti: "iguazu-falls",
  "pogoda-i-sezonnost": "el-chalten",
  yazyk: "buenos-aires",
  kultura: "buenos-aires",
  istoriya: "buenos-aires",
  kukhnya: "mendoza",
  svyaz: "buenos-aires",
  "ekonomika-i-dengi": "buenos-aires",
  shopping: "buenos-aires",
  bezopasnost: "buenos-aires",
};

/** Guide content page slug → place slug */
export const GUIDE_PAGE_PLACE_MAP: Record<string, string> = {
  "sezony-i-klimat": "perito-moreno-glacier",
  "gastronomiya-i-asado": "mendoza",
  "tango-i-kultura-ba": "buenos-aires",
  "patagoniya-s-chego-nachat": "el-chalten",
  "bronirovanie-i-oplata": "buenos-aires",
};

/** Tour slug → primary place for cover + gallery */
export const TOUR_PLACE_MAP: Record<string, string> = {
  "patagonia-glaciers": "perito-moreno-glacier",
  "buenos-aires-tango": "buenos-aires",
  "mendoza-wine": "mendoza",
  "iguazu-falls": "iguazu-falls",
  "salta-northwest": "salta",
  "ushuaia-end-of-world": "ushuaia",
  "bariloche-lakes": "bariloche",
  "fitz-roy-trek": "el-chalten",
};

/** Default month (1–12) → place slug for climate cards */
export const CLIMATE_MONTH_PLACE_MAP: Record<number, string> = {
  1: "mar-del-plata",
  2: "buenos-aires",
  3: "mendoza",
  4: "salta",
  5: "iguazu-falls",
  6: "buenos-aires",
  7: "bariloche",
  8: "el-chalten",
  9: "mendoza",
  10: "salta",
  11: "perito-moreno-glacier",
  12: "ushuaia",
};

/** Region-specific climate month overrides → place slug */
export const CLIMATE_REGION_MONTH_MAP: Record<string, Partial<Record<number, string>>> = {
  ba: { 1: "buenos-aires", 6: "buenos-aires" },
  patagonia: { 1: "perito-moreno-glacier", 2: "bariloche", 7: "el-chalten", 11: "el-calafate" },
  iguazu: { 2: "iguazu-falls", 3: "iguazu-falls", 12: "iguazu-falls" },
  salta: { 4: "purmamarca", 5: "salta", 9: "cerro-de-los-7-colores" },
  mendoza: { 3: "mendoza", 4: "mendoza", 9: "mendoza" },
};

/** Rich blog article id → place slug for gallery supplement */
export const RICH_ARTICLE_PLACE_MAP: Record<string, string> = {
  "all-argentina-national-parks": "los-glaciares-national-park",
  "banado-la-estrella": "iguazu-falls",
  "iguazu-national-park": "iguazu-falls",
  "ibera-national-park": "iguazu-falls",
  "lanin-national-park": "bariloche",
  "los-alerces-national-park": "bariloche",
  "nahuel-huapi-national-park": "nahuel-huapi-national-park",
  "los-glaciares-national-park": "los-glaciares-national-park",
  "los-cardones-national-park": "salta",
  "patagonia-national-park": "el-calafate",
  "talampaya-national-park": "salta",
  "ischigualasto-valley-of-the-moon": "talampaya-national-park",
  "tierra-del-fuego-national-park": "tierra-del-fuego-national-park",
  "valdes-peninsula-national-park": "valdes-peninsula",
};
