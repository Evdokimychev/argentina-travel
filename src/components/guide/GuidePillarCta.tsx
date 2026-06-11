import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SITE_WHATSAPP_URL } from "@/data/site-contacts";
import { cn } from "@/lib/cn";
import { siteScrollAnchorClass } from "@/lib/site-container";

type GuidePillarCtaProps = {
  title?: string;
  subtitle?: string;
};

export default function GuidePillarCta({
  title = "Остались вопросы об Аргентине?",
  subtitle = "Авторские туры с прозрачной оплатой, консультация по валюте или раздел об иммиграции для планирующих переезд.",
}: GuidePillarCtaProps = {}) {
  return (
    <section
      id="cta"
      className={cn(siteScrollAnchorClass, "rounded-2xl bg-patagonia/5 p-6 text-center sm:p-8")}
    >
      <p className="font-heading text-lg font-bold text-charcoal">{title}</p>
      <p className="mt-2 text-sm text-slate">{subtitle}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={SITE_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants(), "rounded-full px-6")}
        >
          Написать в WhatsApp
        </Link>
        <Link
          href="/contacts"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6")}
        >
          Заказать консультацию
        </Link>
        <Link href="/tours" className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6")}>
          Заказать тур
        </Link>
        <Link
          href="/immigration"
          className={cn(buttonVariants({ variant: "ghost" }), "rounded-full px-6")}
        >
          Иммиграция и ВНЖ
        </Link>
      </div>
    </section>
  );
}
