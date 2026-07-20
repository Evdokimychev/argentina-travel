import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import { SafeImage } from "@/components/ui/safe-image";
import {
  buildKbAuthorProfiles,
  getKbAuthorProfile,
} from "@/lib/knowledge-base/authors";
import { getAllEntries } from "@/lib/knowledge-base/content";
import { resolveKnowledgeCatalog } from "@/lib/cms/knowledge-resolver";
import { entryHref } from "@/lib/knowledge-base/urls";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 86_400;
export const dynamicParams = true;

export function generateStaticParams() {
  return buildKbAuthorProfiles(getAllEntries()).map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = getKbAuthorProfile(slug, await resolveKnowledgeCatalog());
  if (!author) return { title: "Автор не найден" };
  return buildPublicPageMetadata({
    title: `${author.name} — автор базы знаний`,
    description:
      author.bio ?? `Проверенные авторские материалы ${author.name} о жизни и путешествиях в Аргентине.`,
    path: `/baza-znaniy/avtory/${author.slug}`,
    image: author.avatar,
  });
}

export default async function KnowledgeAuthorPage({ params }: PageProps) {
  const { slug } = await params;
  const author = getKbAuthorProfile(slug, await resolveKnowledgeCatalog());
  if (!author) notFound();

  return (
    <div className="bg-surface-muted pb-16">
      <div className={cn(siteContainerClass, "py-8 md:py-10")}>
        <PageBreadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "База знаний", href: "/baza-znaniy" },
            { label: "Авторы", href: "/baza-znaniy/avtory" },
            { label: author.name },
          ]}
        />

        <header className="mt-8 max-w-2xl">
          <div className="flex items-center gap-4">
            <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-sky-pale text-2xl font-semibold text-sky-ink">
              {author.avatar ? (
                <SafeImage
                  src={author.avatar}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                  placeholderVariant="avatar"
                  placeholderCompact
                  blurPlaceholder={false}
                />
              ) : (
                author.name.slice(0, 1).toLocaleUpperCase("ru")
              )}
            </span>
            <div>
              <h1 className="font-heading text-3xl font-bold text-charcoal sm:text-4xl">
                {author.name}
              </h1>
              <p className="mt-1 text-sm text-slate">Подтверждённый автор личных материалов</p>
            </div>
          </div>
          {author.bio ? (
            <p className="mt-4 text-sm leading-relaxed text-slate sm:text-base">{author.bio}</p>
          ) : null}
        </header>

        <h2 className="mt-10 text-xl font-semibold text-foreground">Материалы автора</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {author.entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={entryHref(entry.id)}
                className="block h-full rounded-card border border-border-subtle bg-surface-elevated p-5 shadow-card transition hover:border-sky/40"
              >
                <h3 className="font-semibold text-foreground">{entry.title}</h3>
                {entry.summary ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                    {entry.summary}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
