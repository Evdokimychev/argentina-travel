/** Популярные направления в Аргентине — порядок для пикера рейсов и подборок. */
export const POPULAR_ARGENTINA = [
  { code: "BUE", label: "Буэнос-Айрес" },
  { code: "BRC", label: "Барилоче" },
  { code: "IGR", label: "Игуасу" },
  { code: "FTE", label: "Эль-Калафате" },
  { code: "USH", label: "Ушуайя" },
  { code: "MDZ", label: "Мендоса" },
  { code: "SLA", label: "Сальта" },
  { code: "COR", label: "Кордова" },
  { code: "ROS", label: "Росарио" },
] as const;

/** Популярные международные пункты вылета для «Откуда». */
export const POPULAR_INTERNATIONAL = [
  { code: "MOW", label: "Москва" },
  { code: "LED", label: "Санкт-Петербург" },
  { code: "IST", label: "Стамбул" },
  { code: "MAD", label: "Мадрид" },
  { code: "FCO", label: "Рим" },
  { code: "CDG", label: "Париж" },
  { code: "LHR", label: "Лондон" },
  { code: "DXB", label: "Дубай" },
  { code: "MIA", label: "Майами" },
  { code: "GRU", label: "Сан-Паулу" },
  { code: "SCL", label: "Сантьяго" },
  { code: "LIM", label: "Лима" },
] as const;

export type PopularDestination = {
  code: string;
  label: string;
};

export function getPopularDestinations(kind: "origin" | "destination"): PopularDestination[] {
  if (kind === "destination") {
    return [...POPULAR_ARGENTINA];
  }
  return [
    POPULAR_INTERNATIONAL[0],
    POPULAR_ARGENTINA[0],
    ...POPULAR_INTERNATIONAL.slice(1),
  ];
}
