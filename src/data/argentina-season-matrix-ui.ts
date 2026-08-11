/**
 * UI copy for ArgentinaSeasonMatrix — kept separate from score data for future locales.
 */
export const ARGENTINA_SEASON_MATRIX_UI = {
  ariaLabel: "Таблица сезонности по направлениям Аргентины",
  eyebrow: "Ориентир по месяцам",
  planningEyebrow: "Планирование поездки",
  title: "Когда ехать: сводная таблица",
  intro:
    "Ориентир, не прогноз. Выберите месяц или ячейку — увидите подходящие направления.",
  currentMonthPrefix: "Текущий месяц:",
  monthPickerLabel: "Выбор месяца",
  pickMonthHint: "Сначала выберите месяц — появятся подходящие направления.",
  quickScenariosTitle: "Быстрые сценарии",
  quickScenarios: [
    { id: "first-trip", label: "Первая поездка", monthIndex: 10 },
    { id: "patagonia", label: "Патагония", monthIndex: 0 },
    { id: "wildlife", label: "Киты и природа", monthIndex: 8 },
  ],
  showMore: "Показать ещё",
  showLess: "Свернуть",
  destinationCol: "Направление",
  legendTitle: "Обозначения",
  scoreShort: {
    2: "Лучшее окно",
    1: "С оговорками",
    0: "Специальная цель",
  } as const,
  detailCta: "Подробнее о направлении",
  pickCellHint: "Выберите месяц или ячейку — появится подсказка по сезону.",
  suitableIn: "Подходящие в",
  goalRowLabel: "Цель поездки",
  dataNote: "Оценки — редакционный ориентир на основе официальных климатических и туристических данных.",
} as const;
