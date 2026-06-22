export function parseBlogCommentBody(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const sanitized = value.trim().slice(0, 4000);
  return sanitized.length > 0 ? sanitized : null;
}

export function parseBlogCommentSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
