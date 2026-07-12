import type { ReactNode } from "react";

import type { KbEntry } from "@/lib/knowledge-base/types";

function cleanInlineText(value: string): string {
  return value.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, id, label) =>
    String(label ?? id).trim(),
  );
}

function formatList(values?: string[] | null): string | null {
  if (!values || values.length === 0) return null;
  return values.map(cleanInlineText).join(", ");
}

function formatCost(cost: KbEntry["cost"]): string | null {
  if (!cost || typeof cost !== "object" || Array.isArray(cost)) return null;
  const parts = [cost.level, cost.details].filter(Boolean);
  return parts.length > 0 ? parts.join(" — ") : null;
}

function formatCoordinates(coordinates: KbEntry["coordinates"]): {
  label: string;
  href: string;
} | null {
  if (!coordinates) return null;
  const { lat, lng } = coordinates;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return {
    label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    href: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  };
}

function FactItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-card border border-border-subtle bg-surface-elevated p-3">
      <dt className="text-2xs font-semibold uppercase tracking-wide text-slate">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed text-foreground">{children}</dd>
    </div>
  );
}

export default function KbFactPanel({ entry }: { entry: KbEntry }) {
  const bestTime = formatList(entry.best_time);
  const cost = formatCost(entry.cost);
  const coordinates = formatCoordinates(entry.coordinates);
  const howToGetThere = entry.how_to_get_there
    ? cleanInlineText(entry.how_to_get_there)
    : null;

  const hasFacts = Boolean(
    entry.title_es ||
      entry.province ||
      bestTime ||
      entry.duration ||
      howToGetThere ||
      cost ||
      coordinates,
  );

  if (!hasFacts) return null;

  return (
    <section className="mt-6 rounded-panel border border-border-subtle bg-surface-muted/50 p-4">
      <h2 className="text-base font-semibold text-foreground">Коротко и по делу</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {entry.title_es && <FactItem label="Оригинальное название">{entry.title_es}</FactItem>}
        {entry.province && <FactItem label="Провинция / зона">{entry.province}</FactItem>}
        {bestTime && <FactItem label="Лучшее время">{bestTime}</FactItem>}
        {entry.duration && <FactItem label="Сколько закладывать">{entry.duration}</FactItem>}
        {cost && <FactItem label="Бюджет">{cost}</FactItem>}
        {coordinates && (
          <FactItem label="Координаты">
            <a
              href={coordinates.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-ink underline decoration-sky/40 underline-offset-2 hover:decoration-sky-ink"
            >
              {coordinates.label}
            </a>
          </FactItem>
        )}
      </dl>
      {howToGetThere && (
        <div className="mt-3 rounded-card border border-border-subtle bg-surface-elevated p-3">
          <p className="text-2xs font-semibold uppercase tracking-wide text-slate">
            Как добраться
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{howToGetThere}</p>
        </div>
      )}
    </section>
  );
}
