import type { UrlRedirect, UrlRedirectInput, UrlRedirectStatusCode } from "@/types/url-redirect";

const ALLOWED_STATUS = new Set<number>([301, 302, 307, 308]);

/** Normalize public path: leading slash, no trailing slash (except root). */
export function normalizeRedirectFromPath(value: string): string {
  let path = value.trim();
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) {
    path = path.replace(/\/+$/, "");
  }
  return path;
}

/** Relative site path or absolute http(s) URL. */
export function normalizeRedirectToPath(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  let path = trimmed;
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) {
    path = path.replace(/\/+$/, "");
  }
  return path;
}

export function normalizeRedirectStatusCode(value: unknown): UrlRedirectStatusCode {
  const code = typeof value === "number" ? value : Number(value);
  if (ALLOWED_STATUS.has(code)) return code as UrlRedirectStatusCode;
  return 301;
}

export function normalizeUrlRedirectInput(input: UrlRedirectInput): UrlRedirectInput {
  return {
    fromPath: normalizeRedirectFromPath(input.fromPath),
    toPath: normalizeRedirectToPath(input.toPath),
    statusCode: normalizeRedirectStatusCode(input.statusCode ?? 301),
    enabled: input.enabled !== false,
    note: input.note?.trim() || undefined,
  };
}

export function validateUrlRedirectInput(input: UrlRedirectInput): string | null {
  const normalized = normalizeUrlRedirectInput(input);
  if (normalized.fromPath === normalized.toPath) {
    return "Пути «откуда» и «куда» не должны совпадать";
  }
  if (!normalized.fromPath.startsWith("/")) {
    return "Путь «откуда» должен начинаться с /";
  }
  if (
    !normalized.toPath.startsWith("/") &&
    !/^https?:\/\//i.test(normalized.toPath)
  ) {
    return "Путь «куда» — относительный (/...) или абсолютный URL";
  }
  return null;
}

export function mapUrlRedirectRow(row: {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  enabled: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}): UrlRedirect {
  return {
    id: row.id,
    fromPath: row.from_path,
    toPath: row.to_path,
    statusCode: normalizeRedirectStatusCode(row.status_code),
    enabled: row.enabled,
    note: row.note?.trim() || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
