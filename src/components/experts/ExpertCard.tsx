"use client";

import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { expertHref } from "@/lib/local-experts-server";
import {
  EXPERT_CATEGORY_LABELS,
  type LocalExpertView,
} from "@/types/local-experts";

type ExpertCardProps = {
  expert: LocalExpertView;
  className?: string;
};

export default function ExpertCard({ expert, className }: ExpertCardProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-sky/30 hover:shadow-md",
        className
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky/10 text-sm font-bold text-sky">
          {expert.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-bold text-charcoal">
            <Link href={expertHref(expert.slug)} className="hover:text-sky">
              {expert.name}
            </Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-slate">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {expert.city}
          </p>
        </div>
      </div>

      <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-slate">
        {expert.bio}
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {expert.categories.map((category) => (
          <span
            key={category}
            className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-charcoal"
          >
            {EXPERT_CATEGORY_LABELS[category]}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4 text-xs text-slate">
        <span>{expert.languages.map((lang) => lang.toUpperCase()).join(" · ")}</span>
        <Link
          href={expertHref(expert.slug)}
          className="inline-flex items-center gap-1 font-medium text-sky hover:underline"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
          Профиль
        </Link>
      </div>
    </article>
  );
}
