import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_MODULES,
  DEFAULT_SITE_NAVIGATION,
} from "@/lib/cms/site-globals/normalize";
import { applyPublicLaunchGuards } from "@/lib/cms/site-globals/public-launch-guards";

describe("applyPublicLaunchGuards", () => {
  it("hides unfinished shop/forum and disables transfer hubs for public readers", () => {
    const { navigation, modules } = applyPublicLaunchGuards(
      {
        ...DEFAULT_SITE_NAVIGATION,
        showShop: true,
        showForum: true,
        showImmigration: true,
      },
      {
        ...DEFAULT_SITE_MODULES,
        transfersMode: "partner",
        showTransfersInServices: true,
        publicModules: {
          ...DEFAULT_SITE_MODULES.publicModules,
          shop: {
            activated: true,
            published: true,
            includeInSearch: true,
            includeInSitemap: true,
          },
          forum: {
            activated: true,
            published: true,
            includeInSearch: true,
            includeInSitemap: true,
          },
          immigration: {
            activated: true,
            published: true,
            includeInSearch: true,
            includeInSitemap: true,
          },
        },
      },
    );

    expect(navigation.showShop).toBe(false);
    expect(navigation.showForum).toBe(false);
    expect(navigation.showImmigration).toBe(false);
    expect(modules.transfersMode).toBe("disabled");
    expect(modules.showTransfersInServices).toBe(false);
    expect(modules.publicModules.shop.published).toBe(false);
    expect(modules.publicModules.forum.published).toBe(false);
    expect(modules.publicModules.immigration.published).toBe(true);
    expect(modules.publicModules.immigration.activated).toBe(true);
    expect(modules.publicModules.immigration.includeInSearch).toBe(false);
  });
});
