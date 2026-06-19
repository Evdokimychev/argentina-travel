import { htmlToPlainText, isHtmlContent, markdownLiteToHtml, sanitizeHtml } from "@/lib/rich-text";

export const FORUM_BODY_MAX_LENGTH = 10_000;
export const FORUM_TITLE_MAX_LENGTH = 200;
const MIN_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000;

export function sanitizeForumBody(raw: string):
  | { ok: true; body: string }
  | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: "Текст не может быть пустым" };
  }

  const normalized = isHtmlContent(trimmed)
    ? htmlToPlainText(sanitizeHtml(trimmed))
    : trimmed;

  const plain = htmlToPlainText(sanitizeHtml(markdownLiteToHtml(normalized))).trim();
  if (!plain) {
    return { error: "Текст не может быть пустым" };
  }

  if (plain.length > FORUM_BODY_MAX_LENGTH) {
    return {
      error: `Слишком длинное сообщение (максимум ${FORUM_BODY_MAX_LENGTH} символов)`,
    };
  }

  return { ok: true, body: normalized.slice(0, FORUM_BODY_MAX_LENGTH) };
}

export function renderForumBodyHtml(body: string): string {
  return sanitizeHtml(markdownLiteToHtml(body));
}

export function sanitizeForumTitle(raw: string): { ok: true; title: string } | { error: string } {
  const title = raw.trim();
  if (!title) {
    return { error: "Укажите заголовок темы" };
  }
  if (title.length > FORUM_TITLE_MAX_LENGTH) {
    return { error: `Заголовок слишком длинный (максимум ${FORUM_TITLE_MAX_LENGTH} символов)` };
  }
  return { ok: true, title };
}

export function isAccountOldEnoughForForum(createdAt: string | null | undefined): boolean {
  if (!createdAt) return true;
  return Date.now() - new Date(createdAt).getTime() >= MIN_ACCOUNT_AGE_MS;
}

export function forumAccountAgeMessage(): string {
  return "Новым аккаунтам нужно подождать 24 часа перед первым сообщением на форуме.";
}
