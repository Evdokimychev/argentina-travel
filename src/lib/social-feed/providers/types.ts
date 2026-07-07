import type { SocialFeedItem } from "@/lib/social-feed/types";

/** Запрос данных для провайдера ленты. */
export type SocialFeedProviderRequest = {
  sourceIds: string[];
  limit: number;
};

/** Адаптер данных — ManualCurated сейчас, Instagram API в будущем. */
export interface SocialFeedDataProvider {
  getItems(request: SocialFeedProviderRequest): SocialFeedItem[];
}
