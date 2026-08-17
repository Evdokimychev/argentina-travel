/**
 * Deterministic editorial quality checks for partner-facing public text.
 * Does not invent facts — only flags unsafe / nonsensical content.
 */

export type PartnerContentIssue =
  | "empty"
  | "too_short"
  | "raw_html"
  | "script_injection"
  | "entity_garbage"
  | "markdown_leak"
  | "duplicated_paragraph"
  | "all_caps"
  | "language_suspect"
  | "emoji_spam";

export type PartnerContentQualityResult = {
  ok: boolean;
  reasons: PartnerContentIssue[];
  /** Safe plain text suitable for optional display, or empty when unusable. */
  sanitizedPlain: string;
};

const CYRILLIC_RE = /[а-яё]/gi;
const LATIN_RE = /[a-z]/gi;

function stripTags(value: string): string {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countEmojiSequences(value: string): number {
  const matches = value.match(/\p{Extended_Pictographic}/gu);
  return matches?.length ?? 0;
}

export function assessPartnerContentQuality(
  raw: string | null | undefined,
): PartnerContentQualityResult {
  const reasons: PartnerContentIssue[] = [];
  const source = raw ?? "";

  if (!source.trim()) {
    return { ok: false, reasons: ["empty"], sanitizedPlain: "" };
  }

  if (/<script\b/i.test(source) || /javascript:/i.test(source) || /on\w+\s*=/i.test(source)) {
    reasons.push("script_injection");
  }
  if (/<\/?[a-z][\s\S]*?>/i.test(source)) {
    reasons.push("raw_html");
  }
  if (/&(?:#\d+|[a-z]+);/i.test(source) && (source.match(/&(?:#\d+|[a-z]+);/gi)?.length ?? 0) > 8) {
    reasons.push("entity_garbage");
  }
  if (/(^|\n)\s{0,3}#{1,6}\s|(^|\n)\s*[-*+]\s|\*\*[^*]+\*\*/m.test(source)) {
    reasons.push("markdown_leak");
  }

  const plain = stripTags(source);
  if (plain.length < 40) reasons.push("too_short");

  const letters = plain.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, "");
  if (letters.length >= 40) {
    const upper = letters.replace(/[^A-ZА-ЯЁ]/g, "").length;
    if (upper / letters.length > 0.7) reasons.push("all_caps");
  }

  const paragraphs = plain
    .split(/\n{2,}|(?<=\.)\s{2,}/)
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length > 40);
  const seen = new Set<string>();
  for (const paragraph of paragraphs) {
    if (seen.has(paragraph)) {
      reasons.push("duplicated_paragraph");
      break;
    }
    seen.add(paragraph);
  }

  const cyr = plain.match(CYRILLIC_RE)?.length ?? 0;
  const lat = plain.match(LATIN_RE)?.length ?? 0;
  if (cyr + lat > 80 && cyr / (cyr + lat) < 0.15) {
    reasons.push("language_suspect");
  }

  if (countEmojiSequences(plain) >= 12) reasons.push("emoji_spam");

  // Known broken machine-Russian patterns seen in partner feeds.
  if (
    /в\s+в\s+/i.test(plain) ||
    /для\s+для\s+/i.test(plain) ||
    /будет\s+будет\s+/i.test(plain) ||
    /тур\s+тур\s+тур/i.test(plain)
  ) {
    reasons.push("duplicated_paragraph");
  }

  const unique = [...new Set(reasons)];
  const fatal = unique.some((reason) =>
    ["script_injection", "entity_garbage", "too_short", "empty"].includes(reason),
  );

  return {
    ok: !fatal && unique.length <= 1,
    reasons: unique,
    sanitizedPlain: plain,
  };
}
