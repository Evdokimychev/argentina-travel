import type { BlogBodyBlock } from "@/types/blog-content-blocks";

/** Representative samples for /admin/editorial-components preview. */
export const EDITORIAL_PREVIEW_SAMPLES: BlogBodyBlock[] = [
  {
    type: "lead",
    text: "Аргентина — страна контрастов: от влажных субтропиков Мисьонеса до ледников Патагонии.",
    variant: "default",
  },
  {
    type: "article-summary",
    title: "Коротко о главном",
    variant: "horizontal-deck",
    items: [
      {
        title: "Когда ехать",
        body: "Юг лучше в южное лето; север — в более прохладные месяцы.",
      },
      {
        title: "Сколько дней",
        body: "На первое знакомство обычно нужно 10–14 дней и один внутренний перелёт.",
      },
      {
        title: "Язык",
        body: "Испанский rioplatense; в туристических зонах часто понимают английский.",
      },
    ],
  },
  {
    type: "photo",
    src: "/media/blog/argentinian-steak-guide/hero.jpg",
    alt: "Стейк на гриле в аргентинской parrilla",
    caption: "Parrilla — и решётка, и мясной ресторан.",
    variant: "landscape",
  },
  {
    type: "callout",
    variant: "tip",
    title: "Совет",
    body: "Для первого стейка закажите Bife de Chorizo a punto — средняя прожарка, понятная большинству туристов.",
  },
  {
    type: "option-selector",
    title: "Какой отруб выбрать",
    description: "Все варианты остаются в HTML — можно листать и без JavaScript.",
    options: [
      {
        id: "bife",
        title: "Bife de Chorizo",
        summary: "Крупный, сочный стейк для первого знакомства.",
        meta: "Классика",
      },
      {
        id: "ojo",
        title: "Ojo de Bife",
        summary: "Аналог рибая: мраморность и насыщенный вкус.",
        meta: "Мраморный",
      },
      {
        id: "entrana",
        title: "Entraña",
        summary: "Ароматный стейк из диафрагмы, любимый местными.",
        meta: "Для гурманов",
      },
    ],
  },
  {
    type: "comparison-table",
    caption: "Прожарка",
    headers: ["Степень", "Испанский", "Когда заказывать"],
    rows: [
      ["Rare", "Jugoso", "Если любите менее прожаренное мясо"],
      ["Medium", "A punto", "Самый безопасный выбор для туриста"],
      ["Well done", "Bien cocido", "Если предпочитаете полностью прожаренное"],
    ],
    highlightColumn: 1,
    mobileLayout: "cards",
  },
  {
    type: "phrasebook",
    title: "В parrilla",
    category: "restaurant",
    items: [
      {
        original: "A punto, por favor",
        pronunciation: "а пунто, пор фавор",
        translation: "Средняя прожарка, пожалуйста",
        context: "Когда заказываете стейк",
      },
      {
        original: "La cuenta, por favor",
        pronunciation: "ла куэнта, пор фавор",
        translation: "Счёт, пожалуйста",
      },
    ],
  },
  {
    type: "country-tip",
    variant: "ru-traveler",
    body: "В меню размеры порций часто больше привычных европейских. Имеет смысл делить несколько отрубов на компанию — так делают и сами аргентинцы.",
  },
  {
    type: "pros-cons",
    title: "Туристическая parrilla vs семейная",
    pros: {
      title: "Туристическая",
      items: ["Меню на английском", "Привычные отрубы", "Бронирование онлайн"],
    },
    cons: {
      title: "На что обратить внимание",
      items: ["Выше наценка", "Меньше локальных позиций", "Иногда слабее огонь и вкус"],
    },
    recommendation: "Для первого раза можно выбрать понятную туристическую; второй ужин — в районной.",
  },
  {
    type: "facts-grid",
    title: "Коротко",
    columns: 3,
    items: [
      { label: "Блюдо", value: "Asado / Parrilla" },
      { label: "Город", value: "Буэнос-Айрес" },
      { label: "Язык меню", value: "ES / иногда EN" },
    ],
  },
  {
    type: "faq",
    items: [
      {
        question: "Что заказать в первый раз?",
        answer: "Bife de Chorizo, Provoleta и chimichurri.",
      },
      {
        question: "Какой стейк самый нежный?",
        answer: "Lomo — аналог filet mignon.",
      },
    ],
  },
  {
    type: "sources",
    title: "Источники и дата проверки",
    variant: "grouped",
    items: [
      {
        title: "Turismo Buenos Aires — beef and tango",
        url: "https://turismo.buenosaires.gob.ar/en/atractivo/9pm-beef-and-tango",
        publisher: "Gobierno de la Ciudad",
        accessedAt: "2026-07-17",
        type: "official",
      },
    ],
  },
  {
    type: "cta",
    label: "Смотреть гастрономические экскурсии",
    href: "/ekskursii?q=asado",
    variant: "primary",
  },
  {
    type: "hero-banner",
    eyebrow: "Хабы и лендинги",
    title: "Конструктор страниц сайта",
    lede: "Те же блоки работают для направлений, мест, путеводителей и базы знаний.",
    primaryCta: { label: "Открыть путеводители", href: "/guide" },
    secondaryCta: { label: "Карта", href: "/mapa-argentina" },
  },
  {
    type: "hub-cta-row",
    title: "Быстрые переходы",
    items: [
      { label: "Направления", href: "/destinations", description: "Регионы страны" },
      { label: "Места", href: "/places", description: "Справочник объектов" },
      { label: "База знаний", href: "/baza-znaniy", description: "Практические статьи" },
    ],
  },
];
