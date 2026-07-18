export type TourContentStatus = "draft" | "published" | "archived";

export type TourModerationStatus = "none" | "pending" | "approved" | "rejected";

export type TourContentAdminSummary = {
  id: string;
  marketCode: string;
  rowVersion: number;
  slug: string;
  ownerUserId: string;
  status: TourContentStatus;
  title: string;
  productType: "tour" | "excursion";
  publishedAt: string | null;
  updatedAt: string;
  moderationStatus: TourModerationStatus;
  moderationNotes: string | null;
};
