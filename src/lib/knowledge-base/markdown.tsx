/**
 * Минимальный рендерер Markdown → React для тел записей базы знаний.
 * Проект намеренно без runtime-парсера MD; здесь покрыт ограниченный,
 * предсказуемый набор конструкций, которые реально используются в базе:
 * заголовки, абзацы, списки, таблицы, цитаты, жирный/курсив/код, ссылки и
 * [[вики-ссылки]] на другие записи.
 */
import Link from "next/link";
import type { ReactNode } from "react";

import {
  normalizeKbClaimText,
  type KbPublicProvenance,
} from "@/components/knowledge-base/KbProvenance";
import { KbClaimSourceMarkers } from "@/components/knowledge-base/KbClaimSourceMarkers";

import { entryHref } from "./urls";

interface RenderOptions {
  /** id существующих (опубликованных) записей — для резолва [[вики-ссылок]]. */
  validIds: Set<string>;
  /** Строгая публичная цепочка источников; диагностические данные сюда не попадают. */
  provenance?: KbPublicProvenance | null;
}

// Разделы, которые на странице статьи показываются отдельными UI-блоками,
// поэтому из тела их убираем, чтобы не дублировать.
const STRIP_SECTION_TITLES = new Set([
  "Связанные объекты",
  "Источники",
]);
// Разделы-заглушки «См. … в метаданных» — их тоже убираем.
const STRIP_IF_PLACEHOLDER = new Set(["Рекомендации", "Предупреждения"]);
const UNWRAP_SECTION_TITLES = new Set(["Текст"]);

const KNOWN_SECTION_TITLES = [
  "Описание",
  "Программа по дням",
  "Логистика и перелёты",
  "Логистика",
  "Бюджет",
  "Бюджет на человека (14 дней, без межконтинентального перелёта)",
  "Когда ехать",
  "Как выбрать между вариантами",
  "Варианты маршрута",
  "Варианты под интересы",
  "Что взять с собой",
  "Что нужно",
  "Что делать",
  "Что учесть",
  "Что посмотреть и чем заняться",
  "Что посмотреть и сделать",
  "Что смотреть и делать",
  "Немного фактов о названии",
  "Билеты и деньги",
  "Краткая информация",
  "Как добраться",
  "К чему ведёт",
  "Деньги за учёбу",
  "Практическая информация",
  "Факты",
  "Рекомендации",
  "Предупреждения",
  "Связанные объекты",
  "Источники",
  "Текст",
];

const KNOWN_SECTION_RE = new RegExp(
  `(^|\\n|\\s)(#{2,3})\\s+(${KNOWN_SECTION_TITLES.map((title) =>
    title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|")})(?=\\s+\\S)`,
  "g",
);

/** Импортные записи иногда приходят как `## Описание текст ## Факты ...` в одну строку. */
export function normalizeMarkdownSections(body: string): string {
  return body
    .replace(KNOWN_SECTION_RE, (_match, prefix, hashes, title) => {
      const before = prefix.trim() === "" ? "\n" : `${prefix}\n`;
      return `${before}${hashes} ${title}\n\n`;
    })
    .trim();
}

