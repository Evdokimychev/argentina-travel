import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { IMMIGRATION_TOPIC_ORDER, IMMIGRATION_TOPICS } from "@/data/immigration-topics";
import { immigrationTopicHref } from "@/lib/immigration-topics";
import { cn } from "@/lib/cn";
import type { ImmigrationTopicPage } from "@/types/immigration-topic";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80";

type ImmigrationNextTopicProps = {
  slug: string;
};

function TopicThumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-full min-h-[7.5rem] w-28 shrink-0 overflow-hidden sm:w-36">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="144px"
      />
      <div className="absolute inset-0 bg-charcoal/20 transition-colors group-hover:bg-charcoal/10" aria-hidden />
    </div>
  );
}

function TopicNavCard({ topic, direction }: { topic: ImmigrationTopicPage; direction: "prev" | "next" }) {
  const isPrev = direction === "prev";
  const imageSrc = topic.heroImage ?? FALLBACK_IMAGE;

  return (
    <Link
      href={immigrationTopicHref(topic.slug)}
      className={cn(
        "group flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:border-sky/30 hover:shadow-md",
        !isPrev && "sm:col-start-2"
      )}
    >
      {isPrev ? <TopicThumbnail src={imageSrc} alt={topic.title} /> : null}

      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 p-4",
          isPrev ? "text-left" : "justify-end text-right"
        )}
      >
        {isPrev ? (
          <ArrowLeft
            className="hidden h-5 w-5 shrink-0 text-slate transition-colors group-hover:text-sky sm:block"
            aria-hidden
          />
        ) : null}

        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate">
            {isPrev ? "Предыдущая тема" : "Следующая тема"}
          </span>
          <span className="mt-0.5 block font-heading text-base font-bold leading-snug text-charcoal group-hover:text-sky sm:text-lg">
            {topic.title}
          </span>
          <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate sm:text-sm">
            {topic.shortDescription}
          </span>
        </span>

        {!isPrev ? (
          <ArrowRight
            className="hidden h-5 w-5 shrink-0 text-slate transition-colors group-hover:text-sky sm:block"
            aria-hidden
          />
        ) : null}
      </div>

      {!isPrev ? <TopicThumbnail src={imageSrc} alt={topic.title} /> : null}
    </Link>
  );
}

export default function ImmigrationNextTopic({ slug }: ImmigrationNextTopicProps) {
  const index = IMMIGRATION_TOPIC_ORDER.indexOf(slug as (typeof IMMIGRATION_TOPIC_ORDER)[number]);
  if (index === -1) return null;

  const prevSlug = index > 0 ? IMMIGRATION_TOPIC_ORDER[index - 1] : null;
  const nextSlug =
    index < IMMIGRATION_TOPIC_ORDER.length - 1 ? IMMIGRATION_TOPIC_ORDER[index + 1] : null;

  if (!prevSlug && !nextSlug) return null;

  const prevTopic = prevSlug ? IMMIGRATION_TOPICS[prevSlug] : null;
  const nextTopic = nextSlug ? IMMIGRATION_TOPICS[nextSlug] : null;

  return (
    <nav className="grid gap-3 sm:grid-cols-2" aria-label="Соседние темы иммиграции">
      {prevTopic ? <TopicNavCard topic={prevTopic} direction="prev" /> : <div aria-hidden />}

      {nextTopic ? <TopicNavCard topic={nextTopic} direction="next" /> : null}
    </nav>
  );
}
