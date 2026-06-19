import Link from "next/link";
import { ArrowRight, Stamp } from "lucide-react";
import Hero from "@/components/Hero";
import {
  IMMIGRATION_HUB_ARTICLES,
  IMMIGRATION_HUB_INTRO,
  IMMIGRATION_HUB_RELATED,
} from "@/data/immigration-hub";
import { siteContainerClass } from "@/lib/site-container";

export default function ImmigrationPageView() {
  return (
    <>
      <Hero
        title="Иммиграция и въезд в Аргентину"
        subtitle="Визы, документы и обзор видов ВНЖ — справочно, без юридических гарантий"
        image="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80"
        compact
      />

      <section className={siteContainerClass + " py-12 sm:py-16"}>
        <div className="max-w-3xl">
          <p className="text-base leading-relaxed text-slate">{IMMIGRATION_HUB_INTRO}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {IMMIGRATION_HUB_ARTICLES.map((article) => (
            <Link
              key={article.id}
              href={article.href}
              className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-colors hover:border-sky/30 hover:bg-sky/5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky/10 text-sky">
                <Stamp className="h-5 w-5" aria-hidden />
              </span>
              <span className="mt-4 font-heading text-lg font-bold text-charcoal group-hover:text-sky">
                {article.label}
              </span>
              <span className="mt-2 text-sm text-slate">{article.description}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky">
                Читать
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <aside className="mt-12 rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
          <h2 className="font-heading text-lg font-bold text-charcoal">См. также</h2>
          <ul className="mt-4 space-y-2">
            {IMMIGRATION_HUB_RELATED.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.href}
                  className="group flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-sky/5"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-charcoal group-hover:text-sky">
                      {link.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate">{link.description}</span>
                  </span>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate group-hover:text-sky" />
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <p className="mt-8 text-sm text-slate">
          Материалы носят справочный характер и не заменяют консультацию миграционного юриста.{" "}
          <Link href="/contacts" className="font-medium text-sky hover:underline">
            Свяжитесь с нами
          </Link>
          , если нужна помощь с турами или платформой.
        </p>
      </section>
    </>
  );
}