/** Удаляет из тела разделы, дублирующие структурные UI-блоки. */
export function stripRedundantSections(body: string): string {
  const normalized = normalizeMarkdownSections(body);
  const parts = normalized.split(/^(##\s+.+)$/m);
  // parts: [before, "## Heading", content, "## Heading", content, ...]
  let out = parts[0] ?? "";
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i];
    const content = parts[i + 1] ?? "";
    const title = heading.replace(/^##\s+/, "").trim();
    if (STRIP_SECTION_TITLES.has(title)) continue;
    if (STRIP_IF_PLACEHOLDER.has(title) && /в метаданных/i.test(content)) continue;
    if (UNWRAP_SECTION_TITLES.has(title)) {
      out += content;
      continue;
    }
    out += heading + content;
  }
  return out.trim();
}

// ── Inline ──────────────────────────────────────────────────────────────────

const INLINE_RE =
  /(\[\[[^\]]+\]\])|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(`[^`]+`)|(\*[^*\s][^*]*\*)/g;

function renderInline(text: string, validIds: Set<string>): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("[[")) {
      const inner = token.slice(2, -2);
      const [id, label] = inner.split("|");
      const display = (label ?? id).trim();
      if (validIds.has(id.trim())) {
        nodes.push(
          <Link
            key={key++}
            href={entryHref(id.trim())}
            className="text-sky-ink underline decoration-sky/40 underline-offset-2 hover:decoration-sky-ink"
          >
            {display}
          </Link>,
        );
      } else {
        nodes.push(display);
      }
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-surface-muted px-1 py-0.5 text-[0.9em] text-foreground"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("[")) {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (m) {
        const [, label, url] = m;
        const external = /^https?:\/\//.test(url);
        if (external) {
          nodes.push(
            <a
              key={key++}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-ink underline decoration-sky/40 underline-offset-2 hover:decoration-sky-ink"
            >
              {label}
            </a>,
          );
        } else {
          nodes.push(
            <Link
              key={key++}
              href={url}
              className="text-sky-ink underline decoration-sky/40 underline-offset-2 hover:decoration-sky-ink"
            >
              {label}
            </Link>,
          );
        }
      } else {
        nodes.push(token);
      }
    } else {
      nodes.push(token);
    }
    lastIndex = INLINE_RE.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

// ── Block ───────────────────────────────────────────────────────────────────

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Оглавление: список H2-заголовков тела (после очистки). */
export function extractHeadings(body: string): { id: string; text: string }[] {
  const clean = stripRedundantSections(body);
  const result: { id: string; text: string }[] = [];
  for (const line of clean.split("\n")) {
    const m = /^##\s+(.+)$/.exec(line.trim());
    if (m) result.push({ id: slugifyHeading(m[1]), text: m[1].trim() });
  }
  return result;
}

function renderTable(rows: string[], validIds: Set<string>, key: number): ReactNode {
  const parseRow = (row: string) =>
    row
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  const header = parseRow(rows[0]);
  const bodyRows = rows.slice(2).map(parseRow);
  return (
    <div key={key} className="my-5 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border-default bg-surface-muted">
            {header.map((cell, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold text-foreground"
              >
                {renderInline(cell, validIds)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((cells, r) => (
            <tr key={r} className="border-b border-border-subtle align-top">
              {cells.map((cell, c) => (
                <td key={c} className="px-3 py-2 text-muted">
                  {renderInline(cell, validIds)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Основной рендер тела статьи. */
export function renderMarkdown(body: string, opts: RenderOptions): ReactNode {
  const { validIds, provenance } = opts;
  const clean = stripRedundantSections(body);
  const lines = clean.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    // Заголовки
    const h2 = /^##\s+(.+)$/.exec(trimmed);
    const h3 = /^###\s+(.+)$/.exec(trimmed);
    if (h2) {
      blocks.push(
        <h2
          key={key++}
          id={slugifyHeading(h2[1])}
          className="mt-8 mb-3 scroll-mt-24 text-xl font-semibold text-foreground"
        >
          {renderInline(h2[1], validIds)}
        </h2>,
      );
      i++;
      continue;
    }
    if (h3) {
      blocks.push(
        <h3 key={key++} className="mt-6 mb-2 text-lg font-semibold text-foreground">
          {renderInline(h3[1], validIds)}
        </h3>,
      );
      i++;
      continue;
    }

    // Таблица
    if (trimmed.startsWith("|") && i + 1 < lines.length && /^\|[\s:|-]+\|?$/.test(lines[i + 1].trim())) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(lines[i]);
        i++;
      }
      blocks.push(renderTable(rows, validIds, key++));
      continue;
    }
    if (trimmed.startsWith("|")) {
      blocks.push(
        <p key={key++} className="my-3 leading-relaxed text-muted">
          {renderInline(trimmed, validIds)}
        </p>,
      );
      i++;
      continue;
    }

    // Цитата
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-4 rounded-r-lg border-l-4 border-sun bg-sun/10 px-4 py-3 text-sm text-foreground"
        >
          {renderInline(quoteLines.join(" "), validIds)}
        </blockquote>,
      );
      continue;
    }

    // Маркированный список
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-4 list-disc space-y-1.5 pl-5 text-muted">
          {items.map((item, idx) => (
            <li key={idx}>
              {renderInline(item, validIds)}
              {provenance?.claimsByText.get(normalizeKbClaimText(item)) ? (
                <KbClaimSourceMarkers
                  claim={provenance.claimsByText.get(normalizeKbClaimText(item))!}
                />
              ) : null}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Нумерованный список
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="my-4 list-decimal space-y-1.5 pl-5 text-muted">
          {items.map((item, idx) => (
            <li key={idx}>
              {renderInline(item, validIds)}
              {provenance?.claimsByText.get(normalizeKbClaimText(item)) ? (
                <KbClaimSourceMarkers
                  claim={provenance.claimsByText.get(normalizeKbClaimText(item))!}
                />
              ) : null}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Абзац (собираем подряд идущие непустые строки)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{2,3}\s|[-*]\s|\d+\.\s|>|\|)/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push(
        <p key={key++} className="my-3 leading-relaxed text-muted">
          {renderInline(paraLines.join(" "), validIds)}
        </p>,
      );
    }
  }

  return <>{blocks}</>;
}
