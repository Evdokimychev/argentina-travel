"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { getGuideTopicIcon } from "@/lib/guide-nav-icons";
import { getNavBadgeLabel, navLinkLabel, resolveNavLabel } from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavColumn, SiteNavLink } from "@/types/site-nav";

function NavBadge({ badge }: { badge: SiteNavLink["badge"] }) {
  const label = getNavBadgeLabel(badge);
  if (!label) return null;

  return (
    <span className="rounded-full bg-sky/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky">
      {label}
    </span>
  );
}

function MegaMenuLink({
  link,
  t,
  onNavigate,
  showIcon = false,
}: {
  link: SiteNavLink;
  t: NavTranslate;
  onNavigate?: () => void;
  showIcon?: boolean;
}) {
  const Icon = link.topicSlug ? getGuideTopicIcon(link.topicSlug) : BookOpen;

  const content = (
    <>
      <span className="flex items-start gap-2.5">
        {showIcon && link.topicSlug ? (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky/10 text-sky transition-colors group-hover/link:bg-sky group-hover/link:text-white">
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-medium text-charcoal group-hover/link:text-sky">{navLinkLabel(link, t)}</span>
            {link.badge ? <NavBadge badge={link.badge} /> : null}
          </span>
          {link.description ? (
            <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate">{link.description}</span>
          ) : null}
        </span>
      </span>
    </>
  );

  const className =
    "group/link block rounded-xl px-3 py-2.5 transition-colors hover:bg-sky/5";

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={link.href} onClick={onNavigate} className={className}>
      {content}
    </Link>
  );
}

export function MegaMenuPanel({
  columns,
  t,
  onNavigate,
  className,
  showIcons = false,
}: {
  columns: SiteNavColumn[];
  t: NavTranslate;
  onNavigate?: () => void;
  className?: string;
  showIcons?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-6 p-5 sm:grid-cols-2",
        columns.length >= 3 && "lg:grid-cols-3",
        className
      )}
    >
      {columns.map((column) => (
        <div key={column.id} className="min-w-0">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate">
            {resolveNavLabel(
              { label: column.title ?? "", labelKey: column.titleKey },
              t
            )}
          </p>
          <ul className="space-y-0.5">
            {column.links.map((link) => (
              <li key={link.id}>
                <MegaMenuLink link={link} t={t} onNavigate={onNavigate} showIcon={showIcons} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export { NavBadge };
