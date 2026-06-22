import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import FaqAccordionSection from "@/components/faq/FaqAccordionSection";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import FAQPageJsonLd from "@/components/seo/FAQPageJsonLd";
import { FAQ_ITEMS } from "@/data/faq";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

const PAGE_TITLE = "Частые вопросы";
const PAGE_DESCRIPTION =
  "Ответы на популярные вопросы о бронировании туров, оплате и работе с организаторами.";

export const metadata: Metadata = buildPublicPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <FAQPageJsonLd questions={FAQ_ITEMS} path="/faq" />

      <section className="border-b border-gray-100 bg-gradient-to-br from-surface-muted via-white to-sky/[0.06]">
        <div className={cn(siteContainerClass, "py-10 md:py-12")}>
          <div className="mx-auto flex max-w-3xl items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky/10 text-sky">
              <HelpCircle className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky">Справочник</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-charcoal md:text-4xl">
                Частые вопросы
              </h1>
              <p className="mt-2 text-base leading-relaxed text-slate">
                Ответы о бронировании, оплате и работе с организаторами на «Пора в Аргентину».
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-surface-muted pb-16">
        <div className={cn(siteContainerClass, "py-8 md:py-12")}>
          <div className="mx-auto max-w-3xl">
            <PageBreadcrumbs
              items={[
                { label: "Главная", href: "/" },
                { label: "Частые вопросы" },
              ]}
            />

            <FaqAccordionSection items={FAQ_ITEMS} className="mt-8" />

            <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
              <p className="font-heading font-bold text-charcoal">Не нашли ответ?</p>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                <Link href="/contacts" className="font-medium text-sky hover:underline">
                  Напишите нам
                </Link>
                {" "}или откройте раздел{" "}
                <Link href="/legal/booking" className="font-medium text-sky hover:underline">
                  условия бронирования
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
