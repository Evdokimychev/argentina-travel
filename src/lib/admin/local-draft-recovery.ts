const MAX_RECOVERY_BYTES = 300_000;

const BLOCKED_KEYS = new Set([
  "apikey",
  "api_key",
  "authorization",
  "authorname",
  "createdby",
  "email",
  "password",
  "phone",
  "secret",
  "token",
  "updatedby",
]);

const SENSITIVE_VALUE_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/iu,
  /\b(?:api[_-]?key|password|secret|token)\s*[:=]\s*\S+/iu,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu,
  /(?:^|\D)(?:\+?\d[\s().-]*){10,}(?:$|\D)/u,
  /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{8,}\b/u,
] as const;

export type SessionDraftEnvelope<T> = {
  version: 1;
  savedAt: string;
  serverUpdatedAt: string;
  draft: T;
};

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!value || typeof value !== "object") return value;

  const sanitized: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (BLOCKED_KEYS.has(key.toLowerCase())) continue;
    sanitized[key] = sanitizeValue(child);
  }
  return sanitized;
}

export function prepareLocalRecoveryDraft<T>(draft: T): T | null {
  const sanitized = sanitizeValue(draft) as T;
  const serialized = JSON.stringify(sanitized);
  if (serialized.length > MAX_RECOVERY_BYTES) return null;
  if (SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(serialized))) return null;
  return sanitized;
}

export function buildSessionDraftKey(documentId: string): string {
  let hash = 2166136261;
  for (let index = 0; index < documentId.length; index += 1) {
    hash ^= documentId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `goargentina:cms-recovery:v1:${(hash >>> 0).toString(36)}`;
}

export function writeSessionDraft<T>(
  storage: Pick<Storage, "setItem">,
  key: string,
  envelope: SessionDraftEnvelope<T>,
): boolean {
  const safeDraft = prepareLocalRecoveryDraft(envelope.draft);
  if (!safeDraft) return false;
  storage.setItem(key, JSON.stringify({ ...envelope, draft: safeDraft }));
  return true;
}

export function readSessionDraft<T>(
  storage: Pick<Storage, "getItem" | "removeItem">,
  key: string,
): SessionDraftEnvelope<T> | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionDraftEnvelope<T>>;
    if (
      parsed.version !== 1 ||
      typeof parsed.savedAt !== "string" ||
      typeof parsed.serverUpdatedAt !== "string" ||
      !parsed.draft
    ) {
      throw new Error("invalid recovery envelope");
    }
    const safeDraft = prepareLocalRecoveryDraft(parsed.draft);
    if (!safeDraft) throw new Error("unsafe recovery payload");
    return { ...parsed, draft: safeDraft } as SessionDraftEnvelope<T>;
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Storage can be unavailable in hardened browser modes.
    }
    return null;
  }
}
