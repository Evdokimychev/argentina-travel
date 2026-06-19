import {
  Plane,
  PlaneTakeoff,
  Bus,
  Car,
  Truck,
  Train,
  TramFront,
  Ship,
  Sailboat,
  Waves,
  Fish,
  Binoculars,
  Bird,
  Footprints,
  Mountain,
  Backpack,
  MountainSnow,
  Bike,
  Waypoints,
  Camera,
  Wine,
  UtensilsCrossed,
  ChefHat,
  Landmark,
  Theater,
  Music,
  Sparkles,
  BedDouble,
  MessageSquare,
  Clock,
  MapPin,
  Snowflake,
  Flame,
  Droplets,
  Sun,
  TreePine,
  Tent,
  ShoppingBag,
  HeartPulse,
  Star,
  CircleDot,
  Anchor,
  Wind,
  Zap,
  Building2,
  Church,
  Coffee,
  Users,
  Moon,
  Route,
  Ticket,
  Leaf,
  Sunrise,
  LogOut,
  Hammer,
  Paintbrush,
  Mic2,
  Gamepad2,
  Turtle,
  Flag,
  Eye,
  Trees,
  Pickaxe,
  Circle,
  type LucideIcon,
} from "lucide-react";

export type ItineraryActivityKind =
  | "transfer"
  | "flight"
  | "departure"
  | "bus_tour"
  | "train"
  | "scenic_train"
  | "ferry"
  | "driving"
  | "scenic_drive"
  | "jeep"
  | "atv"
  | "motorcycle"
  | "helicopter"
  | "border_crossing"
  | "walking"
  | "city_walk"
  | "national_park"
  | "viewpoint"
  | "trekking"
  | "hiking"
  | "camping"
  | "climbing"
  | "ice_trek"
  | "canyoning"
  | "cycling"
  | "mountain_bike"
  | "boat_cruise"
  | "kayak"
  | "canoeing"
  | "sup"
  | "rafting"
  | "snorkeling"
  | "diving"
  | "sailing"
  | "swimming"
  | "wildlife"
  | "wildlife_drive"
  | "whale_watching"
  | "dolphin_watching"
  | "penguin_watching"
  | "seal_watching"
  | "birdwatching"
  | "wine"
  | "brewery"
  | "food"
  | "asado"
  | "mate"
  | "coffee"
  | "cooking"
  | "market"
  | "museum"
  | "cultural"
  | "architecture"
  | "religious"
  | "archaeological"
  | "tango"
  | "folklore"
  | "dance"
  | "concert"
  | "nightlife"
  | "soccer"
  | "photo"
  | "free_time"
  | "briefing"
  | "check_in"
  | "glacier"
  | "volcano"
  | "hot_springs"
  | "beach"
  | "waterfall"
  | "cave"
  | "horseback"
  | "estancia"
  | "fishing"
  | "shopping"
  | "spa"
  | "yoga"
  | "meditation"
  | "stargazing"
  | "zip_line"
  | "paragliding"
  | "balloon"
  | "skiing"
  | "snowboarding"
  | "sandboarding"
  | "surf"
  | "picnic"
  | "workshop"
  | "graffiti"
  | "community"
  | "custom";

export interface ItineraryActivityKindOption {
  kind: ItineraryActivityKind;
  label: string;
  icon: LucideIcon;
  keywords: string[];
}

