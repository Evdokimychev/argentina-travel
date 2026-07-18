import type { ContactSubmissionKind } from "@/types/database";

export const CONTACT_REQUEST_MAX_BYTES = 32_768;
export const NEWSLETTER_REQUEST_MAX_BYTES = 4_096;

const CONTACT_KINDS = new Set<ContactSubmissionKind>([
  "general",
  "tour_inquiry",
  "service_request",
  "product_inquiry",
  "organizer_application",
  "consultation",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,158}[a-z0-9])?$/i;
const LOCALE_RE = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/i;
const FORBIDDEN_CONTEXT_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export class LeadCaptureValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeadCaptureValidationError";
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function requiredSingleLine(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new LeadCaptureValidationError(`${label}: укажите текст.`);
  }
  const normalized = value.trim();
  if (!normalized) throw new LeadCaptureValidationError(`${label}: поле обязательно.`);
  if (normalized.length > maxLength) {
    throw new LeadCaptureValidationError(`${label}: не более ${maxLength} символов.`);
  }
  if (/[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new LeadCaptureValidationError(`${label}: недопустимые служебные символы.`);
  }
  return normalized;
}

function optionalSingleLine(
  value: unknown,
  label: string,
  maxLength: number
): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requiredSingleLine(value, label, maxLength);
}

