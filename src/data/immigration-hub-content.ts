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
    question: "Можно ли начать оформление residencia после туристического въезда?",
    answer:
      "Заявления о radicación внутри Аргентины начинаются через RADEX. Возможность смены категории и решение зависят от основания и документов; туристический въезд не гарантирует ВНЖ.",
  },
  {
    question: "Сколько оснований для temporaria в статье 23?",
    answer:
      "После добавления reunificación familiar (ñ) статья 23 Ley 25.871 содержит 15 подкатегорий a–ñ. Цифровой кочевник — отдельная transitoria по Disposición 758/2022, а не шестнадцатое основание temporaria.",
  },
  {
    question: "Через сколько можно подать на натурализацию?",
    answer:
      "Действующая Ley 346 требует два года непрерывного законного проживания непосредственно перед заявлением. Непрерывность означает отсутствие выездов; precaria в этот срок не входит.",
  },
  {
    question: "Чем temporaria отличается от permanente?",
    answer:
      "Temporaria выдаётся на ограниченный срок по конкретной подкатегории. Permanente не имеет даты окончания, но может быть отменена по статье 62, в том числе при отсутствии в стране один год или более без применимого исключения или разрешения DNM.",
  },
  {
    question: "Нужно ли показывать медицинскую страховку на границе?",
    answer:
      "Decreto 366/2025 предусмотрел страховку и декларацию цели, но статья 123 bis связывает обязательность с введением регламента. Перед поездкой проверьте, не опубликован ли он. Полис всё равно разумно оформить.",
  },
  {
    question: "Что такое RADEX?",
    answer:
      "Это официальный портал DNM, через который начинаются заявления о radicación в Аргентине. Выберите категорию на странице «Residencias», затем следуйте требованиям именно своего trámite.",
  },
  {
    question: "Получает ли ребёнок гражданство при рождении?",
    answer:
      "Ребёнок, родившийся в Аргентине, является гражданином по рождению, кроме установленного Ley 346 исключения для детей иностранных дипломатов. Статус родителей оформляется отдельно.",
  },
  {
    question: "Можно ли работать как турист?",
    answer:
      "Туристическая категория сама по себе не разрешает оплачиваемую или приносящую доход деятельность. Нужен статус, допускающий конкретную работу.",
  },
  {
    question: "Что даёт precaria?",
    answer:
      "Действующая precaria разрешает пребывание, выезд и въезд, работу и учёбу. Она может выдаваться до 90 дней и продлеваться по решению DNM, но не гарантирует одобрение и не считается стажем для permanente или гражданства.",
  },
  {
    question: "Цифровой кочевник — это ВНЖ?",
    answer:
      "Нет. Disposición 758/2022 устанавливает transitoria до 180 дней с одной возможной prórroga на срок первоначального разрешения.",
  },
  {
    question: "Когда можно перейти на permanente по сроку?",
    answer:
      "DNM указывает два года действующей temporaria для граждан MERCOSUR и три года для остальных, с пребыванием в стране более половины разрешённого срока. Проверьте карточку своего критерия перед подачей.",
  },
  {
    question: "Где проверять действующие правила?",
    answer:
      "Начните с argentina.gob.ar/migraciones/residencias, официального FAQ DNM и актуальных текстов Ley 25.871, Ley 346 и Decreto 366/2025. Ссылки собраны в разделе «Официальные источники».",
  },
];

