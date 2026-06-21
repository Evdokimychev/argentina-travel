import type { ImmigrationHubContent } from "@/types/immigration-hub";
import { getImmigrationHubHeroImage } from "@/lib/media-resolver";
import {
  IMMIGRATION_BIRTH,
  IMMIGRATION_CITIZENSHIP,
  IMMIGRATION_LIFE_IN_COUNTRY,
  IMMIGRATION_OPPORTUNITIES,
  IMMIGRATION_PROCESS,
  IMMIGRATION_RESIDENCY,
} from "@/data/immigration-topic-content";

const FAQ: ImmigrationHubContent["faq"] = [
  {
    question: "Можно ли получить ВНЖ в Аргентине, приехав как турист?",
    answer:
      "Да — большинство оснований для residencia temporaria оформляют уже в стране через RADEX, без консульской визы. Важно легально въехать, не нарушать срок туристического пребывания и собрать пакет по выбранному основанию.",
  },
  {
    question: "Сколько оснований для ВНЖ существует в Аргентине?",
    answer:
      "15 подкатегорий residencia temporaria в ст. 23 Ley 25.871 (incisos a–ñ), включая reunificación familiar с Decreto 366/2025. Nómada digital — transitoria по Disposición 758/2022, не входит в эту таблицу.",
  },
  {
    question: "Через сколько лет можно получить гражданство?",
    answer:
      "Decreto 366/2025: 2 года непрерывного legal residence без выезда; подача в DNM (не суд). Дела до 29.05.2025 — по старым правилам через суд. Precaria и turista не засчитываются.",
  },
  {
    question: "Чем отличается temporaria от permanente?",
    answer:
      "Temporaria — до 3 лет с prórroga. Permanente — без продления по пункту; отмена при ≥1 годе вне AR. Arraigo для ПМЖ: 2–3 года temporaria, ≥50% времени в стране, не более 6 мес. подряд за границей.",
  },
  {
    question: "Что такое Decreto 366/2025 и как он влияет на въезд?",
    answer:
      "Декрет 366/2025 ужесточил правила въезда: медстраховка и декларация о цели поездки закреплены в законе, но на практике на границе их пока не всегда проверяют. Для подачи на residencia требования строже.",
  },
  {
    question: "Нужна ли медстраховка для въезда?",
    answer:
      "Decreto 366/2025 закрепил требование медстраховки на весь срок пребывания. На границе декларацию пока не всегда запрашивают, но полис рекомендуется иметь — без него плановая помощь в госпиталях оплачивается. Для подачи на ВНЖ страховка обычно входит в пакет документов.",
  },
  {
    question: "Что такое RADEX и как им пользоваться?",
    answer:
      "RADEX — онлайн-портал Migraciones для записи на приём, подачи заявлений на residencia, precaria и продлений. Нужна регистрация, загрузка сканов и оплата пошлин. Слоты на запись бывают дефицитными.",
  },
  {
    question: "Даёт ли рождение ребёнка в Аргентине гражданство?",
    answer:
      "Да — по принципу jus soli ребёнок, рождённый на территории Аргентины, получает гражданство. Родители могут оформить residencia по основанию padre/madre de argentino — это одно из популярных семейных оснований.",
  },
  {
    question: "Можно ли работать на туристическом статусе?",
    answer:
      "Нет. Туристический штамп не даёт права на оплачиваемую работу. Для легальной занятости нужен соответствующий тип residencia или разрешение через работодателя.",
  },
  {
    question: "Что такое precaria?",
    answer:
      "Residencia precaria — до 90 дней, продлевается DNM на период рассмотрения заявления. Даёт легальное пребывание, работу и учёбу, но с Decreto 366/2025 не засчитывается в arraigo для ПМЖ и гражданства.",
  },
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
  {
    question: "Даёт ли аргентинский паспорт безвизовый режим?",
    answer:
      "Да — паспорт Аргентины открывает безвиз или упрощённый въезд (включая визу по прилёте) примерно в 170 стран: Шенген, Япония, большинство Латинской Америки. Для отдельных стран (например, для въезда в Великобританию) может требоваться виза или разрешение — проверяйте перед поездкой.",
  },
  {
    question: "Нужен ли DNI и как его получить?",
    answer:
      "DNI выдаёт Renaper после одобрения residencia. Нужен для банков, аренды, медицины и контрактов. Запись — через портал Renaper, отдельно от Migraciones.",
  },
  {
    question: "Где проверить актуальные правила?",
    answer:
      "Официально: migraciones.gob.ar, tramites.migraciones.gob.ar, boletín oficial, консульство Аргентины. Наш справочник не заменяет юриста — перед решениями сверяйтесь с первоисточниками.",
  },
];

