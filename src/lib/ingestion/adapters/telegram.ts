import { validation, withCommonAdapterMethods } from "@/lib/ingestion/adapters/common";
import type { AdapterRawItem, SourceAdapter } from "@/types/ingestion";

function secret(ref: string | null, suffix: string): string | undefined { return ref ? process.env[`${ref}_${suffix}`]?.trim() : undefined; }

export const telegramAdapter: SourceAdapter = withCommonAdapterMethods({
  type: "telegram",
  validateConfig: (source) => validation([
    !source.connectionConfig.channel && "Укажите канал Telegram",
    !source.credentialRef && "Укажите ссылку на секреты окружения",
    source.connectionConfig.telegramMode === "bot_api" && "История каналов доступна только через MTProto",
  ]),
  fetch: async (source) => {
    const apiId = Number(secret(source.credentialRef, "API_ID"));
    const apiHash = secret(source.credentialRef, "API_HASH");
    const session = secret(source.credentialRef, "SESSION");
    if (!Number.isSafeInteger(apiId) || !apiHash || !session) throw new Error("TELEGRAM_CREDENTIALS_NOT_CONFIGURED");
    const [{ TelegramClient }, { StringSession }] = await Promise.all([import("teleproto"), import("teleproto/sessions/index.js")]);
    const client = new TelegramClient(new StringSession(session), apiId, apiHash, { connectionRetries: 2, autoReconnect: false });
    await client.connect();
    try {
      const minId = Number(source.checkpoint.lastMessageId ?? 0);
      const messages = await client.getMessages(source.connectionConfig.channel!, { limit: source.connectionConfig.limit ?? source.connectionConfig.historyDepth ?? 50, minId, reverse: minId > 0 });
      const groups = new Map<string, typeof messages>();
      for (const message of messages.filter((value) => Boolean(value.id))) {
        const key = message.groupedId?.toString() ?? String(message.id);
        const group = groups.get(key) ?? ([] as unknown as typeof messages); group.push(message); groups.set(key, group);
      }
      const items: AdapterRawItem[] = [];
      for (const group of groups.values()) {
        const first = group[0]; const text = [...new Set(group.map((message) => message.message?.trim()).filter(Boolean))].join("\n\n");
        const attachments: NonNullable<AdapterRawItem["attachments"]> = [];
        if (source.connectionConfig.importMedia !== false) for (const message of group.filter((value) => Boolean(value.media))) {
          const downloaded = await client.downloadMedia(message, {}); if (!downloaded || typeof downloaded === "string") continue;
          if (downloaded.byteLength > 25 * 1024 * 1024) continue;
          const media = message.media as unknown as { className?: string; document?: { mimeType?: string } };
          const mimeType = media.document?.mimeType ?? (media.className?.includes("Photo") ? "image/jpeg" : "application/octet-stream");
          const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "bin";
          attachments.push({ filename: `${message.id}.${extension}`, mimeType, bytes: new Uint8Array(downloaded) });
        }
        items.push({ externalId: String(first.id), sourceUrl: `https://t.me/${source.connectionConfig.channel!.replace(/^@/, "")}/${first.id}`, rawFormat: "telegram", rawContent: text, title: text.split("\n").find(Boolean)?.slice(0, 180), publishedAt: first.date ? new Date(first.date * 1000).toISOString() : undefined, attachments, rawPayload: { messageIds: group.map((message) => message.id), groupedId: first.groupedId?.toString(), views: group.reduce((sum, message) => sum + (message.views ?? 0), 0), forwards: group.reduce((sum, message) => sum + (message.forwards ?? 0), 0), edited: group.some((message) => Boolean(message.editDate)), messagesWithReactions: group.filter((message) => Boolean(message.reactions)).length, forwarded: group.some((message) => Boolean(message.fwdFrom)) } });
      }
      const latest = items.reduce((max, item) => Math.max(max, Number(item.externalId)), minId);
      return { items, checkpoint: { lastMessageId: latest, fetchedAt: new Date().toISOString() } };
    } finally { await client.disconnect(); }
  },
});
