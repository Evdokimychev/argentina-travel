interface TourFeature {
  title: string;
  description: string;
}

interface TourOrganizer {
  name: string;
  role: string;
  avatar: string;
}

export interface TourExtra {
  rating: number;
  reviewCount: number;
  organizer: TourOrganizer;
  comfort: "Простой" | "Средний" | "Высокий";
  startLocation: string;
  features: TourFeature[];
  tags: string[];
  originalPriceUsd?: number;
  bookingMode?: "scheduled" | "on_request" | "both";
  requestDateFrom?: string;
  requestDateTo?: string;
  minimumAge?: number;
  bookingAdvantages?: string[];
}

export const tourExtra: Record<string, TourExtra> = {
  "patagonia-glaciers": {
    rating: 4.9,
    reviewCount: 187,
    organizer: {
      name: "Мария Г.",
      role: "Организатор путешествия",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    },
    comfort: "Средний",
    startLocation: "Буэнос-Айрес, аэропорт Ezeiza",
    features: [
      {
        title: "Ледник Перито-Морено",
        description:
          "Увидите, как ледяные блоки откалываются и падают в бирюзовые воды — одно из главных природных шоу Планеты.",
      },
      {
        title: "Torres del Paine",
        description:
          "Треккинг среди гранитных башен и ледниковых озёр в знаменитом чилийском национальном парке.",
      },
      {
        title: "Круиз по озеру Аргентино",
        description:
          "Приблизитесь к ледникам вплотную на комфортабельном судне с панорамной палубой.",
      },
      {
        title: "Дикая природа",
        description:
          "Пингвины, condors и guanaco — Патагония полна уникальных животных в их естественной среде.",
      },
    ],
    tags: ["10 дней (9 ночей)", "Пешие туры", "Природа и приключения"],
    originalPriceUsd: 3026,
    minimumAge: 12,
  },
  "buenos-aires-tango": {
    rating: 4.8,
    reviewCount: 142,
    organizer: {
      name: "Карлос Р.",
      role: "Организатор путешествия",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    },
    comfort: "Высокий",
    startLocation: "Буэнос-Айрес, аэропорт Aeroparque",
    features: [
      {
        title: "Шоу танго в San Telmo",
        description:
          "Вечернее представление в историческом milonga — сердце культуры аргентинского танго.",
      },
      {
        title: "Район La Boca",
        description:
          "Яркие дома Caminito, уличные артисты и атмосфера, которую не найти больше нигде в мире.",
      },
      {
        title: "Гастрономия",
        description:
          "Аргентинский asado, стейк и дегустация лучших вин Malbec в лучших parrilla города.",
      },
      {
        title: "Архитектура",
        description:
          "Европейский дух столицы: Recoleta, Palermo и кладбище, где покоится Эва Перón.",
      },
    ],
    tags: ["5 дней (4 ночи)", "Городские туры", "Культура и гастрономия"],
    originalPriceUsd: 1087,
    bookingMode: "on_request",
    requestDateFrom: "2026-01-01",
    requestDateTo: "2026-12-31",
    minimumAge: 5,
    bookingAdvantages: [
      "Не требует оплаты сейчас",
      "Тур полностью настраивается под вас",
      "Профессиональный местный гид",
    ],
  },
  "mendoza-wine": {
    rating: 4.9,
    reviewCount: 96,
    organizer: {
      name: "Ана Л.",
      role: "Организатор путешествия",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    },
    comfort: "Высокий",
    startLocation: "Мендоса, аэропорт El Plumerillo",
    features: [
      {
        title: "Bodegas и дегустации",
        description:
          "Посетите 5 лучших виноделен региона и продегустируйте знаменитый Malbec у подножия Анд.",
      },
      {
        title: "Гора Аконкагуа",
        description:
          "Панорамный вид на высочайшую вершину Америки с смотровой площадки.",
      },
      {
        title: "Ужин among the vines",
        description:
          "Гастрономический ужин прямо среди виноградников под звёздным небом.",
      },
      {
        title: "Велопрогулка",
        description:
          "Неспешная прогулка по виноградникам — лучший способ познакомиться с terroir региона.",
      },
    ],
    tags: ["7 дней (6 ночей)", "Винные туры", "Гастрономия"],
  },
  "iguazu-falls": {
    rating: 4.9,
    reviewCount: 203,
    organizer: {
      name: "Пабlo М.",
      role: "Организатор путешествия",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    },
    comfort: "Средний",
    startLocation: "Puerto Iguazú, аэропорт Cataratas",
    features: [
      {
        title: "Garganta del Diablo",
        description:
          "Подойдите к самому мощному водопаду — «Глотке Дьявола» — по подвесным мосткам.",
      },
      {
        title: "280 водопадов",
        description:
          "Прогулка по обширной системе каскадов на границе Аргентины и Бразилии.",
      },
      {
        title: "Джунгли Missiones",
        description:
          "Тропический лес с туканами, бабуинами и бабочками morpho — настоящий рай для натуралистов.",
      },
      {
        title: "Два ракурса",
        description:
          "Посмотрите на водопады с аргентинской и бразильской сторон — каждый вид уникален.",
      },
    ],
    tags: ["4 дня (3 ночи)", "Экскурсионные туры", "Природа"],
  },
  "salta-northwest": {
    rating: 4.7,
    reviewCount: 78,
    organizer: {
      name: "София Т.",
      role: "Организатор путешествия",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
    },
    comfort: "Средний",
    startLocation: "Сальта, аэропорт Martín Miguel de Güemes",
    features: [
      {
        title: "Quebrada de las Conchas",
        description:
          "Красные скалы, причудливые формы и закат, окрашивающий каньон в огненные тона.",
      },
      {
        title: "Salinas Grandes",
        description:
          "Бескрайняя соляная равнина на высоте 4000 м — сюрреалистичный пейзаж для фотографий.",
      },
      {
        title: "Колониальная Сальта",
        description:
          "Испанская архитектура, peñas с folk-музыкой и атмосфера северо-запада.",
      },
      {
        title: "Винодельни Кафаяте",
        description:
          "Torrontés и высокогорные вина — уникальный terroir на высоте 1700 метров.",
      },
    ],
    tags: ["8 дней (7 ночей)", "Экскурсионные туры", "Культура"],
  },
  "ushuaia-end-of-world": {
    rating: 4.8,
    reviewCount: 115,
    organizer: {
      name: "Дiego Ф.",
      role: "Организатор путешествия",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    },
    comfort: "Средний",
    startLocation: "Ушуайя, аэропорт Malvinas Argentinas",
    features: [
      {
        title: "Круиз по каналу Бигля",
        description:
          "Морские львы, пингвины и панорамы Огненной Земли с борта комфортабельного судна.",
      },
      {
        title: "Поезд End of the World",
        description:
          "Историческая железная дорога через тайгу к самой южной станции планеты.",
      },
      {
        title: "Tierra del Fuego",
        description:
          "Треккинг в национальном парке среди бескрайних просторов края света.",
      },
      {
        title: "Край континента",
        description:
          "Ушуайя — ворота в Антарктиду и место, где заканчивается цивилизация.",
      },
    ],
    tags: ["6 дней (5 ночей)", "Приключения", "Природа"],
  },
};
