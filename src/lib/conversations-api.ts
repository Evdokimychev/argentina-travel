import { isSupabaseMessagingEnabled } from "@/lib/auth-mode";
import type {
  ConversationMessage,
  ConversationThread,
} from "@/types/conversations";

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return body;
}

export function isRemoteMessagingMode(): boolean {
  return isSupabaseMessagingEnabled();
}

export async function apiGetConversationByBooking(
  bookingId: string
): Promise<ConversationThread> {
  const data = await parseJson<{ thread: ConversationThread }>(
    await fetch(`/api/conversations/by-booking/${encodeURIComponent(bookingId)}`)
  );
  return data.thread;
}

export async function apiFetchConversationMessages(
  threadId: string
): Promise<ConversationMessage[]> {
  const data = await parseJson<{ messages: ConversationMessage[] }>(
    await fetch(`/api/conversations/${encodeURIComponent(threadId)}/messages`)
  );
  return data.messages;
}

export async function apiSendConversationMessage(
  threadId: string,
  body: string
): Promise<ConversationMessage> {
  const data = await parseJson<{ message: ConversationMessage }>(
    await fetch(`/api/conversations/${encodeURIComponent(threadId)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    })
  );
  return data.message;
}
