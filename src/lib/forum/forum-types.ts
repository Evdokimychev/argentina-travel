export type ForumCategory = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  publicRead: boolean;
  sortOrder: number;
  threadCount?: number;
};

export type ForumAuthor = {
  id: string | null;
  displayName: string;
};

export type ForumThreadSummary = {
  id: string;
  categoryId: string;
  categorySlug: string;
  categoryTitle: string;
  categoryPublicRead: boolean;
  title: string;
  pinned: boolean;
  locked: boolean;
  lastPostAt: string;
  createdAt: string;
  author: ForumAuthor;
  replyCount: number;
};

export type ForumPost = {
  id: string;
  threadId: string;
  body: string;
  status: "published" | "hidden";
  editedAt: string | null;
  createdAt: string;
  author: ForumAuthor;
};

export type ForumThreadDetail = ForumThreadSummary & {
  posts: ForumPost[];
};

export const FORUM_REPORT_REASONS = [
  "spam",
  "offensive",
  "fake",
  "irrelevant",
  "other",
] as const;

export type ForumReportReason = (typeof FORUM_REPORT_REASONS)[number];

export const FORUM_REPORT_REASON_LABELS: Record<ForumReportReason, string> = {
  spam: "Спам",
  offensive: "Оскорбления",
  fake: "Подозрительная информация",
  irrelevant: "Не по теме",
  other: "Другое",
};
