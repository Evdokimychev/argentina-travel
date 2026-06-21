"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Clock,
  ExternalLink,
  Info,
  Lightbulb,
  MapPin,
  Mountain,
  Star,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { siteScrollAnchorClass } from "@/lib/site-container";
import type {
  BlogRichArticle,
  BlogRichBlock,
  BlogRichCalloutVariant,
  BlogRichSeason,
  BlogRichSpot,
} from "@/types/blog-rich-article";

const CALLOUT_STYLES: Record<
  BlogRichCalloutVariant,
  { border: string; bg: string; icon: typeof Info; iconClass: string }
> = {
  info: {
    border: "border-gray-200",
    bg: "bg-surface-muted/70",
    icon: Info,
    iconClass: "text-slate",
  },
  tip: {
    border: "border-sky/20",
    bg: "bg-sky/[0.06]",
    icon: Lightbulb,
    iconClass: "text-sky",
  },
  warning: {
    border: "border-amber-200/80",
    bg: "bg-amber-50/60",
    icon: AlertTriangle,
    iconClass: "text-amber-700",
  },
};

function RichCallout({
  variant,
  title,
  body,
}: {
  variant: BlogRichCalloutVariant;
  title: string;
  body: string;
}) {
  const style = CALLOUT_STYLES[variant];
  const Icon = style.icon;
  return (
    <aside
      className={cn(
        "rounded-2xl border p-4 shadow-sm sm:p-5",
        style.border,
        style.bg
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", style.iconClass)} aria-hidden />
        <div>
          <p className="font-heading text-sm font-bold text-charcoal">{title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate">{body}</p>
        </div>
      </div>
    </aside>
  );
}

function RichStatsGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-sky/[0.03] p-4 shadow-sm"
        >
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate/80">
            {item.label}
          </dt>
          <dd className="mt-1.5 text-sm font-medium leading-snug text-charcoal">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RichLinks({
  title,
  items,
}: {
  title?: string;
  items: Array<{ label: string; href: string; external?: boolean }>;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      {title ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate/80">
          {title}
        </p>
      ) : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.href}>
            {item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-sky hover:underline"
              >
                {item.label}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </a>
            ) : (
              <Link
                href={item.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-sky hover:underline"
              >
                {item.label}
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RichSpotCard({ spot }: { spot: BlogRichSpot }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky text-sm font-bold text-white">
          {spot.rank}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base font-bold text-charcoal sm:text-lg">{spot.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate">{spot.why}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-slate">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {spot.duration}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-slate">
              <Mountain className="h-3.5 w-3.5" aria-hidden />
              {spot.difficulty}
            </span>
          </div>
          <p className="mt-3 rounded-xl bg-sky/[0.05] px-3 py-2 text-xs leading-relaxed text-charcoal/90">
            <span className="font-semibold text-sky-dark">Совет: </span>
            {spot.tip}
          </p>
        </div>
      </div>
    </article>
  );
}

function RichTable({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: string[][];
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[520px] text-left text-sm">
        {caption ? (
          <caption className="border-b border-gray-100 bg-surface-muted/50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate">
            {caption}
          </caption>
        ) : null}
        <thead>
          <tr className="border-b border-gray-100 bg-surface-muted/60">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 font-heading font-bold text-charcoal"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-50 last:border-0">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    "px-4 py-3 text-slate",
                    cellIndex === 0 && "font-medium text-charcoal"
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RichSeasonCard({ season }: { season: BlogRichSeason }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="font-heading text-base font-bold text-charcoal">{season.name}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Плюсы</p>
          <ul className="mt-1.5 space-y-1 text-sm text-slate">
            {season.pros.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-emerald-600" aria-hidden>
                  +
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Минусы</p>
          <ul className="mt-1.5 space-y-1 text-sm text-slate">
            {season.cons.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-700" aria-hidden>
                  −
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function RichFaqList({ items }: { items: Array<{ question: string; answer: string }> }) {
  return (
    <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
      {items.map((item) => (
        <details key={item.question} className="group px-4 py-3 sm:px-5 sm:py-4">
          <summary className="cursor-pointer list-none font-medium text-charcoal marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-3">
              <span>{item.question}</span>
              <span className="mt-0.5 text-sky transition group-open:rotate-45" aria-hidden>
                +
              </span>
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-slate">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} из 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "h-4 w-4",
            index < value ? "fill-amber-400 text-amber-400" : "text-gray-200"
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

function RichRatings({
  items,
  audience,
  note,
}: {
  items: Array<{ label: string; stars: number }>;
  audience: string[];
  note?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-sm font-medium text-charcoal">{item.label}</span>
            <StarRating value={item.stars} />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-sky/15 bg-sky/[0.04] p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-dark">Кому подойдёт</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {audience.map((item) => (
            <li
              key={item}
              className="rounded-full border border-sky/15 bg-white px-3 py-1.5 text-xs font-medium text-charcoal"
            >
              {item}
            </li>
          ))}
        </ul>
        {note ? <p className="mt-3 text-xs leading-relaxed text-slate">{note}</p> : null}
      </div>
    </div>
  );
}

function RichBlock({ block }: { block: BlogRichBlock }) {
  switch (block.type) {
    case "paragraphs":
      return (
        <div className="space-y-4">
          {block.items.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="leading-relaxed text-slate">
              {paragraph}
            </p>
          ))}
        </div>
      );
    case "callout":
      return <RichCallout variant={block.variant} title={block.title} body={block.body} />;
    case "stats":
      return <RichStatsGrid items={block.items} />;
    case "links":
      return <RichLinks title={block.title} items={block.items} />;
    case "spots":
      return (
        <div className="grid gap-4">
          {block.items.map((spot) => (
            <RichSpotCard key={spot.rank} spot={spot} />
          ))}
        </div>
      );
    case "table":
      return <RichTable headers={block.headers} rows={block.rows} caption={block.caption} />;
    case "bullets":
      return (
        <div>
          {block.title ? (
            <h3 className="mb-2 font-heading text-base font-semibold text-charcoal">{block.title}</h3>
          ) : null}
          <ul className="list-disc space-y-2 pl-5 text-slate">
            {block.items.map((item) => (
              <li key={item.slice(0, 48)} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    case "seasons":
      return (
        <div className="space-y-4">
          {block.items.map((season) => (
            <RichSeasonCard key={season.name} season={season} />
          ))}
          {block.conclusion ? (
            <p className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate shadow-sm sm:px-5">
              {block.conclusion}
            </p>
          ) : null}
        </div>
      );
    case "faq":
      return <RichFaqList items={block.items} />;
    case "ratings":
      return (
        <RichRatings items={block.items} audience={block.audience} note={block.note} />
      );
    case "numbered-tips":
      return (
        <ol className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          {block.items.map((item, index) => (
            <li key={item.slice(0, 40)} className="flex gap-3 text-sm leading-relaxed text-slate">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky/10 text-xs font-bold text-sky">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    default:
      return null;
  }
}

export default function BlogRichArticle({ article }: { article: BlogRichArticle }) {
  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/[0.07] via-white to-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sky" aria-hidden />
          <div>
            <p className="text-base leading-relaxed text-charcoal">{article.lede}</p>
            {article.intro?.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="mt-4 text-base leading-relaxed text-charcoal">
                {paragraph}
              </p>
            ))}
            {article.updatedLabel ? (
              <p className="mt-3 text-xs leading-relaxed text-slate">{article.updatedLabel}</p>
            ) : null}
          </div>
        </div>
      </div>

      {article.sections.map((section) => (
        <section key={section.id} id={section.id} className="space-y-5">
          <h2
            className={cn(
              "font-heading text-xl font-bold text-charcoal sm:text-2xl",
              siteScrollAnchorClass
            )}
          >
            {section.title}
          </h2>
          <div className="space-y-5">
            {section.blocks.map((block, index) => (
              <RichBlock key={`${section.id}-${index}`} block={block} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
