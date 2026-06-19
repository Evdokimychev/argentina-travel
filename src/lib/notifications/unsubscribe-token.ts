import { createHmac, timingSafeEqual } from "crypto";
import { absoluteUrl } from "@/lib/site-url";
import type { NotificationCategory } from "@/types/notifications-hub";

const TOKEN_SEPARATOR = ".";

type UnsubscribePayload = {
  userId: string;
  category: NotificationCategory;
};

const VALID_CATEGORIES = new Set<NotificationCategory>([
  "booking",
  "payment",
  "travelers",
  "reviews",
  "moderation",
  "system",
]);

function resolveUnsubscribeSecret(): string | null {
  return (
    process.env.NOTIFICATION_UNSUBSCRIBE_SECRET?.trim() ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    null
  );
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createUnsubscribeToken(
  userId: string,
  category: NotificationCategory
): string | null {
  const secret = resolveUnsubscribeSecret();
  if (!secret || !userId.trim() || !VALID_CATEGORIES.has(category)) return null;

  const payload: UnsubscribePayload = { userId: userId.trim(), category };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}${TOKEN_SEPARATOR}${signature}`;
}

export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  const secret = resolveUnsubscribeSecret();
  if (!secret || !token.trim()) return null;

  const [encodedPayload, signature] = token.trim().split(TOKEN_SEPARATOR);
  if (!encodedPayload || !signature) return null;

  const expected = signPayload(encodedPayload, secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<UnsubscribePayload>;

    if (
      !parsed.userId?.trim() ||
      !parsed.category ||
      !VALID_CATEGORIES.has(parsed.category)
    ) {
      return null;
    }

    return { userId: parsed.userId.trim(), category: parsed.category };
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(
  userId: string,
  category: NotificationCategory
): string | null {
  const token = createUnsubscribeToken(userId, category);
  if (!token) return null;
  return absoluteUrl(`/api/notifications/unsubscribe?token=${encodeURIComponent(token)}`);
}

export function buildListUnsubscribeHeader(unsubscribeUrl: string | null): Record<string, string> {
  if (!unsubscribeUrl) return {};
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
