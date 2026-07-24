export type CommercialSeoLink = {
  title: string;
  description: string;
  href: string;
};

export type CommercialSeoCopy = {
  eyebrow: string;
  title: string;
  description: string;
  links: CommercialSeoLink[];
};

export const TOURS_CATALOG_SEO: CommercialSeoCopy = {
  eyebrow: "Спланировать поездку",
  title: "Как выбрать тур по Аргентине",
  description:
    "Сначала определите регионы и темп поездки, затем сравните программу, даты, язык сопровождения и условия бронирования. Каталог объединяет собственные и партнёрские предложения, поэтому окончательные условия всегда указаны в карточке конкретного тура.",
  links: [
    {
      title: "Туры в Патагонию",
      description: "Ледники, Эль-Калафате, Эль-Чальтен, Ушуайя и маршруты с треккингом.",
      href: "/tours/region/patagonia",
    },
    {
      title: "Экскурсии в Буэнос-Айресе",
      description: "Городские прогулки, история, архитектура, гастрономия и танго.",
      href: "/excursions/city/Buenos_Aires",
    },
    {
      title: "Водопады Игуасу",
      description: "Туры и программы с аргентинской стороной парка, даты и условия.",
      href: "/tours/region/iguazu",
    },
    {
      title: "Интерактивная карта",
      description: "Сопоставьте города, природные места и расстояния между регионами.",
      href: "/mapa-argentina",
    },
  ],
};

export const PATAGONIA_TOURS_SEO: CommercialSeoCopy = {
  eyebrow: "Патагония",
  title: "Как подобрать маршрут по Патагонии",
  description:
    "Патагония занимает огромную территорию, поэтому важнее не число точек, а логичная связка регионов. Сравнивайте продолжительность, сложность, переезды и сезонность; наличие конкретных дат и мест проверяйте в карточке предложения.",
  links: [
    {
      title: "Путеводитель по Патагонии",
      description: "С чего начать подготовку, какие регионы совместить и сколько дней заложить.",
      href: "/guide/patagoniya-s-chego-nachat",
    },
    {
      title: "Регион Патагония",
      description: "Ледники, горные районы, сезонность и основные транспортные узлы.",
      href: "/destinations/patagonia",
    },
    {
      title: "Эль-Чальтен и треккинг",
      description: "База для пеших маршрутов к Фиц-Рою и лагунам национального парка.",
      href: "/places/el-chalten",
    },
    {
      title: "Патагония на карте",
      description: "Оцените расстояния между Барилоче, Эль-Калафате и Ушуайей.",
      href: "/mapa-argentina",
    },
  ],
};

export const IGUAZU_TOURS_SEO: CommercialSeoCopy = {
  eyebrow: "Игуасу",
  title: "Как выбрать программу к водопадам",
  description:
    "Для Игуасу важны сторона парка, число дней и логистика из Буэнос-Айреса или Пуэрто-Игуасу. В каталоге остаются предложения с реальной аргентинской частью маршрута; чисто бразильские и карнавальные программы сюда не попадают.",
  links: [
    {
      title: "Путеводитель по парку",
      description: "Маршруты, стороны границы, сколько дней заложить и как добраться.",
      href: "/blog/natsionalnyy-park-iguasu",
    },
    {
      title: "Регион Игуасу",
      description: "Направление, сезонность и связанные места вокруг водопадов.",
      href: "/destinations/iguazu",
    },
    {
      title: "Водопады на карте мест",
      description: "Точка на карте и соседние локации для короткой поездки.",
      href: "/places/iguazu-falls",
    },
    {
      title: "Экскурсии в Пуэрто-Игуасу",
      description: "Локальные выезды к парку и городским маршрутам.",
      href: "/excursions/city/Puerto_Iguazu",
    },
  ],
};

