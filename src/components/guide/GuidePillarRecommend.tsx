import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import HubSection from "@/components/guide/hub/HubSection";
import type { GuidePartnerCard } from "@/types/guide-pillar";

type GuidePillarRecommendProps = {
  services: GuidePartnerCard[];
  intro?: string;
};

export default function GuidePillarRecommend({ services, intro }: GuidePillarRecommendProps) {
  if (!services.length) return null;

  return (
    <HubSection
      id="recommend"
      title="Рекомендуем"
      subtitle={
        intro ??
        "Проверенные сервисы и консультации — без навязанных схем. Выбирайте то, что подходит вашему маршруту."
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <article
            key={service.href + service.title}
            className="flex flex-col rounded-2xl border border-gray-100 bg-surface-muted/40 p-5"
          >
            {service.softIntro ? (
              <p className="text-xs font-medium text-sky">{service.softIntro}</p>
            ) : null}
            <h3 className="font-heading text-base font-bold text-charcoal">{service.title}</h3>
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
    </HubSection>
  );
}
