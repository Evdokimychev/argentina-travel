import "server-only";

import type {
  ContentChannel,
  ContentFactoryFormat,
} from "@/lib/content-factory/types";
import type { Json } from "@/types/database";

type ProviderCredentials = {
  provider: ContentChannel;
  connectionId: string;
  externalAccountId: string | null;
  handle: string | null;
  config: Record<string, Json | undefined>;
  secrets: Record<string, string>;
};

export type ProviderVariant = {
  format: ContentFactoryFormat;
  body: string;
  mediaUrls: string[];
  linkUrl: string | null;
  target: string | null;
  providerOptions: Record<string, Json | undefined>;
};

export type ProviderPublicationResult = {
  externalId: string;
  externalUrl: string | null;
  metadata: Record<string, Json | undefined>;
};

export class ContentProviderError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ContentProviderError";
  }
}

function requiredString(value: unknown, code: string, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ContentProviderError(code, `Не заполнено поле «${label}».`);
  }
  return value.trim();
}

function graphVersion(config: ProviderCredentials["config"]): string {
  const value = typeof config.apiVersion === "string" ? config.apiVersion.trim() : "v25.0";
  if (!/^v\d{1,2}\.\d$/.test(value)) {
    throw new ContentProviderError("INVALID_API_VERSION", "Версия Meta Graph API указана неверно.");
  }
  return value;
}

function metaBaseUrl(config: ProviderCredentials["config"], instagram = false): string {
  const fallback = instagram ? "https://graph.instagram.com" : "https://graph.facebook.com";
  const raw = typeof config.graphBaseUrl === "string" ? config.graphBaseUrl.trim() : fallback;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ContentProviderError("INVALID_GRAPH_URL", "Адрес Meta Graph API указан неверно.");
  }
  const allowed = new Set(["graph.facebook.com", "graph.instagram.com"]);
  if (parsed.protocol !== "https:" || !allowed.has(parsed.hostname) || parsed.username || parsed.password) {
    throw new ContentProviderError("INVALID_GRAPH_URL", "Разрешены только официальные адреса Meta Graph API.");
  }
  return `${parsed.origin}/${graphVersion(config)}`;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function metaErrorCode(payload: Record<string, unknown>, fallback: string): string {
  const error = payload.error;
  if (!error || typeof error !== "object") return fallback;
  const code = "code" in error ? String(error.code) : "UNKNOWN";
  const subcode = "error_subcode" in error ? String(error.error_subcode) : "";
  return `${fallback}_${code}${subcode ? `_${subcode}` : ""}`;
}

async function metaRequest(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await readJson(response);
  if (!response.ok || payload.error) {
    throw new ContentProviderError(
      metaErrorCode(payload, "META_API_ERROR"),
      "Meta отклонила запрос. Проверьте токен, права приложения и идентификатор аккаунта.",
    );
  }
  return payload;
}

async function telegramRequest(
  token: string,
  method: string,
  payload?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: payload ? "POST" : "GET",
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  const result = await readJson(response);
  if (!response.ok || result.ok !== true) {
    const errorCode = typeof result.error_code === "number" ? result.error_code : "UNKNOWN";
    throw new ContentProviderError(
      `TELEGRAM_${errorCode}`,
      "Telegram отклонил запрос. Проверьте токен бота и права администратора канала.",
    );
  }
  return result;
}

