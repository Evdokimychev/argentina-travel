import { TourDetail } from "@/types";

const patagoniaDetail: TourDetail = {
  id: "1",
  slug: "patagonia-glaciers",
  title: "Ледники Патагонии",
  country: "Аргентина",
  region: "Патагония",
  durationDays: 10,
  durationNights: 9,
  priceUsd: 2663,
  originalPriceUsd: 3026,
  rating: 4.9,
  reviewCount: 187,
  gallery: [
    "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=1200&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    "https://images.unsplash.com/photo-1519682337058-a94d51933763?w=800&q=80",
    "https://images.unsplash.com/photo-1589182370481-0de83087320f?w=800&q=80",
  ],
  image: "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&q=80",
  shortDescription:
    "Путешествие к леднику Перито-Морено и национальному парку Torres del Paine",
  difficulty: "Средняя",
  comfort: "Комфорт",
  accommodationType: "Лодж",
  groupMin: 8,
  groupMax: 12,
  minimumAge: 12,
  startLocation: "Буэнос-Айрес, аэропорт Ezeiza",
  bookingMode: "both",
  requestDateFrom: "2026-01-01",
  requestDateTo: "2026-12-31",
  bookingAdvantages: [
    "Не требует оплаты сейчас",
    "Гарантия лучшей цены",
    "Бесплатная отмена за 30 дней",
    "Профессиональный местный гид",
  ],
  places: [
    {
      id: "p1",
      title: "Ледник Перито-Морено",
      description:
        "Один из немногих ледников в мире, который продолжает расти. Зрелище откалывания льда — незабываемо.",
      image: "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=600&q=80",
    },
    {
      id: "p2",
      title: "Torres del Paine",
      description:
        "Гранитные башни, ледниковые озёra и треккинг-маршруты мирового класса в Чили.",
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
    },
    {
      id: "p3",
      title: "Озеро Аргентино",
      description:
        "Круиз среди ледников Upsala и Spegazzini на фоне Анд.",
      image: "https://images.unsplash.com/photo-1519682337058-a94d51933763?w=600&q=80",
    },
    {
      id: "p4",
      title: "Эль-Калафате",
      description:
        "Уютный городок у края ледников — база для исследования южной Патагонии.",
      image: "https://images.unsplash.com/photo-1589182370481-0de83087320f?w=600&q=80",
    },
  ],
  descriptionBlocks: [
    {
      type: "paragraph",
      content:
        "Патагония — край контрастов, где ледники спускаются к бирюзовым озёрам, а ветер пронизывает бескрайние степи. Этот тур — для тех, кто мечтает увидеть природу в её первозданной мощи.",
    },
    {
      type: "heading",
      content: "Что делает этот тур особенным",
    },
    {
      type: "list",
      content: "",
      items: [
        "Круиз к ледникам с расстояния вытянутой руки",
        "Треккинг в Torres del Paine с русскоязычным гидом",
        "Наблюдение за пингвинами Магеллана",
        "Малые группы — максимум 12 человек",
      ],
    },
    {
      type: "quote",
      content:
        "Патагония не оставляет равнодушным никого. Это место, куда хочется вернуться.",
    },
    {
      type: "image",
      content: "",
      image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=900&q=80",
      caption: "Треккинг в национальном парке Torres del Paine",
    },
    {
      type: "paragraph",
      content:
        "Маршрут продуман так, чтобы вы успели отдохнуть между активными днями. Проживание в комфортабельных отелях, все трансферы и внутренние перелёты включены в стоимость.",
    },
  ],
  itinerary: [
    {
      id: "d1",
      dayNumber: 1,
      title: "Прилёт в Буэнос-Айрес",
      description:
        "Встреча в аэропорту Ezeiza, трансфер в отель. Свободное время для прогулки по городу. Вечерний брифинг с гидом.",
      images: ["https://images.unsplash.com/photo-1589909202800-2f2e1b8a4b8e?w=600&q=80"],
      activities: ["Трансфер из аэропорта", "Брифинг с гидом", "Свободная прогулка"],
      meals: ["Ужин (по желанию)"],
      accommodation: "Отель 4* в центре Буэнос-Айреса",
    },
    {
      id: "d2",
      dayNumber: 2,
      title: "Перелёт в Эль-Калафате",
      description:
        "Утренний перелёт в сердце Патагонии. После заселения — прогулка по набережной озера Аргентино с видом на ледники.",
      images: ["https://images.unsplash.com/photo-1589182370481-0de83087320f?w=600&q=80"],
      activities: ["Перелёт", "Обзорная прогулка", "Заселение"],
      meals: ["Завтрак", "Обед"],
      accommodation: "Отель 4* в Эль-Калафате",
    },
    {
      id: "d3",
      dayNumber: 3,
      title: "Ледник Перито-Морено",
      description:
        "Полный день в национальном парке Los Glaciares. Мостки вдоль ледника, наблюдение за откалыванием льда. Опционально — круиз Safari Náutico.",
      images: [
        "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=600&q=80",
        "https://images.unsplash.com/photo-1519682337058-a94d51933763?w=600&q=80",
      ],
      activities: ["Экскурсия по мосткам", "Safari Náutico", "Фотосессия"],
      meals: ["Завтрак", "Обед", "Ужин"],
      accommodation: "Отель 4* в Эль-Калафате",
    },
    {
      id: "d4",
      dayNumber: 4,
      title: "Круиз по озеру Аргентино",
      description:
        "Круиз к ледникам Upsala и Spegazzini. Близкое знакомство с ледяными стенами высотой до 80 метров.",
      images: ["https://images.unsplash.com/photo-1519682337058-a94d51933763?w=600&q=80"],
      activities: ["Круиз 4 часа", "Дегустация ледниковой воды"],
      meals: ["Завтрак", "Обед на борту"],
      accommodation: "Отель 4* в Эль-Калафате",
    },
    {
      id: "d5",
      dayNumber: 5,
      title: "Переезд в Torres del Paine",
      description:
        "Переезд через границу в Чили. Заселение у входа в парк. Вечерняя прогулка к озеру Pehoé.",
      images: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80"],
      activities: ["Трансфер", "Прогулка к озеру Pehoé"],
      meals: ["Завтрак", "Обед", "Ужин"],
      accommodation: "Lodge у входа в парк",
    },
    {
      id: "d6",
      dayNumber: 6,
      title: "Треккинг Base Torres",
      description:
        "Классический трек к подножию гранитных башен — 8 часов, набор высоты 800 м. Один из лучших однодневных маршрутов мира.",
      images: ["https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80"],
      activities: ["Треккинг 18 км", "Пикник у лагуны"],
      meals: ["Завтрак", "Ланч-бокс", "Ужин"],
      accommodation: "Lodge у входа в парк",
    },
  ],
  organizerComment: {
    greeting:
      "Привет! Меня зовут Мария, и Патагония — моя страсть уже 12 лет. Я провела здесь более 40 групп и знаю каждый уголок этого региона.",
    recommendations: [
      "Возьмите непродуваемую куртку — ветер в Патагонии очень сильный",
      "Зарядите power bank: розетки не везде",
      "День 6 — самый интенсивный, начните его с хорошего завтрака",
    ],
    routeNotes:
      "Маршрут оптимизирован с учётом акклиматизации: сначала более лёгкие дни у ледников, затем треккинг. Если погода не позволит подняться к Torres — есть запасной маршрут к Grey Glacier.",
  },
  organizer: {
    id: "org-1",
    name: "Мария Гонсалес",
    role: "Организатор путешествий",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    rating: 4.9,
    tourCount: 24,
    travelerCount: 680,
    languages: ["Русский", "Испанский", "Английский"],
    experienceYears: 12,
    phone: "+7 (495) 123-45-67",
    email: "maria@argentina-travel.ru",
  },
  reviews: [
    {
      id: "r1",
      author: "Елена К.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
      rating: 5,
      date: "2025-04-12",
      tripDate: "2025-03-01",
      text: "Ледник Перито-Морено — это что-то невероятное! Организация на высшем уровне, гид Мария знает каждый камень.",
      photos: ["https://images.unsplash.com/photo-1558980664-769d59546b3d?w=400&q=80"],
    },
    {
      id: "r2",
      author: "Дмитрий В.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
      rating: 5,
      date: "2025-03-28",
      tripDate: "2025-02-15",
      text: "Трек к Base Torres был сложным, но того стоил. Группа была дружная, все поддерживали друг друга.",
      photos: [],
    },
    {
      id: "r3",
      author: "Анна М.",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
      rating: 5,
      date: "2025-02-10",
      tripDate: "2025-01-20",
      text: "Уже планируем следующую поездку с ArgentinaTravel. Патагония покорила сердце!",
      photos: [
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80",
        "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=80",
      ],
    },
    {
      id: "r4",
      author: "Сергей П.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
      rating: 4,
      date: "2025-01-15",
      tripDate: "2024-12-10",
      text: "Отличный тур, единственное — на 6-й день было очень ветрено. Но гид предупреждал заранее.",
      photos: [],
    },
    {
      id: "r5",
      author: "Ольга Н.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
      rating: 5,
      date: "2024-12-01",
      tripDate: "2024-11-05",
      text: "Круиз по озеру Аргентино — отдельная магия. Рекомендую брать тёплые перчатки!",
      photos: ["https://images.unsplash.com/photo-1519682337058-a94d51933763?w=400&q=80"],
    },
  ],
  accommodations: [
    {
      id: "a1",
      name: "Отель в Эль-Калафате",
      description: "Современный отель 4* с видом на озеро. Двухместные номера с собственной ванной.",
      comfort: "Комфорт",
      amenities: ["Wi-Fi", "Завтрак", "Кондиционер", "Сейф", "Прачечная"],
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
      ],
    },
    {
      id: "a2",
      name: "Lodge Torres del Paine",
      description: "Уютный lodge у входа в парк с панорамными окнами на горы.",
      comfort: "Комфорт",
      amenities: ["Wi-Fi", "Завтрак и ужин", "Отопление", "Общая гостиная"],
      images: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80"],
    },
  ],
  included: [
    "Проживание в отелях 4* (9 ночей)",
    "Завтраки и обеды",
    "Все трансферы и внутренние перелёты",
    "Русскоязычный гид",
    "Входные билеты в парки",
    "Круиз Safari Náutico",
  ],
  excluded: [
    "Международные авиабилеты",
    "Ужины (кроме дней в lodge)",
    "Личные расходы и сувениры",
    "Страховка (рекомендуем оформить)",
    "Опциональные экскурсии",
  ],
  arrival: {
    airports: ["Buenos Aires Ezeiza (EZE)", "El Calafate (FTE)"],
    flights: [
      "Рекомендуем прилетать в EZE за день до начала тура",
      "Внутренний рейс EZE → FTE включён в стоимость",
    ],
    transfers: [
      "Трансфер из аэропорта Ezeiza в отель",
      "Все трансферы по программе",
    ],
    meetingPoint: "Аэропорт Ezeiza, зона прилёта — табличка ArgentinaTravel",
  },
  importantInfo: [
    "Необходима виза для граждан РФ (электронная AVE или штамп при пересадке)",
    "Рекомендуем медицинскую страховку с пок покрытием треккинга",
    "Средняя температура: +5…+15 °C летом, ветрено",
    "Для треккинга нужна трекинговая обувь",
    "Минимальный возраст участников — 14 лет",
  ],
  faq: [
    {
      id: "f1",
      question: "Нужна ли виза в Аргентину?",
      answer:
        "Для граждан РФ необходима электронная авторизация AVE или транзитная виза. Мы поможем с оформлением.",
    },
    {
      id: "f2",
      question: "Какой уровень подготовки нужен?",
      answer:
        "Средний. Трек к Base Torres — 18 км с набором 800 м. Остальные дни — лёгкие и умеренные.",
    },
    {
      id: "f3",
      question: "Что взять с собой?",
      answer:
        "Непродуваемая куртка, трекинговые ботинки, солнцезащитные очки, крем SPF 50+, перчатки.",
    },
    {
      id: "f4",
      question: "Можно ли отменить бронирование?",
      answer:
        "Бесплатная отмена за 30 дней до начала. За 15–30 дней — возврат 50%. Менее 15 дней — без возврата.",
    },
  ],
  dates: [
    {
      id: "dt1",
      startDate: "2025-11-01",
      endDate: "2025-11-10",
      spotsLeft: 4,
      priceUsd: 2663,
    },
    {
      id: "dt2",
      startDate: "2025-11-15",
      endDate: "2025-11-24",
      spotsLeft: 8,
      priceUsd: 2663,
    },
    {
      id: "dt3",
      startDate: "2025-12-01",
      endDate: "2025-12-10",
      spotsLeft: 2,
      priceUsd: 2804,
    },
    {
      id: "dt4",
      startDate: "2026-01-10",
      endDate: "2026-01-19",
      spotsLeft: 10,
      priceUsd: 2663,
    },
  ],
  tags: ["10 дней (9 ночей)", "Пешие туры", "Природа и приключения"],
  featured: true,
};

export const tourDetailsMap: Record<string, TourDetail> = {
  "patagonia-glaciers": patagoniaDetail,
};

export function getTourDetailBySlug(slug: string): TourDetail | undefined {
  return tourDetailsMap[slug];
}

export function getAllTourDetailSlugs(): string[] {
  return Object.keys(tourDetailsMap);
}
