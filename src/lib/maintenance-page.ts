import { getHomeHeroImage } from "@/lib/media-resolver";
import { parseMaintenanceCountdownTarget } from "@/lib/maintenance-countdown";
import type { SiteBrandingGlobal, SiteContactGlobal, SiteMaintenanceGlobal } from "@/types/site-globals";
import { SITE_EMAIL, SITE_OFFICE, SITE_PHONES } from "@/data/site-contacts";

export type MaintenancePageViewModel = {
  siteName: string;
  tagline: string;
  badgeLabel: string;
  headline: string;
  message: string;
  notifyLabel: string;
  backgroundImage: string;
  showContacts: boolean;
  countdownEnabled: boolean;
  countdownTarget: string | null;
  countdownTargetDate: Date | null;
  supportEmail: string;
  telegramUrl?: string;
  instagramUrl?: string;
  whatsAppUrl?: string;
  phones: typeof SITE_PHONES;
  office: string;
};

export function resolveMaintenancePageViewModel(input: {
  maintenance: SiteMaintenanceGlobal;
  branding: SiteBrandingGlobal;
  contact: SiteContactGlobal;
}): MaintenancePageViewModel {
  const countdownTargetDate = input.maintenance.countdownEnabled
    ? parseMaintenanceCountdownTarget(input.maintenance.countdownTarget)
    : null;

  return {
    siteName: input.branding.siteName,
    tagline: input.branding.tagline,
    badgeLabel: input.maintenance.badgeLabel,
    headline: input.maintenance.headline,
    message: input.maintenance.message,
    notifyLabel: input.maintenance.notifyLabel,
    backgroundImage:
      input.maintenance.backgroundImage?.trim() || getHomeHeroImage(),
    showContacts: input.maintenance.showContacts,
    countdownEnabled: Boolean(input.maintenance.countdownEnabled && countdownTargetDate),
    countdownTarget: input.maintenance.countdownTarget?.trim() || null,
    countdownTargetDate,
    supportEmail: contactEmail(input.contact),
    telegramUrl: input.contact.telegramUrl?.trim() || undefined,
    instagramUrl: input.contact.instagramUrl?.trim() || undefined,
    whatsAppUrl: input.contact.whatsAppUrl?.trim() || undefined,
    phones: SITE_PHONES,
    office: SITE_OFFICE.display,
  };
}

function contactEmail(contact: SiteContactGlobal): string {
  return contact.supportEmail?.trim() || SITE_EMAIL.display;
}