export const EXCURSIONS_CATALOG_SEO: CommercialSeoCopy = {
  eyebrow: "Экскурсии по стране",
  title: "Экскурсии и местные гиды в Аргентине",
  description:
    "Выберите город, формат прогулки и удобный язык. В каталоге встречаются предложения разных поставщиков: состав группы, доступные даты, порядок подтверждения и оплаты указаны на странице каждой экскурсии.",
  links: [
    {
      title: "Буэнос-Айрес",
      description: "Обзорные маршруты, районы, архитектура, гастрономия и танго.",
      href: "/excursions/city/Buenos_Aires",
    },
    {
      title: "Игуасу",
      description: "Экскурсии к водопадам и маршруты из Пуэрто-Игуасу.",
      href: "/excursions/city/Puerto_Iguazu",
    },
    {
      title: "Ушуайя",
      description: "Огненная Земля, канал Бигл и природные маршруты вокруг города.",
      href: "/excursions/city/Ushuaia",
    },
    {
      title: "Русскоязычные специалисты",
      description: "Гиды и местные эксперты с фильтрами по городу и языку.",
      href: "/experts",
    },
  ],
};

export const EXPERTS_CATALOG_SEO: CommercialSeoCopy = {
  eyebrow: "Помощь на месте",
  title: "Как выбрать русскоязычного гида или эксперта",
  description:
    "Смотрите город, языки, специализацию и описание опыта в профиле. Перед обращением сформулируйте даты и задачу: экскурсия, индивидуальный маршрут или консультация. Отправка запроса не означает автоматического подтверждения услуги.",
  links: [
    {
      title: "Экскурсии по Аргентине",
      description: "Готовые прогулки и активности с условиями в карточке предложения.",
      href: "/excursions",
    },
    {
      title: "Экскурсии в Буэнос-Айресе",
      description: "Подборка городских маршрутов по столице.",
      href: "/excursions/city/Buenos_Aires",
    },
    {
      title: "Туры по Аргентине",
      description: "Многодневные авторские и партнёрские программы.",
      href: "/tours",
    },
    {
      title: "Путеводитель по стране",
      description: "Практические материалы для самостоятельной подготовки.",
      href: "/guide",
    },
  ],
};

const CITY_SEO_COPY: Record<string, CommercialSeoCopy> = {
  buenos_aires: {
    eyebrow: "Столица Аргентины",
    title: "Что учесть при выборе экскурсии в Буэнос-Айресе",
    description:
      "Для первого знакомства подойдёт обзорный маршрут по центру, Реколете, Сан-Тельмо и Ла-Боке. Тематические прогулки помогают глубже разобраться в архитектуре, гастрономии или танго. Язык, место встречи и формат группы проверяйте в карточке экскурсии.",
    links: [
      {
        title: "Путеводитель по Буэнос-Айресу",
        description: "Районы, логистика и идеи для самостоятельных прогулок.",
        href: "/destinations/ba",
      },
      {
        title: "Места Буэнос-Айреса",
        description: "Достопримечательности столицы на одной странице.",
        href: "/places/buenos-aires",
      },
      {
        title: "Русскоязычные гиды",
        description: "Найдите специалиста и уточните язык до отправки запроса.",
        href: "/experts",
      },
      {
        title: "Туры по Аргентине",
        description: "Продолжите поездку за пределами столицы.",
        href: "/tours",
      },
    ],
  },
  puerto_iguazu: {
    eyebrow: "Водопады Игуасу",
    title: "Как выбрать экскурсию к водопадам Игуасу",
    description:
      "Сравните продолжительность, включённый транспорт и сторону национального парка. Для пересечения границы требования зависят от гражданства и могут меняться, поэтому документы нужно проверять по официальным источникам перед поездкой.",
    links: [
      {
        title: "Путеводитель по Игуасу",
        description: "Сезонность, логистика и продолжительность поездки.",
        href: "/destinations/iguazu",
      },
      {
        title: "Водопады на карте",
        description: "Расположение парка и других точек северо-востока Аргентины.",
        href: "/mapa-argentina",
      },
      {
        title: "Место: водопады Игуасу",
        description: "Основные сведения о природной достопримечательности.",
        href: "/places/iguazu-falls",
      },
      {
        title: "Туры с Игуасу",
        description: "Многодневные программы с посещением региона.",
        href: "/tours?query=%D0%98%D0%B3%D1%83%D0%B0%D1%81%D1%83",
      },
    ],
  },
};

