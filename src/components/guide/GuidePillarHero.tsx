import Link from "next/link";
import Hero from "@/components/Hero";
import { buttonVariants } from "@/components/ui/button";
import { SITE_WHATSAPP_URL } from "@/data/site-contacts";
import { getGuideTopicHeroImage } from "@/lib/media-resolver";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import type { GuidePillarHeroCta } from "@/types/guide-pillar";
import type { GuideTopicPage } from "@/types/guide-topic";

type GuidePillarHeroProps = {
  topic: GuideTopicPage;
  heroTitle: string;
  heroSubtitle: string;
  ctas: GuidePillarHeroCta[];
};

export default function GuidePillarHero({
  topic,
  heroTitle,
  heroSubtitle,
  ctas,
}: GuidePillarHeroProps) {
  const heroImage = topic.heroImage ?? getGuideTopicHeroImage(topic.slug);

  return (
    <>
      <Hero title={heroTitle} subtitle={heroSubtitle} image={heroImage} compact />
      <div className="border-b border-gray-100 bg-white">
        <div
          className={cn(
            siteContainerClass,
            "flex flex-wrap items-center justify-center gap-3 py-5"
          )}
        >
          {ctas.map((cta) => (
            <Link
              key={cta.href + cta.label}
              href={cta.href}
              target={cta.external ? "_blank" : undefined}
              rel={cta.external ? "noopener noreferrer" : undefined}
              className={cn(
                buttonVariants({
                  variant:
                    cta.variant === "primary"
                      ? "default"
                      : cta.variant === "secondary"
                        ? "outline"
                        : "ghost",
                }),
                "rounded-full px-5"
              )}
            >
              {cta.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export function defaultAskQuestionCta(slug: string): GuidePillarHeroCta {
  return {
    label: "Задать вопрос",
    href: `/contacts?topic=${slug}`,
    variant: "tertiary",
  };
}

export function whatsAppCta(label = "Написать в WhatsApp"): GuidePillarHeroCta {
  return {
    label,
    href: SITE_WHATSAPP_URL,
    variant: "tertiary",
    external: true,
  };
}
