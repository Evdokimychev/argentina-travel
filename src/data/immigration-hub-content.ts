import type { ImmigrationHubContent } from "@/types/immigration-hub";
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
      "Закон предусматривает 14 категорий residencia temporaria — от rentista и цифрового кочевника до работы, учёбы, инвестиций и семейных оснований. Актуальный список публикует Dirección Nacional de Migraciones.",
  },
  {
    question: "Через сколько лет можно получить гражданство?",
    answer:
      "При непрерывном легальном проживании — обычно 2 года с момента одобрения permanente (или с даты въезда по некоторым основаниям). Нужны испанский язык, экзамен «Conocer Argentina», отсутствие судимостей.",
  },
  {
    question: "Чем отличается temporaria от permanente?",
    answer:
      "Temporaria выдаётся на срок до 3 лет по конкретному основанию. Permanente — после 3 лет непрерывной temporaria или по особым основаниям (например, родитель аргентинского ребёнка). Permanente не требует ежегодного продления по тому же пункту.",
  },
  {
    question: "Что такое DNU 366/2025 и как он влияет на въезд?",
    answer:
      "Декрет ужесточил требования к туристическому въезду: обязательная медстраховка на весь срок, более строгая проверка документов и цели визита. На residencia напрямую не распространяется, но первый контакт с Migraciones проходит по новым правилам.",
  },
  {
    question: "Нужна ли медстраховка для въезда?",
    answer:
      "С 2025 года — да, для туристов: полис или travel assistance с покрытием на всей территории Аргентины на весь заявленный срок. Для подачи на ВНЖ страховка также часто входит в пакет документов.",
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
      "Временное разрешение на пребывание после подачи на residencia, пока рассматривается заявление. Даёт право легально находиться в стране; условия зависят от типа дела.",
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
      "Да — паспорт Аргентины открывает безвиз или visa on arrival примерно в 170 стран, включая Шенген, Великобританию, Японию и большинство Латинской Америки.",
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
  heroImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920&q=80",
  heroCtas: [
    { label: "🏠 Жизнь в стране", href: "/immigration/zhizn-v-strane", variant: "primary" },
    { label: "📋 ВНЖ и ПМЖ", href: "/immigration/vnzh-i-pmzh", variant: "secondary" },
    { label: "🇦🇷 Гражданство", href: "/immigration/grazhdanstvo", variant: "secondary" },
    { label: "👶 Роды", href: "/immigration/rody-v-argentine", variant: "tertiary" },
  ],
  quickFacts30: [
    { emoji: "🌎", label: "Открытая страна", headline: "14 оснований для ВНЖ", detail: "От digital nomad до family reunification — выбор под ваш кейс" },
    { emoji: "⏱", label: "Путь к гражданству", headline: "~2 года после permanente", detail: "После 2 лет с ПМЖ — подача на гражданство (сроки уточняйте)" },
    { emoji: "🛂", label: "Турист → резидент", headline: "Смена статуса в стране", detail: "Не обязательно выезжать — подача Radication в Migraciones" },
    { emoji: "📘", label: "Пасport AR", headline: "Безвиз ~170 стран", detail: "После гражданства — сильный travel document" },
    { emoji: "💻", label: "Digital nomad", headline: "Отдельное основание ВНЖ", detail: "Доказательство удалённого дохода и страховки" },
    { emoji: "👶", label: "Jus soli", headline: "Гражданство ребёнку при рождении", detail: "Ребёнок, рождённый в AR, — гражданин (с нюансами для родителей)" },
    { emoji: "⚠️", label: "DNU 366/2025", headline: "Страховка и контроль въезда", detail: "Проверяйте актуальные требования перед поездкой" },
    { emoji: "🏥", label: "Медицина", headline: "Экстренная помощь бесплатна", detail: "Плановая — через prepaga или частные клиники" },
  ],
  toc: [
    { id: "quick-30", label: "Кратко за 30 секунд" },
    { id: "hub-overview", label: "Разделы справочника" },
    { id: "topic-summaries", label: "Обзор тем" },
    { id: "faq", label: "FAQ" },
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
      description: "Въезд, DNU 366/2025, RADEX и документы",
      teaser: IMMIGRATION_PROCESS.intro,
      href: "/immigration/protsess-immigratsii",
    },
    {
      id: "birth",
      emoji: "👶",
      title: "Роды в Аргентине",
      description: "Jus soli, гражданство ребёнку и residencia родителям",
      teaser: IMMIGRATION_BIRTH.intro,
      href: "/immigration/rody-v-argentine",
    },
    {
      id: "citizenship",
      emoji: "🇦🇷",
      title: "Гражданство",
      description: "Паспорт, экзамены, сроки и безвизовый режим",
      teaser: IMMIGRATION_CITIZENSHIP.intro,
      href: "/immigration/grazhdanstvo",
    },
    {
      id: "residency",
      emoji: "📋",
      title: "ВНЖ и ПМЖ",
      description: "Temporaria, permanente и 14 оснований",
      teaser: IMMIGRATION_RESIDENCY.intro,
      href: "/immigration/vnzh-i-pmzh",
    },
    {
      id: "opportunities",
      emoji: "💡",
      title: "Возможности",
      description: "Rentista, nomad, DIY и сопровождение",
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
    "Материалы не являются юридической консультацией — перед подачей проконсультируйтесь с licensed abogado migratorio.",
    "Не работайте на туристическом статусе — штрафы и депортация.",
    "Следите за сроком туристического штампа: просрочка осложняет легализацию.",
    "Правила Migraciones и DNU меняются — проверяйте migraciones.gob.ar перед каждым этапом.",
  ],
  faq: FAQ,
  disclaimer:
    "Справочник «Пора в Аргентину» носит информационный характер. Решения принимает Dirección Nacional de Migraciones и судебная система Аргентины.",
};
