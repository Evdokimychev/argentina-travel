import type { KbEntry } from "@/lib/knowledge-base/types";

/** Ключ placement для статьи базы знаний. */
export function kbSocialFeedPlacement(entry: KbEntry): string {
  return `kb:${entry.id}`;
}
