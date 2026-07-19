import type { Json } from "@/types/database";

export const CONTENT_FACTORY_PROJECT_KEY = "argentina-travel";

export const CONTENT_CHANNELS = ["telegram", "instagram", "whatsapp"] as const;
export type ContentChannel = (typeof CONTENT_CHANNELS)[number];

export const CONTENT_FORMATS = [
  "post",
  "carousel",
  "reel",
  "story",
  "message",
  "template",
] as const;
export type ContentFactoryFormat = (typeof CONTENT_FORMATS)[number];

export type ChannelConnectionStatus = "configured" | "verified" | "error" | "disconnected";
export type ContentFactoryItemStatus =
  | "idea"
  | "draft"
  | "review"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";
export type PublicationJobStatus =
  | "pending"
  | "processing"
  | "retry"
  | "succeeded"
  | "failed"
  | "canceled";

export type SafeChannelConnection = {
  id: string;
  provider: ContentChannel;
  label: string;
  externalAccountId: string | null;
  handle: string | null;
  status: ChannelConnectionStatus;
  config: Record<string, Json | undefined>;
  configuredSecrets: string[];
  lastVerifiedAt: string | null;
  lastUsedAt: string | null;
  lastErrorCode: string | null;
};

export type ContentFactoryVariant = {
  id: string;
  channel: ContentChannel;
  format: ContentFactoryFormat;
  body: string;
  mediaUrls: string[];
  linkUrl: string | null;
  target: string | null;
  status: string;
  providerOptions: Record<string, Json | undefined>;
  publishedAt: string | null;
  externalUrl: string | null;
};

export type ContentFactoryItem = {
  id: string;
  sourceDocumentId: string | null;
  title: string;
  brief: string;
  audience: string;
  contentPillar: string;
  goal: string;
  status: ContentFactoryItemStatus;
  priority: number;
  scheduledAt: string | null;
  publishedAt: string | null;
  updatedAt: string;
  variants: ContentFactoryVariant[];
};

export type PublicationJobSummary = {
  id: string;
  itemTitle: string;
  channel: ContentChannel;
  status: PublicationJobStatus;
  scheduledFor: string;
  attemptCount: number;
  externalUrl: string | null;
  errorSummary: string | null;
};

export type SocialInboxThreadSummary = {
  id: string;
  provider: ContentChannel;
  displayName: string | null;
  contactPhone: string | null;
  status: string;
  unreadCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
};

export type ContentFactorySnapshot = {
  generatedAt: string;
  storageReady: true;
  stats: {
    drafts: number;
    scheduled: number;
    published: number;
    failedJobs: number;
    unreadMessages: number;
  };
  connections: SafeChannelConnection[];
  items: ContentFactoryItem[];
  jobs: PublicationJobSummary[];
  inbox: SocialInboxThreadSummary[];
};

export type ConnectionSetupInput = {
  provider: ContentChannel;
  label: string;
  externalAccountId?: string;
  handle?: string;
  config: Record<string, Json | undefined>;
  secrets: Record<string, string>;
};

export type VariantDraftInput = {
  channel: ContentChannel;
  format: ContentFactoryFormat;
  body: string;
  mediaUrls?: string[];
  linkUrl?: string;
  target?: string;
  providerOptions?: Record<string, Json | undefined>;
};

export type ContentItemDraftInput = {
  title: string;
  brief?: string;
  audience?: string;
  contentPillar?: string;
  goal?: string;
  sourceDocumentId?: string;
  variants: VariantDraftInput[];
};

export function isContentChannel(value: unknown): value is ContentChannel {
  return typeof value === "string" && CONTENT_CHANNELS.includes(value as ContentChannel);
}

export function isContentFactoryFormat(value: unknown): value is ContentFactoryFormat {
  return typeof value === "string" && CONTENT_FORMATS.includes(value as ContentFactoryFormat);
}

