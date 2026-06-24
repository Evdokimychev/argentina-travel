import type { ComfortLevel, DifficultyLevel } from "@/types";

export type YouTravelActivityLevel = 1 | 2 | 3 | 4 | 5;
export type YouTravelComfortLevel = 1 | 2 | 3 | 4 | 5;

export type YouTravelGradationLevel = {
  level: number;
  label: string;
  description: string;
};

export const YOUTRAVEL_ACTIVITY_LEVELS: Record<
  YouTravelActivityLevel,
  { label: string; description: string }
> = {
  1: {
    label: "Спокойная",
    description: "Минимум перемещений. Подходит для неспешного отдыха без активных нагрузок.",
  },
  2: {
    label: "Лёгкая",
    description: "Основное время в одной локации с короткими прогулками поблизости.",
  },
  3: {
    label: "Умеренная",
    description: "Несколько локаций и умеренная физическая нагрузка в течение дня.",
  },
  4: {
    label: "Интенсивная",
    description:
      "Постоянные перемещения, периодические долгосрочные пешие вылазки на природу. Желателен опыт походов и активная физическая форма.",
  },
  5: {
    label: "Экстремальная",
    description:
      "Спортивные или экстремальные активности, высокая физическая нагрузка. Нужны навыки и специальное снаряжение.",
  },
};

export const YOUTRAVEL_COMFORT_LEVELS: Record<
  YouTravelComfortLevel,
  { label: string; description: string }
> = {
  1: {
    label: "Палаточный",
    description: "Палатки, базовые условия, минимальный сервис.",
  },
  2: {
    label: "Базовый",
    description: "Хостелы, гостевые дома, простые условия проживания.",
  },
  3: {
    label: "Стандартный",
    description: "Отели 2–3*, двухместные номера с удобствами.",
  },
  4: {
    label: "Комфортный",
    description: "Отели 3–4*, просторные номера, завтраки включены.",
  },
  5: {
    label: "Уникальный",
    description:
      "Проживание в отелях 4* и 5*, в глэмпингах, отелях-бутиках с экстра-обслуживанием. Для тех, кто хочет наслаждаться исключительными условиями отдыха.",
  },
};

/** Подписи комфорта на витрине YouTravel.me (блок «Детали тура»). */
export const YOUTRAVEL_COMFORT_DETAIL_LABELS: Record<YouTravelComfortLevel, string> = {
  1: "Базовый",
  2: "Простой",
  3: "Средний",
  4: "Высокий",
  5: "Уникальный",
};

const INTERNAL_COMFORT_LABEL_TO_DETAIL = Object.fromEntries(
  (Object.keys(YOUTRAVEL_COMFORT_LEVELS) as unknown as YouTravelComfortLevel[]).map((level) => [
    YOUTRAVEL_COMFORT_LEVELS[level].label,
    YOUTRAVEL_COMFORT_DETAIL_LABELS[level],
  ]),
) as Record<string, string>;

const DETAIL_COMFORT_LABELS = new Set(Object.values(YOUTRAVEL_COMFORT_DETAIL_LABELS));

const ACTIVITY_TO_DIFFICULTY: Record<YouTravelActivityLevel, DifficultyLevel> = {
  1: "Лёгкая",
  2: "Лёгкая",
  3: "Умеренная",
  4: "Высокая",
  5: "Экстремальная",
};

const COMFORT_TO_LEVEL: Record<YouTravelComfortLevel, ComfortLevel> = {
  1: "Базовый",
  2: "Базовый",
  3: "Стандарт",
  4: "Комфорт",
  5: "Премиум",
};

