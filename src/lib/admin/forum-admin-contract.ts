import { slugifyTourTitle } from "@/lib/tour-slug";

export type AdminForumCategory = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  publicRead: boolean;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  threadCount: number;
};

export type AdminForumThread = {
  id: string;
  categoryId: string;
  categoryTitle: string;
  categorySlug: string;
  title: string;
  pinned: boolean;
  locked: boolean;
  lastPostAt: string;
  updatedAt: string;
  postCount: number;
};

export type ForumCategoryDraft = {
  title: string;
  description: string | null;
  sortOrder: number;
  publicRead: boolean;
  isActive: boolean;
};

export type ForumAdminValidation<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function forumCategorySlug(title: string): string {
  return slugifyTourTitle(title).slice(0, 80);
}

export function validateForumCategoryDraft(input: unknown): ForumAdminValidation<ForumCategoryDraft> {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Заполните настройки раздела" };
  }
  const body = input as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const rawDescription = typeof body.description === "string" ? body.description.trim() : "";
  const sortOrder = Number(body.sortOrder);

  if (title.length < 2 || title.length > 100) {
    return { ok: false, error: "Название должно содержать от 2 до 100 символов" };
  }
  if (rawDescription.length > 1000) {
    return { ok: false, error: "Описание не должно превышать 1000 символов" };
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 32767) {
    return { ok: false, error: "Порядок должен быть целым числом от 0 до 32767" };
  }
  if (typeof body.publicRead !== "boolean" || typeof body.isActive !== "boolean") {
    return { ok: false, error: "Выберите видимость и состояние раздела" };
  }

  return {
    ok: true,
    value: {
      title,
      description: rawDescription || null,
      sortOrder,
      publicRead: body.publicRead,
      isActive: body.isActive,
    },
  };
}

export function forumAdminError(code: string | null | undefined): {
  status: number;
  error: string;
} {
  switch (code) {
    case "version_conflict":
      return { status: 409, error: "Данные уже изменил другой администратор. Обновите страницу." };
    case "category_not_empty":
      return {
        status: 409,
        error: "В разделе есть темы. Чтобы сохранить обсуждения, выключите «Показывать раздел».",
      };
    case "slug_conflict":
      return { status: 409, error: "Раздел с таким названием уже существует." };
    case "not_found":
      return { status: 404, error: "Запись не найдена" };
    case "forbidden":
      return { status: 403, error: "Недостаточно прав для управления форумом" };
    case "no_change":
      return { status: 409, error: "Состояние темы уже изменилось. Обновите список." };
    case "invalid_action":
    case "invalid_input":
      return { status: 400, error: "Проверьте заполненные поля" };
    default:
      return { status: 500, error: "Не удалось выполнить действие. Попробуйте ещё раз." };
  }
}
