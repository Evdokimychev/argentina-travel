import {
  Mountain,
  ThermometerSun,
  PawPrint,
  MapPinOff,
  CloudLightning,
  TriangleAlert,
  Sun,
  Waves,
  Bug,
  HeartPulse,
  Flag,
  CircleDot,
  type LucideIcon,
} from "lucide-react";

export type TourTravelRiskKind =
  | "altitude"
  | "temperature"
  | "wildlife"
  | "remote"
  | "weather"
  | "terrain"
  | "sun"
  | "water"
  | "insects"
  | "acclimatization"
  | "border"
  | "health"
  | "custom";

export interface TourTravelRiskKindOption {
  kind: TourTravelRiskKind;
  label: string;
  icon: LucideIcon;
  defaultHint: string;
  keywords: string[];
}

export const TOUR_TRAVEL_RISK_KINDS: TourTravelRiskKindOption[] = [
  {
    kind: "altitude",
    label: "Высота",
    icon: Mountain,
    defaultHint: "Маршрут проходит на значительной высоте — возможны головная боль и одышка без акклиматизации.",
    keywords: ["высота", "altitude", "2500", "3000"],
  },
  {
    kind: "temperature",
    label: "Температура",
    icon: ThermometerSun,
    defaultHint: "Возможны резкие перепады или экстремальная жара/холод — планируйте одежду и режим дня.",
    keywords: ["жара", "холод", "температура", "heat"],
  },
  {
    kind: "wildlife",
    label: "Дикая природа",
    icon: PawPrint,
    defaultHint: "Возможны встречи с дикими животными — соблюдайте инструкции гида и дистанцию.",
    keywords: ["животн", "wildlife", "puma", "зме"],
  },
  {
    kind: "remote",
    label: "Удалённые районы",
    icon: MapPinOff,
    defaultHint: "Участки без связи и медпунктов поблизости — запас воды, power bank и страховка обязательны.",
    keywords: ["удал", "remote", "связь", "offline"],
  },
  {
    kind: "weather",
    label: "Погода",
    icon: CloudLightning,
    defaultHint: "Погода меняется быстро — программа может корректироваться ради безопасности.",
    keywords: ["ветер", "дождь", "погода", "weather"],
  },
  {
    kind: "terrain",
    label: "Сложный рельеф",
    icon: TriangleAlert,
    defaultHint: "Каменистые участки, обрывы или скользкие тропы — нужна устойчивая обувь и внимание.",
    keywords: ["рельеф", "скольз", "камни", "terrain"],
  },
  {
    kind: "sun",
    label: "Солнце и UV",
    icon: Sun,
    defaultHint: "Сильное солнце на открытых участках — крем SPF 50+, головной убор и вода.",
    keywords: ["солнце", "uv", "загар", "sunburn"],
  },
  {
    kind: "water",
    label: "Водные участки",
    icon: Waves,
    defaultHint: "Катер, каяк или брод — используйте спасжилет и следуйте инструктажу.",
    keywords: ["вода", "лодка", "kayak", "raft"],
  },
  {
    kind: "insects",
    label: "Насекомые",
    icon: Bug,
    defaultHint: "Комары или другие насекомые в сезон — репеллент и закрытая одежда вечером.",
    keywords: ["комар", "insect", "mosquito"],
  },
  {
    kind: "acclimatization",
    label: "Акклиматизация",
    icon: HeartPulse,
    defaultHint: "Первые дни после перелёта или смены климата — не перегружайте себя активностью.",
    keywords: ["акклимат", "jet lag", "адаптац"],
  },
  {
    kind: "border",
    label: "Пограничные переходы",
    icon: Flag,
    defaultHint: "Переход границы — проверьте документы, визы и правила ввоза заранее.",
    keywords: ["границ", "border", "виза", "паспорт"],
  },
  {
    kind: "health",
    label: "Медицинские факторы",
    icon: HeartPulse,
    defaultHint: "Нагрузка или условия могут быть не подходящими при хронических заболеваниях — проконсультируйтесь с врачом.",
    keywords: ["медиц", "health", "аллерг"],
  },
  {
    kind: "custom",
    label: "Другое",
    icon: CircleDot,
    defaultHint: "Дополнительный фактор, который важно учесть перед поездкой.",
    keywords: [],
  },
];

const kindMap = new Map(TOUR_TRAVEL_RISK_KINDS.map((option) => [option.kind, option]));

export function getTourTravelRiskKindOption(
  kind: TourTravelRiskKind | string | undefined
): TourTravelRiskKindOption {
  return kindMap.get(kind as TourTravelRiskKind) ?? kindMap.get("custom")!;
}

export function getTourTravelRiskLabel(risk: { kind: TourTravelRiskKind; title?: string }): string {
  const custom = risk.title?.trim();
  if (custom) return custom;
  return getTourTravelRiskKindOption(risk.kind).label;
}

export function getTourTravelRiskIcon(kind: TourTravelRiskKind | string): LucideIcon {
  return getTourTravelRiskKindOption(kind).icon;
}

export const TOUR_TRAVEL_RISK_KIND_GROUPS: { title: string; kinds: TourTravelRiskKind[] }[] = [
  {
    title: "Природа и условия",
    kinds: ["altitude", "temperature", "weather", "sun", "terrain", "water", "insects"],
  },
  {
    title: "Маршрут и логистика",
    kinds: ["remote", "wildlife", "border", "acclimatization"],
  },
  {
    title: "Здоровье и прочее",
    kinds: ["health", "custom"],
  },
];

export const TOUR_TRAVEL_RISK_KINDS_FLAT = TOUR_TRAVEL_RISK_KINDS.map((option) => option.kind);
