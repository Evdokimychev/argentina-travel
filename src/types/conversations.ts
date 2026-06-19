import type { MessageSenderRole } from "@/types/messages";

export interface ConversationThread {
  id: string;
  bookingId: string;
  touristUserId: string;
  organizerUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: MessageSenderRole;
  body: string;
  createdAt: string;
  /** When the counterpart read this message (only set for own outgoing messages). */
  readByCounterpartAt?: string | null;
}

export interface ConversationTypingState {
  userId: string;
  updatedAt: string;
}
