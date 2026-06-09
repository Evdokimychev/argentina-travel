import { DifficultyLevel, ComfortLevel } from "@/types";
import {
  AlertTriangle,
  Bed,
  Crown,
  Footprints,
  Hotel,
  Mountain,
  MountainSnow,
  Sparkles,
  Sun,
  Tent,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export const DIFFICULTY_ICONS: Record<DifficultyLevel, LucideIcon> = {
  Лёгкая: Footprints,
  Умеренная: TrendingUp,
  Средняя: Mountain,
  Высокая: MountainSnow,
  Экстремальная: AlertTriangle,
};

export const COMFORT_ICONS: Record<ComfortLevel, LucideIcon> = {
  "Без проживания": Sun,
  Базовый: Tent,
  Стандарт: Bed,
  Комфорт: Hotel,
  Премиум: Sparkles,
  Люкс: Crown,
};

export const DIFFICULTY_LEVELS: {
  level: DifficultyLevel;
  description: string;
  example: string;
}[] = [
  {
    level: "Лёгкая",
    description:
      "Минимальная физическая нагрузка. Подходит для всех независимо от физической формы и возраста.",
    example: "Например: обзорная экскурсия по городу или семейный отдых.",
  },
  {
    level: "Умеренная",
    description:
      "Специальной подготовки не требуется, но предполагает умеренную физическую активность.",
    example: "Например: прогулка к водопаду через лес.",
  },
  {
    level: "Средняя",
    description:
      "Не нужны особые навыки, но туристам нужна базовая физическая подготовка.",
    example: "Например: однодневный маршрут с подъёмами и длительной ходьбой.",
  },
  {
    level: "Высокая",
    description:
      "Особых навыков не требуется, но туристы должны быть в хорошей физической форме.",
    example: "Например: многодневный поход к высокогорным озёрам с рюкзаком.",
  },
  {
    level: "Экстремальная",
    description:
      "Только для опытных и физически подготовленных туристов. Нужны специальные навыки и снаряжение.",
    example: "Например: восхождение в горы или технически сложный маршрут.",
  },
];

export const COMFORT_LEVELS: {
  level: ComfortLevel;
  description: string;
}[] = [
  {
    level: "Без проживания",
    description:
      "Однодневный тур без ночёвки. Проживание не включено в программу и не требуется.",
  },
  {
    level: "Базовый",
    description: "Хостелы, общие удобства, палаточный лагерь.",
  },
  {
    level: "Стандарт",
    description: "Отели 2–3*, двухместные номера с удобствами.",
  },
  {
    level: "Комфорт",
    description: "Отели 3–4*, просторные номера, завтраки включены.",
  },
  {
    level: "Премиум",
    description: "Boutique-отели 4–5*, индивидуальный сервис.",
  },
  {
    level: "Люкс",
    description: "Лучшие отели региона, VIP-трансферы, персональный гид.",
  },
];

export const DIFFICULTY_DOT_COUNT: Record<DifficultyLevel, number> = {
  Лёгкая: 1,
  Умеренная: 2,
  Средняя: 3,
  Высокая: 4,
  Экстремальная: 5,
};

export const COMFORT_DOT_COUNT: Record<ComfortLevel, number> = {
  "Без проживания": 0,
  Базовый: 1,
  Стандарт: 2,
  Комфорт: 3,
  Премиум: 4,
  Люкс: 5,
};

export const COMFORT_INFO_ITEMS = COMFORT_LEVELS.map(({ level, description }) => ({
  level,
  description,
  scale: COMFORT_DOT_COUNT[level],
}));

export function primaryComfortLevel(levels: ComfortLevel[]): ComfortLevel {
  if (!levels.length) return "Комфорт";

  const housed = levels.filter((level) => level !== "Без проживания");
  if (!housed.length) return "Без проживания";

  return housed.reduce((best, level) =>
    COMFORT_DOT_COUNT[level] > COMFORT_DOT_COUNT[best] ? level : best
  );
}

export const DEFAULT_IGUAZU_DIFFICULTY_DESCRIPTION = `**Сложность программы**
• Маршрут включает прогулки по оборудованным дорожкам, лестницам и смотровым площадкам.
• Возможны участки с неровным покрытием и подъёмами.
• Часть маршрута проходит под открытым солнцем, возможна повышенная влажность.

**Меры предосторожности**
• Рекомендуем нескользящую обувь и лёгкую непромокаемую одежду.
• Возьмите воду, головной убор и солнцезащитный крем.
• Следуйте указаниям гида на смотровых площадках.

**Особенности, которые могут представлять опасность**
1. Скользкие участки после дождя.
2. Высокая инсоляция в дневные часы.
3. Повышенная влажность в зоне водопадов.

Мы адаптируем темп прогулки под состав группы и заранее предупреждаем о сложных участках маршрута.`;
