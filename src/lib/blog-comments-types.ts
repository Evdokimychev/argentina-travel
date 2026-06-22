export type BlogCommentAuthor = {
  id: string;
  displayName: string;
};

export type BlogComment = {
  id: string;
  articleSlug: string;
  body: string;
  status: string;
  parentId: string | null;
  createdAt: string;
  author: BlogCommentAuthor;
  canReport: boolean;
};

export type BlogCommentReportReason = "spam" | "offensive" | "off_topic" | "other";

export const BLOG_COMMENT_REPORT_REASON_LABELS: Record<BlogCommentReportReason, string> = {
  spam: "Спам",
  offensive: "Оскорбление",
  off_topic: "Не по теме",
  other: "Другое",
};
