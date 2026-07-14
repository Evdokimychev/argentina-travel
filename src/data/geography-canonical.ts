export const ARGENTINA_REGIONS = [
  { id: "buenos-aires-city", label: "Буэнос-Айрес", provinces: ["Ciudad Autónoma de Buenos Aires"] },
  { id: "buenos-aires-province", label: "Провинция Буэнос-Айрес", provinces: ["Buenos Aires"] },
  { id: "central", label: "Центральная Аргентина", provinces: ["Córdoba", "La Pampa", "Santa Fe"] },
  { id: "cuyo", label: "Куйо", provinces: ["Mendoza", "San Juan", "San Luis"] },
  { id: "northwest", label: "Северо-Запад", provinces: ["Catamarca", "Jujuy", "La Rioja", "Salta", "Santiago del Estero", "Tucumán"] },
  { id: "northeast", label: "Северо-Восток (Литораль)", provinces: ["Chaco", "Corrientes", "Entre Ríos", "Formosa", "Misiones"] },
  { id: "patagonia", label: "Патагония", provinces: ["Chubut", "Neuquén", "Río Negro", "Santa Cruz"] },
  { id: "tierra-del-fuego", label: "Огненная Земля", provinces: ["Tierra del Fuego, Antártida e Islas del Atlántico Sur"] },
] as const;

export type ArgentinaRegionId = (typeof ARGENTINA_REGIONS)[number]["id"];

export const ARGENTINA_PLACE_NAMES = {
  Misiones: { label: "Мисионес", aliases: ["Миссионес"] },
  Corrientes: { label: "Корриентес", aliases: [] },
  "Entre Ríos": { label: "Энтре-Риос", aliases: ["Энтре Риос"] },
  "Santiago del Estero": { label: "Сантьяго-дель-Эстеро", aliases: [] },
  Jujuy: { label: "Хухуй", aliases: ["Жужуй"] },
  "San Salvador de Jujuy": { label: "Сан-Сальвадор-де-Хухуй", aliases: [] },
  Ushuaia: { label: "Ушуайя", aliases: ["Усуайя"] },
  "Puerto Iguazú": { label: "Пуэрто-Игуасу", aliases: [] },
  Bariloche: { label: "Барилоче", aliases: ["Сан-Карлос-де-Барилоче"] },
  "El Calafate": { label: "Эль-Калафате", aliases: [] },
  "El Chaltén": { label: "Эль-Чальтен", aliases: [] },
  "Nahuel Huapi": { label: "Нахуэль-Уапи", aliases: ["Науэль-Уапи"] },
  "Los Glaciares": { label: "Лос-Гласьярес", aliases: ["Лос-Гласиарес"] },
  "Perito Moreno": { label: "Перито-Морено", aliases: [] },
} as const;