function textChunks(value: string, limit: number): string[] {
  const text = value.trim();
  if (!text) return [];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > limit) {
    let boundary = rest.lastIndexOf("\n", limit);
    if (boundary < Math.floor(limit * 0.6)) boundary = rest.lastIndexOf(" ", limit);
    if (boundary < Math.floor(limit * 0.6)) boundary = limit;
    chunks.push(rest.slice(0, boundary).trim());
    rest = rest.slice(boundary).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function publishTelegram(
  credentials: ProviderCredentials,
  variant: ProviderVariant,
): Promise<ProviderPublicationResult> {
  const token = requiredString(credentials.secrets.bot_token, "TELEGRAM_TOKEN_MISSING", "Токен бота");
  const chatId = requiredString(
    credentials.config.chatId ?? credentials.externalAccountId,
    "TELEGRAM_CHAT_MISSING",
    "Канал / chat_id",
  );
  const body = [variant.body.trim(), variant.linkUrl?.trim()].filter(Boolean).join("\n\n");
  const mediaUrl = variant.mediaUrls[0];
  let firstMessageId: string | null = null;

  if (mediaUrl) {
    const mediaMethod = variant.format === "reel" ? "sendVideo" : "sendPhoto";
    const mediaField = mediaMethod === "sendVideo" ? "video" : "photo";
    const caption = body.length <= 1024 ? body : undefined;
    const response = await telegramRequest(token, mediaMethod, {
      chat_id: chatId,
      [mediaField]: mediaUrl,
      ...(caption ? { caption } : {}),
    });
    const result = response.result as Record<string, unknown> | undefined;
    firstMessageId = result?.message_id ? String(result.message_id) : null;
  }

  if (!mediaUrl || body.length > 1024) {
    for (const chunk of textChunks(body, 4096)) {
      const response = await telegramRequest(token, "sendMessage", { chat_id: chatId, text: chunk });
      const result = response.result as Record<string, unknown> | undefined;
      firstMessageId ??= result?.message_id ? String(result.message_id) : null;
    }
  }

  if (!firstMessageId) {
    throw new ContentProviderError("TELEGRAM_EMPTY_RESULT", "Telegram не вернул идентификатор публикации.");
  }
  const publicHandle = (credentials.handle ?? chatId).replace(/^@/, "");
  const externalUrl = /^[a-zA-Z][a-zA-Z0-9_]{3,}$/.test(publicHandle)
    ? `https://t.me/${publicHandle}/${firstMessageId}`
    : null;
  return { externalId: firstMessageId, externalUrl, metadata: { chatId } };
}

async function publishInstagram(
  credentials: ProviderCredentials,
  variant: ProviderVariant,
): Promise<ProviderPublicationResult> {
  const token = requiredString(credentials.secrets.access_token, "INSTAGRAM_TOKEN_MISSING", "Токен доступа");
  const accountId = requiredString(
    credentials.externalAccountId ?? credentials.config.instagramUserId,
    "INSTAGRAM_ACCOUNT_MISSING",
    "Instagram User ID",
  );
  const mediaUrl = requiredString(variant.mediaUrls[0], "INSTAGRAM_MEDIA_MISSING", "Медиафайл");
  if (!mediaUrl.startsWith("https://")) {
    throw new ContentProviderError("INSTAGRAM_MEDIA_NOT_PUBLIC", "Instagram нужен публичный HTTPS-адрес медиафайла.");
  }
  const baseUrl = metaBaseUrl(credentials.config, true);
  const isVideo = variant.format === "reel" || /\.(mp4|mov)(?:\?|$)/i.test(mediaUrl);
  const createPayload: Record<string, unknown> = {
    caption: [variant.body.trim(), variant.linkUrl?.trim()].filter(Boolean).join("\n\n").slice(0, 2200),
    ...(isVideo ? { video_url: mediaUrl } : { image_url: mediaUrl }),
  };
  if (variant.format === "reel") Object.assign(createPayload, { media_type: "REELS", share_to_feed: true });
  if (variant.format === "story") Object.assign(createPayload, { media_type: "STORIES" });

  const container = await metaRequest(`${baseUrl}/${accountId}/media`, token, {
    method: "POST",
    body: JSON.stringify(createPayload),
  });
  const creationId = requiredString(container.id, "INSTAGRAM_CONTAINER_MISSING", "Контейнер публикации");
  const published = await metaRequest(`${baseUrl}/${accountId}/media_publish`, token, {
    method: "POST",
    body: JSON.stringify({ creation_id: creationId }),
  });
  const mediaId = requiredString(published.id, "INSTAGRAM_MEDIA_ID_MISSING", "Публикация Instagram");
  let permalink: string | null = null;
  try {
    const media = await metaRequest(`${baseUrl}/${mediaId}?fields=permalink`, token);
    permalink = typeof media.permalink === "string" ? media.permalink : null;
  } catch {
    // Publication succeeded; a missing permalink must not turn it into a duplicate retry.
  }
  return { externalId: mediaId, externalUrl: permalink, metadata: { creationId } };
}

async function publishWhatsApp(
  credentials: ProviderCredentials,
  variant: ProviderVariant,
): Promise<ProviderPublicationResult> {
  const token = requiredString(credentials.secrets.access_token, "WHATSAPP_TOKEN_MISSING", "Токен доступа");
  const phoneNumberId = requiredString(
    credentials.config.phoneNumberId ?? credentials.externalAccountId,
    "WHATSAPP_PHONE_ID_MISSING",
    "Phone Number ID",
  );
  const recipient = requiredString(variant.target, "WHATSAPP_RECIPIENT_MISSING", "Получатель WhatsApp");
  const baseUrl = metaBaseUrl(credentials.config);
  const templateName = typeof variant.providerOptions.templateName === "string"
    ? variant.providerOptions.templateName.trim()
    : "";
  const languageCode = typeof variant.providerOptions.languageCode === "string"
    ? variant.providerOptions.languageCode.trim()
    : "ru";
  if (variant.format === "template" && !templateName) {
    throw new ContentProviderError("WHATSAPP_TEMPLATE_MISSING", "Укажите имя утверждённого шаблона WhatsApp.");
  }
  const payload = templateName
    ? {
        messaging_product: "whatsapp",
        to: recipient.replace(/^\+/, ""),
        type: "template",
        template: { name: templateName, language: { code: languageCode } },
      }
    : {
        messaging_product: "whatsapp",
        to: recipient.replace(/^\+/, ""),
        type: "text",
        text: { body: [variant.body.trim(), variant.linkUrl?.trim()].filter(Boolean).join("\n\n") },
      };
  const result = await metaRequest(`${baseUrl}/${phoneNumberId}/messages`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const messages = Array.isArray(result.messages) ? result.messages : [];
  const first = messages[0] as Record<string, unknown> | undefined;
  const messageId = requiredString(first?.id, "WHATSAPP_MESSAGE_ID_MISSING", "Сообщение WhatsApp");
  return { externalId: messageId, externalUrl: null, metadata: { recipient, templateName: templateName || null } };
}

export async function verifyProviderConnection(credentials: ProviderCredentials): Promise<{ accountLabel: string }> {
  if (credentials.provider === "telegram") {
    const token = requiredString(credentials.secrets.bot_token, "TELEGRAM_TOKEN_MISSING", "Токен бота");
    const result = await telegramRequest(token, "getMe");
    const bot = result.result as Record<string, unknown> | undefined;
    const username = typeof bot?.username === "string" ? `@${bot.username}` : "Telegram Bot";
    return { accountLabel: username };
  }

  const token = requiredString(credentials.secrets.access_token, "META_TOKEN_MISSING", "Токен доступа");
  if (credentials.provider === "instagram") {
    const accountId = requiredString(
      credentials.externalAccountId ?? credentials.config.instagramUserId,
      "INSTAGRAM_ACCOUNT_MISSING",
      "Instagram User ID",
    );
    const result = await metaRequest(`${metaBaseUrl(credentials.config, true)}/${accountId}?fields=id,username`, token);
    return { accountLabel: typeof result.username === "string" ? `@${result.username}` : accountId };
  }

  const phoneNumberId = requiredString(
    credentials.config.phoneNumberId ?? credentials.externalAccountId,
    "WHATSAPP_PHONE_ID_MISSING",
    "Phone Number ID",
  );
  const result = await metaRequest(
    `${metaBaseUrl(credentials.config)}/${phoneNumberId}?fields=id,display_phone_number,verified_name`,
    token,
  );
  const label = typeof result.verified_name === "string"
    ? result.verified_name
    : typeof result.display_phone_number === "string"
      ? result.display_phone_number
      : phoneNumberId;
  return { accountLabel: label };
}

export async function publishProviderVariant(
  credentials: ProviderCredentials,
  variant: ProviderVariant,
): Promise<ProviderPublicationResult> {
  if (credentials.provider === "telegram") return publishTelegram(credentials, variant);
  if (credentials.provider === "instagram") return publishInstagram(credentials, variant);
  return publishWhatsApp(credentials, variant);
}

export type { ProviderCredentials };