function normalizeCitySlug(citySlug: string): string {
  return citySlug.trim().toLowerCase().replace(/[-\s]+/g, "_");
}

export function getExcursionCitySeoCopy(
  citySlug: string,
  cityName: string,
): CommercialSeoCopy {
  return (
    CITY_SEO_COPY[normalizeCitySlug(citySlug)] ?? {
      eyebrow: "Экскурсии по городу",
      title: `Как выбрать экскурсию в ${cityName}`,
      description:
        "Сравните тему маршрута, продолжительность, формат группы и язык проведения. Доступные даты, место встречи, правила отмены и порядок подтверждения указаны в карточке конкретной экскурсии.",
      links: [
        {
          title: "Все экскурсии по Аргентине",
          description: "Вернитесь к каталогу и сравните предложения в других городах.",
          href: "/excursions",
        },
        {
          title: "Русскоязычные специалисты",
          description: "Каталог гидов и местных экспертов с фильтрами.",
          href: "/experts",
        },
        {
          title: "Туры по Аргентине",
          description: "Многодневные программы по регионам страны.",
          href: "/tours",
        },
        {
          title: "Интерактивная карта",
          description: "Места, регионы и маршруты на карте Аргентины.",
          href: "/mapa-argentina",
        },
      ],
    }
  );
}

type ExcursionCitySearchCopy = {
  metadataTitle: string;
  metadataDescription: string;
  heading: string;
  subtitle: string;
};

const CITY_SEARCH_COPY: Record<string, ExcursionCitySearchCopy> = {
  buenos_aires: {
    metadataTitle: "Экскурсии в Буэнос-Айресе: маршруты и местные гиды",
    metadataDescription:
      "Экскурсии в Буэнос-Айресе: обзорные и тематические маршруты, местные гиды, форматы групп и условия бронирования в карточках предложений.",
    heading: "Экскурсии в Буэнос-Айресе",
    subtitle: "Обзорные и тематические прогулки с местными гидами",
  },
  puerto_iguazu: {
    metadataTitle: "Экскурсии на водопады Игуасу из Пуэрто-Игуасу",
    metadataDescription:
      "Экскурсии к водопадам Игуасу: сравните маршруты, продолжительность, транспорт, язык и условия подтверждения перед выбором предложения.",
    heading: "Экскурсии на водопады Игуасу",
    subtitle: "Маршруты из Пуэрто-Игуасу с понятными условиями в карточке",
  },
};

export function getExcursionCitySearchCopy(
  citySlug: string,
  cityName: string,
): ExcursionCitySearchCopy {
  return (
    CITY_SEARCH_COPY[normalizeCitySlug(citySlug)] ?? {
      metadataTitle: `Экскурсии в городе ${cityName}`,
      metadataDescription: `Экскурсии, прогулки и активности в городе ${cityName}, Аргентина. Сравните тему, формат, язык, продолжительность и условия в карточках предложений.`,
      heading: `Экскурсии в городе ${cityName}`,
      subtitle: "Маршруты и активности с местными гидами",
    }
  );
}

const COMMERCIAL_FILTER_PARAMS = new Set([
  "query",
  "q",
  "city",
  "category",
  "language",
  "sort",
  "format",
  "duration",
  "minRating",
  "maxPrice",
  "partner",
  "page",
  "view",
  "dateFrom",
  "dateTo",
]);

export function hasCommercialFilterParams(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  return Object.keys(searchParams).some((key) => COMMERCIAL_FILTER_PARAMS.has(key));
}
