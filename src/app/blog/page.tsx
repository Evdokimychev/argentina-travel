import BlogIndexView from "@/components/blog/BlogIndexView";

export const metadata = {
  title: "Блог — советы и маршруты по Аргентине",
  description:
    "Редакционные гиды и тематический каталог: Patagonia, Buenos Aires, визы, деньги, треккинг, вино и маршруты на 7–14 дней.",
};

export default function BlogPage() {
  return <BlogIndexView />;
}
