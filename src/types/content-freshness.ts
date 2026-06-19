import type { CmsDocType } from "@/types/cms-content";

export type ContentFreshnessDocType = CmsDocType;

export type ContentFreshnessStatus = "fresh" | "stale" | "critical";

export type ContentFreshnessRow = {
  id: string;
  doc_slug: string;
  doc_type: ContentFreshnessDocType;
  last_verified_at: string;
  next_review_at: string;
  owner: string;
  created_at: string;
  updated_at: string;
};

export type ContentFreshnessItem = {
  docSlug: string;
  docType: ContentFreshnessDocType;
  title: string;
  href: string;
  owner: string;
  lastVerifiedAt: string;
  nextReviewAt: string;
  ageDays: number;
  status: ContentFreshnessStatus;
};

export type ImmigrationFreshnessState = {
  status: ContentFreshnessStatus;
  lastVerifiedAt: string;
  nextReviewAt: string;
  ageDays: number;
};