function optionalLongText(value: unknown, label: string, maxLength: number): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw new LeadCaptureValidationError(`${label}: укажите текст.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new LeadCaptureValidationError(`${label}: не более ${maxLength} символов.`);
  }
  if (normalized.includes("\u0000")) {
    throw new LeadCaptureValidationError(`${label}: недопустимый служебный символ.`);
  }
  return normalized;
}

function normalizeEmail(value: unknown, required: boolean): string | null {
  const email = optionalSingleLine(value, "Email", 254)?.toLowerCase() ?? null;
  if (!email && required) throw new LeadCaptureValidationError("Укажите email.");
  if (email && !EMAIL_RE.test(email)) {
    throw new LeadCaptureValidationError("Проверьте формат email.");
  }
  return email;
}

function normalizePhone(value: unknown): string | null {
  const phone = optionalSingleLine(value, "Телефон", 60);
  if (!phone) return null;
  const digitCount = phone.replace(/\D/g, "").length;
  if (digitCount < 6 || digitCount > 20) {
    throw new LeadCaptureValidationError("Проверьте формат телефона.");
  }
  return phone;
}

function normalizeSlug(value: unknown, label: string): string | null {
  const slug = optionalSingleLine(value, label, 160);
  if (slug && !SLUG_RE.test(slug)) {
    throw new LeadCaptureValidationError(`${label}: некорректный идентификатор.`);
  }
  return slug;
}

function assertJsonValue(value: unknown, depth: number, state: { nodes: number }): void {
  state.nodes += 1;
  if (state.nodes > 200 || depth > 5) {
    throw new LeadCaptureValidationError("Контекст обращения слишком сложный.");
  }
  if (value === null || typeof value === "boolean" || typeof value === "number") return;
  if (typeof value === "string") {
    if (value.length > 1_000) {
      throw new LeadCaptureValidationError("Значение в контексте обращения слишком длинное.");
    }
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 50) {
      throw new LeadCaptureValidationError("В контексте обращения слишком много значений.");
    }
    for (const item of value) assertJsonValue(item, depth + 1, state);
    return;
  }
  const source = record(value);
  if (!source) throw new LeadCaptureValidationError("Некорректный контекст обращения.");
  for (const [key, item] of Object.entries(source)) {
    if (!key || key.length > 80 || FORBIDDEN_CONTEXT_KEYS.has(key)) {
      throw new LeadCaptureValidationError("Некорректное поле в контексте обращения.");
    }
    assertJsonValue(item, depth + 1, state);
  }
}

function normalizeContext(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  const context = record(value);
  if (!context) throw new LeadCaptureValidationError("Некорректный контекст обращения.");
  assertJsonValue(context, 0, { nodes: 0 });
  if (new TextEncoder().encode(JSON.stringify(context)).byteLength > 12_000) {
    throw new LeadCaptureValidationError("Контекст обращения слишком большой.");
  }
  return context;
}

function normalizePageUrl(value: unknown, requestUrl?: string): string | null {
  const raw = optionalSingleLine(value, "Адрес страницы", 2_048);
  if (!raw) return null;
  if (!requestUrl && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const base = requestUrl ? new URL(requestUrl) : null;
    const parsed = new URL(raw, base ?? "https://www.goargentina.ru");
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
    if (parsed.username || parsed.password) throw new Error();
    if (base && parsed.origin !== base.origin) {
      throw new LeadCaptureValidationError("Адрес страницы должен относиться к этому сайту.");
    }
    return base ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.toString();
  } catch (error) {
    if (error instanceof LeadCaptureValidationError) throw error;
    throw new LeadCaptureValidationError("Некорректный адрес страницы.");
  }
}

function normalizeKind(value: unknown, required: boolean): ContactSubmissionKind | undefined {
  if (value === undefined || value === null || value === "") {
    if (required) throw new LeadCaptureValidationError("Не указан тип обращения.");
    return undefined;
  }
  if (typeof value !== "string" || !CONTACT_KINDS.has(value as ContactSubmissionKind)) {
    throw new LeadCaptureValidationError("Некорректный тип обращения.");
  }
  return value as ContactSubmissionKind;
}

export async function readLimitedJson(request: Request, maxBytes: number): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new LeadCaptureValidationError("Запрос слишком большой.");
  }
  if (!request.body) throw new LeadCaptureValidationError("Пустой запрос.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > maxBytes) {
      await reader.cancel();
      throw new LeadCaptureValidationError("Запрос слишком большой.");
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  if (!text) throw new LeadCaptureValidationError("Пустой запрос.");
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new LeadCaptureValidationError("Некорректный JSON.");
  }
}

export function normalizeNewsletterSubmission(value: unknown): {
  email: string;
  source: string;
  locale: string | null;
} {
  const source = record(value);
  if (!source) throw new LeadCaptureValidationError("Некорректные данные подписки.");
  const email = normalizeEmail(source.email, true)!;
  const normalizedSource = optionalSingleLine(source.source, "Источник подписки", 80) ?? "footer";
  const locale = optionalSingleLine(source.locale, "Язык", 16);
  if (locale && !LOCALE_RE.test(locale)) {
    throw new LeadCaptureValidationError("Некорректный код языка.");
  }
  return { email, source: normalizedSource, locale };
}

export type NormalizedContactRequest = {
  kind?: ContactSubmissionKind;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  context: Record<string, unknown>;
  pageUrl: string | null;
  tourSlug: string | null;
  productSlug: string | null;
  serviceSlug: string | null;
  organizerApplication: boolean;
};

export function normalizeContactRequest(
  value: unknown,
  requestUrl?: string
): NormalizedContactRequest {
  const source = record(value);
  if (!source) throw new LeadCaptureValidationError("Некорректные данные обращения.");
  const email = normalizeEmail(source.email, false);
  const phone = normalizePhone(source.phone);
  if (!email && !phone) {
    throw new LeadCaptureValidationError("Укажите email или телефон.");
  }
  if (
    source.organizerApplication !== undefined &&
    typeof source.organizerApplication !== "boolean"
  ) {
    throw new LeadCaptureValidationError("Некорректный признак заявки организатора.");
  }
  return {
    kind: normalizeKind(source.kind, false),
    name: requiredSingleLine(source.name, "Имя", 160),
    email,
    phone,
    message: optionalLongText(source.message, "Сообщение", 4_000),
    context: normalizeContext(source.context),
    pageUrl: normalizePageUrl(source.pageUrl, requestUrl),
    tourSlug: normalizeSlug(source.tourSlug, "Тур"),
    productSlug: normalizeSlug(source.productSlug, "Продукт"),
    serviceSlug: normalizeSlug(source.serviceSlug, "Услуга"),
    organizerApplication: source.organizerApplication === true,
  };
}

export function normalizeContactSubmission(value: unknown): {
  kind: ContactSubmissionKind;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  context: Record<string, unknown>;
  pageUrl: string | null;
} {
  const normalized = normalizeContactRequest(value);
  const kind = normalizeKind(record(value)?.kind, true)!;
  return { ...normalized, kind };
}
