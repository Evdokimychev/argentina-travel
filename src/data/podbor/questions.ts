import type { PodborOption, PodborQuestion, PodborQuestionId } from "@/types/podbor";

const IMG = {
  nature: "https://images.unsplash.com/photo-1516026672322-bc52c61a55d5?w=900&q=80",
  city: "https://images.unsplash.com/photo-1589909202802-8d28781408ec?w=900&q=80",
  wine: "https://images.unsplash.com/photo-1506377247377-2ecb89819a88?w=900&q=80",
  glacier: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80",
  falls: "https://images.unsplash.com/photo-1558980664-1db756751b1a?w=900&q=80",
  tango: "https://images.unsplash.com/photo-1509099836629-18eb960b6869?w=900&q=80",
  penguins: "https://images.unsplash.com/photo-1551986782-d0169b3f8fa7?w=900&q=80",
  mountains: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80",
  relax: "https://images.unsplash.com/photo-1540541333437-94a6835c4e5c?w=900&q=80",
  family: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=900&q=80",
  relocation: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=80",
  business: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=80",
  expedition: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=900&q=80",
  honeymoon: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=900&q=80",
  photo: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=80",
};

export const PODBOR_QUESTIONS: Record<PodborQuestionId, PodborQuestion> = {
  goal: {
    id: "goal",
    title: "Какова цель поездки?",
    subtitle: "От этого зависит, какие вопросы мы зададим дальше — как живой консультант.",
    selectionMode: "single",
    options: [
      {
        id: "rest",
        label: "Отдых",
        description: "Классическое путешествие без спешки",
        image: IMG.relax,
        scores: { "buenos-aires": 2, patagonia: 2, mendoza: 2 },
        tags: ["leisure"],
      },
      {
        id: "honeymoon",
        label: "Медовый месяц",
        description: "Романтика, красивые места и приватность",
        image: IMG.honeymoon,
        scores: { mendoza: 4, "buenos-aires": 3, bariloche: 3 },
        tags: ["romantic", "premium"],
      },
      {
        id: "family",
        label: "Семейное путешествие",
        description: "Комфорт и программа для разных возрастов",
        image: IMG.family,
        scores: { "buenos-aires": 3, iguazu: 4, bariloche: 3 },
        tags: ["family"],
      },
      {
        id: "expedition",
        label: "Экспедиция",
        description: "Дальние маршруты и сильные впечатления",
        image: IMG.expedition,
        scores: { patagonia: 5, ushuaia: 5, salta: 3 },
        tags: ["expedition", "adventure"],
      },
      {
        id: "photo",
        label: "Фототур",
        description: "Свет, ландшафты и редкие ракурсы",
        image: IMG.photo,
        scores: { patagonia: 4, salta: 4, iguazu: 3 },
        tags: ["photo"],
      },
      {
        id: "relocation",
        label: "Переезд",
        description: "Жизнь в Аргентине: документы, районы, быт",
        image: IMG.relocation,
        scores: { "buenos-aires": 5, mendoza: 2 },
        tags: ["relocation"],
      },
      {
        id: "business",
        label: "Бизнес",
        description: "Деловая поездка с элементами networking",
        image: IMG.business,
        scores: { "buenos-aires": 5, mendoza: 2 },
        tags: ["business"],
      },
      {
        id: "unknown",
        label: "Не знаю",
        description: "Помогите определиться — начнём с главного",
        image: IMG.city,
        scores: { "buenos-aires": 2, patagonia: 2, iguazu: 2 },
        tags: ["undecided"],
      },
    ],
  },

  focus: {
    id: "focus",
    title: "Что для вас главнее?",
    subtitle: "Выберите направление — дальше уточним детали.",
    selectionMode: "single",
    options: [
      {
        id: "nature",
        label: "Природа и ландшафты",
        description: "Горы, ледники, водопады, дикая фауна",
        image: IMG.nature,
        scores: { patagonia: 4, iguazu: 3, salta: 3, ushuaia: 3 },
        tags: ["nature"],
      },
      {
        id: "city",
        label: "Городская жизнь",
        description: "Архитектура, гастрономия, культура",
        image: IMG.city,
        scores: { "buenos-aires": 5, mendoza: 2 },
        tags: ["city"],
      },
      {
        id: "both",
        label: "И то, и другое",
        description: "Сочетание мегаполиса и природных блоков",
        image: IMG.tango,
        scores: { "buenos-aires": 3, patagonia: 3, iguazu: 2, mendoza: 2 },
        tags: ["mixed"],
      },
    ],
  },

  "nature-priorities": {
    id: "nature-priorities",
    title: "Что из природы важнее всего?",
    subtitle: "Можно выбрать несколько — мы учтём все.",
    selectionMode: "multi",
    minSelections: 1,
    maxSelections: 4,
    options: [
      {
        id: "mountains",
        label: "Горы",
        image: IMG.mountains,
        scores: { patagonia: 4, bariloche: 4, mendoza: 3, salta: 3 },
        tags: ["trekking", "mountains"],
      },
      {
        id: "glaciers",
        label: "Ледники",
        image: IMG.glacier,
        scores: { patagonia: 5, ushuaia: 2 },
        tags: ["glacier"],
      },
      {
        id: "waterfalls",
        label: "Водопады",
        image: IMG.falls,
        scores: { iguazu: 5, salta: 1 },
        tags: ["waterfalls"],
      },
      {
        id: "ocean",
        label: "Океан и побережье",
        image: "https://images.unsplash.com/photo-1505118389327-28a385e4f124?w=900&q=80",
        scores: { ushuaia: 4, patagonia: 2 },
        tags: ["coast"],
      },
      {
        id: "wildlife",
        label: "Животные",
        description: "Пингвины, киты, ламы",
        image: IMG.penguins,
        scores: { ushuaia: 5, patagonia: 3 },
        tags: ["wildlife", "penguins"],
      },
    ],
  },

  "city-priorities": {
    id: "city-priorities",
    title: "Что интересует в городе?",
    subtitle: "Выберите то, без чего поездка будет неполной.",
    selectionMode: "multi",
    minSelections: 1,
    maxSelections: 4,
    options: [
      {
        id: "architecture",
        label: "Архитектура",
        image: IMG.city,
        scores: { "buenos-aires": 4, salta: 2 },
        tags: ["architecture"],
      },
      {
        id: "gastronomy",
        label: "Гастрономия",
        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80",
        scores: { "buenos-aires": 4, mendoza: 4 },
        tags: ["gastro", "food"],
      },
      {
        id: "bars",
        label: "Бары и ночная жизнь",
        image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=900&q=80",
        scores: { "buenos-aires": 4, mendoza: 2 },
        tags: ["nightlife"],
      },
      {
        id: "tango",
        label: "Танго",
        image: IMG.tango,
        scores: { "buenos-aires": 5 },
        tags: ["tango"],
      },
      {
        id: "museums",
        label: "Музеи и искусство",
        image: "https://images.unsplash.com/photo-1564399579889-451725552d02?w=900&q=80",
        scores: { "buenos-aires": 3, salta: 2 },
        tags: ["culture"],
      },
    ],
  },

  "relocation-priorities": {
    id: "relocation-priorities",
    title: "Что важно при переезде?",
    subtitle: "Подберём материалы и маршруты знакомства со страной.",
    selectionMode: "multi",
    minSelections: 1,
    maxSelections: 5,
    options: [
      {
        id: "visa",
        label: "ВНЖ и документы",
        image: IMG.relocation,
        scores: { "buenos-aires": 4 },
        tags: ["immigration", "visa"],
      },
      {
        id: "housing",
        label: "Аренда жилья",
        scores: { "buenos-aires": 4, mendoza: 2 },
        tags: ["housing"],
      },
      {
        id: "districts",
        label: "Районы города",
        scores: { "buenos-aires": 5 },
        tags: ["districts"],
      },
      {
        id: "business-setup",
        label: "Открытие бизнеса",
        scores: { "buenos-aires": 4 },
        tags: ["business"],
      },
      {
        id: "schools",
        label: "Школы и образование",
        scores: { "buenos-aires": 3, mendoza: 2 },
        tags: ["schools"],
      },
      {
        id: "healthcare",
        label: "Медицина",
        scores: { "buenos-aires": 4, mendoza: 2 },
        tags: ["healthcare"],
      },
    ],
  },

  "business-priorities": {
    id: "business-priorities",
    title: "Что нужно в деловой поездке?",
    selectionMode: "multi",
    minSelections: 1,
    maxSelections: 3,
    options: [
      {
        id: "meetings",
        label: "Деловые встречи",
        scores: { "buenos-aires": 5 },
        tags: ["business"],
      },
      {
        id: "networking",
        label: "Networking и ивенты",
        scores: { "buenos-aires": 4, mendoza: 2 },
        tags: ["networking"],
      },
      {
        id: "site-visits",
        label: "Осмотр регионов / производств",
        scores: { mendoza: 4, patagonia: 2, salta: 2 },
        tags: ["site-visit"],
      },
      {
        id: "leisure-addon",
        label: "Досуг после работы",
        scores: { "buenos-aires": 3, mendoza: 3 },
        tags: ["leisure"],
      },
    ],
  },

  sights: {
    id: "sights",
    title: "Что хочется увидеть?",
    subtitle: "Отметьте места мечты — мы соберём маршрут вокруг них.",
    selectionMode: "multi",
    minSelections: 1,
    maxSelections: 5,
    options: [
      {
        id: "glaciers",
        label: "Ледники",
        image: IMG.glacier,
        scores: { patagonia: 5 },
        tags: ["glacier"],
      },
      {
        id: "waterfalls",
        label: "Водопады",
        image: IMG.falls,
        scores: { iguazu: 5 },
        tags: ["waterfalls"],
      },
      {
        id: "mountains",
        label: "Горы",
        image: IMG.mountains,
        scores: { patagonia: 4, bariloche: 4, mendoza: 3, salta: 3 },
        tags: ["mountains"],
      },
      {
        id: "penguins",
        label: "Пингвинов",
        image: IMG.penguins,
        scores: { ushuaia: 5 },
        tags: ["penguins"],
      },
      {
        id: "whales",
        label: "Китов",
        image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=900&q=80",
        scores: { patagonia: 3, ushuaia: 4 },
        tags: ["whales"],
      },
      {
        id: "wineries",
        label: "Винодельни",
        image: IMG.wine,
        scores: { mendoza: 5, salta: 2 },
        tags: ["wine"],
      },
      {
        id: "ba",
        label: "Буэнос-Айрес",
        image: IMG.city,
        scores: { "buenos-aires": 5 },
        tags: ["city"],
      },
      {
        id: "patagonia",
        label: "Патагонию",
        image: IMG.nature,
        scores: { patagonia: 5, bariloche: 3 },
        tags: ["patagonia"],
      },
      {
        id: "tierra-del-fuego",
        label: "Огненную Землю",
        image: IMG.expedition,
        scores: { ushuaia: 5 },
        tags: ["ushuaia"],
      },
      {
        id: "northwest",
        label: "Север Аргентины",
        image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=900&q=80",
        scores: { salta: 5 },
        tags: ["northwest"],
      },
    ],
  },

  format: {
    id: "format",
    title: "Какой формат отдыха нравится?",
    selectionMode: "single",
    options: [
      {
        id: "comfort",
        label: "Комфортный",
        description: "Хорошие отели, продуманная логистика",
        image: IMG.relax,
        tags: ["comfort"],
      },
      {
        id: "premium",
        label: "Премиальный",
        description: "Лучшие отели и персональный сервис",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80",
        tags: ["premium"],
      },
      {
        id: "adventure",
        label: "Приключенческий",
        description: "Треккинг, экспедиции, активные дни",
        image: IMG.expedition,
        tags: ["adventure"],
        scores: { patagonia: 3, ushuaia: 3, salta: 2 },
      },
      {
        id: "active",
        label: "Активный",
        description: "Много движения, но с комфортным отдыхом",
        image: IMG.mountains,
        tags: ["active"],
        scores: { bariloche: 2, patagonia: 2 },
      },
      {
        id: "relaxed",
        label: "Максимально расслабленный",
        description: "Медленный ритм, минимум переездов",
        image: IMG.wine,
        tags: ["relaxed"],
        scores: { mendoza: 3, "buenos-aires": 2 },
      },
    ],
  },

  duration: {
    id: "duration",
    title: "Сколько дней есть?",
    selectionMode: "single",
    options: [
      { id: "3-5", label: "3–5 дней", tags: ["short"] },
      { id: "5-7", label: "5–7 дней", tags: ["week"] },
      { id: "7-10", label: "7–10 дней", tags: ["medium"] },
      { id: "10-14", label: "10–14 дней", tags: ["long"] },
      { id: "14+", label: "Более 14", tags: ["extended"] },
    ],
  },

  budget: {
    id: "budget",
    title: "Бюджет на человека",
    subtitle: "Ориентир без перелёта — поможет подобрать формат.",
    selectionMode: "single",
    options: [
      { id: "under-500", label: "До 500 $", tags: ["budget-low"] },
      { id: "500-1000", label: "500–1000 $", tags: ["budget-mid"] },
      { id: "1000-2000", label: "1000–2000 $", tags: ["budget-comfort"] },
      { id: "2000-5000", label: "2000–5000 $", tags: ["budget-premium"] },
      { id: "5000+", label: "Более 5000 $", tags: ["budget-luxury"] },
    ],
  },

  travelers: {
    id: "travelers",
    title: "Кто путешествует?",
    selectionMode: "single",
    options: [
      { id: "solo", label: "Один", tags: ["solo"] },
      { id: "couple", label: "Пара", tags: ["couple"] },
      { id: "family", label: "Семья", tags: ["family"] },
      { id: "friends", label: "Друзья", tags: ["friends"] },
      { id: "corporate", label: "Корпоративная группа", tags: ["corporate"] },
    ],
  },

  activity: {
    id: "activity",
    title: "Какой уровень активности комфортен?",
    selectionMode: "single",
    options: [
      {
        id: "minimal",
        label: "Минимальный",
        description: "Прогулки, трансферы, без треккинга",
        tags: ["easy"],
        scores: { "buenos-aires": 2, mendoza: 2, iguazu: 2 },
      },
      {
        id: "moderate",
        label: "Средний",
        description: "Лёгкие треккинги и экскурсии",
        tags: ["moderate"],
        scores: { bariloche: 2, salta: 2 },
      },
      {
        id: "high",
        label: "Высокий",
        description: "Полноценные походы и длинные дни",
        tags: ["hard"],
        scores: { patagonia: 3, salta: 2 },
      },
      {
        id: "extreme",
        label: "Очень высокий",
        description: "Экспедиции и сложные маршруты",
        tags: ["extreme"],
        scores: { patagonia: 4, ushuaia: 3 },
      },
    ],
  },
};

