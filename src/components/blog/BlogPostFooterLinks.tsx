import Link from "next/link";
import type { BlogRelatedResource } from "@/types";

type BlogPostFooterLinksProps = {
  links: BlogRelatedResource[];
};

export default function BlogPostFooterLinks({ links }: BlogPostFooterLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate">Полезные разделы</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex rounded-full border border-gray-200 bg-surface-muted/60 px-3 py-1.5 text-sm font-medium text-charcoal transition-colors hover:border-sky/30 hover:bg-sky/5 hover:text-sky"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
