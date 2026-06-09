import { DifficultyLevel, ComfortLevel } from "@/types";

export const DIFFICULTY_LEVELS: {
  level: DifficultyLevel;
  description: string;
}[] = [
  {
    level: "Лёгкая",
    description:
      "Минимальная физическая нагрузка. Короткие прогулки, передвижение преимущественно на транспорте.",
  },
  {
    level: "Умеренная",
    description:
      "Лёгкие пешие прогулки до 5 км в день. Подходит для начинающих путешественников.",
  },
  {
    level: "Средняя",
    description:
      "Пешие маршруты 5–10 км в день, возможны подъёмы. Требуется базовая физическая подготовка.",
  },
  {
    level: "Высокая",
    description:
      "Интенсивные треккинги, длительные переходы, высокогорье. Нужна хорошая физическая форма.",
  },
  {
    level: "Экстремальная",
    description:
      "Экстремальные условия, многодневные походы. Только для опытных путешественников.",
  },
];

export const COMFORT_LEVELS: {
  level: ComfortLevel;
  description: string;
}[] = [
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
  Базовый: 1,
  Стандарт: 2,
  Комфорт: 3,
  Премиум: 4,
  Люкс: 5,
};