export function resolveYouTravelActivityLevel(level: unknown): YouTravelActivityLevel | undefined {
  const parsed = typeof level === "number" ? level : Number.parseInt(String(level ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) return undefined;
  return parsed as YouTravelActivityLevel;
}

export function resolveYouTravelComfortLevel(level: unknown): YouTravelComfortLevel | undefined {
  const parsed = typeof level === "number" ? level : Number.parseInt(String(level ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) return undefined;
  return parsed as YouTravelComfortLevel;
}

/** В API иногда приходит `activity: 2|4|6|8|10` вместо `activity_data.level`. */
export function resolveYouTravelActivityLevelFromPayload(payload: {
  activity_data?: { level?: unknown } | null;
  activity?: unknown;
}): YouTravelActivityLevel | undefined {
  const fromData = resolveYouTravelActivityLevel(payload.activity_data?.level);
  if (fromData) return fromData;

  const rawActivity =
    typeof payload.activity === "number"
      ? payload.activity
      : Number.parseInt(String(payload.activity ?? ""), 10);
  if (
    Number.isFinite(rawActivity) &&
    rawActivity >= 2 &&
    rawActivity <= 10 &&
    rawActivity % 2 === 0
  ) {
    return resolveYouTravelActivityLevel(rawActivity / 2);
  }

  return undefined;
}

export function resolveYouTravelComfortLevelFromPayload(payload: {
  comfort_data?: { level?: unknown } | null;
}): YouTravelComfortLevel | undefined {
  return resolveYouTravelComfortLevel(payload.comfort_data?.level);
}

export function mapYouTravelActivityToDifficulty(level: YouTravelActivityLevel): DifficultyLevel {
  return ACTIVITY_TO_DIFFICULTY[level];
}

export function mapYouTravelActivityToDifficultyLevel(
  level: number | undefined | null,
): DifficultyLevel {
  const resolved = resolveYouTravelActivityLevel(level);
  return resolved ? mapYouTravelActivityToDifficulty(resolved) : "Умеренная";
}

export function mapYouTravelComfortToComfortLevel(level: number | undefined | null): ComfortLevel {
  const resolved = resolveYouTravelComfortLevel(level);
  return resolved ? COMFORT_TO_LEVEL[resolved] : "Стандарт";
}

export function resolveYouTravelActivityGradation(
  level: number | undefined | null,
): YouTravelGradationLevel | undefined {
  const resolved = resolveYouTravelActivityLevel(level);
  if (!resolved) return undefined;
  return { level: resolved, ...YOUTRAVEL_ACTIVITY_LEVELS[resolved] };
}

export function resolveYouTravelComfortGradation(
  level: number | undefined | null,
): YouTravelGradationLevel | undefined {
  const resolved = resolveYouTravelComfortLevel(level);
  if (!resolved) return undefined;
  return { level: resolved, ...YOUTRAVEL_COMFORT_LEVELS[resolved] };
}

/** Подпись комфорта для витрины YouTravel: «Комфортный» → «Высокий» и т.д. */
export function resolveYouTravelComfortDetailLabel(input: {
  level?: number | null;
  fallbackLabel?: string | null;
}): string | undefined {
  const resolved = resolveYouTravelComfortLevel(input.level);
  if (resolved) return YOUTRAVEL_COMFORT_DETAIL_LABELS[resolved];

  const fallback = input.fallbackLabel?.trim();
  if (!fallback) return undefined;

  const normalized = fallback.toLowerCase();
  if (normalized === "комфорт" || normalized === "comfort") return undefined;
  if (DETAIL_COMFORT_LABELS.has(fallback)) return fallback;

  return INTERNAL_COMFORT_LABEL_TO_DETAIL[fallback] ?? fallback;
}

/** Подпись активности для блока «Детали тура». */
export function resolveYouTravelActivityDetailLabel(input: {
  level?: number | null;
  fallbackLabel?: string | null;
}): string | undefined {
  const resolved = resolveYouTravelActivityLevel(input.level);
  if (resolved) return YOUTRAVEL_ACTIVITY_LEVELS[resolved].label;

  const fallback = input.fallbackLabel?.trim();
  if (!fallback) return undefined;

  const normalized = fallback.toLowerCase();
  if (normalized === "активность" || normalized === "activity") return undefined;

  return fallback;
}
