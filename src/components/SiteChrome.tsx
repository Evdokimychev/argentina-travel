"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SkipToContentLink from "@/components/SkipToContentLink";
import PublicMobileBottomNav from "@/components/navigation/PublicMobileBottomNav";
import type { SiteFooterInfo } from "@/lib/site-footer-info";
import type {
  SiteBrandingGlobalResolved,
  SiteDesignGlobal,
  SiteNavigationGlobal,
  SiteMarketingGlobal,
  SiteFormsGlobal,
  SiteModulesGlobal,
} from "@/types/site-globals";
import type { SiteNavLink, SiteNavSection } from "@/types/site-nav";
import { isWorkspacePath } from "@/lib/internal-route-access";
import { cn } from "@/lib/cn";
import { shouldShowPublicMobileNav } from "@/lib/public-mobile-nav";
import {
  publicMobileNavHeightClass,
  publicMobileNavInsetClass,
} from "@/lib/responsive-ui";

export type { SiteFooterInfo };

/** @deprecated Use SiteFooterInfo */
export type SiteLegalFooterInfo = SiteFooterInfo;

export default function SiteChrome({
  children,
  siteFooter,
  /** @deprecated Pass siteFooter instead */
  siteLegal,
  siteNavigation,
  siteDesign,
  siteBranding,
  siteMarketing,
  siteForms,
  siteModules,
  siteNavSections,
  siteNavUtilityLinks,
}: {
  children: React.ReactNode;
  siteFooter?: SiteFooterInfo;
  siteLegal?: SiteFooterInfo;
  siteNavigation?: SiteNavigationGlobal;
  siteDesign?: SiteDesignGlobal;
  siteBranding?: SiteBrandingGlobalResolved;
  siteMarketing?: SiteMarketingGlobal;
  siteForms?: SiteFormsGlobal;
  siteModules?: SiteModulesGlobal;
  siteNavSections: SiteNavSection[];
  siteNavUtilityLinks: SiteNavLink[];
}) {
  const pathname = usePathname();
  const isEmbed = pathname?.startsWith("/embed");
  const isMaintenance = pathname === "/maintenance";
  const isWorkspace = isWorkspacePath(pathname);
  const footerInfo = siteFooter ?? siteLegal;
  const showPublicMobileNav = shouldShowPublicMobileNav(pathname);

  if (isEmbed || isMaintenance) {
    return <>{children}</>;
  }

  if (isWorkspace) {
    return (
      <>
        <SkipToContentLink />
        <main id="main-content" className="ym-hide-content relative min-h-dvh bg-surface-elevated" tabIndex={-1}>
          {children}
        </main>
      </>
    );
  }

  return (
    <>
      <SkipToContentLink />
      <Header
        navigation={siteNavigation}
        design={siteDesign}
        branding={siteBranding}
        marketing={siteMarketing}
        modules={siteModules}
        sections={siteNavSections}
        baseUtilityLinks={siteNavUtilityLinks}
      />
      <div className="site-header-spacer shrink-0" aria-hidden="true" />
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          showPublicMobileNav && publicMobileNavHeightClass,
          showPublicMobileNav && publicMobileNavInsetClass,
        )}
      >
        <main id="main-content" className="relative z-0 flex-1 bg-surface-elevated" tabIndex={-1}>
          {children}
        </main>
        <Footer
          siteFooter={footerInfo}
          design={siteDesign}
          branding={siteBranding}
          navigation={siteNavigation}
          forms={siteForms}
          modules={siteModules}
        />
      </div>
      {showPublicMobileNav ? (
        <PublicMobileBottomNav navigation={siteNavigation} modules={siteModules} />
      ) : null}
    </>
  );
}