export const IMMIGRATION_HUB: ImmigrationHubContent = {
  heroTitle: "Иммиграция в Аргентину",
  heroSubtitle:
    "Жизнь в стране, ВНЖ и ПМЖ, гражданство, роды и правила въезда — справочно, без юридических гарантий.",
  heroImage: getImmigrationHubHeroImage(),
  heroCtas: [
    { label: "🏠 Жизнь в стране", href: "/immigration/zhizn-v-strane", variant: "primary" },
    { label: "📋 ВНЖ и ПМЖ", href: "/immigration/vnzh-i-pmzh", variant: "secondary" },
    { label: "🇦🇷 Гражданство", href: "/immigration/grazhdanstvo", variant: "secondary" },
    { label: "👶 Роды", href: "/immigration/rody-v-argentine", variant: "tertiary" },
  ],
  quickFacts30: [
    { emoji: "🌎", label: "Открытая страна", headline: "15 оснований для ВНЖ", detail: "Temporaria по Ley 25.871 — от rentista до reunificación familiar" },
    { emoji: "⏱", label: "Путь к гражданству", headline: "~2 года резиденции", detail: "2 года непрерывной легальной резиденции без выездов; ПМЖ заранее не обязателен" },
    { emoji: "🛂", label: "Турист → резидент", headline: "Смена статуса в стране", detail: "Не обязательно выезжать — подача radicación в Migraciones" },
    { emoji: "📘", label: "Паспорт AR", headline: "Безвиз ~170 стран", detail: "После гражданства — сильный проездной документ" },
    { emoji: "💻", label: "Цифровой кочевник", headline: "Транзитный статус 180+180 дней", detail: "Не ВНЖ; доход удалённой работы и страховка (Disposición 758/2022)" },
    { emoji: "👶", label: "Jus soli", headline: "Гражданство ребёнку при рождении", detail: "Ребёнок, рождённый в AR, — гражданин (с нюансами для родителей)" },
    { emoji: "⚠️", label: "Decreto 366/2025", headline: "Страховка и контроль въезда", detail: "Проверяйте актуальные требования перед поездкой" },
    { emoji: "🏥", label: "Медицина", headline: "Экстренная помощь бесплатна", detail: "Плановая — через prepaga или частные клиники" },
  ],
  toc: [
    { id: "quick-30", label: "Кратко за 30 секунд" },
    { id: "hub-overview", label: "Разделы справочника" },
    { id: "topic-summaries", label: "Обзор тем" },
    { id: "faq", label: "Частые вопросы" },
  ],
  hubTopics: [
    {
      id: "life-in-country",
      emoji: "🏠",
      title: "Жизнь в стране",
      description: "Климат, медицина, жильё, продукты и сообщество экспатов",
      teaser: IMMIGRATION_LIFE_IN_COUNTRY.intro,
      href: "/immigration/zhizn-v-strane",
    },
    {
      id: "immigration-process",
      emoji: "🛂",
      title: "Процесс иммиграции",
      description: "Въезд, Decreto 366/2025, RADEX и документы",
      teaser: IMMIGRATION_PROCESS.intro,
      href: "/immigration/protsess-immigratsii",
    },
    {
      id: "birth",
      emoji: "👶",
      title: "Роды в Аргентине",
      description: "Jus soli, гражданство ребёнку и ВНЖ для родителей",
      teaser: IMMIGRATION_BIRTH.intro,
      href: "/immigration/rody-v-argentine",
    },
    {
      id: "citizenship",
      emoji: "🇦🇷",
      title: "Гражданство",
      description: "Административно (DNM), Decreto 366/2025",
      teaser: IMMIGRATION_CITIZENSHIP.intro,
      href: "/immigration/grazhdanstvo",
    },
    {
      id: "residency",
      emoji: "📋",
      title: "ВНЖ и ПМЖ",
      description: "ВНЖ, ПМЖ и 15 оснований",
      teaser: IMMIGRATION_RESIDENCY.intro,
      href: "/immigration/vnzh-i-pmzh",
    },
    {
      id: "opportunities",
      emoji: "💡",
      title: "Возможности",
      description: "Рантье, кочевник, самостоятельно и с сопровождением",
      teaser: IMMIGRATION_OPPORTUNITIES.intro,
      href: "/immigration/vozmozhnosti",
    },
    {
      id: "useful-links",
      emoji: "🔗",
      title: "Полезные ссылки",
      description: "Migraciones, статьи и смежные разделы",
      teaser: "Официальные порталы Migraciones и RADEX, наши статьи о визах и ВНЖ, смежные разделы путеводителя.",
      href: "/immigration/poleznye-ssylki",
    },
  ],
  warnings: [
    "Материалы не являются юридической консультацией — перед подачей проконсультируйтесь с лицензированным миграционным юристом (abogado migratorio).",
    "Не работайте на туристическом статусе — штрафы и депортация.",
    "Следите за сроком туристического штампа: просрочка осложняет легализацию.",
    "Правила Migraciones и миграционного декрета меняются — проверяйте migraciones.gob.ar перед каждым этапом.",
  ],
  faq: FAQ,
  disclaimer:
    "Справочник «Пора в Аргентину» носит информационный характер. Решения принимает Dirección Nacional de Migraciones и судебная система Аргентины.",
};
