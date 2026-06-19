import { isSupabaseMessagingEnabled } from "@/lib/auth-mode";
import type { MessageSenderRole } from "@/types/messages";
import type {
  ConversationInboxSummary,
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

export async function apiMarkConversationMessagesRead(
  threadId: string,
  messageIds: string[]
): Promise<number> {
  const data = await parseJson<{ marked: number }>(
    await fetch(`/api/conversations/${encodeURIComponent(threadId)}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageIds }),
    })
  );
  return data.marked;
}

export async function apiSetConversationTyping(
  threadId: string,
  typing: boolean
): Promise<void> {
  await parseJson<{ ok: true }>(
    await fetch(`/api/conversations/${encodeURIComponent(threadId)}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typing }),
    })
  );
}

export async function apiFetchConversationTyping(
  threadId: string
): Promise<{ userId: string; updatedAt: string }[]> {
  const data = await parseJson<{
    typing: { userId: string; updatedAt: string }[];
  }>(await fetch(`/api/conversations/${encodeURIComponent(threadId)}/typing`));
  return data.typing;
}

export async function apiFetchConversationInbox(
  role: MessageSenderRole,
  limit = 50
): Promise<ConversationInboxSummary> {
  const params = new URLSearchParams({
    role,
    limit: String(limit),
  });
  return parseJson<ConversationInboxSummary>(
    await fetch(`/api/conversations/inbox?${params.toString()}`)
  );
}

export async function apiFetchConversationUnreadCount(
  role: MessageSenderRole
): Promise<number> {
  const params = new URLSearchParams({
    role,
    summary: "1",
  });
  const data = await parseJson<{ unreadCount?: number }>(
    await fetch(`/api/conversations/inbox?${params.toString()}`)
  );
  return data.unreadCount ?? 0;
}
