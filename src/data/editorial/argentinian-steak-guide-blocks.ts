import type { BlogBodyBlock } from "@/types/blog-content-blocks";

/** Key editorial blocks for /blog/argentinian-steak-guide — universal components + data. */
export const ARGENTINIAN_STEAK_GUIDE_TYPED_BLOCKS: Record<string, BlogBodyBlock[]> = {
  Введение: [
    {
      type: "lead",
      text: "Asado и parrilla — первые слова, которые вы услышите, если приехали в Аргентину ради мяса. Ниже — отрубы, прожарка, фразы для заказа и типичные ошибки туристов.",
      variant: "wide",
    },
    {
      type: "article-summary",
      title: "Коротко о главном",
      variant: "horizontal-deck",
      items: [
        {
          title: "С чего начать",
          body: "Bife de Chorizo a punto и Provoleta — понятный первый заказ в parrilla.",
        },
        {
          title: "Что значит asado",
          body: "Не одно блюдо, а традиция готовить мясо на огне и собирать за столом семью или друзей.",
        },
        {
          title: "Как читать меню",
          body: "Названия отрубов отличаются от европейских: Ojo de Bife, Vacío, Entraña.",
        },
        {
          title: "Счёт",
          body: "Уточняйте, включён ли cubierto и как принято оставлять propina в конкретном заведении.",
        },
      ],
    },
  ],
  "Главные виды аргентинских стейков": [
    {
      type: "option-selector",
      title: "Какой отруб выбрать",
      description: "Данные поверх универсального селектора — тот же блок подходит для регионов или документов.",
      options: [
        {
          id: "bife-de-chorizo",
          title: "Bife de Chorizo",
          summary: "Крупный стейк из поясничной части. Лучший старт для первого знакомства.",
          meta: "Классика",
          details: "Сочный, с выраженным мясным вкусом. Не путать с колбасой chorizo.",
        },
        {
          id: "ojo-de-bife",
          title: "Ojo de Bife",
          summary: "Аргентинский аналог рибая: мраморность и насыщенный вкус.",
          meta: "Мраморный",
        },
        {
          id: "lomo",
          title: "Lomo",
          summary: "Самая нежная часть — аналог filet mignon.",
          meta: "Нежный",
        },
        {
          id: "vacio",
          title: "Vacío",
          summary: "Символ asado: более выраженные волокна и насыщенный вкус.",
          meta: "Asado",
        },
        {
          id: "entrana",
          title: "Entraña",
          summary: "Стейк из диафрагмы: ароматный «секрет местных».",
          meta: "Для гурманов",
        },
      ],
    },
  ],
  "Какой прожарки заказывать мясо": [
    {
      type: "comparison-table",
      caption: "Прожарка в меню",
      headers: ["Степень", "Испанский", "Комментарий"],
      rows: [
        ["Rare", "Jugoso", "С кровью — реже, чем в Европе, но можно попросить"],
        ["Medium", "A punto", "Самый безопасный выбор для туриста"],
        ["Well done", "Bien cocido", "Полностью прожарено — привычный запрос для многих аргентинцев"],
      ],
      highlightColumn: 1,
      mobileLayout: "cards",
    },
    {
      type: "phrasebook",
      title: "Как заказать прожарку",
      category: "restaurant",
      items: [
        {
          original: "A punto, por favor",
          pronunciation: "а пунто, пор фавор",
          translation: "Средняя прожарка, пожалуйста",
        },
        {
          original: "Jugoso, por favor",
          pronunciation: "хугосо, пор фавор",
          translation: "Пожалуйста, с кровью / rare",
        },
        {
          original: "Bien cocido, por favor",
          pronunciation: "бьен косидо, пор фавор",
          translation: "Полностью прожарено, пожалуйста",
        },
      ],
    },
  ],
  "Сколько стоит хороший стейк": [
    {
      type: "budget",
      note: "Ориентиры быстро устаревают. Перед визитом смотрите актуальное меню и дату проверки источников.",
      items: [
        { label: "Районная parrilla", value: "уточняйте по меню" },
        { label: "Туристический ресторан", value: "уточняйте по меню" },
        { label: "Премиум", value: "уточняйте по меню" },
      ],
    },
    {
      type: "country-tip",
      variant: "different-practice",
      body: "В счёте может появиться cubierto — плата за приборы/хлеб. Propina обычно оставляют отдельно; не путайте её с уже включённым обслуживанием, если оно указано в меню.",
    },
  ],
  "Как едят аргентинцы": [
    {
      type: "country-tip",
      variant: "ru-traveler",
      body: "Аргентинцы часто ставят на стол несколько разных отрубов и делят их на компанию. Для туриста это удобный способ сравнить Bife, Vacío и Entraña за один ужин.",
    },
  ],
  "Часто задаваемые вопросы": [
    {
      type: "faq",
      items: [
        {
          question: "Что попробовать в первый раз?",
          answer: "Bife de Chorizo, Provoleta и chimichurri.",
        },
        {
          question: "Какой стейк самый нежный?",
          answer: "Lomo — аргентинский аналог filet mignon.",
        },
        {
          question: "Что такое parrilla?",
          answer: "И решётка для жарки мяса, и мясной ресторан.",
        },
        {
          question: "Что такое asado?",
          answer: "Традиция готовить мясо на огне и важная часть местной культуры общения.",
        },
      ],
    },
  ],
  Итог: [
    {
      type: "cta",
      label: "Посмотреть гастрономические экскурсии",
      href: "/ekskursii?q=asado",
      variant: "primary",
    },
  ],
  "Источники и дата проверки": [
    {
      type: "sources",
      title: "Источники и дата проверки",
      variant: "grouped",
      items: [
        {
          title: "Turismo Buenos Aires — beef and tango",
          url: "https://turismo.buenosaires.gob.ar/en/atractivo/9pm-beef-and-tango",
          publisher: "Gobierno de la Ciudad de Buenos Aires",
          accessedAt: "2026-07-17",
          type: "official",
          language: "en",
        },
      ],
    },
  ],
};
