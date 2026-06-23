"use client";

import Link from "next/link";
import { NAV_FOOTER_SERVICE_LINKS } from "@/data/site-nav";
import { cn } from "@/lib/cn";
import { navLinkLabel } from "@/lib/site-nav";
import type { NavTranslate } from "@/lib/site-nav";

export function MegaMenuServicesFooter({
  t,
  onNavigate,
  className,
}: {
  t: NavTranslate;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-t border-border-subtle px-5 py-2.5 text-xs leading-relaxed text-slate/70",
        className,
      )}
    >
      {NAV_FOOTER_SERVICE_LINKS.map((link, index) => (
        <span key={link.id}>
          {index > 0 ? <span aria-hidden> · </span> : null}
          <Link href={link.href} onClick={onNavigate} className="transition-colors hover:text-sky">
            {navLinkLabel(link, t)}
          </Link>
        </span>
      ))}
    </div>
  );
}
