import { CalendarDays, ExternalLink, Paperclip, UserRound } from "lucide-react";

export type IngestionMediaEvidence = {
  filename?: string | null;
  mimeType?: string | null;
  storagePath?: string | null;
  url?: string | null;
  signedUrl?: string | null;
};

export type IngestionProvenanceData = {
  url: string | null;
  sourceUrl: string | null;
  author: string | null;
  publishedAt: string | null;
  media: IngestionMediaEvidence[];
};

type IngestionProvenanceProps = {
  provenance: IngestionProvenanceData | null;
};

function publishedDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function IngestionProvenance({ provenance }: IngestionProvenanceProps) {
  if (!provenance) {
    return <p className="text-xs text-amber-800">Данные первоисточника недоступны</p>;
  }

  const date = publishedDate(provenance.publishedAt);
  const sourceHref = safeExternalUrl(provenance.url);
  return (
    <section aria-label="Первоисточник" className="border-y border-border-subtle py-4">
      <p className="text-xs font-semibold uppercase text-muted">Первоисточник</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {sourceHref ? (
          <a
            href={sourceHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-0 items-center gap-1.5 font-medium text-sky hover:underline"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span className="max-w-80 truncate">Открыть оригинал</span>
          </a>
        ) : <span className="text-muted">Ссылка не сохранена</span>}
        {provenance.author ? (
          <span className="inline-flex items-center gap-1.5 text-muted">
            <UserRound className="h-4 w-4" />{provenance.author}
          </span>
        ) : null}
        {date ? (
          <span className="inline-flex items-center gap-1.5 text-muted">
            <CalendarDays className="h-4 w-4" />{date}
          </span>
        ) : null}
      </div>
      {provenance.media.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {provenance.media.map((media, index) => {
            const href = safeExternalUrl(media.signedUrl ?? media.url);
            const label = media.filename ?? media.mimeType ?? `Медиа ${index + 1}`;
            return href ? (
              <a
                key={`${media.storagePath ?? media.url ?? label}-${index}`}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-button border border-border-subtle px-3 text-xs font-medium text-foreground hover:bg-surface-muted"
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </a>
            ) : (
              <span key={`${label}-${index}`} className="inline-flex items-center gap-2 text-xs text-muted">
                <Paperclip className="h-3.5 w-3.5" />{label}
              </span>
            );
          })}
        </div>
      ) : <p className="mt-3 text-xs text-muted">Медиафайлов нет</p>}
    </section>
  );
}