export const PODBOR_FUTURE_QUESTIONS: Array<{
  id: string;
  title: string;
  purpose: string;
  conversionHint: string;
}> = [
  {
    id: "travel-month",
    title: "В каком месяце планируете поездку?",
    purpose: "Сезонность и доступность дат туров",
    conversionHint: "Показать ближайшие заезды с местами",
  },
  {
    id: "departure-city",
    title: "Из какого города вылетаете?",
    purpose: "Логистика перелётов и стыковок",
    conversionHint: "Ссылка на подбор авиабилетов",
  },
  {
    id: "flight-class",
    title: "Какой класс перелёта предпочитаете?",
    purpose: "Общий бюджет и комфорт",
    conversionHint: "Пакет «тур + перелёт»",
  },
  {
    id: "children-ages",
    title: "Сколько лет детям?",
    purpose: "Фильтр семейных туров и возрастных ограничений",
    conversionHint: "Туры «для семей с детьми»",
  },
  {
    id: "diet",
    title: "Есть ли особенности питания?",
    purpose: "Гастрономические и винные программы",
    conversionHint: "Экскурсии с гастро-фокусом",
  },
  {
    id: "language",
    title: "На каком языке удобнее общаться с гидом?",
    purpose: "Подбор русскоязычных организаторов",
    conversionHint: "Туры с русским сопровождением",
  },
  {
    id: "accommodation",
    title: "Какой тип жилья предпочитаете?",
    purpose: "Комфорт и уровень размещения",
    conversionHint: "Фильтр по уровню комфорта",
  },
  {
    id: "private-vs-group",
    title: "Индивидуальный тур или группа?",
    purpose: "Формат бронирования",
    conversionHint: "CTA на индивидуальный запрос",
  },
  {
    id: "photo-gear",
    title: "Путешествуете с профессиональной камерой?",
    purpose: "Фототуры и треккинг с тяжёлым снаряжением",
    conversionHint: "Экспедиционные программы",
  },
  {
    id: "first-time",
    title: "Первый раз в Аргентине?",
    purpose: "Баланс главных мест и глубины",
    conversionHint: "Маршрут «классика за 10 дней»",
  },
  {
    id: "avoid",
    title: "Чего хотите избежать?",
    purpose: "Исключение неподходящих регионов",
    conversionHint: "Персональное «не рекомендуем»",
  },
  {
    id: "pace",
    title: "Сколько переездов за поездку комфортно?",
    purpose: "Длина и фрагментация маршрута",
    conversionHint: "Один регион vs комбинированный тур",
  },
  {
    id: "special-date",
    title: "Есть ли важная дата (юбилей, праздник)?",
    purpose: "Привязка к конкретным датам",
    conversionHint: "Запрос организатору под дату",
  },
  {
    id: "insurance",
    title: "Нужна ли помощь со страховкой?",
    purpose: "Допуслуги",
    conversionHint: "Партнёрская страховка",
  },
  {
    id: "visa-status",
    title: "Есть ли действующая виза / ВНЖ?",
    purpose: "Срок пребывания и переезд",
    conversionHint: "Раздел иммиграции",
  },
  {
    id: "work-remote",
    title: "Планируете работать удалённо в поездке?",
    purpose: "Relocate / slow travel",
    conversionHint: "Длинные туры и коворкинги",
  },
  {
    id: "social",
    title: "Насколько важно знакомство с другими путешественниками?",
    purpose: "Групповые vs камерные туры",
    conversionHint: "Малые группы до 8 человек",
  },
  {
    id: "sustainability",
    title: "Насколько важен экологичный формат?",
    purpose: "Эко- и ответственный туризм",
    conversionHint: "Экспедиции с локальными гидами",
  },
  {
    id: "contact-preference",
    title: "Как удобнее получить программу?",
    purpose: "Канал лидогенерации",
    conversionHint: "WhatsApp / email / звонок",
  },
  {
    id: "decision-stage",
    title: "На какой стадии принятия решения вы?",
    purpose: "Сегментация в CRM",
    conversionHint: "Срочный CTA vs nurture-контент",
  },
];

export function getQuestionById(id: PodborQuestionId): PodborQuestion {
  return PODBOR_QUESTIONS[id];
}

export function filterSightOptions(
  options: PodborOption[],
  answers: Partial<Record<PodborQuestionId, string[]>>
): PodborOption[] {
  const goal = answers.goal?.[0];
  const focus = answers.focus?.[0];

  if (goal === "relocation" || goal === "business") {
    return options.filter((o) => ["ba", "wineries", "patagonia"].includes(o.id));
  }

  if (focus === "city") {
    return options.filter((o) => ["ba", "wineries", "northwest"].includes(o.id));
  }

  if (focus === "nature") {
    return options.filter((o) => o.id !== "ba");
  }

  return options;
}
