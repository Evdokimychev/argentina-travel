import type { CmsDocument, CmsAuthorArticleType } from "@/types/cms-content";

export const AUTHOR_ARTICLE_TYPE_LABELS: Record<CmsAuthorArticleType, string> = {
  story: "История",
  place_guide: "Гид по месту",
  route: "Маршрут",
  practical_tip: "Практический совет",
  tour_review: "Обзор тура",
  local_recommendation: "Местная рекомендация",
};

export type AuthorArticleWorkflowStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "published"
  | "archived";

export const AUTHOR_ARTICLE_STATUS_LABELS: Record<AuthorArticleWorkflowStatus, string> = {
  draft: "Черновик",
  in_review: "На проверке",
  changes_requested: "Требуются изменения",
  approved: "Одобрено",
  scheduled: "Запланировано",
  published: "Опубликовано",
  archived: "Архив",
};

export type AuthorArticleWorkflow = {
  status: AuthorArticleWorkflowStatus;
  note: string | null;
  updatedAt: string;
};

type ModerationSnapshot = {
  status: string;
  reason: string | null;
  updated_at: string;
};

export function resolveAuthorArticleWorkflow(
  document: CmsDocument,
  moderation?: ModerationSnapshot | null,
): AuthorArticleWorkflow {
  if (document.status === "published") {
    return { status: "published", note: null, updatedAt: document.updatedAt };
  }
  if (document.status === "scheduled") {
    return { status: "scheduled", note: null, updatedAt: document.updatedAt };
  }
  if (document.status === "archived") {
    return { status: "archived", note: null, updatedAt: document.updatedAt };
  }
  if (moderation?.status === "pending" || moderation?.status === "in_review") {
    return { status: "in_review", note: moderation.reason, updatedAt: moderation.updated_at };
  }
  if (moderation?.status === "rejected") {
    return {
      status: "changes_requested",
      note: moderation.reason,
      updatedAt: moderation.updated_at,
    };
  }
  if (moderation?.status === "approved") {
    return { status: "approved", note: moderation.reason, updatedAt: moderation.updated_at };
  }
  return { status: "draft", note: null, updatedAt: document.updatedAt };
}
