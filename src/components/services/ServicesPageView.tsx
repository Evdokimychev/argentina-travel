import Link from "next/link";
import { ArrowRight, ExternalLink, Plane } from "lucide-react";
import Hero from "@/components/Hero";
import {
  SERVICE_CATEGORIES,
  SERVICES_HUB_DISCLAIMER,
  SERVICES_HUB_INTRO,
} from "@/data/services-hub";
import { siteContainerClass } from "@/lib/site-container";

export default function ServicesPageView() {
  return (
    <>
      <Hero
        title="Сервисы для поездки"
        subtitle="Перелёты, трансферы, страхование и визовая поддержка — партнёры и заявки"
        image="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80"
        compact
      />

      <section className={siteContainerClass + " py-12 sm:py-16"}>
        <div className="max-w-3xl">
          <p className="text-base leading-relaxed text-slate">{SERVICES_HUB_INTRO}</p>
        </div>

        <div className="mt-10 space-y-10">
          {SERVICE_CATEGORIES.map((category) => (
            <div key={category.id}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky">
                  <Plane className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-heading text-xl font-bold text-charcoal">{category.title}</h2>
                  <p className="mt-1 text-sm text-slate">{category.description}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {category.items.map((item) => {
                  const isExternal = item.external;

                  if (isExternal) {
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-colors hover:border-sky/30 hover:bg-sky/5"
                      >
                        <span className="font-medium text-charcoal group-hover:text-sky">
                          {item.title}
                        </span>
                        <span className="mt-2 text-sm text-slate">{item.description}</span>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky">
                          Открыть партнёра
                          <ExternalLink className="h-4 w-4" />
                        </span>
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-colors hover:border-sky/30 hover:bg-sky/5"
                    >
                      <span className="font-medium text-charcoal group-hover:text-sky">
                        {item.title}
                      </span>
                      <span className="mt-2 text-sm text-slate">{item.description}</span>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky">
                        Подробнее
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <aside className="mt-12 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-6">
          <p className="text-sm leading-relaxed text-charcoal">{SERVICES_HUB_DISCLAIMER}</p>
        </aside>
      </section>
    </>
  );
}
