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
  | "emoji_spam"
  | "encoding_garbage"
  | "nonsense_translation"
  | "repeated_template"
  | "irrelevant_content"
  | "too_long";

export type PartnerContentQualityResult = {
  ok: boolean;
  reasons: PartnerContentIssue[];
  /** Safe plain text suitable for optional display, or empty when unusable. */
  sanitizedPlain: string;
};

const CYRILLIC_RE = /[а-яё]/gi;
const LATIN_RE = /[a-z]/gi;

/** Observed partner machine-translation garbage. */
const NONSENSE_TRANSLATION_RE = [
  /на\s+сковород/i,
  /аргентинск\w*\s+сторон\w*\s+на\s+/i,
  /потрясающ\w*\s+аргентинск\w*\s+сторон/i,
  /сторону\s+на\s+(сковород|тарелк|кастрюл)/i,
  /\b(lorem ipsum|dummy text|click here|test description)\b/i,
  /Ð.|Ã.|â€|Ð¿Ð¾|Ñ/i,
];

const COOKING_UTENSIL_RE = /\b(сковород|кастрюл|духовок|микроволн|блендер|половник)\w*\b/i;
const TRAVEL_CONTEXT_RE =
  /\b(аргентин|патагон|буэнос|игуасу|мендос|сальт|барилоч|ушуай|калафат|тур|маршрут|экскур)\w*\b/i;
const FOOD_CONTEXT_RE = /\b(стейк|asado|асадо|мяс|вин|гастро|кулин|еда|ресторан|ужин|завтрак)\w*\b/i;

const REPEATED_TEMPLATE_RE = [
  /^откройте для себя потрясающ/i,
  /^погрузитесь в уникальн\w+\s+атмосфер/i,
  /^незабываемое приключение ждет вас/i,
  /^лучший тур вашей жизни/i,
];

const FATAL_ISSUES: PartnerContentIssue[] = [
  "script_injection",
  "entity_garbage",
  "encoding_garbage",
  "nonsense_translation",
  "empty",
];

const HIDE_ON_CARD_ISSUES: PartnerContentIssue[] = [
  ...FATAL_ISSUES,
  "irrelevant_content",
  "repeated_template",
  "language_suspect",
];

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

function hasMojibake(value: string): boolean {
  return /Ã.|Â.|â€|Ð.|Ñ.|ðŸ/.test(value) || (value.match(/�/g)?.length ?? 0) >= 2;
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
  if (hasMojibake(source) || hasMojibake(plain)) {
    reasons.push("encoding_garbage");
  }
  if (plain.length < 40) reasons.push("too_short");
  if (plain.length > 800) reasons.push("too_long");

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

  if (
    /в\s+в\s+/i.test(plain) ||
    /для\s+для\s+/i.test(plain) ||
    /будет\s+будет\s+/i.test(plain) ||
    /тур\s+тур\s+тур/i.test(plain)
  ) {
    reasons.push("duplicated_paragraph");
  }

  if (NONSENSE_TRANSLATION_RE.some((pattern) => pattern.test(plain))) {
    reasons.push("nonsense_translation");
  }

  if (COOKING_UTENSIL_RE.test(plain) && TRAVEL_CONTEXT_RE.test(plain) && !FOOD_CONTEXT_RE.test(plain)) {
    reasons.push("irrelevant_content");
  }

  if (REPEATED_TEMPLATE_RE.some((pattern) => pattern.test(plain))) {
    reasons.push("repeated_template");
  }

  const unique = [...new Set(reasons)];
  const fatal = unique.some((reason) => FATAL_ISSUES.includes(reason));

  return {
    ok: !fatal && unique.length <= 1,
    reasons: unique,
    sanitizedPlain: unique.some((reason) => HIDE_ON_CARD_ISSUES.includes(reason)) ? "" : plain,
  };
}

/**
 * Card/detail display text: hide garbage instead of publishing a bad translation.
 * Never invents a destination-specific substitute.
 */
export function resolvePartnerPublicCardText(
  raw: string | null | undefined,
  trustedFallback = "",
): string {
  const assessed = assessPartnerContentQuality(raw);
  if (assessed.sanitizedPlain) {
    return assessed.sanitizedPlain.length > 280
      ? `${assessed.sanitizedPlain.slice(0, 277).trimEnd()}…`
      : assessed.sanitizedPlain;
  }
  if (!trustedFallback.trim()) return "";
  const fallback = assessPartnerContentQuality(trustedFallback);
  return fallback.sanitizedPlain;
}
