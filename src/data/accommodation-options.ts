import { AccommodationType } from "@/types";
import {
  Sun,
  Bed,
  Building2,
  Sparkles,
  Home,
  Tent,
  Mountain,
  MountainSnow,
  Trees,
  Ship,
  type LucideIcon,
} from "lucide-react";

export interface AccommodationOption {
  type: AccommodationType;
  description: string;
  icon: LucideIcon;
}

export const ACCOMMODATION_FILTER_OPTIONS: AccommodationOption[] = [
  {
    type: "Без проживания",
    description: "Однодневные экскурсии и туры без ночёвки",
    icon: Sun,
  },
  {
    type: "Хостел",
    description: "Общие или бюджетные номера, атмосфера путешественников",
    icon: Bed,
  },
  {
    type: "Отель",
    description: "Стандартные отели 3–4* с завтраками",
    icon: Building2,
  },
  {
    type: "Бутик-отель",
    description: "Небольшие дизайнерские отели с сервисом",
    icon: Sparkles,
  },
  {
    type: "Апартаменты",
    description: "Квартиры и апартаменты с кухней",
    icon: Home,
  },
  {
    type: "Глэмпинг",
    description: "Комфортный кемпинг на природе",
    icon: Tent,
  },
  {
    type: "Палатка",
    description: "Походные туры с ночёвкой в палатках",
    icon: Mountain,
  },
  {
    type: "Горный приют",
    description: "Refugio и shelter в горах",
    icon: MountainSnow,
  },
  {
    type: "Лодж",
    description: "Загородные lodge у парков и озёр",
    icon: Trees,
  },
  {
    type: "Круизная каюта",
    description: "Морские и речные круизы",
    icon: Ship,
  },
];
