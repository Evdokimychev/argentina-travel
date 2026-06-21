import type { SiteContactGlobal } from "@/types/site-globals";
import { DEFAULT_SUPPORT_EMAIL, formatSiteLegalLine } from "@/lib/site-legal-display";
import { fetchSiteContact, fetchSiteLegal } from "@/lib/site-settings-server";

export type SiteFooterInfo = {
  legalLine: string | null;
  supportEmail: string | null;
  socialLinks: Array<{ label: string; href: string }>;
};

function socialLinksFromContact(contact: SiteContactGlobal): SiteFooterInfo["socialLinks"] {
  const links: SiteFooterInfo["socialLinks"] = [];
  if (contact.telegramUrl?.trim()) {
    links.push({ label: "Telegram", href: contact.telegramUrl.trim() });
  }
  if (contact.whatsAppUrl?.trim()) {
    links.push({ label: "WhatsApp", href: contact.whatsAppUrl.trim() });
  }
  if (contact.instagramUrl?.trim()) {
    links.push({ label: "Instagram", href: contact.instagramUrl.trim() });
  }
  return links;
}

export async function loadSiteFooterInfo(): Promise<SiteFooterInfo> {
  const [legal, contact] = await Promise.all([fetchSiteLegal(), fetchSiteContact()]);
  const supportEmail =
    contact.supportEmail?.trim() || legal.supportEmail?.trim() || DEFAULT_SUPPORT_EMAIL;

  return {
    legalLine: formatSiteLegalLine(legal),
    supportEmail,
    socialLinks: socialLinksFromContact(contact),
  };
}
