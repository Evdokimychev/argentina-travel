import Link from "next/link";
import type { ReactNode } from "react";

import { getEntry } from "@/lib/knowledge-base/content";
import { entryHref } from "@/lib/knowledge-base/urls";

type Variant = "warning" | "recommendation";

const STYLES: Record<Variant, { box: string; title: string; label: string; icon: string }> = {
  warning: {
    box: "border-warning/30 bg-warning-muted",
    title: "text-warning",
    label: "На что обратить внимание",
    icon: "⚠️",
  },
  recommendation: {
    box: "border-success/30 bg-success-muted",
    title: "text-success",
    label: "Рекомендации",
    icon: "✅",
  },
};

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

function renderCalloutText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  WIKILINK_RE.lastIndex = 0;
  while ((match = WIKILINK_RE.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const [, id, label] = match;
    const entry = getEntry(id.trim());
    nodes.push(
      <Link
        key={key++}
        href={entryHref(id.trim())}
        className="text-sky-ink underline decoration-sky/40 underline-offset-2 hover:decoration-sky-ink"
      >
        {(label ?? entry?.title ?? id).trim()}
      </Link>,
    );
    lastIndex = WIKILINK_RE.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/** Структурный блок предупреждений/рекомендаций записи. */
export default function KbCallout({
  variant,
  items,
  children,
}: {
  variant: Variant;
  items?: string[];
  children?: ReactNode;
}) {
  const style = STYLES[variant];
  if ((!items || items.length === 0) && !children) return null;
  return (
    <aside className={`my-5 rounded-panel border px-4 py-3.5 ${style.box}`}>
      <p className={`mb-2 flex items-center gap-1.5 text-sm font-semibold ${style.title}`}>
        <span aria-hidden>{style.icon}</span>
        {style.label}
      </p>
      {items && items.length > 0 && (
        <ul className="space-y-1.5 text-sm leading-relaxed text-foreground">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2">
              <span aria-hidden className="mt-1 text-charcoal-15">
                •
              </span>
              <span>{renderCalloutText(item)}</span>
            </li>
          ))}
        </ul>
      )}
      {children}
    </aside>
  );
}
