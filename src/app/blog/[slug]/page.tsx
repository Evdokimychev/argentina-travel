import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug, formatDate, blogPosts } from "@/data/blog";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: "Статья не найдена" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <section className="relative h-[40vh] min-h-[300px]">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 gradient-hero" />
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-sky hover:underline"
        >
          ← Все статьи
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate">
          <span className="rounded-full bg-wine/10 px-3 py-1 font-medium text-wine">
            {post.category}
          </span>
          <span>{formatDate(post.date)}</span>
          <span>•</span>
          <span>{post.readTime}</span>
          <span>•</span>
          <span>{post.author}</span>
        </div>

        <h1 className="mt-6 font-display text-3xl font-bold text-charcoal sm:text-4xl">
          {post.title}
        </h1>

        <p className="mt-4 text-lg text-slate leading-relaxed">{post.excerpt}</p>

        <div className="mt-8 space-y-4 text-slate leading-relaxed">
          {post.content.split(". ").map((paragraph, i) => (
            <p key={i}>{paragraph}{i < post.content.split(". ").length - 1 ? "." : ""}</p>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-patagonia/5 p-6 text-center">
          <p className="font-display text-lg font-bold text-charcoal">
            Планируете поездку в Аргентину?
          </p>
          <p className="mt-2 text-sm text-slate">
            Посмотрите наши туры или свяжитесь с нами для консультации
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/tours"
              className="rounded-full bg-patagonia px-6 py-2 text-sm font-semibold text-white hover:bg-patagonia-light"
            >
              Каталог туров
            </Link>
            <Link
              href="/contacts"
              className="rounded-full border-2 border-patagonia px-6 py-2 text-sm font-semibold text-patagonia hover:bg-patagonia hover:text-white"
            >
              Контакты
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
