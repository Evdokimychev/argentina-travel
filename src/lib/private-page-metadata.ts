import type { Metadata } from "next";

/** Pages that must not appear in search indexes (cabinets, admin, token flows). */
export const PRIVATE_PAGE_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export function privatePageMetadata(title: string, description?: string): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    robots: PRIVATE_PAGE_ROBOTS,
  };
}