export const ITINERARY_ACTIVITY_KINDS: ItineraryActivityKindOption[] = [
  { kind: "transfer", label: "Трансфер", icon: Bus, keywords: ["трансфер", "transfer", "shuttle"] },
  { kind: "flight", label: "Перелёт", icon: Plane, keywords: ["перелёт", "перелет", "flight", "авиа"] },
  { kind: "departure", label: "Выезд / отъезд", icon: LogOut, keywords: ["выезд", "отъезд", "departure", "check-out"] },
  { kind: "bus_tour", label: "Автобусная экскурсия", icon: Bus, keywords: ["автобус", "bus", "экскурсия"] },
  { kind: "train", label: "Ж/д поездка", icon: Train, keywords: ["поезд", "train", "ж/д", "жд"] },
  { kind: "scenic_train", label: "Ж/д панорама", icon: TramFront, keywords: ["tren", "панорам", "scenic train", "clouds"] },
  { kind: "ferry", label: "Паром", icon: Ship, keywords: ["паром", "ferry", "переправа"] },
  { kind: "driving", label: "Автопробег", icon: Car, keywords: ["авто", "drive", "road trip", "машина"] },
  { kind: "scenic_drive", label: "Живописная дорога", icon: Route, keywords: ["дорога", "scenic", "route 40", "ruta"] },
  { kind: "jeep", label: "Джип-тур", icon: Truck, keywords: ["jeep", "джип", "4x4", "offroad"] },
  { kind: "atv", label: "Квадrocycle / ATV", icon: Zap, keywords: ["atv", "квадро", "quad"] },
  { kind: "motorcycle", label: "Мотоцикл", icon: Zap, keywords: ["мото", "motorcycle", "байк"] },
  { kind: "helicopter", label: "Вертолёт", icon: PlaneTakeoff, keywords: ["helicopter", "вертолёт", "heli"] },
  { kind: "border_crossing", label: "Переход границы", icon: Flag, keywords: ["границ", "border", "customs"] },
  { kind: "walking", label: "Прогулка", icon: Footprints, keywords: ["прогулка", "walk", "walking"] },
  { kind: "city_walk", label: "Обзорная прогулка", icon: MapPin, keywords: ["обзорная", "city walk", "город"] },
  { kind: "national_park", label: "Нацпарк", icon: Trees, keywords: ["national park", "нацпарк", "parque"] },
  { kind: "viewpoint", label: "Смотровая площадка", icon: Eye, keywords: ["viewpoint", "смотровая", "mirador"] },
  { kind: "trekking", label: "Треккинг", icon: Mountain, keywords: ["трек", "trek", "trekking", "треккинг"] },
  { kind: "hiking", label: "Поход", icon: Backpack, keywords: ["поход", "hike", "hiking", "палатка"] },
  { kind: "camping", label: "Кемпинг", icon: Tent, keywords: ["camping", "кемпинг", "ночёвка в палатке"] },
  { kind: "climbing", label: "Альпинизм", icon: MountainSnow, keywords: ["альп", "climb", "скалолаз"] },
  { kind: "ice_trek", label: "Прогулка по льду", icon: Snowflake, keywords: ["ice trek", "mini trekking", "лед"] },
  { kind: "canyoning", label: "Каньонинг", icon: Pickaxe, keywords: ["canyon", "каньон", "canyoning"] },
  { kind: "cycling", label: "Велосипед", icon: Bike, keywords: ["велосипед", "bike", "cycling", "вело"] },
  { kind: "mountain_bike", label: "MTB", icon: Bike, keywords: ["mtb", "mountain bike", "горный велосипед"] },
  { kind: "boat_cruise", label: "Круиз / катер", icon: Ship, keywords: ["круиз", "cruise", "катер", "safari náutico"] },
  { kind: "kayak", label: "Каякинг", icon: Sailboat, keywords: ["kayak", "каяк", "paddle"] },
  { kind: "canoeing", label: "Каноэ", icon: Circle, keywords: ["canoe", "каноэ"] },
  { kind: "sup", label: "SUP / сапборд", icon: Waves, keywords: ["sup", "сап", "paddleboard"] },
  { kind: "rafting", label: "Рафтинг", icon: Waves, keywords: ["raft", "рафт", "сплав"] },
  { kind: "snorkeling", label: "Снорклинг", icon: Fish, keywords: ["snorkel", "сноркл", "маска"] },
  { kind: "diving", label: "Дайвинг", icon: Anchor, keywords: ["dive", "дайв", "scuba"] },
  { kind: "sailing", label: "Парусный спорт", icon: Wind, keywords: ["sail", "парус", "яхта"] },
  { kind: "swimming", label: "Купание", icon: Droplets, keywords: ["swim", "купание", "плавание"] },
  { kind: "wildlife", label: "Дикая природа", icon: Binoculars, keywords: ["safari", "wildlife", "фауна", "животные"] },
  { kind: "wildlife_drive", label: "Сафari на авто", icon: Binoculars, keywords: ["safari drive", "game drive"] },
  { kind: "whale_watching", label: "Наблюдение за китами", icon: Fish, keywords: ["whale", "кит", "киты"] },
  { kind: "dolphin_watching", label: "Дельфины", icon: Waves, keywords: ["dolphin", "дельфин"] },
  { kind: "penguin_watching", label: "Пингвины", icon: Bird, keywords: ["penguin", "пингвин"] },
  { kind: "seal_watching", label: "Морские львы", icon: Turtle, keywords: ["seal", "sea lion", "лёд"] },
  { kind: "birdwatching", label: "Наблюдение за птицами", icon: Bird, keywords: ["bird", "птиц", "орнитолог"] },
  { kind: "wine", label: "Винная дегустация", icon: Wine, keywords: ["wine", "вино", "bodega", "дегустация"] },
  { kind: "brewery", label: "Пивоварня", icon: UtensilsCrossed, keywords: ["brewery", "пиво", "cerveza"] },
  { kind: "food", label: "Гастрономия", icon: UtensilsCrossed, keywords: ["food", "еда", "обед", "ужин", "завтрак", "кухня"] },
  { kind: "asado", label: "Асадо", icon: Flame, keywords: ["asado", "асадо", "parrilla", "bbq"] },
  { kind: "mate", label: "Мате-церемония", icon: Coffee, keywords: ["mate", "мате"] },
  { kind: "coffee", label: "Кофе / кафе", icon: Coffee, keywords: ["coffee", "кофе", "café"] },
  { kind: "cooking", label: "Кулинарный мастер-класс", icon: ChefHat, keywords: ["cook", "кулинар", "master class"] },
  { kind: "market", label: "Рынок / ярмарка", icon: Ticket, keywords: ["market", "рынок", "feria"] },
  { kind: "museum", label: "Музей", icon: Landmark, keywords: ["museum", "музей", "галерея"] },
  { kind: "cultural", label: "Культурная программа", icon: Theater, keywords: ["culture", "культура", "история"] },
  { kind: "architecture", label: "Архитектура", icon: Building2, keywords: ["architecture", "архитектур", "facade"] },
  { kind: "religious", label: "Храм / собор", icon: Church, keywords: ["church", "cathedral", "храм", "собор"] },
  { kind: "archaeological", label: "Археология", icon: Landmark, keywords: ["ruins", "археолог", "памятник"] },
  { kind: "tango", label: "Танго-шоу", icon: Music, keywords: ["tango", "танго", "milonga"] },
  { kind: "folklore", label: "Фольклор-шоу", icon: Mic2, keywords: ["folklore", "peña", "фольклор"] },
  { kind: "dance", label: "Танцы / урок", icon: Music, keywords: ["dance", "танец", "урок"] },
  { kind: "concert", label: "Концерт", icon: Music, keywords: ["concert", "концерт", "show"] },
  { kind: "nightlife", label: "Ночная жизнь", icon: Moon, keywords: ["night", "ночь", "bar", "club"] },
  { kind: "soccer", label: "Футбол", icon: Gamepad2, keywords: ["soccer", "football", "футбол", "boca"] },
  { kind: "photo", label: "Фотосессия", icon: Camera, keywords: ["photo", "фото", "photography"] },
  { kind: "free_time", label: "Свободное время", icon: Clock, keywords: ["свобод", "free time", "отдых"] },
  { kind: "briefing", label: "Брифинг", icon: MessageSquare, keywords: ["брифинг", "briefing", "инструктаж"] },
  { kind: "check_in", label: "Заселение", icon: BedDouble, keywords: ["заселение", "check-in", "check in"] },
  { kind: "glacier", label: "Ледник", icon: Snowflake, keywords: ["glacier", "ледник", "perito", "moreno"] },
  { kind: "volcano", label: "Вулкан", icon: Flame, keywords: ["volcano", "вулкан"] },
  { kind: "hot_springs", label: "Термальные источники", icon: Droplets, keywords: ["hot spring", "терм", "источник"] },
  { kind: "beach", label: "Пляж", icon: Sun, keywords: ["beach", "пляж", "купание"] },
  { kind: "waterfall", label: "Водопад", icon: Droplets, keywords: ["waterfall", "водопад", "cascade"] },
  { kind: "cave", label: "Пещера", icon: TreePine, keywords: ["cave", "пещер", "grotto"] },
  { kind: "horseback", label: "Верховая езда", icon: Waypoints, keywords: ["horse", "лошад", "riding"] },
  { kind: "estancia", label: "Эстансия", icon: Leaf, keywords: ["estancia", "эстансия", "gaucho", "gaúcho"] },
  { kind: "fishing", label: "Рыбалка", icon: Fish, keywords: ["fish", "рыбалка", "angling"] },
  { kind: "shopping", label: "Шопинг", icon: ShoppingBag, keywords: ["shop", "шопинг", "рынок", "market"] },
  { kind: "spa", label: "СПА", icon: Sparkles, keywords: ["spa", "спа", "массаж"] },
  { kind: "yoga", label: "Йога", icon: HeartPulse, keywords: ["yoga", "йога"] },
  { kind: "meditation", label: "Медитация", icon: Sunrise, keywords: ["meditation", "медитация"] },
  { kind: "stargazing", label: "Наблюдение за звёздами", icon: Star, keywords: ["star", "звёзд", "астро"] },
  { kind: "zip_line", label: "Зип-лайн", icon: Zap, keywords: ["zip", "zipline", "троллей"] },
  { kind: "paragliding", label: "Параплан", icon: Wind, keywords: ["paraglid", "параплан"] },
  { kind: "balloon", label: "Воздушный шар", icon: Wind, keywords: ["balloon", "шар", "aeronaut"] },
  { kind: "skiing", label: "Лыжи", icon: Snowflake, keywords: ["ski", "лыжи", "катание"] },
  { kind: "snowboarding", label: "Сноуборд", icon: Snowflake, keywords: ["snowboard", "сноуборд"] },
  { kind: "sandboarding", label: "Сэндбординг", icon: Sun, keywords: ["sandboard", "дюна", "sand"] },
  { kind: "surf", label: "Сёрфинг", icon: Waves, keywords: ["surf", "сёрф", "волны"] },
  { kind: "picnic", label: "Пикник", icon: Tent, keywords: ["picnic", "пикник", "ланч-бокс"] },
  { kind: "workshop", label: "Мастер-класс", icon: Hammer, keywords: ["workshop", "мастер-класс", "craft"] },
  { kind: "graffiti", label: "Стрит-арт", icon: Paintbrush, keywords: ["graffiti", "street art", "граффити"] },
  { kind: "community", label: "Встреча с местными", icon: Users, keywords: ["community", "local", "местные", "племя"] },
  { kind: "custom", label: "Другое", icon: CircleDot, keywords: [] },
];

