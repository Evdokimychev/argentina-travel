import type { BlogPost } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";

const rt = (minutes: number) => formatBlogReadTime(minutes);

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "best-time-to-visit-argentina",
    title: "Когда лучше ехать в Аргентину: сезоны и климат",
    excerpt:
      "Разбираемся, в какое время года лучше посетить Патагонию, Буэнос-Айрес и северо-запад страны.",
    content:
      "Аргентина — огромная страна с разнообразным климатом. Для Патагонии лучшее время — с ноября по март (лето в южном полушарии), когда дни длинные и погода стабильнее. Буэнос-Айрес приятен круглый год, но осень (март–май) особенно красива. Северо-запад (Сальта, Кафаяте) комфортнее посещать весной и осенью, избегая жары лета и холодов зимы на высоте. Подробнее о сезонности — в путеводителе по погоде и в статьях о конкретных регионах.",
    author: "Мария Гонсалес",
    authorBio: "Экскурсовод по Патагонии, 8 лет в туризме",
    date: "2025-05-15",
    image:
      "https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=1200&q=80",
    category: "Советы",
    readTimeMinutes: 5,
    readTime: rt(5),
    views: 12480,
    tags: ["сезон", "климат", "Patagonia", "Buenos Aires", "Salta"],
    featured: true,
    cardVariant: "featured",
    relatedResources: [
      { label: "Погода и сезонность", href: "/guide/pogoda-i-sezonnost", type: "guide" },
      { label: "Туры в Patagonia", href: "/tours?query=Patagonia", type: "tour" },
    ],
  },
  {
    id: "2",
    slug: "argentinian-steak-guide",
    title: "Аргентинский стейк: asado и parrilla",
    excerpt:
      "Всё о культуре asado: от выбора мяса до лучших parrilla в Буэнос-Айресе.",
    content:
      "Asado — не просто барбекю, а целый ритуал. Традиционно готовят на parrilla (гриле) разные отрубы: bife de chorizo (рибай), ojo de bife, vacío (фланк). Лучшие parrilla Буэнос-Айреса: Don Julio, La Cabrera, El Pobre Luis. Не забудьте chimichurri — соус из петрушки, чеснока и оливкового масла. Раздел путеводителя о кухне дополняет эту статью рекомендациями по вину и регионам.",
    author: "Карлос Ривера",
    date: "2025-04-28",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=80",
    category: "Гастрономия",
    readTimeMinutes: 7,
    readTime: rt(7),
    views: 9340,
    tags: ["asado", "parrilla", "Buenos Aires", "стейк", "гастрономия"],
    relatedResources: [
      { label: "Кухня Аргентины", href: "/guide/kukhnya", type: "guide" },
      { label: "Туры с гастрономией", href: "/tours?query=гастроном", type: "tour" },
    ],
  },
  {
    id: "3",
    slug: "tango-beginners-guide",
    title: "Танго для начинающих: milonga и первые шаги",
    excerpt:
      "Как посетить milonga в Буэнос-Айресе и не чувствовать себя чужим на танцполе.",
    content:
      "Milonga — место, где местные танцуют танго. Для туристов есть milonga de practica и milonga de baile. Начните с урока в San Telmo или La Boca. Дресс-код: smart casual. Приглашение — cabeceo: кивок глазами. Не отказывайтесь от приглашения — это часть культуры. Подробнее о районах BA — в путеводителе и статье о безопасных маршрутах.",
    author: "Ана Лópez",
    date: "2025-04-10",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80",
    category: "Культура",
    readTimeMinutes: 6,
    readTime: rt(6),
    views: 7120,
    tags: ["танго", "milonga", "San Telmo", "культура", "Buenos Aires"],
    relatedResources: [
      { label: "Культура", href: "/guide/kultura", type: "guide" },
      { label: "Буэнос-Айрес", href: "/destinations/ba", type: "tour" },
    ],
  },
  {
    id: "4",
    slug: "patagonia-packing-list",
    title: "Что взять в Patagonia: список вещей",
    excerpt:
      "Слои одежды, обувь и аксессуары для комфортного треккинга в переменчивую погоду.",
    content:
      "Patagonia славится ветром и резкими перепадами температур. Принцип трёх слоёв: базовый (термобельё), средний (флис), верхний (непродуваемая куртка). Обязательно: трекинговые ботинки, солнцезащитные очки, крем SPF 50+, перчатки. Не забудьте power bank. Список согласован с программой туров в Los Glaciares и Torres del Paine.",
    author: "Pablo Martínez",
    date: "2025-03-22",
    image:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80",
    category: "Советы",
    readTimeMinutes: 4,
    readTime: rt(4),
    views: 15890,
    tags: ["Patagonia", "треккинг", "сборы", "одежда", "Perito Moreno"],
    relatedResources: [
      { label: "Тур: ледники Patagonia", href: "/tours/patagonia-glaciers", type: "tour" },
      { label: "Безопасность на природе", href: "/guide/bezopasnost", type: "guide" },
    ],
  },
  {
    id: "5",
    slug: "blue-dollar-argentina-2025",
    title: "Синий доллар и оплата в Аргентине: что знать туристу",
    excerpt:
      "Как безопасно обменять валюту, платить картой и не переплачивать в 2025 году.",
    content:
      "У Аргентины несколько курсов доллара: официальный, MEP и «blue». Туристу важно понимать, где выгоднее платить картой, а где — наличными USD или EUR. Не меняйте уличным менялам. Western Union и обмен через криптовалюту — отдельная тема для резидентов. Полный разбор — в путеводителе «Экономика и деньги», здесь — краткий список перед поездкой.",
    author: "Редакция «Пора в Аргентину»",
    date: "2025-06-01",
    image:
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=80",
    category: "Путеводитель",
    readTimeMinutes: 8,
    readTime: rt(8),
    views: 22100,
    tags: ["деньги", "dólar blue", "обмен", "карты", "ARS"],
    cardVariant: "standard",
    relatedResources: [
      { label: "Экономика и деньги", href: "/guide/ekonomika-i-dengi", type: "guide" },
      { label: "Безопасность", href: "/guide/bezopasnost", type: "guide" },
    ],
  },
  {
    id: "6",
    slug: "argentina-tourist-visa-2025",
    title: "Въезд туриста в Аргентину: виза, сроки и документы",
    excerpt:
      "Кто может въехать без визы, сколько дней дают на границе и что подготовить заранее.",
    content:
      "Граждане многих стран, включая Россию, въезжают без визы на срок до 90 дней (уточняйте актуальные правила). Нужны: действующий загранпаспорт, обратный билет или продолжение маршрута, иногда — подтверждение жилья и страховка. Для длительного пребывания смотрите раздел иммиграции. Эта статья — для туристической поездки, не для переезда.",
    author: "Редакция «Пора в Аргентину»",
    date: "2025-05-28",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80",
    category: "Иммиграция",
    readTimeMinutes: 6,
    readTime: rt(6),
    views: 18750,
    tags: ["виза", "въезд", "паспорт", "миграция", "турист"],
    relatedResources: [
      { label: "Визы для туристов", href: "/immigration/vizy-dlya-turistov", type: "immigration" },
      { label: "Иммиграция", href: "/immigration", type: "immigration" },
    ],
  },
  {
    id: "7",
    slug: "buenos-aires-neighborhoods",
    title: "Районы Buenos Aires: где остановиться и гулять",
    excerpt:
      "Palermo, Recoleta, San Telmo и другие — краткий обзор для выбора жилья и маршрутов.",
    content:
      "Palermo и Recoleta — база для первого визита: кафе, парки, безопаснее днём. San Telmo — танго и антиквариат, осторожнее с вещами. La Boca — только туристические улицы днём. Puerto Madero — спокойнее, но дороже. Подробные таблицы районов — в путеводителе «Где жить» и «Безопасность».",
    author: "Мария Гонсалес",
    date: "2025-05-20",
    image:
      "https://images.unsplash.com/photo-1589909202800-2f2e1b8a4b8e?w=1200&q=80",
    category: "Путеводитель",
    readTimeMinutes: 9,
    readTime: rt(9),
    views: 10340,
    tags: ["Buenos Aires", "районы", "жильё", "Palermo", "Recoleta"],
    relatedResources: [
      { label: "Где жить", href: "/guide/gde-zhit", type: "guide" },
      { label: "Безопасность", href: "/guide/bezopasnost", type: "guide" },
      { label: "Туры в BA", href: "/tours/buenos-aires-tango", type: "tour" },
    ],
  },
  {
    id: "8",
    slug: "mendoza-wine-route",
    title: "Винный маршрут Mendoza: bodega за одни выходные",
    excerpt:
      "Maipú, Luján de Cuyo и Uco Valley — как спланировать дегустации без машины и с машиной.",
    content:
      "Mendoza — столица malbec. Maipú ближе к городу и удобна на велосипеде между bodega. Luján — классика с видом на Андes. Uco Valley — премиум и высота. Бронируйте дегустации заранее в высокий сезон. Можно совместить с туром на несколько дней из каталога — трансфер и гид включены.",
    author: "Карлос Ривера",
    date: "2025-04-05",
    image:
      "https://images.unsplash.com/photo-1506377247377-2ecb89819a88?w=1200&q=80",
    category: "Туры",
    readTimeMinutes: 7,
    readTime: rt(7),
    views: 5680,
    tags: ["Mendoza", "вино", "bodega", "malbec", "Uco Valley"],
    relatedResources: [
      { label: "Тур: Mendoza", href: "/tours/mendoza-wine", type: "tour" },
      { label: "Кухня и вино", href: "/guide/kukhnya", type: "guide" },
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export { getBlogCategories, getBlogTags, filterBlogPosts, sortBlogPostsByDate, computeBlogStats, formatBlogViews, formatBlogReadTime } from "@/lib/blog-utils";
