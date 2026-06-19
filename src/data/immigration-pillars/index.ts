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
          "Decreto 366/2025 закрепил требование медстраховки и декларации о цели поездки; на границе их пока не всегда проверяют. Для подачи на residencia требования строже.",
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
      { title: "Гражданство", href: topicHref("grazhdanstvo"), description: "Административно (DNM), DNU 366/2025" },
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
      { emoji: "📘", label: "Паспорт AR", headline: "Безвиз ~170 направлений", detail: "Шенген, Великобритания, Япония и страны Латинской Америки" },
      { emoji: "⏱", label: "Резиденция", headline: "2 года без выезда", detail: "Любой выезд обнуляет срок (366/2025)" },
      { emoji: "🏛", label: "Подача", headline: "DNM / Migraciones", detail: "Административно с окт. 2025; не PJN" },
      { emoji: "🗳", label: "Срок дела", headline: "Не фиксирован", detail: "От месяцев до нескольких лет — уточняйте на migraciones.gob.ar" },
    ],
    sections: [
      {
        id: "overview",
        title: "Натурализация",
        content: IMMIGRATION_CITIZENSHIP.intro,
      },
    ],
    faq: [
      {
        question: "Через сколько можно подать на гражданство?",
        answer:
          "При натурализации — 2 года непрерывной легальной резиденции без выездов. Супруг(а) аргентинца по рождению и родители ребёнка-аргентинца могут подать без периода ожидания — уточняйте на migraciones.gob.ar.",
      },
      {
        question: "Нужен ли ПМЖ перед подачей на гражданство?",
        answer:
          "Для граждан стран вне Mercosur ПМЖ обычно оформляют после 3 лет temporaria, но на гражданство можно подать раньше — при 2 годах резиденции. Это разные процедуры.",
      },
      {
        question: "Как подать документы на гражданство?",
        answer:
          "С октября 2025 новые дела — административно в DNM (не суд). Канал и формы — migraciones.gob.ar. Дела до 29.05.2025 могли идти через федеральный суд.",
      },
      {
        question: "Сколько длится рассмотрение дела?",
        answer:
          "Законом срок может не быть ограничен; на практике — от нескольких месяцев до нескольких лет. Уточняйте на migraciones.gob.ar.",
      },
      {
        question: "Нужны ли экзамены по испанскому или «Conocer Argentina»?",
        answer:
          "Языковые проверки и экзамены по конституции в административном порядке могут применяться — практика после реформы уточняется.",
      },
      {
        question: "Что такое Carta de Ciudadanía?",
        answer:
          "Документ об одобрении naturalización; с ним обращаются в RENAPER за DNI гражданина Аргентины, затем оформляют pasaporte argentino.",
      },
      {
        question: "Даёт ли аргентинский паспорт безвизовый режим?",
        answer:
          "Да — паспорт открывает безвиз, визу по прилёте или электронное разрешение примерно в 170 направлений, включая Шенген, Великобританию, Японию и большинство Латинской Америки.",
      },
      {
        question: "Как Decreto 366/2025 влияет на гражданство?",
        answer:
          "Перевод натурализации в DNM, 2 года строго без выезда, отмена присяги для новых дел. Декрет оспаривается в судах — следите за migraciones.gob.ar.",
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
      hubCta("Гражданство", topicHref("grazhdanstvo")),
      hubCta("Возможности", topicHref("vozmozhnosti")),
    ],
    quickFacts: [
      {
        emoji: "🌎",
        label: "15 оснований",
        headline: "Temporaria по Ley 25.871",
        detail: "Ст. 23 incisos a–ñ, включая reunificación familiar",
      },
      {
        emoji: "📄",
        label: "ВНЖ",
        labelEs: "residencia temporaria",
        headline: "До 3 лет",
        detail: "Prórroga, DNI, arraigo 2–3 года → ПМЖ",
      },
      {
        emoji: "🏡",
        label: "ПМЖ",
        labelEs: "residencia permanente",
        headline: "После arraigo или по семье",
        detail: "Доход и antecedentes — обязательны с 366/2025",
      },
      {
        emoji: "⏳",
        label: "Прекария",
        labelEs: "residencia precaria",
        headline: "До 90 дней",
        detail: "Не засчитывается в срок ПМЖ и гражданства",
      },
    ],
    sections: [
      {
        id: "overview",
        title: "ВНЖ и ПМЖ",
        content: IMMIGRATION_RESIDENCY.intro,
      },
      {
        id: "dnu-note",
        title: "Decreto 366/2025",
        content: IMMIGRATION_RESIDENCY.dnuWarning,
      },
    ],
    faq: IMMIGRATION_RESIDENCY.extendedFaq,
    partnerServices: [],
    blogLinks: [
      { title: "Обзор видов ВНЖ", href: "/immigration/obzor-vnzh" },
      { title: "Процесс иммиграции", href: topicHref("protsess-immigratsii") },
      { title: "Гражданство", href: topicHref("grazhdanstvo"), description: "Административно (DNM), DNU 366/2025" },
      { title: "Роды в Аргентине", href: topicHref("rody-v-argentine") },
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
      {
        emoji: "💰",
        label: "Рантье",
        labelEs: "rentista",
        headline: "Пассивный доход из-за рубежа",
        detail: "Популярный путь для релокантов",
      },
      {
        emoji: "💻",
        label: "Цифровой кочевник",
        labelEs: "nómada digital",
        headline: "Удалённая работа + страховка",
        detail: "Отдельное основание для кочевников",
      },
      {
        emoji: "👶",
        label: "Родитель ребёнка-аргентинца",
        labelEs: "padre/madre de argentino",
        headline: "Рождение ребёнка в AR",
        detail: "Ускоренный путь к ПМЖ",
      },
      {
        emoji: "🌎",
        label: "Гражданин Mercosur",
        labelEs: "mercosur",
        headline: "Упрощённый режим",
        detail: "Для граждан стран Mercosur",
      },
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
      { emoji: "📋", label: "RADEX", headline: "Онлайн-оформление (trámites en línea)", detail: "tramites.migraciones.gob.ar" },
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