const kindMap = new Map(ITINERARY_ACTIVITY_KINDS.map((option) => [option.kind, option]));

export function getItineraryActivityKindOption(
  kind: ItineraryActivityKind | string | undefined
): ItineraryActivityKindOption {
  return kindMap.get(kind as ItineraryActivityKind) ?? kindMap.get("custom")!;
}

export function inferItineraryActivityKind(text: string): ItineraryActivityKind {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return "custom";

  for (const option of ITINERARY_ACTIVITY_KINDS) {
    if (option.kind === "custom") continue;
    if (option.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
      return option.kind;
    }
  }

  return "custom";
}

export function getItineraryActivityLabel(
  activity: { kind: ItineraryActivityKind; title?: string }
): string {
  const customTitle = activity.title?.trim();
  if (customTitle) return customTitle;
  return getItineraryActivityKindOption(activity.kind).label;
}

export function getItineraryActivityIcon(kind: ItineraryActivityKind | string): LucideIcon {
  return getItineraryActivityKindOption(kind).icon;
}

/** Частые активности — быстрый выбор в редакторе */
export const POPULAR_ITINERARY_ACTIVITY_KINDS: ItineraryActivityKind[] = [
  "transfer",
  "flight",
  "briefing",
  "city_walk",
  "trekking",
  "boat_cruise",
  "glacier",
  "wine",
  "wildlife",
  "photo",
  "free_time",
  "check_in",
  "food",
  "national_park",
  "horseback",
];

