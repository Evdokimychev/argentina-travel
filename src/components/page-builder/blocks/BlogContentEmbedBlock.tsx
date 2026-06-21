import Link from "next/link";
import { ArrowRight, MapPin, Newspaper } from "lucide-react";
import type { BlogContentEmbedKind } from "@/types/blog-content-blocks";

type Props = {
  embedKind: BlogContentEmbedKind;
  slug: string;
  title?: string;
};

function resolveHref(kind: BlogContentEmbedKind, slug: string): string {
  switch (kind) {
    case "tour":
      return `/tours/${slug}`;
    case "excursion":
      return `/excursions/${slug}`;
    case "article":
      return `/blog/${slug}`;
    case "guide":
      return `/guide/${slug}`;
  }
}

const KIND_LABELS: Record<BlogContentEmbedKind, string> = {
  tour: "Тур",
  excursion: "Экскурсия",
  article: "Статья",
  guide: "Путеводитель",
};

export default function BlogContentEmbedBlock({ embedKind, slug, title }: Props) {
  if (!slug.trim()) return null;

  const href = resolveHref(embedKind, slug);
  const label = title?.trim() || slug;

  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl border border-sky/20 bg-sky/5 p-4 transition hover:border-sky/40 hover:bg-sky/10"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sky shadow-sm">
        {embedKind === "tour" || embedKind === "excursion" ? (
          <MapPin className="h-4 w-4" aria-hidden />
        ) : (
          <Newspaper className="h-4 w-4" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-xs font-medium uppercase tracking-wide text-sky">
          {KIND_LABELS[embedKind]}
        </span>
        <span className="mt-1 block font-heading text-base font-semibold text-charcoal group-hover:text-sky">
          {label}
        </span>
      </span>
      <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-slate transition group-hover:text-sky" aria-hidden />
    </Link>
  );
}
