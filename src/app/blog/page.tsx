import BlogIndexView from "@/components/blog/BlogIndexView";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "Блог — советы и маршруты по Аргентине";
const PAGE_DESCRIPTION =
  "Редакционные материалы и тематический каталог: Патагония, Буэнос-Айрес, визы, деньги, треккинг, вино и маршруты на 7–14 дней.";

export const metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/blog",
});

export default function BlogPage() {
  return <BlogIndexView />;
}