export const IMMIGRATION_HUB: Omit<ImmigrationHubContent, "heroImage"> = {
  heroTitle: "Иммиграция в Аргентину",
  heroSubtitle:
    "Понятный справочник по въезду, residencia, гражданству и семейным вопросам — с официальными источниками и без обещаний результата.",
  heroCtas: [
    { label: "🏠 Жизнь в стране", href: "/immigration/zhizn-v-strane", variant: "primary" },
    { label: "📋 ВНЖ и ПМЖ", href: "/immigration/vnzh-i-pmzh", variant: "secondary" },
    { label: "🇦🇷 Гражданство", href: "/immigration/grazhdanstvo", variant: "secondary" },
    { label: "🔗 Официальные источники", href: "/immigration/poleznye-ssylki", variant: "tertiary" },
  ],
  quickFacts30: [
    { emoji: "🌎", label: "Статья 23", headline: "15 оснований для temporaria", detail: "Подкатегории a–ñ; соответствие проверяет DNM" },
    { emoji: "⏱", label: "Натурализация", headline: "2 года без выездов", detail: "Только непрерывное законное проживание; precaria не считается" },
    { emoji: "📋", label: "RADEX", headline: "Старт radicación", detail: "Официальный портал DNM для заявлений внутри страны" },
    { emoji: "⏳", label: "Precaria", headline: "До 90 дней", detail: "Разрешает работу и учёбу, но не гарантирует решение" },
    { emoji: "💻", label: "Цифровой кочевник", headline: "Transitoria до 180 дней", detail: "Одна возможная prórroga; это не temporaria" },
    { emoji: "👶", label: "Рождение", headline: "Гражданство ребёнка", detail: "Статус родителей оформляется отдельно" },
    { emoji: "🧳", label: "Отсутствие", headline: "6 месяцев / 1 год", detail: "Пороги отмены temporaria / permanente по статье 62" },
    { emoji: "📅", label: "Дата проверки", headline: "17.07.2026", detail: "Перед действием откройте источники заново" },
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
      description: "Город, медицина, жильё и повседневные документы",
      teaser: IMMIGRATION_LIFE_IN_COUNTRY.intro,
      href: "/immigration/zhizn-v-strane",
    },
    {
      id: "immigration-process",
      emoji: "🛂",
      title: "Процесс иммиграции",
      description: "Въезд, RADEX, документы и precaria",
      teaser: IMMIGRATION_PROCESS.intro,
      href: "/immigration/protsess-immigratsii",
    },
    {
      id: "birth",
      emoji: "👶",
      title: "Роды в Аргентине",
      description: "Гражданство ребёнка и отдельный статус родителей",
      teaser: IMMIGRATION_BIRTH.intro,
      href: "/immigration/rody-v-argentine",
    },
    {
      id: "citizenship",
      emoji: "🇦🇷",
      title: "Гражданство",
      description: "Два года без выездов и цифровая подача в DNM",
      teaser: IMMIGRATION_CITIZENSHIP.intro,
      href: "/immigration/grazhdanstvo",
    },
    {
      id: "residency",
      emoji: "📋",
      title: "ВНЖ и ПМЖ",
      description: "Категории, продление, отсутствие и permanente",
      teaser: IMMIGRATION_RESIDENCY.intro,
      href: "/immigration/vnzh-i-pmzh",
    },
    {
      id: "opportunities",
      emoji: "💡",
      title: "Выбор категории",
      description: "Доход, работа, учёба, семья и MERCOSUR",
      teaser: IMMIGRATION_OPPORTUNITIES.intro,
      href: "/immigration/vozmozhnosti",
    },
    {
      id: "useful-links",
      emoji: "🔗",
      title: "Официальные источники",
      description: "DNM, RADEX, законы и действующие процедуры",
      teaser: "Ссылки на официальные категории DNM, RADEX, Ley 25.871, Ley 346 и Decreto 366/2025 с датой проверки.",
      href: "/immigration/poleznye-ssylki",
    },
  ],
  warnings: [
    "Решение по residencia или гражданству принимает DNM. Сайт не обещает одобрение и не заменяет консультацию по конкретному делу.",
    "Не используйте туристический статус для оплачиваемой деятельности; сначала проверьте категорию, которая разрешает вашу работу.",
    "Не считайте precaria уже одобренной residencia или стажем для permanente и натурализации.",
    "Проверено 21.08.2026: https://www.argentina.gob.ar/migraciones/residencias и https://www.argentina.gob.ar/normativa/nacional/decreto-366-2025-413297/texto",
  ],
  faq: FAQ,
  disclaimer:
    "Справочник носит информационный характер. Перед поездкой или подачей проверьте актуальную карточку trámite DNM, тексты норм и обстоятельства своего дела.",
};
