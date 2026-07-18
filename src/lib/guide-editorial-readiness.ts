export type GuideEditorialIssueCode =
  | "ai_trace"
  | "development_trace"
  | "fixed_dynamic_price"
  | "unsafe_payment_guidance"
  | "sensitive_claims_without_official_source";

const AI_TRACE_RE = /(?:chatgpt|claude|как\s+(?:языковая|ии)[ -]модель|сгенерирован[аоы]?\s+(?:ии|нейросетью))/iu;
const DEVELOPMENT_TRACE_RE = /(?:\b(?:TODO|TBD)(?=\b|:)|\b(?:lorem ipsum|placeholder)\b|контент[- ]план|записи базы|внутренняя редакционная пометка)/u;
const FIXED_DYNAMIC_PRICE_RE = /(?:\$\s?\d|\d[\d\s.,–—-]*\s(?:USD|ARS)\b)/u;
const UNSAFE_PAYMENT_RE = /(?:\bcueva\b|blue dollar|син(?:ий|ему|его) курс|\bUSDT\b|\bкрипто\b|Western Union)/iu;
const SENSITIVE_RE = /(?:безвиз|\bвиза\b|Decreto|Migraciones|миграционн.{0,24}(?:правил|статус|служб|процед|треб|закон)|гражданств|\bВНЖ\b|\bПМЖ\b|страховк.{0,24}(?:треб|обяз)|медицинск.{0,20}(?:помощ|страхов)|экстренн.{0,12}помощ)/iu;
const OFFICIAL_SOURCE_RE = /https:\/\/(?:[^\s/]+\.)?(?:argentina\.gob\.ar|gob\.ar|buenosaires\.gob\.ar|migraciones\.gob\.ar|bcra\.gob\.ar|indec\.gob\.ar|arca\.gob\.ar|anmat\.gob\.ar|enacom\.gob\.ar|smn\.gob\.ar)\b/iu;

export function getGuideEditorialIssues(value: unknown): GuideEditorialIssueCode[] {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const issues: GuideEditorialIssueCode[] = [];
  if (AI_TRACE_RE.test(text)) issues.push("ai_trace");
  if (DEVELOPMENT_TRACE_RE.test(text)) issues.push("development_trace");
  if (FIXED_DYNAMIC_PRICE_RE.test(text)) issues.push("fixed_dynamic_price");
  if (UNSAFE_PAYMENT_RE.test(text)) issues.push("unsafe_payment_guidance");
  if (SENSITIVE_RE.test(text) && !OFFICIAL_SOURCE_RE.test(text)) {
    issues.push("sensitive_claims_without_official_source");
  }
  return issues;
}
