import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import Hero from "@/components/Hero";
import { GUIDE_INDEX_INTRO, getOrderedGuideTopics } from "@/data/guide-topics";
import { getGuideTopicIcon } from "@/lib/guide-nav-icons";
import { guideTopicHref } from "@/lib/guide-topics";
import { siteContainerClass } from "@/lib/site-container";

export default function GuidePageView() {
  const topics = getOrderedGuideTopics();

  return (
    <>
      <Hero
        title="Путеводитель по Аргентине"
        subtitle="Главные темы для планирования поездки — практика, сервисы и туры"
        image="https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=1920&q=80"
        compact
      />

      <section className={siteContainerClass + " py-12 sm:py-16"}>
        <div className="max-w-3xl">
          <p className="text-base leading-relaxed text-slate">{GUIDE_INDEX_INTRO}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {topics.map((topic) => {
            const Icon = getGuideTopicIcon(topic.slug);
            return (
              <Link
                key={topic.slug}
                href={guideTopicHref(topic.slug)}
                className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-colors hover:border-sky/30 hover:bg-sky/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky/10 text-sky transition-colors group-hover:bg-sky group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="mt-4 font-display text-lg font-bold text-charcoal group-hover:text-sky">
                  {topic.title}
                </h2>
                <p className="mt-1 flex-1 text-sm text-slate">{topic.shortDescription}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky">
                  Подробнее
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
