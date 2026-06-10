import Link from "next/link";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import type { GuidePartnerCard } from "@/types/guide-pillar";

type GuidePillarRecommendProps = {
  services: GuidePartnerCard[];
  intro?: string;
};

export default function GuidePillarRecommend({ services, intro }: GuidePillarRecommendProps) {
  if (!services.length) return null;

  return (
    <section id="recommend" className="scroll-mt-24">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-sky" aria-hidden />
        <h2 className="font-display text-xl font-bold text-charcoal">Рекомендуем</h2>
      </div>
      <p className="mt-2 text-sm text-slate">
        {intro ??
          "Проверенные сервисы и консультации — без навязанных схем. Выбирайте то, что подходит вашему маршруту."}
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <article
            key={service.href + service.title}
            className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-card"
          >
            {service.softIntro ? (
              <p className="text-xs font-medium text-sky">{service.softIntro}</p>
            ) : null}
            <h3 className="font-display text-base font-bold text-charcoal">{service.title}</h3>
            <p className="mt-2 flex-1 text-sm text-slate">{service.description}</p>
            <Link
              href={service.href}
              target={service.external ? "_blank" : undefined}
              rel={service.external ? "noopener noreferrer" : undefined}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky transition-colors hover:text-sky/80"
            >
              {service.ctaLabel ?? "Подробнее"}
              {service.external ? (
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              )}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
