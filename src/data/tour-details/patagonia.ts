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
  rating: 0,
  reviewCount: 0,
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
        "Гранитные башни, ледниковые озёра и треккинг-маршруты мирового класса в Чили.",
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
      activities: [
        {
          id: "d1-a1",
          kind: "transfer",
          title: "Трансфер из аэропорта Ezeiza",
          durationLabel: "45 мин",
        },
        {
          id: "d1-a2",
          kind: "briefing",
          title: "Брифинг с гидом",
          durationLabel: "1 ч",
        },
        {
          id: "d1-a3",
          kind: "city_walk",
          title: "Свободная прогулка по центру",
          durationLabel: "2–3 ч",
        },
      ],
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
      activities: [
        {
          id: "d2-a1",
          kind: "flight",
          title: "Перелёт Буэнос-Айрес — Эль-Калафате",
          durationLabel: "3 ч",
        },
        {
          id: "d2-a2",
          kind: "check_in",
          title: "Заселение в отель",
        },
        {
          id: "d2-a3",
          kind: "city_walk",
          title: "Прогулка по набережной озера Аргентино",
          durationLabel: "1,5 ч",
        },
      ],
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
      activities: [
        {
          id: "d3-a1",
          kind: "glacier",
          title: "Экскурсия по мосткам Перито-Морено",
          durationLabel: "3 ч",
          description: "Наблюдение за откалыванием льда с оборудованных смотровых площадок",
        },
        {
          id: "d3-a2",
          kind: "boat_cruise",
          title: "Safari Náutico",
          durationLabel: "1 ч",
          description: "Опционально — приближение к ледяной стене на катере",
        },
        {
          id: "d3-a3",
          kind: "photo",
          title: "Фотосессия у ледника",
          durationLabel: "30 мин",
        },
      ],
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
      activities: [
        {
          id: "d4-a1",
          kind: "boat_cruise",
          title: "Круиз к ледникам Upsala и Spegazzini",
          durationMinutes: 240,
          description: "Ледяные стены высотой до 80 м",
        },
        {
          id: "d4-a2",
          kind: "food",
          title: "Дегустация ледниковой воды",
          durationLabel: "15 мин",
        },
      ],
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
      activities: [
        {
          id: "d5-a1",
          kind: "transfer",
          title: "Трансфер Эль-Калафате — Torres del Paine",
          durationLabel: "5 ч",
        },
        {
          id: "d5-a2",
          kind: "walking",
          title: "Прогулка к озеру Pehoé",
          durationLabel: "1 ч",
        },
      ],
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
      activities: [
        {
          id: "d6-a1",
          kind: "trekking",
          title: "Треккинг Base Torres",
          durationMinutes: 480,
          distanceKm: 18,
          elevationGainM: 800,
          elevationLossM: 800,
          description: "Классический однодневный маршрут к подножию гранитных башен",
        },
        {
          id: "d6-a2",
          kind: "picnic",
          title: "Пикник у лагуны",
          durationLabel: "45 мин",
        },
      ],
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
  itineraryOrganizerComment:
    "Маршрут рассчитан на туристов со средней физической формой. Треккинговые дни достаточно комфортные и подходят большинству участников.\n\nБольшую часть пути проезжаем на минивэнах и автобусах, но виды за окном с лихвой компенсируют дорогу.",
  accommodationOrganizerComment:
    "Отели 4* с завтраками по маршруту, в lodge у парка Torres del Paine — полупансион. Wi-Fi есть в городских отелях, в горах сигнал может быть слабым.\n\nБагаж перевозим между точками сами — берите удобную сумку на 1–2 дня для треккингового дня.",
  sectionOrganizerComments: {
    description:
      "Патагония — регион с переменчивой погодой: даже летом возможен ветер и дождь. Мы закладываем запасные сценарии на каждый активный день.",
    places:
      "Главные впечатления — ледник Перито-Морено и Torres del Paine. Если погода не позволит подняться к башням, покажем альтернативный маршрут к Grey Glacier.",
    itinerary:
      "Маршрут рассчитан на туристов со средней физической формой. Треккинговые дни достаточно комфортные и подходят большинству участников.\n\nБольшую часть пути проезжаем на минивэнах и автобусах, но виды за окном с лихвой компенсируют дорогу.",
    dates:
      "Лучше бронировать за 2–3 месяца до выезда: в высокий сезон (декабрь–февраль) места в отелях и lodge разбирают быстро. На некоторые даты действует повышенная цена.",
    included:
      "В стоимость входят завтраки и обеды по программе, но не все ужины — закладывайте бюджет на ужин в городах. В lodge у парка часть питания уже включена.",
    accommodations:
      "Отели 4* с завтраками по маршруту, в lodge у парка Torres del Paine — полупансион. Wi-Fi есть в городских отелях, в горах сигнал может быть слабым.\n\nБагаж перевозим между точками сами — берите удобную сумку на 1–2 дня для треккингового дня.",
    important:
      "Обязательна медицинская страховка с покрытием треккинга и эвакуации. Возьмите ветрозащитную куртку и несколько слоёв одежды — температура может меняться на 15 °C за день.",
    logistics:
      "Рекомендуем прилетать в Буэнос-Айрес за день до начала тура. Внутренний рейс EZE → FTE включён — мы поможем с регистрацией и трансфером в отель.",
    routeMap:
      "Маршрут выстроен по принципу «сначала юг, потом чилийская Патагония»: так проще акклиматизироваться и не возвращаться лишний раз через Буэнос-Айрес.",
    packing:
      "Не забудьте power bank — в lodge розетки не у каждой кровати. Крем SPF 50+ обязателен: солнце в горах обманчиво, даже в пасмурную погоду.",
    faq:
      "Если не нашли ответ — напишите нам в WhatsApp. Часто туристы спрашивают про визу в Чили для Torres del Paine: уточняйте актуальные правила за месяц до поездки.",
    policies:
      "При отмене менее чем за 30 дней до заезда удерживается предоплата. Страховку лучше оформить сразу после бронирования — так покрытие начнётся раньше.",
  },
  organizer: {
    id: "ivan-evdokimychev",
    name: "Иван Евдокимычев",
    role: "Организатор путешествий",
    avatar: "",
    rating: 0,
    tourCount: 0,
    travelerCount: 235,
    languages: ["Русский", "Испанский", "Английский"],
    experienceYears: 0,
    platformRegisteredAt: "2023-01-01T00:00:00.000Z",
    phone: "",
    email: "",
  },
  reviews: [],
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
    "Проживание в отелях 4* (9 ночей) :: Отели в Буэнос-Айресе, Эль-Калафате и lodge в Торрес-дель-Пайне с завтраками.",
    "Завтраки и обеды :: Завтраки ежедневно, обеды по программе в дни активностей.",
    "Все трансферы и внутренние перелёты :: Групповые трансферы и рейс EZE → FTE включены в стоимость.",
    "Русскоязычный гид :: Сопровождение на всём маршруте, включая национальные парки.",
    "Входные билеты в парки :: Los Glaciares, Torres del Paine и другие объекты по программе.",
    "Круиз Safari Náutico :: Катер к ледникам в заливе Упсала с видом на ледяные стены.",
  ],
  excluded: [
    "Международные авиабилеты :: Перелёт до Буэнос-Айреса и обратно участники оформляют самостоятельно.",
    "Ужины (кроме дней в lodge)",
    "Личные расходы и сувениры",
    "Страховка (рекомендуем оформить) :: Медицинский полис с покрытием активного отдыха и эвакуации.",
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
      priceUsd: 2990,
    },
    {
      id: "dt4",
      startDate: "2026-01-10",
      endDate: "2026-01-19",
      spotsLeft: 10,
      priceUsd: 2540,
    },
  ],
  travelRisks: [
    {
      id: "patagonia-risk-altitude",
      kind: "altitude",
      title: "Высота до 900 м на треккинге",
      description:
        "Трек к Base Torres проходит с набором высоты до 800 м. При чувствительности к высоте двигайтесь в своём темпе и сообщите гиду.",
    },
    {
      id: "patagonia-risk-weather",
      kind: "weather",
      description:
        "В Патагонии ветер и осадки меняются за часы — возьмите непродуваемую куртку и слои одежды.",
    },
    {
      id: "patagonia-risk-wildlife",
      kind: "wildlife",
      description:
        "В парках возможны встречи с дикими животными — не кормите их и держите дистанцию по инструкции гида.",
    },
    {
      id: "patagonia-risk-remote",
      kind: "remote",
      description:
        "На участках в Torres del Paine связь нестабильна — зарядите power bank и сообщите близким о программе.",
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
