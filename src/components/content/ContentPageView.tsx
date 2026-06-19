import Link from "next/link";
import ImmigrationSectionNav from "@/components/immigration/ImmigrationSectionNav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { getContentHubMeta } from "@/lib/content-pages";
import { siteContainerClass } from "@/lib/site-container";
import type { ContentPage } from "@/types/content-page";

interface ContentPageViewProps {
  page: ContentPage;
}

export default function ContentPageView({ page }: ContentPageViewProps) {
  const hub = getContentHubMeta(page.section);

  return (
    <>
      {page.section === "immigration" ? <ImmigrationSectionNav /> : null}
      <div className="bg-surface-muted pb-16">
      <div className={cn(siteContainerClass, "py-8 md:py-12")}>
        <nav className="text-sm text-slate" aria-label="Хлебные крошки">
          <Link href="/" className="transition-colors hover:text-sky">
            Главная
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <Link href={hub.href} className="transition-colors hover:text-sky">
            {hub.label}
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-charcoal">{page.title}</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <span className="inline-block rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky">
            {page.category}
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold text-charcoal md:text-4xl">
            {page.title}
          </h1>
          <p className="mt-3 text-base text-slate">{page.description}</p>
          <p className="mt-2 text-xs text-slate/80">
            Обновлено:{" "}
            {new Intl.DateTimeFormat("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date(page.updatedAt))}
          </p>
        </header>

        <article className="prose-legal mt-10 max-w-3xl space-y-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {page.sections.map((section, index) => (
            <section key={index}>
              {section.heading ? (
                <h2 className="font-heading text-xl font-bold text-charcoal">{section.heading}</h2>
              ) : null}
              {section.paragraphs?.map((paragraph, pIndex) => (
                <p
                  key={pIndex}
                  className={cn(
                    "text-sm leading-relaxed text-slate",
                    section.heading || pIndex > 0 ? "mt-3" : undefined
                  )}
                >
                  {paragraph}
                </p>
              ))}
              {section.list ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>

        {page.relatedLinks && page.relatedLinks.length > 0 ? (
          <aside className="mt-10 max-w-3xl">
            <h2 className="font-heading text-lg font-bold text-charcoal">См. также</h2>
            <ul className="mt-4 space-y-2">
              {page.relatedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex flex-col rounded-xl border border-gray-100 bg-white px-4 py-3 transition-colors hover:border-sky/30 hover:bg-sky/5"
                  >
                    <span className="text-sm font-medium text-charcoal group-hover:text-sky">
                      {link.label}
                    </span>
                    {link.description ? (
                      <span className="mt-0.5 text-xs text-slate">{link.description}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}

        {page.relatedTourQuery ? (
          <div className="mt-10 max-w-3xl rounded-2xl bg-patagonia/5 p-6 text-center">
            <p className="font-heading text-lg font-bold text-charcoal">
              Туры по теме: {page.relatedTourQuery}
            </p>
            <p className="mt-2 text-sm text-slate">
              Авторские маршруты от организаторов на платформе
            </p>
            <Link
              href={`/tours?query=${encodeURIComponent(page.relatedTourQuery)}`}
              className={cn(buttonVariants(), "mt-4 inline-flex rounded-full px-6")}
            >
              Смотреть туры
            </Link>
          </div>
        ) : null}

        <p className="mt-8 text-sm text-slate">
          {page.section === "immigration" ? (
            <>
              Нужна персональная консультация?{" "}
              <Link href="/contacts" className="font-medium text-sky hover:underline">
                Свяжитесь с нами
              </Link>
              . Материал носит справочный характер и не заменяет юридическую помощь.
            </>
          ) : (
            <>
              Остались вопросы?{" "}
              <Link href="/faq" className="font-medium text-sky hover:underline">
                Частые вопросы
              </Link>
              {" · "}
              <Link href="/contacts" className="font-medium text-sky hover:underline">
                Контакты
              </Link>
            </>
          )}
        </p>
      </div>
      </div>
    </>
  );
}
