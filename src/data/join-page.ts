export interface JoinHeroHighlight {
  id: string;
  label: string;
  value: string;
  description: string;
  icon: "free" | "map" | "crm" | "audience";
}

export interface JoinBenefit {
  id: string;
  title: string;
  description: string;
  icon: "sales" | "security" | "experience";
}

export interface JoinAudience {
  id: string;
  label: string;
}

export interface JoinAuthor {
  id: string;
  name: string;
  bio: string;
  image: string;
}

export interface JoinStep {
  id: string;
  title: string;
  description: string;
}

export interface JoinFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const JOIN_HERO_HIGHLIGHTS: JoinHeroHighlight[] = [
  {
    id: "free",
    label: "Размещение",
    value: "Бесплатно",
    description: "Комиссия только за состоявшиеся бронирования",
    icon: "free",
  },
  {
    id: "editor",
    label: "Редактор тура",
    value: "Карта и программа",
    description: "Маршрут, даты, стоимость и условия в одном месте",
    icon: "map",
  },
  {
    id: "crm",
    label: "Личный кабинет",
    value: "CRM заявок",
    description: "Статусы бронирований, чат и статистика туров",
    icon: "crm",
  },
  {
    id: "audience",
    label: "Аудитория",
    value: "Россия и СНГ",
    description: "Туристы, которым нужна именно Аргентина",
    icon: "audience",
  },
];

export const JOIN_BENEFITS: JoinBenefit[] = [
  {
    id: "sales",
    title: "Новый канал продаж",
    description: "Добавляйте туры к нам и получайте новых клиентов из России и СНГ",
    icon: "sales",
  },
  {
    id: "security",
    title: "Безопасность и поддержка",
    description: "Безопасная оплата, прозрачный договор с туристом, дружественная поддержка",
    icon: "security",
  },
  {
    id: "experience",
    title: "Делимся опытом",
    description: "Советы по продвижению, продаже и организации туров по Аргентине",
    icon: "experience",
  },
];

export const JOIN_AUDIENCE: JoinAudience[] = [
  { id: "travelers", label: "Опытные путешественники" },
  { id: "bloggers", label: "Тревел-блогеры" },
  { id: "agencies", label: "Туристические агентства" },
  { id: "guides", label: "Гиды со стажем" },
];

export const JOIN_AUTHORS: JoinAuthor[] = [
  {
    id: "maria",
    name: "Мария",
    bio: "Гид по Буэнос-Айресу и Мендосе. Организует винные туры, гастрономические прогулки и вечера танго с местными артистами.",
    image: "",
  },
  {
    id: "carlos",
    name: "Карлос",
    bio: "Профессиональный гид по Патагонии. Ведёт треккинги к ледникам, организует экспедиции в национальные парки и фото-туры.",
    image: "",
  },
  {
    id: "elena",
    name: "Елена",
    bio: "Инструктор по горному туризму на севере Аргентины. Маршруты по Сальте, Кафаяте и долине реки Калчакí — от лёгких прогулок до сложных походов.",
    image: "",
  },
  {
    id: "diego",
    name: "Диего",
    bio: "Гид по Игуасу и северо-востоку. Экскурсии по водопадам, джунглям Мисьонес и культурным маршрутам с местными общинами.",
    image: "",
  },
];

export const JOIN_STEPS: JoinStep[] = [
  {
    id: "application",
    title: "Подайте анкету организатора",
    description: "Опишите ваш опыт, маршруты и формат путешествий в короткой анкете",
  },
  {
    id: "verification",
    title: "Дождитесь верификации",
    description: "Мы проверим заявку и откроем доступ к кабинету организатора",
  },
  {
    id: "first-tour",
    title: "Создайте первый тур",
    description: "В редакторе добавьте программу, даты, стоимость и условия бронирования",
  },
  {
    id: "first-booking",
    title: "Получите первую заявку",
    description: "После публикации тура вам начнут поступать бронирования в кабинет",
  },
];

export const JOIN_FAQ: JoinFaqItem[] = [
  {
    id: "cost",
    question: "Сколько это стоит?",
    answer:
      "Размещение авторских туров на нашей площадке осуществляется бесплатно. Комиссия взимается только за оплаченные и состоявшиеся бронирования.",
  },
  {
    id: "experience",
    question: "Какой должен быть опыт организации путешествий?",
    answer:
      "В первую очередь авторы туров должны иметь большой личный опыт путешествий по Аргентине. Не важно, начинающий вы гид или опытный организатор — мы оцениваем знание маршрута и умение работать с группой. Решение о размещении принимается индивидуально.",
  },
  {
    id: "verification",
    question: "Как вы проверяете организаторов?",
    answer:
      "Проверка включает верификацию личности, анализ анкеты, проверку медийного пространства (соцсети, отзывы, рекомендации), экспертное собеседование и оценку безопасности маршрута. После каждого тура мы собираем отзывы участников.",
  },
  {
    id: "fee",
    question: "Могу ли я добавлять к стоимости тура сервисный сбор?",
    answer:
      "Нет. Мы следим за тем, чтобы туристы приобретали авторские туры по прямым ценам организаторов. Подробности — в Пользовательском соглашении.",
  },
];
