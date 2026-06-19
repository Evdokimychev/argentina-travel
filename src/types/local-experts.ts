export type ExpertCategory =
  | "guide"
  | "relocation"
  | "photo"
  | "family"
  | "nature"
  | "food";

export type ExpertStatus = "pending" | "published" | "archived";

export type ExpertContactMode = "message" | "email" | "both";

export type ExpertInquiryStatus = "open" | "replied" | "closed";

export interface LocalExpertView {
  id: string;
  slug: string;
  name: string;
  bio: string;
  city: string;
  categories: ExpertCategory[];
  languages: string[];
  avatarUrl: string | null;
  contactMode: ExpertContactMode;
  status: ExpertStatus;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpertInquiryView {
  id: string;
  expertId: string;
  expertName: string;
  expertSlug: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  message: string;
  status: ExpertInquiryStatus;
  threadId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpertCatalogFilters {
  city?: string;
  category?: ExpertCategory;
  language?: string;
  q?: string;
}

export const EXPERT_CATEGORY_LABELS: Record<ExpertCategory, string> = {
  guide: "Гид",
  relocation: "Переезд",
  photo: "Фотограф",
  family: "С семьёй",
  nature: "Природа",
  food: "Гастрономия",
};

export const EXPERT_STATUS_LABELS: Record<ExpertStatus, string> = {
  pending: "На модерации",
  published: "Опубликован",
  archived: "В архиве",
};

export const EXPERT_INQUIRY_STATUS_LABELS: Record<ExpertInquiryStatus, string> = {
  open: "Новое",
  replied: "Есть ответ",
  closed: "Закрыто",
};
