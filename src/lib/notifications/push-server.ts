import webpush from "web-push";
import { isPersistableUserId } from "@/lib/notifications/notifications-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PushDeliveryPayload = {
  title: string;
  body: string;
  href?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type WebPushError = Error & {
  statusCode?: number;
};

const DEFAULT_ICON = "/icons/pwa-icon.svg";
const DEFAULT_BADGE = "/icons/pwa-icon.svg";
const DEFAULT_HREF = "/profile#notifications";

let vapidConfigured = false;

function resolveVapidConfig() {
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT?.trim();
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();

  if (!subject || !publicKey || !privateKey) return null;
  return { subject, publicKey, privateKey };
}

function ensureVapidConfigured(config: {
  subject: string;
  publicKey: string;
  privateKey: string;
}): void {
  if (vapidConfigured) return;
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  vapidConfigured = true;
}

function serializePayload(input: PushDeliveryPayload): string {
  return JSON.stringify({
    title: input.title,
    body: input.body,
    tag: input.tag ?? null,
    icon: input.icon ?? DEFAULT_ICON,
    badge: input.badge ?? DEFAULT_BADGE,
    data: {
      ...(input.data ?? {}),
      url: input.href ?? DEFAULT_HREF,
    },
  });
}

function toPushSubscription(row: PushSubscriptionRow): {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
}

export async function sendPushToUser(
  userId: string | null | undefined,
  payload: PushDeliveryPayload
): Promise<void> {
  if (!isPersistableUserId(userId)) return;

  const vapidConfig = resolveVapidConfig();
  if (!vapidConfig) return;

  try {
    ensureVapidConfigured(vapidConfig);
  } catch {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error || !data?.length) return;

  const body = serializePayload(payload);

  await Promise.all(
    data.map(async (row) => {
      try {
        await webpush.sendNotification(toPushSubscription(row), body);
      } catch (error) {
        const statusCode = (error as WebPushError).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", row.endpoint);
        }
      }
    })
  );
}
