/**
 * @deprecated Темы заменены placements в config.json.
 * Оставлено для обратной совместимости media-library/feed-query.
 */
import type { SocialFeedContext, SocialFeedTopic } from "@/lib/social-feed/types";

export function resolveSocialFeedTopics(_context: SocialFeedContext): SocialFeedTopic[] {
  return [];
}

/** @deprecated */
export function resolvePreferredSourceIds(
  _context: SocialFeedContext,
  _topicList: SocialFeedTopic[],
): string[] {
  return [];
}