/** Группы для селектора в редакторе */
export const ITINERARY_ACTIVITY_KIND_GROUPS: { title: string; kinds: ItineraryActivityKind[] }[] = [
  {
    title: "Транспорт и логистика",
    kinds: [
      "transfer",
      "flight",
      "departure",
      "bus_tour",
      "train",
      "scenic_train",
      "ferry",
      "driving",
      "scenic_drive",
      "jeep",
      "atv",
      "motorcycle",
      "helicopter",
      "border_crossing",
    ],
  },
  {
    title: "Пешком и горы",
    kinds: [
      "walking",
      "city_walk",
      "national_park",
      "viewpoint",
      "trekking",
      "hiking",
      "camping",
      "climbing",
      "ice_trek",
      "canyoning",
      "cycling",
      "mountain_bike",
      "horseback",
      "zip_line",
      "paragliding",
      "balloon",
      "skiing",
      "snowboarding",
      "sandboarding",
      "surf",
      "yoga",
      "meditation",
    ],
  },
  {
    title: "Вода и дикая природа",
    kinds: [
      "boat_cruise",
      "kayak",
      "canoeing",
      "sup",
      "rafting",
      "snorkeling",
      "diving",
      "sailing",
      "swimming",
      "wildlife",
      "wildlife_drive",
      "whale_watching",
      "dolphin_watching",
      "penguin_watching",
      "seal_watching",
      "birdwatching",
      "glacier",
      "volcano",
      "hot_springs",
      "beach",
      "waterfall",
      "cave",
      "fishing",
      "stargazing",
    ],
  },
  {
    title: "Культура и гастрономия",
    kinds: [
      "wine",
      "brewery",
      "food",
      "asado",
      "mate",
      "coffee",
      "cooking",
      "market",
      "museum",
      "cultural",
      "architecture",
      "religious",
      "archaeological",
      "tango",
      "folklore",
      "dance",
      "concert",
      "nightlife",
      "soccer",
      "photo",
      "shopping",
      "spa",
      "picnic",
      "workshop",
      "graffiti",
      "community",
      "estancia",
    ],
  },
  {
    title: "Организация дня",
    kinds: ["free_time", "briefing", "check_in", "custom"],
  },
];

export const ITINERARY_ACTIVITY_KINDS_FLAT = ITINERARY_ACTIVITY_KINDS.map((option) => option.kind);
