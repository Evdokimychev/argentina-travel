export type DomesticRouteFrequency = "high" | "medium" | "seasonal" | "low";

export type ArgentinaDomesticAirport = {
  code: string;
  city: string;
  lat: number;
  lng: number;
  region: string;
};

export type DomesticHubRoute = {
  hub: "AEP" | "EZE";
  to: string;
  duration: string;
  frequency: DomesticRouteFrequency;
  note?: string;
};

export type RegionalDirectRoute = {
  from: string;
  to: string;
  duration: string;
  season: string;
};

/** Координаты аэропортов Аргентины (OpenFlights / ICAO). */
export const ARGENTINA_DOMESTIC_AIRPORTS: Record<string, ArgentinaDomesticAirport> = {
  AEP: { code: "AEP", city: "Буэнос-Айрес", lat: -34.5592, lng: -58.4156, region: "PAMPA" },
  EZE: { code: "EZE", city: "Буэнос-Айрес", lat: -34.8222, lng: -58.5358, region: "PAMPA" },
  COR: { code: "COR", city: "Кордова", lat: -31.3236, lng: -64.2077, region: "CENTRO" },
  MDZ: { code: "MDZ", city: "Мендоса", lat: -32.8317, lng: -68.7928, region: "CUYO" },
  SLA: { code: "SLA", city: "Сальта", lat: -24.856, lng: -65.4862, region: "NOROESTE" },
  TUC: { code: "TUC", city: "Тукуман", lat: -26.8409, lng: -65.1046, region: "NOROESTE" },
  BRC: { code: "BRC", city: "Барилоче", lat: -41.1511, lng: -71.1575, region: "PATAGONIA" },
  FTE: { code: "FTE", city: "Эль-Калафате", lat: -50.2803, lng: -72.0531, region: "PATAGONIA" },
  USH: { code: "USH", city: "Ушуайя", lat: -54.8433, lng: -68.2958, region: "PATAGONIA" },
  REL: { code: "REL", city: "Трелю", lat: -43.2105, lng: -65.2703, region: "PATAGONIA" },
  PMY: { code: "PMY", city: "Пуэрто-Мадрин", lat: -42.7592, lng: -65.1027, region: "PATAGONIA" },
  CRD: { code: "CRD", city: "Комодoro-Ривдавия", lat: -45.7853, lng: -67.4655, region: "PATAGONIA" },
  NQN: { code: "NQN", city: "Неукен", lat: -38.949, lng: -68.1557, region: "PATAGONIA" },
  IGR: { code: "IGR", city: "Пуэрто-Игуасу", lat: -25.7373, lng: -54.4734, region: "NEA" },
  PSS: { code: "PSS", city: "Посadas", lat: -27.3858, lng: -55.9707, region: "NEA" },
  ROS: { code: "ROS", city: "Росарио", lat: -32.9036, lng: -60.785, region: "LITORAL" },
};

