import type { OrganizerTourGuide } from "@/types/organizer-tour";
import { joinFullName } from "@/lib/full-name";

export const ORGANIZER_TOUR_GUIDES_MAX = 5;
export const ORGANIZER_TEAM_GUIDES_MAX = 20;
export const ORGANIZER_TOUR_GUIDE_BIO_MAX = 2000;

export const DEFAULT_GUIDE_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face";

export const DEFAULT_TOUR_AUTHOR_BIO = `Привет! Меня зовут Иван, и я живу в Буэнос-Айресе уже больше пяти лет. За это время я успел полюбить эту страну — её культуру, природу и, конечно, людей.

Я организую авторские туры по Аргентине: от прогулок по историческому центру Буэнос-Айреса до поездок в Мендосу, Патагонию и к водопадам Игуасу. Мне важно, чтобы каждый путешественник почувствовал себя не туристом, а гостем.

Что я предлагаю:
• Индивидуальные туры под ваш запрос
• Подготовку маршрута и логистики
• Сопровождение небольших групп

На моих турах вы узнаете, где пьют лучший мате, как заказывать стейк как местный и почему аргентинцы так любят футбол. Добро пожаловать в мою Аргентину!`;

export const TOUR_GUIDE_CATALOG: Omit<OrganizerTourGuide, "isTourAuthor">[] = [
  {
    id: "guide-maria",
    name: "Мария",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
    bio: "Гид по Буэнос-Айресу и Мендосе. Организует винные туры, гастрономические прогулки и вечера танго с местными артистами.",
    userId: null,
  },
  {
    id: "guide-carlos",
    name: "Карлос",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    bio: "Профессиональный гид по Патагонии. Ведёт треккинги к ледникам, организует экспедиции в национальные парки и фото-туры.",
    userId: null,
  },
  {
    id: "guide-elena",
    name: "Елена",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
    bio: "Инструктор по горному туризму на севере Аргентины. Маршруты по Сальте, Кафаяте и долине реки Калчакí — от лёгких прогулок до сложных походов.",
    userId: null,
  },
  {
    id: "guide-diego",
    name: "Диего",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    bio: "Гид по Игуасу и северо-востоку. Экскурсии по водопадам, джунглям Misiones и культурным маршрутам с местными общинами.",
    userId: null,
  },
];

export function buildTourAuthorGuide(
  overrides?: Partial<OrganizerTourGuide>
): OrganizerTourGuide {
  return {
    id: "guide-author-ivan",
    name: "Иван Евдокимычев",
    avatar: DEFAULT_GUIDE_AVATAR,
    bio: DEFAULT_TOUR_AUTHOR_BIO,
    isTourAuthor: true,
    userId: "ivan-evdokimychev",
    ...overrides,
  };
}

export function createDefaultTourGuides(): OrganizerTourGuide[] {
  return [buildTourAuthorGuide()];
}

export function createCustomGuide(input: {
  firstName: string;
  lastName: string;
  avatar: string;
  bio: string;
  id?: string;
}): OrganizerTourGuide {
  return {
    id: input.id ?? `guide-custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: joinFullName(input.firstName, input.lastName),
    avatar: input.avatar.trim() || DEFAULT_GUIDE_AVATAR,
    bio: input.bio.trim().slice(0, ORGANIZER_TOUR_GUIDE_BIO_MAX),
    isTourAuthor: false,
    userId: null,
  };
}

export function teamGuideFromTourGuide(guide: OrganizerTourGuide): Omit<OrganizerTourGuide, "isTourAuthor"> {
  const { isTourAuthor: _ignored, ...teamGuide } = guide;
  return teamGuide;
}
