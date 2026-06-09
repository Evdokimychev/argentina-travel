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
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
  },
  {
    id: "carlos",
    name: "Карлос",
    bio: "Профессиональный гид по Патагонии. Ведёт треккинги к ледникам, организует экспедиции в национальные парки и фото-туры.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
  },
  {
    id: "elena",
    name: "Елена",
    bio: "Инструктор по горному туризму на севере Аргентины. Маршруты по Сальте, Кафаяте и долине реки Калчакí — от лёгких прогулок до сложных походов.",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
  },
  {
    id: "diego",
    name: "Диего",
    bio: "Гид по Игуасу и северо-востоку. Экскурсии по водопадам, джунглям Мisiones и культурным маршрутам с местными общинами.",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
  },
];

export const JOIN_STEPS: JoinStep[] = [
  {
    id: "register",
    title: "Зарегистрируйтесь и добавьте туры",
    description: "Создайте профиль автора и опубликуйте описание маршрутов",
  },
  {
    id: "requests",
    title: "Принимайте заявки",
    description: "Общайтесь с туристами в чате или созванивайтесь напрямую",
  },
  {
    id: "payment",
    title: "Получайте предоплату",
    description: "Бронирование подтверждается после оплаты на платформе",
  },
  {
    id: "reviews",
    title: "Собирайте отзывы",
    description: "После тура участники оставляют отзывы — это повышает рейтинг",
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
