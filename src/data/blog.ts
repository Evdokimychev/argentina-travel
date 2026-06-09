import { BlogPost } from "@/types";

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "best-time-to-visit-argentina",
    title: "Когда лучше ехать в Аргентину: сезоны и климат",
    excerpt:
      "Разбираемся, в какое время года лучше посетить Патагонию, Буэнос-Айрес и северо-запад страны.",
    content:
      "Аргентина — огромная страна с разнообразным климатом. Для Патагонии лучшее время — с ноября по март (лето в южном полушарии), когда дни длинные и погода стабильнее. Буэнос-Айрес приятен круглый год, но осень (март–май) особенно красива. Северо-запад (Сальта, Кафаяте) комфортнее посещать весной и осенью, избегая жары лета и холодов зимы на высоте.",
    author: "Мария Гонсалес",
    date: "2025-05-15",
    image:
      "https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=800&q=80",
    category: "Советы",
    readTime: "5 мин",
  },
  {
    id: "2",
    slug: "argentinian-steak-guide",
    title: "Гид по аргентинскому стейку: asado и parrilla",
    excerpt:
      "Всё о культуре asado: от выбора мяса до лучших parrilla в Буэнос-Айресе.",
    content:
      "Asado — не просто барбекю, а целый ритуал. Традиционно готовят на parrilla (гриле) разные отрубы: bife de chorizo (рибай), ojo de bife (рибай), vacío (фlanк). Лучшие parrilla Буэнос-Айреса: Don Julio, La Cabrera, El Pobre Luis. Не забудьте заказать chimichurri — соус из петрушки, чеснока и оливкового масла.",
    author: "Карлос Ривера",
    date: "2025-04-28",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80",
    category: "Гастрономия",
    readTime: "7 мин",
  },
  {
    id: "3",
    slug: "tango-beginners-guide",
    title: "Танго для начинающих: milonga и первые шаги",
    excerpt:
      "Как посетить milonga в Буэнос-Айресе и не чувствовать себя чужим на танцполе.",
    content:
      "Milonga — это место, где местные танцуют танго. Для туристов есть milonga de practica (практика) и milonga de baile (танцы). Начните с урока в San Telmo или La Boca. Дресс-код: smart casual. Приглашение на танец — cabeceo: кивок глазами. Не отказывайтесь от приглашения — это часть культуры.",
    author: "Ана Лópez",
    date: "2025-04-10",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    category: "Культура",
    readTime: "6 мин",
  },
  {
    id: "4",
    slug: "patagonia-packing-list",
    title: "Что взять в Патагонию: список вещей",
    excerpt:
      "Слои одежды, обувь и аксессуары для комфортного треккинга в переменчивую погоду.",
    content:
      "Патагония славится ветром и резкими перепадами температур. Принцип трёх слоёв: базовый (термобельё), средний (флис), верхний (непродуваемая куртка). Обязательно: трекинговые ботинки, солнцезащитные очки, крем SPF 50+, перчатки. Не забудьте power bank — розетки не везде.",
    author: "Пабlo Мартínez",
    date: "2025-03-22",
    image:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
    category: "Советы",
    readTime: "4 мин",
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