/** Рейсы из Aeroparque (AEP) — основной внутренний хаб у центра BA. */
export const DOMESTIC_HUB_ROUTES: DomesticHubRoute[] = [
  { hub: "AEP", to: "COR", duration: "1h 15m", frequency: "high" },
  { hub: "AEP", to: "MDZ", duration: "1h 50m", frequency: "high" },
  { hub: "AEP", to: "SLA", duration: "2h 05m", frequency: "high" },
  { hub: "AEP", to: "TUC", duration: "1h 45m", frequency: "medium" },
  { hub: "AEP", to: "IGR", duration: "1h 50m", frequency: "high" },
  { hub: "AEP", to: "PSS", duration: "1h 30m", frequency: "medium" },
  { hub: "AEP", to: "ROS", duration: "1h 00m", frequency: "medium" },
  { hub: "AEP", to: "NQN", duration: "1h 55m", frequency: "medium" },
  { hub: "AEP", to: "BRC", duration: "2h 10m", frequency: "high" },
  { hub: "AEP", to: "FTE", duration: "3h 05m", frequency: "high" },
  { hub: "AEP", to: "USH", duration: "3h 25m", frequency: "high" },
  { hub: "AEP", to: "REL", duration: "2h 00m", frequency: "medium" },
  { hub: "AEP", to: "PMY", duration: "2h 05m", frequency: "seasonal", note: "Сезонный спрос" },
  { hub: "AEP", to: "CRD", duration: "2h 30m", frequency: "medium" },
  { hub: "EZE", to: "COR", duration: "1h 20m", frequency: "medium", note: "Меньше рейсов, чем из AEP" },
  { hub: "EZE", to: "MDZ", duration: "1h 55m", frequency: "medium" },
  { hub: "EZE", to: "SLA", duration: "2h 10m", frequency: "medium" },
  { hub: "EZE", to: "IGR", duration: "2h 00m", frequency: "medium" },
  { hub: "EZE", to: "BRC", duration: "2h 15m", frequency: "medium" },
  { hub: "EZE", to: "FTE", duration: "3h 10m", frequency: "medium" },
  { hub: "EZE", to: "USH", duration: "3h 30m", frequency: "medium" },
  { hub: "EZE", to: "NQN", duration: "2h 00m", frequency: "low" },
];

/** Прямые региональные рейсы без BA (сезонные / ограниченные). */
export const REGIONAL_DIRECT_ROUTES: RegionalDirectRoute[] = [
  { from: "MDZ", to: "BRC", duration: "1h 55m", season: "Высокий сезон, дек–мар" },
  { from: "MDZ", to: "FTE", duration: "2h 30m", season: "Сезонные прямые рейсы" },
  { from: "SLA", to: "BRC", duration: "2h 20m", season: "Ограниченно, проверяйте расписание" },
  { from: "SLA", to: "USH", duration: "4h+", season: "Редкие сезонные рейсы" },
  { from: "COR", to: "BRC", duration: "2h 10m", season: "Часто через BA; прямые — сезонно" },
  { from: "COR", to: "FTE", duration: "3h+", season: "Сезонно / через BA" },
];

export const FREQUENCY_META: Record<
  DomesticRouteFrequency,
  { label: string; color: string; description: string }
> = {
  high: { label: "Часто", color: "#2563eb", description: "Ежедневные рейсы, несколько в день" },
  medium: { label: "Регулярно", color: "#ca8a04", description: "Несколько рейсов в неделю" },
  seasonal: { label: "Сезонно", color: "#ea580c", description: "Пик — дек–мар, меньше в межсезонье" },
  low: { label: "Редко", color: "#dc2626", description: "Ограниченное расписание" },
};

export function getHubRoutes(hub: "AEP" | "EZE"): DomesticHubRoute[] {
  return DOMESTIC_HUB_ROUTES.filter((route) => route.hub === hub).sort((a, b) => {
    const order: DomesticRouteFrequency[] = ["high", "medium", "seasonal", "low"];
    return order.indexOf(a.frequency) - order.indexOf(b.frequency);
  });
}

export function getAirport(code: string): ArgentinaDomesticAirport | undefined {
  return ARGENTINA_DOMESTIC_AIRPORTS[code];
}

/** Дуга между двумя точками для «радиальных» линий как на FlightConnections. */
export function buildCurvedLine(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  bend = 0.18
): [number, number][] {
  const mx = (from.lat + to.lat) / 2;
  const my = (from.lng + to.lng) / 2;
  const dx = to.lng - from.lng;
  const dy = to.lat - from.lat;
  const cx = mx + dx * bend;
  const cy = my - dy * bend;
  const points: [number, number][] = [];
  for (let t = 0; t <= 1; t += 0.05) {
    const lat = (1 - t) ** 2 * from.lat + 2 * (1 - t) * t * cx + t ** 2 * to.lat;
    const lng = (1 - t) ** 2 * from.lng + 2 * (1 - t) * t * cy + t ** 2 * to.lng;
    points.push([lat, lng]);
  }
  return points;
}
