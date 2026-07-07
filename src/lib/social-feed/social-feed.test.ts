import { beforeEach, describe, expect, it } from "vitest";
import {
  invalidateSocialFeedConfigCache,
  resolvePlacementConfig,
  resolveSourceIds,
} from "@/lib/social-feed/config";
import { resetSocialFeedConfigCache } from "@/lib/social-feed/manifest";
import { getSocialFeedSync } from "@/lib/social-feed/get-feed";
import { ManualCuratedProvider } from "@/lib/social-feed/providers/manual-curated";
import { getDefaultSocialFeedConfig } from "@/lib/social-feed/config";

describe("social-feed", () => {
  beforeEach(() => {
    resetSocialFeedConfigCache();
    invalidateSocialFeedConfigCache();
  });

  it("resolves placement source ids with fallback to type default", () => {
    const config = getDefaultSocialFeedConfig();
    const unknown = resolvePlacementConfig(config, "destination:ushuaia");
    expect(unknown?.id).toBe("destination:default");

    const ba = resolvePlacementConfig(config, "destination:ba");
    expect(ba?.id).toBe("destination:ba");
    expect(ba?.sourceIds).toContain("iv-evd");
  });

  it("prefers explicit sources over placement", () => {
    const config = getDefaultSocialFeedConfig();
    const resolved = resolveSourceIds(config, {
      placement: "home",
      sources: ["visit-argentina"],
    });
    expect(resolved.sourceIds).toEqual(["visit-argentina"]);
    expect(resolved.placement).toBeNull();
  });

  it("returns curated posts for home placement", () => {
    const feed = getSocialFeedSync({ placement: "home", limit: 6 });
    expect(feed.items.length).toBeGreaterThanOrEqual(3);
    expect(feed.items[0]).toMatchObject({
      id: expect.any(String),
      sourceId: "iv-evd",
      thumbnailUrl: expect.stringContaining("/"),
      permalink: expect.stringContaining("instagram.com"),
    });
    expect(feed.primarySource?.handle).toBe("iv.evd");
  });

  it("hides feed when minItems not met", () => {
    const config = getDefaultSocialFeedConfig();
    const emptyConfig = {
      ...config,
      posts: config.posts.map((p) => ({ ...p, enabled: false })),
    };
    const provider = new ManualCuratedProvider(emptyConfig);
    const items = provider.getItems({ sourceIds: ["iv-evd"], limit: 12 });
    expect(items.length).toBe(0);

    const feed = getSocialFeedSync({ placement: "home" });
    expect(feed.items.length).toBeGreaterThan(0);
  });

  it("provider output matches SocialFeedItem shape", () => {
    const config = getDefaultSocialFeedConfig();
    const provider = new ManualCuratedProvider(config);
    const items = provider.getItems({ sourceIds: ["iv-evd"], limit: 2 });
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          sourceId: "iv-evd",
          mediaType: "image",
          thumbnailUrl: expect.any(String),
          syncedAt: expect.any(String),
          topics: [],
        }),
      );
    }
  });
});
