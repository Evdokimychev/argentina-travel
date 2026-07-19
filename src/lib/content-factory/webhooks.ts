import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getProviderCredentials } from "@/lib/content-factory/server";
import type { ContentChannel } from "@/lib/content-factory/types";
import type { Json } from "@/types/database";

type InboundSocialMessage = {
  externalMessageId: string;
  externalUserId: string;
  displayName: string | null;
  contactPhone: string | null;
  messageType: string;
  body: string;
  media: Json;
  providerTimestamp: string | null;
  rawEvent: Json;
};

function secureCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function verifyMetaWebhookChallenge(
  provider: Extract<ContentChannel, "instagram" | "whatsapp">,
  requestUrl: string,
): Promise<string | null> {
  const url = new URL(requestUrl);
  const mode = url.searchParams.get("hub.mode") ?? "";
  const token = url.searchParams.get("hub.verify_token") ?? "";
  const challenge = url.searchParams.get("hub.challenge") ?? "";
  const credentials = await getProviderCredentials(provider);
  const expected = credentials.secrets.webhook_verify_token?.trim() ?? "";
  return mode === "subscribe" && token && expected && secureCompare(token, expected) ? challenge : null;
}

export async function verifyMetaWebhookSignature(
  provider: Extract<ContentChannel, "instagram" | "whatsapp">,
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  const credentials = await getProviderCredentials(provider);
  const secret = credentials.secrets.app_secret?.trim();
  if (!secret || !signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return secureCompare(expected, signatureHeader.slice("sha256=".length));
}

function whatsappMessages(payload: unknown): InboundSocialMessage[] {
  const root = payload as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
          messages?: Array<{
            id?: string;
            from?: string;
            timestamp?: string;
            type?: string;
            text?: { body?: string };
            image?: { id?: string; caption?: string; mime_type?: string };
            video?: { id?: string; caption?: string; mime_type?: string };
            document?: { id?: string; caption?: string; filename?: string; mime_type?: string };
            interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
          }>;
        };
      }>;
    }>;
  };
  const result: InboundSocialMessage[] = [];
  for (const entry of root.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const contacts = change.value?.contacts ?? [];
      for (const message of change.value?.messages ?? []) {
        if (!message.id || !message.from) continue;
        const contact = contacts.find((item) => item.wa_id === message.from) ?? contacts[0];
        const mediaObject = message.image ?? message.video ?? message.document;
        const interactiveBody = message.interactive?.button_reply?.title ?? message.interactive?.list_reply?.title;
        const body = message.text?.body ?? mediaObject?.caption ?? interactiveBody ?? "";
        result.push({
          externalMessageId: message.id,
          externalUserId: message.from,
          displayName: contact?.profile?.name ?? null,
          contactPhone: message.from,
          messageType: message.type ?? "unknown",
          body,
          media: mediaObject ? [{ ...mediaObject }] as Json : [],
          providerTimestamp: message.timestamp
            ? new Date(Number(message.timestamp) * 1000).toISOString()
            : null,
          rawEvent: message as unknown as Json,
        });
      }
    }
  }
  return result;
}

function instagramMessages(payload: unknown): InboundSocialMessage[] {
  const root = payload as {
    entry?: Array<{
      messaging?: Array<{
        sender?: { id?: string };
        timestamp?: number;
        message?: { mid?: string; text?: string; attachments?: unknown[] };
      }>;
    }>;
  };
  const result: InboundSocialMessage[] = [];
  for (const entry of root.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const id = event.message?.mid;
      const userId = event.sender?.id;
      if (!id || !userId) continue;
      result.push({
        externalMessageId: id,
        externalUserId: userId,
        displayName: null,
        contactPhone: null,
        messageType: event.message?.attachments?.length ? "attachment" : "text",
        body: event.message?.text ?? "",
        media: (event.message?.attachments ?? []) as Json,
        providerTimestamp: event.timestamp ? new Date(event.timestamp).toISOString() : null,
        rawEvent: event as unknown as Json,
      });
    }
  }
  return result;
}

export async function ingestMetaWebhook(
  provider: Extract<ContentChannel, "instagram" | "whatsapp">,
  payload: unknown,
): Promise<{ received: number; duplicates: number }> {
  const credentials = await getProviderCredentials(provider);
  const messages = provider === "whatsapp" ? whatsappMessages(payload) : instagramMessages(payload);
  const supabase = createSupabaseAdminClient();
  let received = 0;
  let duplicates = 0;

  for (const message of messages) {
    const { data: existingThread, error: threadReadError } = await supabase
      .from("social_inbox_threads")
      .select("id, unread_count")
      .eq("connection_id", credentials.connectionId)
      .eq("external_user_id", message.externalUserId)
      .maybeSingle();
    if (threadReadError) throw threadReadError;
    let thread = existingThread;
    if (!thread) {
      const { data: created, error: createError } = await supabase
        .from("social_inbox_threads")
        .insert({
          project_key: "argentina-travel",
          connection_id: credentials.connectionId,
          provider,
          external_user_id: message.externalUserId,
          display_name: message.displayName,
          contact_phone: message.contactPhone,
          unread_count: 0,
        })
        .select("id, unread_count")
        .single();
      if (createError) {
        if (createError.code === "23505") {
          const retry = await supabase
            .from("social_inbox_threads")
            .select("id, unread_count")
            .eq("connection_id", credentials.connectionId)
            .eq("external_user_id", message.externalUserId)
            .single();
          if (retry.error) throw retry.error;
          thread = retry.data;
        } else {
          throw createError;
        }
      } else {
        thread = created;
      }
    }
    if (!thread) continue;

    const { error: messageError } = await supabase.from("social_inbox_messages").insert({
      thread_id: thread.id,
      external_message_id: message.externalMessageId,
      direction: "inbound",
      message_type: message.messageType,
      body: message.body,
      media: message.media,
      delivery_status: "received",
      provider_timestamp: message.providerTimestamp,
      raw_event: message.rawEvent,
    });
    if (messageError?.code === "23505") {
      duplicates += 1;
      continue;
    }
    if (messageError) throw messageError;

    const preview = message.body.trim() || `Получено: ${message.messageType}`;
    const { error: updateError } = await supabase
      .from("social_inbox_threads")
      .update({
        display_name: message.displayName,
        contact_phone: message.contactPhone,
        unread_count: thread.unread_count + 1,
        last_message_preview: preview.slice(0, 500),
        last_message_at: message.providerTimestamp ?? new Date().toISOString(),
      })
      .eq("id", thread.id);
    if (updateError) throw updateError;
    received += 1;
  }
  return { received, duplicates };
}

