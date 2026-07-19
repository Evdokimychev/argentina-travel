export const INGESTION_EDITORIAL_POLICY = {
  version: 1,
  reviewThreshold: 45,
  acceptedThreshold: 68,
  minTextLength: 120,
  duplicateSimilarity: 0.84,
  sensitiveCategories: ["documents", "money", "safety", "transport"],
  sensitiveMaxAgeDays: 365,
} as const;
