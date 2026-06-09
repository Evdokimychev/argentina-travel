import {
  Bus,
  Footprints,
  Mountain,
  Backpack,
  MountainSnow,
  Binoculars,
  Fish,
  Bird,
  Wine,
  UtensilsCrossed,
  Car,
  Truck,
  Bike,
  Sailboat,
  Waves,
  Waypoints,
  Camera,
  Users,
  Compass,
  Sparkles,
  Map,
  type LucideIcon,
} from "lucide-react";
import { ActivityType } from "@/types";

export interface ActivityTypeOption {
  type: ActivityType;
  icon: LucideIcon;
  keywords: string[];
}

export const ACTIVITY_TYPE_OPTIONS: ActivityTypeOption[] = [
  { type: "Экскурсионные туры", icon: Bus, keywords: ["экскурсия", "обзорные", "bus"] },
  { type: "Пешие туры", icon: Footprints, keywords: ["ходьба", "walking", "hike"] },
  { type: "Треккинг", icon: Mountain, keywords: ["trek", "горы", "trails"] },
  { type: "Походы", icon: Backpack, keywords: ["camping", "палатка", "hiking"] },
  { type: "Альпинизм", icon: MountainSnow, keywords: ["climb", "вершина", "альп"] },
  { type: "Сафари", icon: Binoculars, keywords: ["wildlife", "animals", "джунгли"] },
  { type: "Наблюдение за китами", icon: Fish, keywords: ["whale", "киты", "ocean"] },
  { type: "Наблюдение за пингвинами", icon: Bird, keywords: ["penguin", "пингвин", "birds"] },
  { type: "Винные туры", icon: Wine, keywords: ["wine", "вино", "bodega", "malbec"] },
  { type: "Гастрономические туры", icon: UtensilsCrossed, keywords: ["food", "еда", "кухня", "стейк"] },
  { type: "Автотуры", icon: Car, keywords: ["road trip", "машина", "drive"] },
  { type: "Джип-туры", icon: Truck, keywords: ["jeep", "4x4", "offroad"] },
  { type: "Велотуры", icon: Bike, keywords: ["bike", "велосипед", "cycling"] },
  { type: "Каякинг", icon: Sailboat, keywords: ["kayak", "лодка", "paddle"] },
  { type: "Рафтинг", icon: Waves, keywords: ["raft", "река", "сплав"] },
  { type: "Верховая езда", icon: Waypoints, keywords: ["horse", "лошадь", "riding"] },
  { type: "Фототуры", icon: Camera, keywords: ["photo", "фото", "photography"] },
  { type: "Семейные путешествия", icon: Users, keywords: ["family", "дети", "kids"] },
  { type: "Экспедиции", icon: Compass, keywords: ["expedition", "приключение", "remote"] },
  { type: "Люкс-путешествия", icon: Sparkles, keywords: ["luxury", "люкс", "premium", "vip"] },
  { type: "Авторские туры", icon: Map, keywords: ["author", "индивидуальный", "custom"] },
];

/** Keep ACTIVITY_TYPES in sync — derived from options */
export const ACTIVITY_TYPES = ACTIVITY_TYPE_OPTIONS.map((o) => o.type);
