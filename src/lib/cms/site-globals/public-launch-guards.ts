import type { SiteModulesGlobal, SiteNavigationGlobal } from "@/types/site-globals";

function isLaunchShowUnfinishedEnabled(): boolean {
  return process.env.PUBLIC_LAUNCH_SHOW_UNFINISHED?.trim() === "1";
}

/**
 * Public launch clamp for unfinished surfaces.
 * Admin CMS retains stored values; only public control-plane readers apply this.
 *
 * Immigration stays reachable by direct URL when CMS keeps it published, but is
 * removed from navigation. Shop/Forum are unpublished until inventory is ready.
 *
 * Override with PUBLIC_LAUNCH_SHOW_UNFINISHED=1 when intentionally previewing unfinished modules.
 */
export function applyPublicLaunchGuards(
  navigation: SiteNavigationGlobal,
  modules: SiteModulesGlobal,
): { navigation: SiteNavigationGlobal; modules: SiteModulesGlobal } {
  if (isLaunchShowUnfinishedEnabled()) {
    return { navigation, modules };
  }

  const shop = modules.publicModules.shop;
  const forum = modules.publicModules.forum;
  const immigration = modules.publicModules.immigration;

  return {
    navigation: {
      ...navigation,
      showShop: false,
      showForum: false,
      showImmigration: false,
    },
    modules: {
      ...modules,
      carRentalMode: "disabled",
      transfersMode: "disabled",
      showCarRentalInServices: false,
      showTransfersInServices: false,
      publicModules: {
        ...modules.publicModules,
        shop: {
          ...shop,
          activated: false,
          published: false,
          includeInSearch: false,
          includeInSitemap: false,
        },
        forum: {
          ...forum,
          activated: false,
          published: false,
          includeInSearch: false,
          includeInSitemap: false,
        },
        immigration: {
          ...immigration,
          includeInSearch: false,
          // Keep CMS published flag so /immigration stays open for content review.
        },
      },
    },
  };
}
