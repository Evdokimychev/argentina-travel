import Link from "next/link";

import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import { SafeImage } from "@/components/ui/safe-image";
import { buildKbAuthorProfiles } from "@/lib/knowledge-base/authors";
import { resolveKnowledgeCatalog } from "@/lib/cms/knowledge-resolver";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { pluralRu } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

export const metadata = buildPublicPageMetadata({
  title: "Авторы базы знаний об Аргентине",
  description: "Авторы проверенных личных материалов и практических руководств GoArgentina.",
  path: "/baza-znaniy/avtory",
});

export const revalidate = 86_400;

export default async function KnowledgeAuthorsPage() {
  const authors = buildKbAuthorProfiles(await resolveKnowledgeCatalog());

  return (
    <div className="bg-surface-muted pb-16">
      <div className={cn(siteContainerClass, "py-8 md:py-10")}>
        <PageBreadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "База знаний", href: "/baza-znaniy" },
            { label: "Авторы" },
          ]}
        />

        <header className="mt-8 max-w-2xl">
          <h1 className="font-heading text-3xl font-bold text-charcoal sm:text-4xl">
            Авторы базы знаний
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate sm:text-base">
            Здесь собраны только материалы с подтверждённым личным авторством. Справочные статьи
            публикуются от имени редакции и проходят отдельную проверку источников.
          </p>
        </header>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <li key={author.slug}>
              <Link
                href={`/baza-znaniy/avtory/${author.slug}`}
                className="block h-full rounded-card border border-border-subtle bg-surface-elevated p-5 shadow-card transition hover:border-sky/40"
              >
                <div className="flex items-center gap-3">
                  <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-sky-pale font-semibold text-sky-ink">
                    {author.avatar ? (
                      <SafeImage
                        src={author.avatar}
                        alt=""
                        fill
                        sizes="44px"
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
                    <h2 className="font-semibold text-foreground">{author.name}</h2>
                    <p className="text-xs text-slate">
                      {author.entries.length}{" "}
                      {pluralRu(author.entries.length, "материал", "материала", "материалов")}
                    </p>
                  </div>
                </div>
                {author.bio ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">{author.bio}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
