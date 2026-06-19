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
}
