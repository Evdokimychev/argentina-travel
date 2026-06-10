import type { GuidePillarContent } from "@/types/guide-pillar";
import {
  IMMIGRATION_BIRTH,
  IMMIGRATION_CITIZENSHIP,
  IMMIGRATION_LIFE_IN_COUNTRY,
  IMMIGRATION_OPPORTUNITIES,
  IMMIGRATION_PROCESS,
  IMMIGRATION_RESIDENCY,
  IMMIGRATION_USEFUL_LINKS,
} from "@/data/immigration-topic-content";
function topicHref(slug: string) {
  return `/immigration/${slug}`;
}

function hubCta(label: string, href: string) {
  return { label, href, variant: "secondary" as const };
}

export const IMMIGRATION_PILLARS: Record<string, GuidePillarContent> = {
  "zhizn-v-strane": {
    heroTitle: "Жизнь в Аргентине",
    heroSubtitle: IMMIGRATION_LIFE_IN_COUNTRY.intro,
    heroCtas: [
      { label: "Где жить", href: "/guide/gde-zhit", variant: "primary" },
      hubCta("Процесс иммиграции", topicHref("protsess-immigratsii")),
      { label: "Полный справочник", href: "/immigration", variant: "tertiary" },
    ],
    quickFacts: [
      { emoji: "🏙", label: "Буэнос-Айрес", headline: "Мегаполис с инфраструктурой", detail: "Palermo, Recoleta, Belgrano — популярны у экспатов" },
      { emoji: "🌡", label: "Климат", headline: "От субтропиков до Патагонии", detail: "Можно выбрать свой микроклимат по всей стране" },
      { emoji: "🏥", label: "Медицина", headline: "Экстренная помощь бесплатна", detail: "Плановая — через prepaga или частные клиники" },
      { emoji: "🌐", label: "Сообщество", headline: "Активные expat-чаты", detail: "Русско- и англоязычные группы, коворкинги, школы" },
    ],
    sections: [
      {
        id: "overview",
        title: "Почему Аргентина для жизни",
        content: IMMIGRATION_LIFE_IN_COUNTRY.intro,
      },
    ],
    faq: [
      {
        question: "Нужен ли DNI и как его получить?",
        answer:
          "DNI выдаёт Renaper после одобрения residencia. Нужен для банков, аренды, медицины и контрактов. Запись — через портал Renaper, отдельно от Migraciones.",
      },
      {
        question: "Подходит ли Аргентина цифровым кочевникам?",
        answer:
          "Да, есть отдельное основание для remote workers с подтверждённым доходом из-за рубежа. Требования включают контракт или справку о работе, минимальный доход и страховку.",
      },
    ],
    partnerServices: [],
    blogLinks: [
      { title: "Где жить", href: "/guide/gde-zhit", description: "Районы, аренда, быт" },
      { title: "Погода и сезоны", href: "/guide/pogoda-i-sezonnost" },
      { title: "Экономика и деньги", href: "/guide/ekonomika-i-dengi" },
    ],
  },
  "protsess-immigratsii": {
    heroTitle: "Процесс иммиграции",
    heroSubtitle: IMMIGRATION_PROCESS.intro,
    heroCtas: [
      { label: "Открыть RADEX", href: IMMIGRATION_PROCESS.radexPortalUrl, variant: "primary", external: true },
      hubCta("ВНЖ и ПМЖ", topicHref("vnzh-i-pmzh")),
      { label: "Документы для въезда", href: "/immigration/dokumenty-dlya-vyezda", variant: "tertiary" },
    ],
    quickFacts: [
      { emoji: "🛂", label: "Турист → резидент", headline: "Смена статуса в стране", detail: "Подача Radication в Migraciones без обязательного выезда" },
      { emoji: "⚠️", label: "DNU 366/2025", headline: "Страховка и контроль въезда", detail: "Проверяйте актуальные требования перед поездкой" },
      { emoji: "📋", label: "RADEX", headline: "Онлайн-портал Migraciones", detail: "Запись, подача документов и precaria" },
      { emoji: "📜", label: "Апостиль", headline: "2–8 недель на легализацию", detail: "Закладывайте срок до истечения туристического штампа" },
    ],
    sections: [
      {
        id: "overview",
        title: "Типичный сценарий",
        content: IMMIGRATION_PROCESS.intro,
      },
    ],
    faq: [
      {
        question: "Можно ли получить ВНЖ в Аргентине, приехав как турист?",
        answer:
          "Да — большинство оснований для residencia temporaria оформляют уже в стране через RADEX, без консульской визы. Важно легально въехать, не нарушать срок туристического пребывания и собрать пакет по выбранному основанию.",
      },
      {
        question: "Что такое DNU 366/2025 и как он влияет на въезд?",
        answer:
          "Декрет ужесточил требования к туристическому въезду: обязательная медстраховка на весь срок, более строгая проверка документов и цели визита. На residencia напрямую не распространяется, но первый контакт с Migraciones проходит по новым правилам.",
      },
      {
        question: "Что такое RADEX и как им пользоваться?",
        answer:
          "RADEX — онлайн-портал Migraciones для записи на приём, подачи заявлений на residencia, precaria и продлений. Нужна регистрация, загрузка сканов и оплата пошлин. Слоты на запись бывают дефицитными.",
      },
      {
        question: "Что такое precaria?",
        answer:
          "Временное разрешение на пребывание после подачи на residencia, пока рассматривается заявление. Даёт право легально находиться в стране; условия зависят от типа дела.",
      },
      {
        question: "Можно ли работать на туристическом статусе?",
        answer:
          "Нет. Туристический штамп не даёт права на оплачиваемую работу. Для легальной занятости нужен соответствующий тип residencia или разрешение через работодателя.",
      },
    ],
    partnerServices: [],
    blogLinks: [
      { title: "Документы для въезда", href: "/immigration/dokumenty-dlya-vyezda" },
      { title: "Визы для туристов", href: "/immigration/vizy-dlya-turistov" },
      { title: "Документы на границе", href: "/guide/kak-dobratsya#entry-docs" },
    ],
  },
  "rody-v-argentine": {
    heroTitle: "Роды в Аргентине",
    heroSubtitle: IMMIGRATION_BIRTH.intro,
    heroCtas: [
      hubCta("ВНЖ и ПМЖ", topicHref("vnzh-i-pmzh")),
      hubCta("Гражданство", topicHref("grazhdanstvo")),
      { label: "Процесс иммиграции", href: topicHref("protsess-immigratsii"), variant: "tertiary" },
    ],
    quickFacts: [
      { emoji: "👶", label: "Jus soli", headline: "Гражданство ребёнку при рождении", detail: "Независимо от гражданства родителей" },
      { emoji: "👨‍👩‍👧", label: "Родители", headline: "Residencia по padre/madre de argentino", detail: "Ускоренный путь к permanente" },
      { emoji: "🏥", label: "Роды", headline: "Гос. и частные клиники", detail: "BA, Córdoba, Mendoza — плановые роды в частных центрах" },
      { emoji: "📄", label: "Документы", headline: "Acta de nacimiento → DNI → Migraciones", detail: "Регистрация в Registro Civil и Renaper" },
    ],
    sections: [
      {
        id: "overview",
        title: "Jus soli и residencia родителям",
        content: IMMIGRATION_BIRTH.intro,
      },
    ],
    faq: [
      {
        question: "Даёт ли рождение ребёнка в Аргентине гражданство?",
        answer:
          "Да — по принципу jus soli ребёнок, рождённый на территории Аргентины, получает гражданство. Родители могут оформить residencia по основанию padre/madre de argentino — это одно из популярных семейных оснований.",
      },
    ],
    partnerServices: [],
    blogLinks: [
      { title: "Гражданство", href: topicHref("grazhdanstvo") },
      { title: "ВНЖ и ПМЖ", href: topicHref("vnzh-i-pmzh") },
    ],
  },
  grazhdanstvo: {
    heroTitle: "Гражданство Аргентины",
    heroSubtitle: IMMIGRATION_CITIZENSHIP.intro,
    heroCtas: [
      hubCta("ВНЖ и ПМЖ", topicHref("vnzh-i-pmzh")),
      { label: "Полный справочник", href: "/immigration", variant: "secondary" },
      { label: "Запросить контакты", href: "/contacts", variant: "tertiary" },
    ],
    quickFacts: [
      { emoji: "📘", label: "Пасport AR", headline: "Безвиз ~170 стран", detail: "Шенген, Великобритания, Япония и LatAm" },
      { emoji: "⏱", label: "Срок", headline: "~2 года после permanente", detail: "При непрерывном легальном проживании" },
      { emoji: "📝", label: "Экзамены", headline: "Испанский + Conocer Argentina", detail: "Подготовка 3–12 месяцев" },
      { emoji: "🗳", label: "Права", headline: "Голосование и работа без ограничений", detail: "Двойное гражданство — по законам вашей страны" },
    ],
    sections: [
      {
        id: "overview",
        title: "Путь к паспорту",
        content: IMMIGRATION_CITIZENSHIP.intro,
      },
    ],
    faq: [
      {
        question: "Через сколько лет можно получить гражданство?",
        answer:
          "При непрерывном легальном проживании — обычно 2 года с момента одобрения permanente (или с даты въезда по некоторым основаниям). Нужны испанский язык, экзамен «Conocer Argentina», отсутствие судимостей.",
      },
      {
        question: "Даёт ли аргентинский паспорт безвизовый режим?",
        answer:
          "Да — паспорт Аргентины открывает безвиз или visa on arrival примерно в 170 стран, включая Шенген, Великобританию, Японию и большинство Латинской Америки.",
      },
    ],
    partnerServices: [],
    blogLinks: [
      { title: "ВНЖ и ПМЖ", href: topicHref("vnzh-i-pmzh") },
      { title: "Роды в Аргентине", href: topicHref("rody-v-argentine") },
    ],
  },
  "vnzh-i-pmzh": {
    heroTitle: "ВНЖ и ПМЖ Аргентины",
    heroSubtitle: IMMIGRATION_RESIDENCY.intro,
    heroCtas: [
      { label: "Обзор видов ВНЖ", href: "/immigration/obzor-vnzh", variant: "primary" },
      hubCta("Процесс иммиграции", topicHref("protsess-immigratsii")),
      hubCta("Возможности", topicHref("vozmozhnosti")),
    ],
    quickFacts: [
      { emoji: "🌎", label: "14 оснований", headline: "От digital nomad до family", detail: "Rentista, trabajo, estudiante и другие категории" },
      { emoji: "📄", label: "Temporaria", headline: "ВНЖ до 3 лет", detail: "DNI, банки, аренда, работа по основанию" },
      { emoji: "🏡", label: "Permanente", headline: "ПМЖ после 3 лет temporaria", detail: "Или по особым основаниям (padre de argentino)" },
      { emoji: "⏳", label: "Precaria", headline: "Временное разрешение", detail: "Пока рассматривается заявление на residencia" },
    ],
    sections: [
      {
        id: "overview",
        title: "Temporaria и permanente",
        content: IMMIGRATION_RESIDENCY.intro,
      },
    ],
    faq: [
      {
        question: "Сколько оснований для ВНЖ существует в Аргентине?",
        answer:
          "Закон предусматривает 14 категорий residencia temporaria — от rentista и цифрового кочевника до работы, учёбы, инвестиций и семейных оснований. Актуальный список публикует Dirección Nacional de Migraciones.",
      },
      {
        question: "Чем отличается temporaria от permanente?",
        answer:
          "Temporaria выдаётся на срок до 3 лет по конкретному основанию. Permanente — после 3 лет непрерывной temporaria или по особым основаниям (например, родитель аргентинского ребёнка). Permanente не требует ежегодного продления по тому же пункту.",
      },
      {
        question: "Rentista — сколько нужно дохода?",
        answer:
          "Требуется доказать стабильный пассивный доход из-за рубежа (аренда, дивиденды, пенсия). Порог устанавливает Migraciones и пересматривается — сверяйте актуальную сумму на момент подачи.",
      },
    ],
    partnerServices: [],
    blogLinks: [
      { title: "Обзор видов ВНЖ", href: "/immigration/obzor-vnzh" },
      { title: "Возможности", href: topicHref("vozmozhnosti") },
    ],
  },
  vozmozhnosti: {
    heroTitle: "Возможности иммиграции",
    heroSubtitle: IMMIGRATION_OPPORTUNITIES.intro,
    heroCtas: [
      hubCta("ВНЖ и ПМЖ", topicHref("vnzh-i-pmzh")),
      { label: "Обзор ВНЖ", href: "/immigration/obzor-vnzh", variant: "secondary" },
      { label: "Запросить контакты", href: "/contacts", variant: "tertiary" },
    ],
    quickFacts: [
      { emoji: "💰", label: "Rentista", headline: "Пассивный доход из-за рубежа", detail: "Популярный путь для релокантов" },
      { emoji: "💻", label: "Nómada digital", headline: "Remote work + страховка", detail: "Отдельное основание для кочевников" },
      { emoji: "👶", label: "Padre de argentino", headline: "Рождение ребёнка в AR", detail: "Ускоренный путь к permanente" },
      { emoji: "🌎", label: "Mercosur", headline: "Упрощённый режим", detail: "Для граждан стран Mercosur" },
    ],
    sections: [
      {
        id: "overview",
        title: "Выбор основания",
        content: IMMIGRATION_OPPORTUNITIES.intro,
      },
    ],
    faq: [
      {
        question: "Подходит ли Аргентина цифровым кочевникам?",
        answer:
          "Да, есть отдельное основание для remote workers с подтверждённым доходом из-за рубежа. Требования включают контракт или справку о работе, минимальный доход и страховку.",
      },
      {
        question: "Rentista — сколько нужно дохода?",
        answer:
          "Требуется доказать стабильный пассивный доход из-за рубежа (аренда, дивиденды, пенсия). Порог устанавливает Migraciones и пересматривается — сверяйте актуальную сумму на момент подачи.",
      },
    ],
    partnerServices: [],
    blogLinks: [
      { title: "Обзор видов ВНЖ", href: "/immigration/obzor-vnzh" },
      { title: "Роды в Аргентине", href: topicHref("rody-v-argentine") },
    ],
  },
  "poleznye-ssylki": {
    heroTitle: "Полезные ссылки",
    heroSubtitle: IMMIGRATION_USEFUL_LINKS.intro,
    heroCtas: [
      { label: "Migraciones", href: "https://www.migraciones.gob.ar", variant: "primary", external: true },
      { label: "RADEX", href: "https://tramites.migraciones.gob.ar", variant: "secondary", external: true },
      { label: "Полный справочник", href: "/immigration", variant: "tertiary" },
    ],
    quickFacts: [
      { emoji: "🏛", label: "Migraciones", headline: "Официальные правила", detail: "migraciones.gob.ar — первоисточник" },
      { emoji: "📋", label: "RADEX", headline: "Онлайн-trámites", detail: "tramites.migraciones.gob.ar" },
      { emoji: "🪪", label: "Renaper", headline: "DNI после residencia", detail: "argentina.gob.ar/interior/renaper" },
      { emoji: "📰", label: "Boletín Oficial", headline: "Декреты и нормы", detail: "boletinoficial.gob.ar" },
    ],
    sections: [
      {
        id: "overview",
        title: "Где проверять правила",
        content: IMMIGRATION_USEFUL_LINKS.intro,
        infoBoxes: [
          {
            variant: "warning",
            title: "Не заменяет юриста",
            body: "Официальные порталы — первоисточник. Перед подачей проконсультируйтесь с abogado migratorio.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "Где проверить актуальные правила?",
        answer:
          "Официально: migraciones.gob.ar, tramites.migraciones.gob.ar, boletín oficial, консульство Аргентины. Наш справочник не заменяет юриста — перед решениями сверяйтесь с первоисточниками.",
      },
    ],
    partnerServices: [],
    blogLinks: IMMIGRATION_USEFUL_LINKS.articles.map((link) => ({
      title: link.title,
      href: link.href,
      description: link.description,
    })),
  },
};

export function getImmigrationPillarBySlug(slug: string): GuidePillarContent | undefined {
  return IMMIGRATION_PILLARS[slug];
}
