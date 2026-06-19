export const MESSAGES_STORE_KEY = "argentina-travel-messages";
export const MESSAGES_UPDATED_EVENT = "messages-updated";

export type MessageSenderRole = "tourist" | "organizer";

export interface MessageThread {
  id: string;
  tourSlug: string;
  tourTitle: string;
  bookingId?: string;
  organizerUserId: string;
  organizerName: string;
  touristUserId: string;
  touristName: string;
  touristEmail?: string;
  subject?: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
  organizerUnread: number;
  touristUnread: number;
}

export interface ThreadMessage {
  id: string;
  threadId: string;
  senderRole: MessageSenderRole;
  senderUserId: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface MessageStoreSnapshot {
  threads: MessageThread[];
  messages: ThreadMessage[];
}
