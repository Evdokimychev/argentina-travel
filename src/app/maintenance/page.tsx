import MaintenanceComingSoonView from "@/components/maintenance/MaintenanceComingSoonView";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { resolveMaintenancePageViewModel } from "@/lib/maintenance-page";
import {
  fetchSiteBranding,
  fetchSiteContact,
  fetchSiteMaintenance,
} from "@/lib/site-settings-server";

export const metadata = {
  title: "Сайт на обслуживании",
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  const locale = await getServerI18nLocale();
  const [maintenance, branding, contact] = await Promise.all([
    fetchSiteMaintenance(locale),
    fetchSiteBranding(locale),
    fetchSiteContact(locale),
  ]);

  const model = resolveMaintenancePageViewModel({ maintenance, branding, contact });

  return <MaintenanceComingSoonView model={model} />;
}
