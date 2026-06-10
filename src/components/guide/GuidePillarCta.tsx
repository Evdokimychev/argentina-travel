import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SITE_WHATSAPP_URL } from "@/data/site-contacts";
import { cn } from "@/lib/cn";

export default function GuidePillarCta() {
  return (
    <section
      id="cta"
      className="scroll-mt-24 rounded-2xl bg-patagonia/5 p-6 text-center sm:p-8"
    >
      <p className="font-display text-lg font-bold text-charcoal">
        Остались вопросы об Аргентине?
      </p>
      <p className="mt-2 text-sm text-slate">
        Авторские туры с прозрачной оплатой, консультация по валюте или раздел об иммиграции для
        планирующих переезд.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Link href="/tours" className={cn(buttonVariants(), "rounded-full px-6")}>
          Каталог туров
        </Link>
        <Link
          href="/contacts"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6")}
        >
          Связаться с нами
        </Link>
        <Link
          href="/immigration"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6")}
        >
          Иммиграция и ВНЖ
        </Link>
        <Link
          href={SITE_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6")}
        >
          WhatsApp
        </Link>
      </div>
    </section>
  );
}
