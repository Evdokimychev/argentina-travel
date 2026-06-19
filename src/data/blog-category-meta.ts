/** Описания тематических разделов блога для хабов на главной */
import { getBlogHubImage } from "@/lib/media-resolver";

export type BlogCategoryMeta = {
  description: string;
  image: string;
  accent?: string;
};

const BLOG_CATEGORY_DESCRIPTIONS: Record<string, Omit<BlogCategoryMeta, "image">> = {
  Патагония: {
    description: "Ледники, треккинг, El Calafate и Ushuaia",
  },
  "Буэнос-Айрес": {
    description: "Районы, культура, еда и городские маршруты",
  },
  "Север Аргентины": {
    description: "Сальта, Quebrada, высокогорье и цветные холмы",
  },
  "Водопады Игуасу": {
    description: "Нацпарк, тропы, сезоны и комбинации с BA",
  },
  "Национальные парки": {
    description: "Los Glaciares, Nahuel Huapi и правила посещения",
  },
  "Горы и треккинг": {
    description: "Fitz Roy, Laguna de los Tres, снаряжение",
  },
  Винодельни: {
    description: "Мендоса, мальбек, винодельни и дегустации",
  },
  "Животные Аргентины": {
    description: "Киты, пингвины, кондоры и полуостров Вальдес",
  },
  "Кухня Аргентины": {
    description: "Asado, empanadas, mate и гастрономические туры",
  },
  Транспорт: {
    description: "Авиа, автобусы, аренда авто и поезда",
  },
  "Деньги и обмен валют": {
    description: "Курс, наличные, карты и бюджет поездки",
  },
  Безопасность: {
    description: "Советы по BA, регионам и типичным ошибкам",
  },
  "Интернет и связь": {
    description: "SIM-карты, Wi‑Fi и связь в поездке",
  },
  "Районы Буэнос-Айреса": {
    description: "Palermo, Recoleta, San Telmo и где жить",
  },
  "Переезд и релокация": {
    description: "90 дней, виза, страховка и продление",
  },
  Путешествия: {
    description: "Готовые маршруты на 7–14 дней и open-jaw",
  },
  Советы: {
    description: "Сезоны, сборы и практика первой поездки",
  },
  Гастрономия: {
    description: "Стейк, parrilla и гастрономические маршруты",
  },
  Культура: {
    description: "Танго, milonga и культурные маршруты",
  },
  Путеводитель: {
    description: "Деньги, въезд, районы и базовая подготовка",
  },
  Иммиграция: {
    description: "Въезд, документы и туристические правила",
  },
  Туры: {
    description: "Винные маршруты и организованные поездки",
  },
};

export const BLOG_CATEGORY_META: Record<string, BlogCategoryMeta> = Object.fromEntries(
  Object.entries(BLOG_CATEGORY_DESCRIPTIONS).map(([label, meta]) => [
    label,
    { ...meta, image: getBlogHubImage(label) },
  ]),
);

export const BLOG_DEFAULT_CATEGORY_META: BlogCategoryMeta = {
  description: "Практические материалы для путешественников",
  image: getBlogHubImage("Путешествия"),
};
