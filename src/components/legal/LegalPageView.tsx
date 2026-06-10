import Link from "next/link";
import type { LegalDocument } from "@/data/legal-content";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

interface LegalPageViewProps {
  document: LegalDocument;
}

export default function LegalPageView({ document }: LegalPageViewProps) {
  return (
    <div className="bg-surface-muted pb-16">
      <div className={cn(siteContainerClass, "py-8 md:py-12")}>
        <nav className="text-sm text-slate">
          <Link href="/" className="transition-colors hover:text-sky">
            Главная
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-charcoal">{document.title}</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">
            {document.title}
          </h1>
          <p className="mt-3 text-base text-slate">{document.description}</p>
          <p className="mt-2 text-xs text-slate/80">
            Обновлено:{" "}
            {new Intl.DateTimeFormat("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date(document.updatedAt))}
          </p>
        </header>

        <article className="prose-legal mt-10 max-w-3xl space-y-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {document.sections.map((section, index) => (
            <section key={index}>
              {section.heading ? (
                <h2 className="font-display text-xl font-bold text-charcoal">{section.heading}</h2>
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

        <p className="mt-8 text-sm text-slate">
          Вопросы по документу?{" "}
          <Link href="/contacts" className="font-medium text-sky hover:underline">
            Свяжитесь с нами
          </Link>
        </p>
      </div>
    </div>
  );
}
