/** 0 = не подходит, 1 = с ограничениями, 2 = хорошо, 3 = настоятельно рекомендуем */
export type SeasonScore = 0 | 1 | 2 | 3;

export const SEASON_SCORE_LABELS: Record<SeasonScore, string> = {
  3: "Настоятельно рекомендуем",
  2: "Отлично подходит",
  1: "Возможно с ограничениями",
  0: "Неподходящее время",
};

export const SEASON_MONTH_LABELS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
] as const;

export const SEASON_MONTH_SHORT = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
] as const;

export type SeasonMatrixRow = {
  id: string;
  name: string;
  href: string;
  tag?: string;
  /** Индекс 0 = январь */
  scores: SeasonScore[];
  /** Подсказки по месяцам (если есть — показываются в tooltip) */
  tips?: Partial<Record<number, string>>;
  summary?: string;
};

export const ARGENTINA_SEASON_MATRIX: SeasonMatrixRow[] = [
  {
    id: "ba",
    name: "Буэнос-Айрес",
    href: "/destinations/ba",
    tag: "Столица",
    summary: "Комфортны весна и осень; летом жарко и влажно, зимой прохладно.",
    scores: [2, 2, 3, 3, 3, 2, 2, 2, 3, 3, 3, 2],
    tips: {
      0: "Высокий сезон, +28…+36 °C, много туристов",
      2: "Идеальная осень: +18…+26 °C, меньше жары",
      5: "Зимние каникулы — оживлённый город, +10…+17 °C",
      10: "Весна перед летом — один из лучших месяцев",
    },
  },
  {
    id: "uruguay",
    name: "Уругвай (из BA)",
    href: "/guide/kak-dobratsya",
    tag: "Комбо",
    summary: "Колония, Montevideo, Punta del Este — удобно совместить с Буэнос-Айресом.",
    scores: [2, 2, 3, 3, 3, 2, 1, 2, 3, 3, 3, 2],
    tips: {
      0: "Пляжный сезон на побережье Río de la Plata",
      6: "Прохладнее на побережье, меньше пляжной активности",
    },
  },
  {
    id: "iguazu",
    name: "Водопады Игуасу",
    href: "/destinations/iguazu",
    tag: "Природа",
    summary: "Максимум воды летом; комфортнее ходить по тропам весной и осенью.",
    scores: [1, 2, 3, 3, 3, 2, 2, 2, 3, 3, 2, 1],
    tips: {
      1: "Много воды, но жара +35 °C и комары",
      4: "Баланс воды и комфорта на тропах",
      11: "Сезон дождей — полные водопады, но влажно",
    },
  },
  {
    id: "beaches",
    name: "Аргентинские пляжи",
    href: "/places/mar-del-plata",
    tag: "Лето",
    summary: "Mar del Plata, Pinamar — классический летний отдых (дек–фев).",
    scores: [3, 3, 2, 1, 0, 0, 0, 0, 1, 2, 2, 3],
    tips: {
      0: "Пик пляжного сезона на Атлантике",
      4: "Off-season, многие сервисы закрыты",
      9: "Начало сезона, ещё прохладная вода",
    },
  },
  {
    id: "salta",
    name: "Сальта и Jujuy",
    href: "/destinations/salta",
    tag: "Северо-запад",
    summary: "Горы и каньоны — весна и осень; летом жарко, зимой холодные ночи.",
    scores: [1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1],
    tips: {
      0: "Жара в долинах, грозы",
      4: "Сухо, комфортно для Quebrada de Humahuaca",
      6: "Прохладные ночи на высоте, мало туристов",
    },
  },
  {
    id: "mendoza",
    name: "Мендоса",
    href: "/destinations/mendoza",
    tag: "Вино",
    summary: "Винодельни и Анды — весна (сбор) и осень особенно хороши.",
    scores: [2, 2, 3, 3, 3, 2, 2, 2, 3, 3, 2, 2],
    tips: {
      2: "Vendimia — винный сезон",
      3: "Сбор урожая, дегустации",
      0: "Жарко в долине (+33 °C), но сухо",
    },
  },
  {
    id: "bariloche",
    name: "Барилоче",
    href: "/destinations/bariloche",
    tag: "Озёра",
    summary: "Лето — озёра и треккинг; зима — Cerro Catedral.",
    scores: [3, 3, 2, 1, 0, 0, 3, 1, 2, 2, 3, 3],
    tips: {
      0: "Пик сезона на озёре Nahuel Huapi",
      6: "Горнолыжный сезон Cerro Catedral",
      4: "Межсезонье, часть активностей закрыта",
    },
  },
  {
    id: "calafate",
    name: "Эль-Калафате",
    href: "/destinations/calafate",
    tag: "Патагония",
    summary: "Перито-Морено и ледники — ноябрь–март.",
    scores: [3, 3, 2, 2, 1, 0, 0, 0, 1, 2, 3, 3],
    tips: {
      0: "Открыты все смотровые площадки ледника",
      5: "Короткий день, часть сервисов на минимуме",
      10: "Старт сезона, меньше туристов чем в январе",
    },
  },
  {
    id: "ushuaia",
    name: "Ушуайя",
    href: "/destinations/ushuaia",
    tag: "Край света",
    summary: "Tierra del Fuego — короткое лето, зимой круизы и снег.",
    scores: [3, 3, 2, 1, 0, 0, 1, 0, 1, 2, 3, 3],
    tips: {
      0: "Круизы в пролив Beagle, длинный световой день",
      6: "Зимние активности, короткий день",
      10: "Начало сезона, ещё прохладно",
    },
  },
  {
    id: "valdes",
    name: "Полуостров Вальдес",
    href: "/places/valdes-peninsula",
    tag: "Киты",
    summary: "Киты — июнь–октябрь; пингвины — сентябрь–март.",
    scores: [2, 2, 2, 1, 1, 3, 3, 3, 3, 3, 2, 2],
    tips: {
      5: "Сезон южных китов (Southern Right Whale)",
      8: "Пик наблюдения китов с лодок",
      0: "Пингвины Magellanic на пляжах",
    },
  },
  {
    id: "ski",
    name: "Горнолыжные курорты",
    href: "/destinations/bariloche",
    tag: "Зима",
    summary: "Bariloche, Chapelco, Las Leñas — июнь–сентябрь.",
    scores: [0, 0, 0, 0, 0, 2, 3, 2, 1, 0, 0, 0],
    tips: {
      6: "Пик снежного покрова в Bariloche",
      5: "Открытие сезона на Cerro Catedral",
      8: "Конец сезона, нестабильный снег",
    },
  },
];

export function getBestDestinationsForMonth(monthIndex: number): SeasonMatrixRow[] {
  return ARGENTINA_SEASON_MATRIX.filter((row) => row.scores[monthIndex] >= 2).sort(
    (a, b) => b.scores[monthIndex] - a.scores[monthIndex]
  );
}

export function getCurrentMonthIndex(): number {
  return new Date().getMonth();
}
