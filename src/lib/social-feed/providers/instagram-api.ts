import type { SocialFeedItem } from "@/lib/social-feed/types";
import type {
  SocialFeedDataProvider,
  SocialFeedProviderRequest,
} from "@/lib/social-feed/providers/types";

/**
 * Заглушка для будущего Instagram Graph API.
 * Реализация должна возвращать тот же SocialFeedItem[], что и ManualCuratedProvider.
 */
export class InstagramApiProvider implements SocialFeedDataProvider {
  getItems(_request: SocialFeedProviderRequest): SocialFeedItem[] {
    throw new Error(
      "InstagramApiProvider не реализован. Используйте ManualCuratedProvider или админку курирования.",
    );
  }
}

/** Безопасная заглушка — пустая выдача без исключения (для feature flag). */
export class InstagramApiProviderStub implements SocialFeedDataProvider {
  getItems(_request: SocialFeedProviderRequest): SocialFeedItem[] {
    return [];
  }
}
