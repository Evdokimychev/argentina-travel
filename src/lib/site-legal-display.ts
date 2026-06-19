import type { SiteLegal } from "@/lib/site-settings-server";

export const DEFAULT_SUPPORT_EMAIL = "IAEvdokimychev@ya.ru";

export function formatSiteLegalLine(legal: SiteLegal): string | null {
  const parts: string[] = [];
  if (legal.companyName?.trim()) parts.push(legal.companyName.trim());
  if (legal.inn?.trim()) parts.push(`ИНН ${legal.inn.trim()}`);
  if (legal.ogrn?.trim()) parts.push(`ОГРН ${legal.ogrn.trim()}`);
  if (legal.address?.trim()) parts.push(legal.address.trim());
  return parts.length ? parts.join(" · ") : null;
}

export async function loadSiteLegalForFooter(): Promise<{
  legalLine: string | null;
  supportEmail: string | null;
}> {
  const { fetchSiteLegal } = await import("@/lib/site-settings-server");
  const legal = await fetchSiteLegal();
  return {
    legalLine: formatSiteLegalLine(legal),
    supportEmail: legal.supportEmail?.trim() || DEFAULT_SUPPORT_EMAIL,
  };
}
